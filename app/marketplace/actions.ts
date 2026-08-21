"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyTraiteur } from "@/lib/marketplace";
import {
  handleOrderTerminal,
  handleReviewSubmitted,
  handleMessageResponded,
  recomputeSubjectState,
} from "@/lib/gamification";
import type { ActionState } from "@/app/actions";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length ? trimmed : null;
}

/* ------------------------------------------------------------------ */
/* Onboarding traiteur                                                  */
/* ------------------------------------------------------------------ */

export async function registerTraiteur(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const name = text(formData, "name");
  if (!name) return { ok: false, message: "Le nom de votre commerce est obligatoire." };

  const productTitle = text(formData, "product_title");
  const productPrice = Number(String(formData.get("product_price") ?? "0").replace(",", "."));
  if (!productTitle) {
    return { ok: false, message: "Ajoutez au moins un produit à votre catalogue." };
  }
  if (!Number.isFinite(productPrice) || productPrice <= 0) {
    return { ok: false, message: "Le prix du produit doit être un nombre positif." };
  }

  const { data: traiteur, error } = await supabase
    .from("traiteurs")
    .insert({
      owner_id: user.id,
      name,
      address: text(formData, "address"),
      phone: text(formData, "phone"),
      patente_number: text(formData, "patente_number"),
      hechsher_name: text(formData, "hechsher_name"),
      delivery_available: formData.get("delivery_available") === "on",
      delivery_zone: text(formData, "delivery_zone"),
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: error.message };

  const { error: productError } = await supabase.from("traiteur_products").insert({
    traiteur_id: traiteur.id,
    title: productTitle,
    description: text(formData, "product_description"),
    price: productPrice,
    category: text(formData, "product_category") ?? "plat",
    quantity_hint: text(formData, "product_quantity_hint"),
    allergens: formData.getAll("product_allergens"),
  });

  if (productError) return { ok: false, message: productError.message };

  revalidatePath("/devenir-traiteur");
  redirect("/devenir-traiteur");
}

/* ------------------------------------------------------------------ */
/* Espace fournisseur — menu et informations                           */
/* ------------------------------------------------------------------ */

export async function addProduct(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const traiteur = await getMyTraiteur();
  if (!traiteur) return { ok: false, message: "Créez d'abord votre profil traiteur." };

  const title = text(formData, "title");
  if (!title) return { ok: false, message: "Le nom du plat est obligatoire." };
  const price = Number(String(formData.get("price") ?? "0").replace(",", "."));
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, message: "Le prix doit être un nombre positif." };
  }

  const { error } = await supabase.from("traiteur_products").insert({
    traiteur_id: traiteur.id,
    title,
    description: text(formData, "description"),
    price,
    category: text(formData, "category") ?? "plat",
    quantity_hint: text(formData, "quantity_hint"),
    allergens: formData.getAll("allergens"),
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/devenir-traiteur/menu");
  redirect("/devenir-traiteur/menu");
}

export async function updateProduct(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const productId = String(formData.get("product_id") ?? "");
  if (!productId) return { ok: false, message: "Plat introuvable." };

  const title = text(formData, "title");
  if (!title) return { ok: false, message: "Le nom du plat est obligatoire." };
  const price = Number(String(formData.get("price") ?? "0").replace(",", "."));
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, message: "Le prix doit être un nombre positif." };
  }

  const { error } = await supabase
    .from("traiteur_products")
    .update({
      title,
      description: text(formData, "description"),
      price,
      category: text(formData, "category") ?? "plat",
      quantity_hint: text(formData, "quantity_hint"),
      allergens: formData.getAll("allergens"),
    })
    .eq("id", productId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/devenir-traiteur/menu");
  redirect("/devenir-traiteur/menu");
}

export async function deleteProduct(productId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("traiteur_products").delete().eq("id", productId);
  revalidatePath("/devenir-traiteur/menu");
  redirect("/devenir-traiteur/menu");
}

/* ------------------------------------------------------------------ */
/* Créneaux de retrait proposés par le traiteur                        */
/* ------------------------------------------------------------------ */

