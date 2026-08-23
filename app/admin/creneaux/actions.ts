"use server";

import { revalidatePath } from "next/cache";
import { myShop, createClient } from "@/lib/merchant";

/**
 * Les créneaux, côté gestes.
 *
 * Ajout à la main, un par un — pas de génération en bloc dans ce schéma.
 * Retrait plutôt que fermeture : `traiteur_slots` n'a pas de colonne
 * `closed`, et la RLS portée depuis lehaim-marketplace n'autorise que
 * l'ajout et la suppression, pas la modification.
 */

function refresh() {
  revalidatePath("/admin/creneaux");
  revalidatePath("/marketplace", "layout");
}

export async function addSlot(formData: FormData): Promise<void> {
  const shop = await myShop();
  if (!shop) return;

  const date = String(formData.get("date") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  if (!date || !label) return;

  // Vide = illimité. Un nombre non positif n'a pas de sens comme plafond.
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const capacity = capacityRaw ? Math.max(1, Math.round(Number(capacityRaw))) : null;

  const supabase = await createClient();
  await supabase
    .from("traiteur_slots")
    .insert({ traiteur_id: shop.id, slot_date: date, slot_label: label, capacity });

  refresh();
}

export async function removeSlot(formData: FormData): Promise<void> {
  const shop = await myShop();
  if (!shop) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("traiteur_slots").delete().eq("id", id).eq("traiteur_id", shop.id);

  refresh();
}
