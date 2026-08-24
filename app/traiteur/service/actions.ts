"use server";

import { revalidatePath } from "next/cache";
import { backOfficeRole } from "@/lib/admin";
import { myShop, nextStatus, createClient, type OrderStatus } from "@/lib/merchant";

/**
 * Le service, côté gestes.
 *
 * Porté sur marketplace_orders : chaque geste n'écrit qu'un statut (et, pour
 * le refus, un motif). L'horodatage par étape n'est pas écrit ici : un
 * trigger sur marketplace_orders (voir migration 0043) journalise chaque
 * changement de statut dans marketplace_order_events, quel que soit le geste
 * qui l'a causé.
 */

async function context() {
  const [role, shop] = await Promise.all([backOfficeRole(), myShop()]);
  if (!role) return null;
  if (role === "merchant" && !shop) return null;
  return { supabase: await createClient(), shop };
}

function refresh() {
  revalidatePath("/traiteur/service");
  revalidatePath("/traiteur/commandes");
  revalidatePath("/admin/pilotage");
  revalidatePath("/commandes", "layout");
}

/** Accepter, en confirmant au passage le temps de préparation annoncé. */
export async function acceptOrder(formData: FormData): Promise<void> {
  const ctx = await context();
  if (!ctx) return;

  const id = String(formData.get("id") ?? "");
  const minutes = Number(formData.get("prep_minutes") ?? 0);
  if (!id) return;

  await ctx.supabase.from("marketplace_orders").update({ status: "acceptee" }).eq("id", id);

  // Un temps de préparation revu à la hausse un jour de rush vaut pour les
  // commandes suivantes, pas seulement pour celle-ci.
  if (ctx.shop && minutes > 0 && minutes !== ctx.shop.prepMinutes) {
    await ctx.supabase
      .from("traiteurs")
      .update({ prep_minutes: Math.min(240, minutes) })
      .eq("id", ctx.shop.id);
  }

  refresh();
}

/** Refuser, avec un motif — c'est ce texte que le client lira. */
export async function refuseOrder(formData: FormData): Promise<void> {
  const ctx = await context();
  if (!ctx) return;

  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id || !reason) return;

  await ctx.supabase
    .from("marketplace_orders")
    .update({ status: "annulee", cancelled_by: "traiteur", refusal_reason: reason })
    .eq("id", id);

  refresh();
}

/** Faire avancer d'un cran, sans jamais sauter d'étape. */
export async function advanceOrder(formData: FormData): Promise<void> {
  const ctx = await context();
  if (!ctx) return;

  const id = String(formData.get("id") ?? "");
  const from = String(formData.get("from") ?? "") as OrderStatus;
  if (!id) return;

  const next = nextStatus(from);
  if (!next) return;

  await ctx.supabase
    .from("marketplace_orders")
    .update({ status: next })
    // La clause sur l'état de départ évite qu'un double appui fasse avancer
    // deux fois : le second ne trouve plus de ligne à mettre à jour.
    .eq("id", id)
    .eq("status", from);

  refresh();
}