export async function addSlot(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const traiteur = await getMyTraiteur();
  if (!traiteur) return { ok: false, message: "Créez d'abord votre profil traiteur." };

  const date = text(formData, "slot_date");
  const label = text(formData, "slot_label");
  if (!date) return { ok: false, message: "Choisissez une date." };
  if (!label) return { ok: false, message: "Indiquez un horaire (ex. 14h00–14h30)." };

  const { error } = await supabase.from("traiteur_slots").insert({
    traiteur_id: traiteur.id,
    slot_date: date,
    slot_label: label,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, message: "Ce créneau existe déjà." };
    return { ok: false, message: error.message };
  }

  revalidatePath("/devenir-traiteur/creneaux");
  return { ok: true, message: "Créneau ajouté." };
}

export async function deleteSlot(slotId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("traiteur_slots").delete().eq("id", slotId);
  revalidatePath("/devenir-traiteur/creneaux");
}

export async function updateTraiteurProfile(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const traiteur = await getMyTraiteur();
  if (!traiteur) return { ok: false, message: "Profil introuvable." };

  const name = text(formData, "name");
  if (!name) return { ok: false, message: "Le nom du commerce est obligatoire." };

  const { error } = await supabase
    .from("traiteurs")
    .update({
      name,
      address: text(formData, "address"),
      phone: text(formData, "phone"),
      patente_number: text(formData, "patente_number"),
      hechsher_name: text(formData, "hechsher_name"),
      delivery_available: formData.get("delivery_available") === "on",
      delivery_zone: text(formData, "delivery_zone"),
    })
    .eq("id", traiteur.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/devenir-traiteur");
  revalidatePath("/devenir-traiteur/profil");
  revalidatePath(`/marketplace/${traiteur.id}`);
  return { ok: true, message: "Informations mises à jour." };
}

/**
 * Marque le palier de réactivité courant comme "vu" par le traiteur, pour
 * ne plus rejouer l'animation "Niveau débloqué" une fois affichée.
 */
export async function acknowledgeTier(traiteurId: string, tier: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase
    .from("traiteurs")
    .update({ last_seen_tier: tier })
    .eq("id", traiteurId)
    .eq("owner_id", user.id);
  revalidatePath("/devenir-traiteur/score");
}

/* ------------------------------------------------------------------ */
/* Réservation (sans paiement)                                         */
/* ------------------------------------------------------------------ */

export type CartLine = { productId: string; title: string; price: number; quantity: number };

export async function createOrder(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const traiteurId = String(formData.get("traiteur_id") ?? "");
  const fulfillment = formData.get("fulfillment") === "livraison" ? "livraison" : "retrait";
  const pickupDate = text(formData, "pickup_date");
  const pickupSlot = text(formData, "pickup_slot");
  const notes = text(formData, "notes");
  const shabbatId = text(formData, "shabbat_id");

  // Le code affiché au traiteur (à la place du nom du client) est celui du
  // Shabbat rattaché. La RLS sur `shabbats` limite la lecture aux membres :
  // si l'id fourni n'est pas accessible à cet utilisateur, on ignore le lien.
  let pickupCode: string | null = null;
  if (shabbatId) {
    const { data: shabbatRow } = await supabase
      .from("shabbats")
      .select("pickup_code")
      .eq("id", shabbatId)
      .maybeSingle();
    pickupCode = (shabbatRow?.pickup_code as string | null) ?? null;
  }

  let cart: CartLine[] = [];
  try {
    cart = JSON.parse(String(formData.get("cart") ?? "[]"));
  } catch {
    cart = [];
  }

  if (!traiteurId || !cart.length) {
    return { ok: false, message: "Votre panier est vide." };
  }
  if (!pickupDate || !pickupSlot) {
    return { ok: false, message: "Choisissez un créneau." };
  }

  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);

  const { data: order, error } = await supabase
    .from("marketplace_orders")
    .insert({
      traiteur_id: traiteurId,
      user_id: user.id,
      fulfillment,
      pickup_date: pickupDate,
      pickup_slot: pickupSlot,
      total_amount: total,
      notes,
      shabbat_id: shabbatId || null,
      pickup_code: pickupCode,
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: error.message };

  const { error: itemsError } = await supabase.from("marketplace_order_items").insert(
    cart.map((line) => ({
      order_id: order.id,
      product_id: line.productId,
      title: line.title,
      price: line.price,
      quantity: line.quantity,
    })),
  );

  if (itemsError) return { ok: false, message: itemsError.message };

  redirect(`/marketplace/commande/${order.id}`);
}

/* ------------------------------------------------------------------ */
/* Espace admin — validation des traiteurs                             */
/* ------------------------------------------------------------------ */

async function requireAdmin() {
  const { supabase, user } = await requireUser();
  if (!user) return { supabase, isAdmin: false };
  const { data } = await supabase.rpc("is_marketplace_admin");
  return { supabase, isAdmin: Boolean(data) };
}

export async function approveTraiteur(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Accès réservé aux admins." };

  const traiteurId = String(formData.get("traiteur_id") ?? "");
  if (!traiteurId) return { ok: false, message: "Traiteur introuvable." };

  const { error } = await supabase
    .from("traiteurs")
    .update({ status: "approved", rejection_reason: null })
    .eq("id", traiteurId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/traiteurs");
  revalidatePath(`/admin/traiteurs/${traiteurId}`);
  revalidatePath("/marketplace");
  return { ok: true, message: "Traiteur approuvé." };
}

export async function rejectTraiteur(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Accès réservé aux admins." };

  const traiteurId = String(formData.get("traiteur_id") ?? "");
  if (!traiteurId) return { ok: false, message: "Traiteur introuvable." };
  const reason = text(formData, "reason");

  const { error } = await supabase
    .from("traiteurs")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", traiteurId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/traiteurs");
  revalidatePath(`/admin/traiteurs/${traiteurId}`);
  revalidatePath("/marketplace");
  return { ok: true, message: "Traiteur rejeté." };
}

/* ------------------------------------------------------------------ */
/* Chat par commande (client ⇄ traiteur)                                */
/* ------------------------------------------------------------------ */

export async function sendOrderMessage(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const orderId = String(formData.get("order_id") ?? "");
  const body = text(formData, "body");
  if (!orderId || !body) return { ok: false, message: null };

  const { error } = await supabase
    .from("marketplace_order_messages")
    .insert({ order_id: orderId, sender_id: user.id, body });

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/marketplace/commande/${orderId}`);
  revalidatePath(`/devenir-traiteur/commandes/${orderId}`);

  // Gamification : simple signal de communication, pas d'XP (le chat est
  // trop facile à faire tourner en boucle pour y attacher une récompense).
  const { data: orderRow } = await supabase
    .from("marketplace_orders")
    .select("traiteur_id, user_id, traiteurs(owner_id)")
    .eq("id", orderId)
    .maybeSingle();
  if (orderRow) {
    const traiteurOwnerId = (orderRow.traiteurs as { owner_id?: string } | null)?.owner_id;
    const isOrganizer = orderRow.user_id === user.id;
    const isTraiteur = traiteurOwnerId === user.id;
    if (isOrganizer || isTraiteur) {
      try {
        await handleMessageResponded({
          orderId,
          senderSubjectType: isOrganizer ? "organizer" : "traiteur",
          senderSubjectId: isOrganizer ? user.id : (orderRow.traiteur_id as string),
        });
      } catch {
        // La discussion ne doit jamais échouer à cause de la gamification.
      }
    }
  }

  return { ok: true, message: null };
}

/* ------------------------------------------------------------------ */
/* Avis client (prérequis gamification — voir docs/gamification-architecture-proposal.md) */
/* ------------------------------------------------------------------ */

export async function submitReview(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const orderId = String(formData.get("order_id") ?? "");
  const rating = Number(formData.get("rating") ?? "0");
  const comment = text(formData, "comment");
  if (!orderId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, message: "Choisissez une note entre 1 et 5." };
  }

  const { data: orderRow } = await supabase
    .from("marketplace_orders")
    .select("traiteur_id, user_id, status")
    .eq("id", orderId)
    .maybeSingle();
  if (!orderRow || orderRow.user_id !== user.id || orderRow.status !== "recuperee") {
    return { ok: false, message: "Cette commande ne peut pas encore être notée." };
  }

  const { error } = await supabase.from("marketplace_reviews").insert({
    order_id: orderId,
    traiteur_id: orderRow.traiteur_id,
    author_id: user.id,
    rating,
    comment,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, message: "Vous avez déjà noté cette commande." };
    return { ok: false, message: error.message };
  }

  try {
    await handleReviewSubmitted({
      orderId,
      traiteurId: orderRow.traiteur_id as string,
      organizerId: user.id,
      rating,
    });
  } catch {
    // L'avis est déjà enregistré ; rattrapable via le recalcul manuel admin.
  }

  revalidatePath(`/marketplace/commande/${orderId}`);
  revalidatePath(`/marketplace/${orderRow.traiteur_id}`);
  return { ok: true, message: "Merci pour votre avis !" };
}

/* ------------------------------------------------------------------ */
/* Admin — recalcul manuel de gamification (§16/§19 du cahier des charges) */
/* ------------------------------------------------------------------ */

export async function recomputeGamificationSubject(
  subjectType: "traiteur" | "organizer",
  subjectId: string,
) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return;
  await recomputeSubjectState(subjectType, subjectId);
  revalidatePath("/devenir-traiteur/score");
  revalidatePath(`/admin/traiteurs/${subjectId}`);
}

/* ------------------------------------------------------------------ */
/* Suivi commandes côté traiteur                                       */
/* ------------------------------------------------------------------ */

export async function setOrderStatus(
  orderId: string,
  status: "nouvelle" | "acceptee" | "en_preparation" | "prete" | "recuperee" | "annulee",
) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  // Une seule lecture pour tous les besoins ci-dessous : qui annule, si
  // c'est la première sortie de "nouvelle", et les données nécessaires à
  // la gamification si la commande atteint un état terminal.
  const { data: orderRow } = await supabase
    .from("marketplace_orders")
    .select("user_id, traiteur_id, status, responded_at, created_at, total_amount")
    .eq("id", orderId)
    .maybeSingle();

  const patch: Record<string, unknown> = { status };
  let cancelledBy: "client" | "traiteur" | null = null;
  if (status === "annulee") {
    // On détermine qui annule en comparant à qui a passé la commande, pas
    // en se fiant à un rôle envoyé par l'appelant (client ou traiteur
    // peuvent tous les deux invoquer cette même action).
    cancelledBy = orderRow?.user_id === user.id ? "client" : "traiteur";
    patch.cancelled_by = cancelledBy;
  }
  // Première sortie de "nouvelle" : marque le temps de réponse du traiteur
  // (accepter, refuser, peu importe), utilisé par la métrique de réactivité.
  const respondedAt =
    orderRow?.status === "nouvelle" && status !== "nouvelle" && !orderRow.responded_at
      ? new Date().toISOString()
      : ((orderRow?.responded_at as string | null) ?? null);
  if (respondedAt && !orderRow?.responded_at) {
    patch.responded_at = respondedAt;
  }

  await supabase.from("marketplace_orders").update(patch).eq("id", orderId);
  revalidatePath("/devenir-traiteur/commandes");
  revalidatePath(`/devenir-traiteur/commandes/${orderId}`);
  revalidatePath("/devenir-traiteur/score");
  revalidatePath("/marketplace/mes-commandes");
  revalidatePath(`/marketplace/commande/${orderId}`);

  // Gamification : uniquement sur les transitions terminales (une commande
  // "en_preparation" ou "prete" ne produit ni événement ni XP).
  if (orderRow && (status === "recuperee" || status === "annulee")) {
    try {
      await handleOrderTerminal({
        id: orderId,
        traiteurId: orderRow.traiteur_id as string,
        userId: orderRow.user_id as string,
        status,
        cancelledBy,
        createdAt: orderRow.created_at as string,
        respondedAt,
        totalAmount: Number(orderRow.total_amount ?? 0),
      });
    } catch {
      // Le statut de la commande est déjà mis à jour ; un échec ici est
      // rattrapable via le recalcul manuel admin, pas bloquant pour l'UX.
    }
  }
}
