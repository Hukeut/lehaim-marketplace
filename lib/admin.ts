import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/supabase/user";

export type AdminRole = "admin" | "merchant";

/**
 * Rôle de la personne dans le back-office, ou null si elle n'y a pas sa
 * place.
 *
 * lehaim-marketplace a déjà son propre mécanisme d'admin — la liste blanche
 * `marketplace_admins` et la fonction `is_marketplace_admin()` (migration
 * 0009_marketplace_admin.sql) — distinct de celui de lehaim (colonne
 * `profiles.back_office_role`). On réutilise celui qui existe déjà plutôt que
 * d'en introduire un second qui serait concurrent : `requireBackOffice()`
 * garde exactement le même nom et la même forme que côté lehaim pour que les
 * écrans portés (app/admin/**, lib/merchant.ts, lib/shops.ts) fonctionnent
 * sans modification, mais la vérification en dessous parle au vrai mécanisme
 * de ce dépôt.
 *
 * Un commerçant, lui, n'a pas de rôle stocké : c'est simplement quelqu'un qui
 * possède un traiteur (candidature en attente, approuvée ou refusée — voir
 * `myShop()` dans lib/merchant.ts, qui accepte tous les statuts).
 */
export const backOfficeRole = cache(async function backOfficeRole(): Promise<AdminRole | null> {
  const [supabase, user] = await Promise.all([createClient(), currentUser()]);
  if (!user) return null;

  const { data: isAdmin } = await supabase.rpc("is_marketplace_admin");
  if (isAdmin) return "admin";

  const { data: shop } = await supabase
    .from("traiteurs")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (shop) return "merchant";

  return null;
});

/** Garde du back-office : renvoie à l'app ceux qui n'y ont rien à faire. */
export async function requireBackOffice(): Promise<AdminRole> {
  const role = await backOfficeRole();
  if (!role) redirect("/accueil");
  return role;
}
