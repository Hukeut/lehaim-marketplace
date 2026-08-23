"use server";

import { revalidatePath } from "next/cache";
import { myShop, createClient } from "@/lib/merchant";
import { userMessage } from "@/lib/db";
import type { ActionState } from "@/app/actions";

/**
 * Une écriture filtrée par la RLS ne renvoie pas d'erreur : elle ne touche
 * simplement aucune ligne. Sans ce contrôle, l'écran annonçait « enregistré »
 * après une mise à jour qui n'avait rien écrit.
 */
const NOTHING_WRITTEN = "Rien n'a été enregistré. Reconnectez-vous et réessayez.";

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length ? trimmed : null;
}

function refresh() {
  revalidatePath("/admin/boutique");
  revalidatePath("/admin/service");
  revalidatePath("/marketplace", "layout");
}

export async function saveIdentity(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const shop = await myShop();
  if (!shop) return { ok: false, message: "Votre boutique n'est pas encore créée." };

  const name = text(formData, "name");
  if (!name) return { ok: false, message: "Indiquez le nom de votre commerce." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("traiteurs")
    .update({
      name,
      description: text(formData, "description"),
      address: text(formData, "address"),
      city: text(formData, "city"),
      phone: text(formData, "phone"),
    })
    .eq("id", shop.id)
    .select("id");

  if (error) return { ok: false, message: await userMessage("saveIdentity", error) };
  if (!data?.length) return { ok: false, message: NOTHING_WRITTEN };

  refresh();
  return { ok: true, message: null };
}

export async function saveService(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const shop = await myShop();
  if (!shop) return { ok: false, message: "Votre boutique n'est pas encore créée." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("traiteurs")
    .update({
      prep_minutes: Math.max(5, Math.min(240, Number(formData.get("prep_minutes") ?? 20))),
    })
    .eq("id", shop.id)
    .select("id");

  if (error) return { ok: false, message: await userMessage("saveService", error) };
  if (!data?.length) return { ok: false, message: NOTHING_WRITTEN };

  refresh();
  return { ok: true, message: null };
}

/** Enregistre l'URL du logo dès le dépôt — pas de bouton "Enregistrer" séparé. */
export async function saveLogo(url: string): Promise<void> {
  const shop = await myShop();
  if (!shop) return;

  const supabase = await createClient();
  await supabase.from("traiteurs").update({ logo_url: url }).eq("id", shop.id);

  refresh();
}

/** Même geste pour la photo de couverture. */
export async function saveCover(url: string): Promise<void> {
  const shop = await myShop();
  if (!shop) return;

  const supabase = await createClient();
  await supabase.from("traiteurs").update({ cover_url: url }).eq("id", shop.id);

  refresh();
}

/**
 * La pause — le seul geste de visibilité qui appartient au commerçant.
 *
 * Distincte du statut, qui est une décision de validation. Une boutique en
 * pause reste approuvée ; elle n'accepte simplement plus de commande.
 */
export async function togglePause(formData: FormData): Promise<void> {
  const shop = await myShop();
  if (!shop) return;

  const supabase = await createClient();
  await supabase.from("traiteurs").update({ paused: formData.get("paused") === "1" }).eq("id", shop.id);

  refresh();
}
