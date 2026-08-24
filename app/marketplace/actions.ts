"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/user";
import { marketplaceClient } from "@/lib/shops";
import { backOfficeRole } from "@/lib/admin";
import { run, userMessage } from "@/lib/db";
import type { ActionState } from "@/app/actions";

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

  if (!shopId) return { ok: false, message: "Commerce introuvable." };
  if (cartLines.length === 0) return { ok: false, message: "Votre panier est vide." };
  if (mode === "livraison" && !address) {
    return { ok: false, message: "Indiquez une adresse de livraison." };
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

  revalidatePath("/commandes", "layout");
  revalidatePath("/traiteur/service");
  redirect(`/commandes/${orderId}?cleared=${shopId}`);
}

/** Renoncer, tant que le traiteur n'a encore rien accepté. */
export async function cancelOrder(formData: FormData): Promise<void> {
  const user = await currentUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await marketplaceClient();
  await supabase
    .from("marketplace_orders")
    .update({ status: "annulee", cancelled_by: "client" })
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
 * Une candidature crée le traiteur ET son premier produit d'un coup : une
 * fiche sans rien à vendre n'aurait rien à montrer une fois approuvée.
 */
export async function registerTraiteur(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await currentUser();
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

  const supabase = await marketplaceClient();

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

  if (error || !traiteur) {
    return { ok: false, message: await userMessage("registerTraiteur", error!) };
  }

  const traiteurId = (traiteur as unknown as { id: string }).id;

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

  revalidatePath("/partenaire");
  redirect("/partenaire");
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
}

/** Approuver : le dossier est clos et la fiche devient visible. */
export async function approveTraiteur(id: string): Promise<void> {
  const ctx = await requireAdminForTraiteurs();
  if (!ctx) return;

  await run(
    "approveTraiteur",
    ctx.supabase
      .from("traiteurs")
      .update({ status: "approved", rejection_reason: null })
      .eq("id", id),
  );

  refreshValidation(id);
}

/** Rejeter, avec un motif — c'est ce texte que le candidat lira. */
export async function rejectTraiteur(id: string, reason: string): Promise<void> {
  const ctx = await requireAdminForTraiteurs();
  if (!ctx) return;

  const motif = reason.trim();
  if (!motif) return;

  await run(
    "rejectTraiteur",
    ctx.supabase.from("traiteurs").update({ status: "rejected", rejection_reason: motif }).eq("id", id),
  );

  refreshValidation(id);
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
