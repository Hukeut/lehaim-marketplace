"use server";

import { revalidatePath } from "next/cache";
import { myShop, createClient } from "@/lib/merchant";
import { userMessage } from "@/lib/db";
import type { ActionState } from "@/app/actions";

/**
 * La carte, côté écriture.
 *
 * Rien ne se supprime : un produit se retire de la vente. Les lignes de
 * commande pointent vers le produit, et une carte effacée rendrait
 * illisibles les commandes passées.
 */

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length ? trimmed : null;
}

function refresh() {
  revalidatePath("/traiteur/carte");
  revalidatePath("/marketplace", "layout");
}

/** Disponible ou non — le geste le plus fréquent d'un service. */
export async function toggleAvailability(formData: FormData): Promise<void> {
  const shop = await myShop();
  if (!shop) return;

  const id = String(formData.get("id") ?? "");
  const active = formData.get("available") === "1";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("traiteur_products").update({ active }).eq("id", id).eq("traiteur_id", shop.id);

  refresh();
}

export async function saveProduct(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const shop = await myShop();
  if (!shop) return { ok: false, message: "Votre boutique n'est pas encore créée." };

  const name = text(formData, "name");
  if (!name) return { ok: false, message: "Donnez un nom à ce produit." };

  const price = Number(String(formData.get("price") ?? "0").replace(",", "."));
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, message: "Indiquez un prix." };
  }

  const payload = {
    title: name,
    description: text(formData, "description"),
    price,
    category: String(formData.get("category") ?? "autre"),
    image_url: text(formData, "image_url"),
    allergens: formData.getAll("allergens").map(String),
    workshop_note: text(formData, "workshop_note"),
  };

  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  // `select` après l'écriture : une mise à jour filtrée par la RLS ne renvoie
  // pas d'erreur, elle ne touche aucune ligne.
  const { data, error } = id
    ? await supabase
        .from("traiteur_products")
        .update(payload)
        .eq("id", id)
        .eq("traiteur_id", shop.id)
        .select("id")
    : await supabase
        .from("traiteur_products")
        .insert({ ...payload, traiteur_id: shop.id })
        .select("id");

  if (error) return { ok: false, message: await userMessage("saveProduct", error) };
  if (!data?.length) {
    return { ok: false, message: "Rien n'a été enregistré. Reconnectez-vous et réessayez." };
  }

  refresh();
  return { ok: true, message: null };
}
