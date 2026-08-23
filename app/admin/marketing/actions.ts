"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { backOfficeRole } from "@/lib/admin";
import { run } from "@/lib/db";

/**
 * La mise en avant, côté écriture.
 *
 * La garde en base refuse déjà ces colonnes à un commerçant ; le contrôle
 * ici rend le droit lisible en TypeScript. Une politique ne se relit pas,
 * une garde si.
 */
async function requireAdmin() {
  if ((await backOfficeRole()) !== "admin") return null;
  return createClient();
}

function refresh() {
  revalidatePath("/admin/marketing");
  revalidatePath("/marketplace", "layout");
}

export async function setFeatured(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  if (!supabase) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const raw = String(formData.get("rank") ?? "").trim();
  const rank = raw ? Math.max(1, Math.min(99, Number(raw))) : null;
  const note = String(formData.get("note") ?? "").trim() || null;

  await run(
    "setFeatured",
    supabase
      .from("shops")
      .update({ featured_rank: Number.isFinite(rank as number) ? rank : null, featured_note: note })
      .eq("id", id),
  );

  refresh();
}

/** Retirer de la vitrine sans toucher au reste de la fiche. */
export async function clearFeatured(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  if (!supabase) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await run(
    "clearFeatured",
    supabase.from("shops").update({ featured_rank: null, featured_note: null }).eq("id", id),
  );

  refresh();
}
