"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
/* Suivi commandes côté traiteur                                       */
/* ------------------------------------------------------------------ */

export async function setOrderStatus(
  orderId: string,
  status: "nouvelle" | "acceptee" | "en_preparation" | "prete" | "recuperee" | "annulee",
) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("marketplace_orders").update({ status }).eq("id", orderId);
  revalidatePath("/devenir-traiteur/commandes");
}
