"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/user";
import { marketplaceClient } from "@/lib/shops";
import { backOfficeRole } from "@/lib/admin";
import { run, userMessage } from "@/lib/db";
import {
  createPaymentProcess,
  createTransactionWithToken,
  pageCodeFor,
  refundTransaction,
  uniqueTransactionIdentifier,
  type GrowMethod,
} from "@/lib/grow";
import type { ActionState } from "@/app/actions";

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

function isGrowMethod(value: string): value is GrowMethod {
  return value === "card_bit" || value === "google_pay" || value === "apple_pay";
}

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length ? trimmed : null;
}

/**
 * La commande, côté écriture.
 *
 * Pas de panier en base ici : il vit dans le navigateur (localStorage), un
 * produit à la fois, comme dans lehaim-marketplace. Le formulaire de
 * réservation envoie tout d'un coup — identifiants et quantités — et cette
 * action relit les prix en base avant d'écrire, plutôt que de faire confiance
 * à ce que le formulaire annonce.
 */

type CartLine = { productId: string; quantity: number };

function parseCart(raw: string): CartLine[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((l) => ({ productId: String(l?.productId ?? ""), quantity: Number(l?.quantity ?? 0) }))
      .filter((l) => l.productId && l.quantity > 0);
  } catch {
    return [];
  }
}

