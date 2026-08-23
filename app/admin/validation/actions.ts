"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/supabase/user";
import { backOfficeRole } from "@/lib/admin";
import { run } from "@/lib/db";

/**
 * Décisions sur un dossier marchand.
 *
 * Les trois issues sont volontairement dissymétriques. Approuver ne demande
 * rien : le dossier parle de lui-même. Refuser ou demander un complément
 * exigent un motif écrit, parce que c'est ce texte que le commerçant lira, et
 * que « dossier incomplet » ne lui dit pas quoi refaire.
 *
 * Le contrôle de droits est doublé : la politique RLS le tient déjà, mais un
 * `requireAdmin()` en tête rend le droit lisible en TypeScript. Une politique
 * ne se relit pas ; une garde, si.
 */
async function requireAdmin() {
  const [role, user] = await Promise.all([backOfficeRole(), currentUser()]);
  if (role !== "admin" || !user) return null;
  return { supabase: await createClient(), user };
}

function refresh(reference: string) {
  revalidatePath("/admin/validation");
  revalidatePath(`/admin/validation/${reference}`);
  revalidatePath("/admin/marchands");
  revalidatePath("/admin");
}

/** Approuver : le dossier est clos et la boutique devient visible. */
export async function approveApplication(reference: string, shopId: string) {
  const ctx = await requireAdmin();
  if (!ctx) return;

  await run(
    "approveApplication/shop_applications",
    ctx.supabase
      .from("shop_applications")
      .update({
        status: "approved",
        decided_at: new Date().toISOString(),
        decided_by: ctx.user.id,
        decision_reason: null,
      })
      .eq("reference", reference),
  );

  // La mise en ligne est la conséquence de l'approbation, pas un second geste :
  // un dossier approuvé dont la boutique reste invisible n'aurait aucun sens.
  await run(
    "approveApplication/shops",
    ctx.supabase.from("shops").update({ status: "live" }).eq("id", shopId),
  );

  // Et le propriétaire reçoit son accès. Sans lui, un marchand approuvé se
  // retrouvait avec une boutique en ligne, des commandes qui arrivent, et
  // aucun back-office pour les voir — `requireBackOffice()` le renvoyait à
  // l'app. Le rôle passe par `admin_set_role` : la garde de 0014 interdit
  // l'écriture directe sur `back_office_role`, y compris à un administrateur.
  const { data: shop } = await run(
    "approveApplication/owner",
    ctx.supabase.from("shops").select("owner_id").eq("id", shopId).maybeSingle(),
  );
  const ownerId = (shop as unknown as { owner_id: string | null } | null)?.owner_id;

  if (ownerId) {
    const { data: profile } = await run(
      "approveApplication/role",
      ctx.supabase.from("profiles").select("back_office_role").eq("id", ownerId).maybeSingle(),
    );
    // On ne rétrograde jamais un administrateur qui tiendrait aussi un
    // commerce : approuver son dossier ne doit pas lui retirer ses droits.
    if (!(profile as unknown as { back_office_role: string | null } | null)?.back_office_role) {
      const { error } = await ctx.supabase.rpc("admin_set_role", {
        target: ownerId,
        next_role: "merchant",
      });
      if (error) console.error("[lehaim] approveApplication/admin_set_role", error.message);
    }
  }

  refresh(reference);
}

/** Demander un complément : le dossier repart chez le commerçant, motivé. */
export async function requestComplement(reference: string, reason: string) {
  const ctx = await requireAdmin();
  if (!ctx) return;

  const motif = reason.trim();
  if (!motif) return;

  await run(
    "requestComplement/shop_applications",
    ctx.supabase
      .from("shop_applications")
      .update({
        status: "complement",
        decided_at: new Date().toISOString(),
        decided_by: ctx.user.id,
        decision_reason: motif,
      })
      .eq("reference", reference),
  );

  refresh(reference);
}

/** Rejeter : la boutique retourne au brouillon, le motif est conservé. */
export async function rejectApplication(reference: string, shopId: string, reason: string) {
  const ctx = await requireAdmin();
  if (!ctx) return;

  const motif = reason.trim();
  if (!motif) return;

  await run(
    "rejectApplication/shop_applications",
    ctx.supabase
      .from("shop_applications")
      .update({
        status: "rejected",
        decided_at: new Date().toISOString(),
        decided_by: ctx.user.id,
        decision_reason: motif,
      })
      .eq("reference", reference),
  );

  await run(
    "rejectApplication/shops",
    ctx.supabase.from("shops").update({ status: "draft" }).eq("id", shopId),
  );

  refresh(reference);
}