export async function createOrder(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await currentUser();
  if (!user) redirect("/connexion?suite=/marketplace");

  const shopId = String(formData.get("shop_id") ?? "");
  const mode = formData.get("mode") === "livraison" ? "livraison" : "retrait";
  const address = String(formData.get("address") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const slotId = String(formData.get("slot_id") ?? "") || null;
  const cartLines = parseCart(String(formData.get("cart") ?? "[]"));

  // Grow exige un nom complet (prénom + nom) et un téléphone valide sur
  // chaque paiement — demandés ici plutôt que devinés depuis le profil, qui
  // peut être incomplet pour un compte créé avant l'ajout du paiement.
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const savedCardId = String(formData.get("saved_card_id") ?? "") || null;
  const methodRaw = String(formData.get("payment_method") ?? "card_bit");
  const method: GrowMethod = isGrowMethod(methodRaw) ? methodRaw : "card_bit";
  const saveCard = formData.get("save_card") === "on";

  if (!shopId) return { ok: false, message: "Commerce introuvable." };
  if (cartLines.length === 0) return { ok: false, message: "Votre panier est vide." };
  if (mode === "livraison" && !address) {
    return { ok: false, message: "Indiquez une adresse de livraison." };
  }
  if (fullName.split(" ").filter(Boolean).length < 2) {
    return { ok: false, message: "Indiquez votre nom complet (prénom et nom)." };
  }
  if (!phone) {
    return { ok: false, message: "Indiquez votre numéro de téléphone." };
  }

  const supabase = await marketplaceClient();

  // Les prix relus en base, jamais ceux envoyés par le formulaire.
  const { data: productRows } = await run(
    "createOrder/products",
    supabase
      .from("traiteur_products")
      .select("id, title, price, active")
      .eq("traiteur_id", shopId)
      .in("id", cartLines.map((l) => l.productId)),
  );
  const products = (productRows ?? []) as unknown as {
    id: string;
    title: string;
    price: number;
    active: boolean;
  }[];

  const lines = cartLines
    .map((l) => {
      const product = products.find((p) => p.id === l.productId);
      if (!product || !product.active) return null;
      return {
        productId: product.id,
        title: product.title,
        price: Number(product.price),
        quantity: Math.max(1, Math.min(99, l.quantity)),
      };
    })
    .filter((l): l is { productId: string; title: string; price: number; quantity: number } => l !== null);

  if (lines.length === 0) {
    return { ok: false, message: "Ces produits ne sont plus disponibles." };
  }

  let pickupDate: string | null = null;
  let pickupSlot: string | null = null;
  if (slotId) {
    const { data: slotRow } = await run(
      "createOrder/slot",
      supabase
        .from("traiteur_slots")
        .select("slot_date, slot_label, capacity")
        .eq("id", slotId)
        .eq("traiteur_id", shopId)
        .maybeSingle(),
    );
    if (!slotRow) {
      return { ok: false, message: "Ce créneau n'est plus disponible." };
    }
    const s = slotRow as unknown as { slot_date: string; slot_label: string; capacity: number | null };

    if (s.capacity !== null) {
      const { count } = await supabase
        .from("marketplace_orders")
        .select("id", { count: "exact", head: true })
        .eq("slot_id", slotId)
        .neq("status", "annulee");
      if ((count ?? 0) >= s.capacity) {
        return { ok: false, message: "Ce créneau est complet. Choisissez-en un autre." };
      }
    }

    pickupDate = s.slot_date;
    pickupSlot = s.slot_label;
  }

  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const { data: order, error } = await supabase
    .from("marketplace_orders")
    .insert({
      traiteur_id: shopId,
      user_id: user.id,
      fulfillment: mode,
      pickup_date: pickupDate,
      pickup_slot: pickupSlot,
      slot_id: slotId,
      total_amount: total,
      notes: note,
      delivery_address: mode === "livraison" ? address : null,
    })
    .select("id")
    .single();

  if (error || !order) {
    return { ok: false, message: await userMessage("createOrder", error!) };
  }

  const orderId = (order as unknown as { id: string }).id;

  const { error: itemsError } = await supabase.from("marketplace_order_items").insert(
    lines.map((l) => ({
      order_id: orderId,
      product_id: l.productId,
      title: l.title,
      price: l.price,
      quantity: l.quantity,
    })),
  );
  if (itemsError) return { ok: false, message: await userMessage("createOrder/items", itemsError) };

  // Carte déjà mémorisée : charge directe côté serveur, sans redirection —
  // le client atterrit immédiatement sur la confirmation.
  if (savedCardId) {
    const { data: cardRow } = await supabase
      .from("payment_methods")
      .select("card_token")
      .eq("id", savedCardId)
      .eq("user_id", user.id)
      .maybeSingle();
    const card = cardRow as unknown as { card_token: string } | null;

    if (!card) {
      return { ok: false, message: "Ce moyen de paiement n'est plus disponible." };
    }

    try {
      const charge = await createTransactionWithToken({
        cardToken: card.card_token,
        sum: total,
        description: `Commande ${orderId}`,
        fullName,
        phone,
        transactionUniqueIdentifier: uniqueTransactionIdentifier(),
      });
      await supabase
        .from("marketplace_orders")
        .update({
          payment_status: "paid",
          grow_transaction_id: charge.transactionId,
          grow_transaction_token: charge.transactionToken,
          grow_asmachta: charge.asmachta ?? null,
        })
        .eq("id", orderId);
    } catch (err) {
      console.error("[lehaim] createOrder/token —", orderId, err);
      await supabase.from("marketplace_orders").update({ payment_status: "failed" }).eq("id", orderId);
      return {
        ok: false,
        message: "Le paiement avec cette carte a échoué. Réessayez ou choisissez un autre moyen de paiement.",
      };
    }

    revalidatePath("/commandes", "layout");
    revalidatePath("/traiteur/service");
    redirect(`/commandes/${orderId}?cleared=${shopId}`);
  }

  // Nouvelle carte, Bit, Google Pay ou Apple Pay : ouverture de la page de
  // paiement hébergée par Grow, redirection, puis confirmation asynchrone
  // via le webhook (voir app/api/grow/webhook/order/route.ts).
  const origin = await siteOrigin();
  const pageCode = pageCodeFor(method);

  let process;
  try {
    process = await createPaymentProcess({
      pageCode,
      sum: total,
      successUrl: `${origin}/commandes/${orderId}?cleared=${shopId}`,
      cancelUrl: `${origin}/marketplace/${shopId}/reserver`,
      description: `Commande ${orderId}`,
      fullName,
      phone,
      email: user.email ?? undefined,
      notifyUrl: `${origin}/api/grow/webhook/order`,
      saveCardToken: saveCard,
      cField1: orderId,
    });
  } catch (err) {
    console.error("[lehaim] createOrder/grow —", orderId, err);
    return { ok: false, message: "Le paiement n'a pas pu démarrer. Réessayez dans un instant." };
  }

  await supabase
    .from("marketplace_orders")
    .update({
      grow_page_code: pageCode,
      grow_process_id: process.processId,
      grow_process_token: process.processToken,
    })
    .eq("id", orderId);

  revalidatePath("/commandes", "layout");
  revalidatePath("/traiteur/service");
  redirect(process.url);
}

/** Renoncer, tant que le traiteur n'a encore rien accepté. */
export async function cancelOrder(formData: FormData): Promise<void> {
  const user = await currentUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await marketplaceClient();

  // Une commande annulée après paiement doit être remboursée.
  const { data: existing } = await supabase
    .from("marketplace_orders")
    .select("total_amount, payment_status, grow_transaction_id, grow_transaction_token")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  const row = existing as unknown as
    | {
        total_amount: number;
        payment_status: string;
        grow_transaction_id: string | null;
        grow_transaction_token: string | null;
      }
    | null;
  const wasPaid = row?.payment_status === "paid" && row.grow_transaction_id && row.grow_transaction_token;

  if (wasPaid) {
    try {
      await refundTransaction({
        transactionId: row.grow_transaction_id!,
        transactionToken: row.grow_transaction_token!,
        refundSum: row.total_amount,
      });
    } catch (err) {
      console.error("[lehaim] cancelOrder/refund —", id, err);
      return;
    }
  }

  await supabase
    .from("marketplace_orders")
    .update({
      status: "annulee",
      cancelled_by: "client",
      ...(wasPaid ? { payment_status: "refunded" } : {}),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "nouvelle");

  revalidatePath("/commandes", "layout");
  revalidatePath("/traiteur/service");
}

/* ------------------------------------------------------------------ */
/* Devenir traiteur                                                     */
/* ------------------------------------------------------------------ */

/**
 * Le dossier traiteur, côté écriture — porté depuis lehaim-marketplace
 * (registerTraiteur/approveTraiteur/rejectTraiteur dans son
 * app/marketplace/actions.ts), avec l'admin de ce dépôt (`is_admin()`,
 * `backOfficeRole()`) plutôt que `marketplace_admins`.
 *
 * Complète le dossier (nom, adresse, documents, livraison) — le premier
 * produit ne fait plus partie de cette étape, il se remplit ensuite depuis
 * /traiteur/carte, qui a son propre formulaire d'ajout.
 *
 * L'inscription (app/connexion/page.tsx) crée déjà une ligne minimale, en
 * attente, dès le mot de passe confirmé — ce formulaire ne crée donc plus un
 * dossier : il complète celui qui existe déjà. Il ne reste à insérer que
 * pour un compte plus ancien, créé avant ce changement, qui n'en a encore
 * aucune.
 */
export async function registerTraiteur(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await currentUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const name = text(formData, "name");
  if (!name) return { ok: false, message: "Le nom de votre commerce est obligatoire." };

  // Le premier produit ne fait plus partie de ce formulaire (onboarding
  // réduit à deux étapes) : ces champs ne sont plus soumis, mais on les lit
  // quand même pour ne pas casser un compte plus ancien dont le formulaire
  // en trois étapes serait encore en cache côté client. S'ils sont absents,
  // aucun produit n'est créé ici — le traiteur en ajoute depuis /traiteur/carte.
  const productTitle = text(formData, "product_title");
  const productPrice = Number(String(formData.get("product_price") ?? "0").replace(",", "."));
  if (productTitle && (!Number.isFinite(productPrice) || productPrice <= 0)) {
    return { ok: false, message: "Le prix du produit doit être un nombre positif." };
  }

  const supabase = await marketplaceClient();

  const fields = {
    name,
    address: text(formData, "address"),
    phone: text(formData, "phone"),
    patente_number: text(formData, "patente_number"),
    hechsher_name: text(formData, "hechsher_name"),
    delivery_available: formData.get("delivery_available") === "on",
    delivery_zone: text(formData, "delivery_zone"),
  };

  const { data: existing } = await supabase
    .from("traiteurs")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  let traiteurId: string;
  let justCreated = false;

  if (existing) {
    const existingId = (existing as unknown as { id: string }).id;
    const { error } = await supabase.from("traiteurs").update(fields).eq("id", existingId);
    if (error) {
      return { ok: false, message: await userMessage("registerTraiteur/update", error) };
    }
    traiteurId = existingId;
  } else {
    const { data: traiteur, error } = await supabase
      .from("traiteurs")
      .insert({ owner_id: user.id, status: "pending", ...fields })
      .select("id")
      .single();
    if (error || !traiteur) {
      return { ok: false, message: await userMessage("registerTraiteur", error!) };
    }
    traiteurId = (traiteur as unknown as { id: string }).id;
    justCreated = true;
  }

  if (productTitle) {
    const { error: productError } = await supabase.from("traiteur_products").insert({
      traiteur_id: traiteurId,
      title: productTitle,
      description: text(formData, "product_description"),
      price: productPrice,
      category: String(formData.get("product_category") ?? "plat"),
      quantity_hint: text(formData, "product_quantity_hint"),
      allergens: formData.getAll("product_allergens").map(String),
    });
    if (productError) {
      return { ok: false, message: await userMessage("registerTraiteur/product", productError) };
    }
  }

  revalidatePath("/partenaire/candidature");

  // Dossier tout juste créé (compte antérieur à l'inscription en deux temps) :
  // pas encore approuvé, direction l'écran d'attente. Dossier complété après
  // validation : direction le back-office, la fiche est prête.
  if (justCreated) redirect("/partenaire/candidature");
  revalidatePath("/traiteur/boutique");
  redirect("/traiteur/boutique");
}

async function requireAdminForTraiteurs() {
  const [role, supabase] = await Promise.all([backOfficeRole(), marketplaceClient()]);
  if (role !== "admin") return null;
  return { supabase };
}

function refreshValidation(id: string) {
  revalidatePath("/admin/validation");
  revalidatePath(`/admin/validation/${id}`);
  revalidatePath("/marketplace");
  // Le badge "En attente" du menu admin (pendingTraiteurCount()) est calculé
  // dans app/admin/layout.tsx, pas dans la page /admin/validation : sans
  // revalidation du layout, il restait affiché avec l'ancien nombre après un
  // approuver/rejeter, tant que la personne ne rechargeait pas la page.
  revalidatePath("/admin", "layout");
}

/**
 * Approuver : le dossier est clos et la fiche devient visible.
 *
 * Renvoie un résultat plutôt qu'un simple `void` : avant, un refus de la
 * garde admin (rôle qui aurait changé) ou une erreur RLS/base disparaissaient
 * en silence — le bouton semblait ne rien faire, sans aucun message pour
 * comprendre pourquoi. DecisionPanel affiche maintenant ce que ce renvoie.
 */
export async function approveTraiteur(id: string): Promise<ActionState> {
  const ctx = await requireAdminForTraiteurs();
  if (!ctx) {
    return { ok: false, message: "Vous n'êtes plus reconnu comme administrateur — reconnectez-vous." };
  }

  const { failed, code } = await run(
    "approveTraiteur",
    ctx.supabase
      .from("traiteurs")
      .update({ status: "approved", rejection_reason: null })
      .eq("id", id),
  );
  if (failed) {
    return { ok: false, message: `L'approbation a échoué (${code ?? "erreur inconnue"}).` };
  }

  refreshValidation(id);
  return { ok: true, message: null };
}

/** Rejeter, avec un motif — c'est ce texte que le candidat lira. */
export async function rejectTraiteur(id: string, reason: string): Promise<ActionState> {
  const ctx = await requireAdminForTraiteurs();
  if (!ctx) {
    return { ok: false, message: "Vous n'êtes plus reconnu comme administrateur — reconnectez-vous." };
  }

  const motif = reason.trim();
  if (!motif) return { ok: false, message: "Indiquez un motif de refus." };

  const { failed, code } = await run(
    "rejectTraiteur",
    ctx.supabase.from("traiteurs").update({ status: "rejected", rejection_reason: motif }).eq("id", id),
  );
  if (failed) {
    return { ok: false, message: `Le refus a échoué (${code ?? "erreur inconnue"}).` };
  }

  refreshValidation(id);
  return { ok: true, message: null };
}

/* ------------------------------------------------------------------ */
/* Avis client                                                          */
/* ------------------------------------------------------------------ */

/**
 * L'avis, côté écriture — porté depuis lehaim-marketplace (submitReview
 * dans son app/marketplace/actions.ts), sans le hook de gamification
 * (handleReviewSubmitted) qui n'a pas encore d'équivalent ici.
 */
export async function submitReview(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await currentUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const orderId = String(formData.get("order_id") ?? "");
  const rating = Number(formData.get("rating") ?? "0");
  const comment = text(formData, "comment");
  if (!orderId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, message: "Choisissez une note entre 1 et 5." };
  }

  const supabase = await marketplaceClient();

  const { data: orderRow } = await run(
    "submitReview/order",
    supabase.from("marketplace_orders").select("traiteur_id, user_id, status").eq("id", orderId).maybeSingle(),
  );
  const order = orderRow as unknown as { traiteur_id: string; user_id: string; status: string } | null;
  if (!order || order.user_id !== user.id || order.status !== "recuperee") {
    return { ok: false, message: "Cette commande ne peut pas encore être notée." };
  }

  const { error } = await supabase.from("marketplace_reviews").insert({
    order_id: orderId,
    traiteur_id: order.traiteur_id,
    author_id: user.id,
    rating,
    comment,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, message: "Vous avez déjà noté cette commande." };
    return { ok: false, message: await userMessage("submitReview", error) };
  }

  revalidatePath(`/commandes/${orderId}`);
  revalidatePath(`/marketplace/${order.traiteur_id}`);
  return { ok: true, message: "Merci pour votre avis !" };
}

/* ------------------------------------------------------------------ */
/* Favoris                                                              */
/* ------------------------------------------------------------------ */

/**
 * Le cœur de la fiche traiteur. Un favori n'appartient qu'à celui qui l'a
 * posé (voir supabase/migrations/0037_marketplace_favorites.sql).
 */
export async function toggleFavorite(formData: FormData): Promise<void> {
  const user = await currentUser();
  const shopId = String(formData.get("shop_id") ?? "");
  if (!user) redirect(`/connexion?suite=/marketplace/${shopId}`);
  if (!shopId) return;

  const supabase = await marketplaceClient();

  if (formData.get("on") === "1") {
    await supabase
      .from("traiteur_favorites")
      .upsert({ profile_id: user.id, traiteur_id: shopId }, { onConflict: "profile_id,traiteur_id" });
  } else {
    await supabase
      .from("traiteur_favorites")
      .delete()
      .eq("profile_id", user.id)
      .eq("traiteur_id", shopId);
  }

  revalidatePath(`/marketplace/${shopId}`);
  revalidatePath("/marketplace/favoris");
}
