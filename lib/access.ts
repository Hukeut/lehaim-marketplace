import "server-only";
import { redirect } from "next/navigation";
import { getShabbat } from "@/lib/data";
import { getMyCohostRole } from "@/lib/cohost";

/**
 * Qui a le droit de piloter un Shabbat : l'hôte, et les personnes qu'il a
 * explicitement nommées co-organisatrices. Être invité ne donne aucun droit
 * de gestion — un convive voit ce qui le concerne, pas le tableau de bord.
 */
export async function canManage(shabbatId: string) {
  const shabbat = await getShabbat(shabbatId);
  if (!shabbat) return false;
  if (shabbat.isHost) return true;

  const role = await getMyCohostRole(shabbatId);
  return Boolean(role);
}

/**
 * Garde des écrans d'administration. Renvoie l'invité vers sa propre vue
 * plutôt que vers une page d'erreur : de son point de vue, l'écran n'existe
 * simplement pas.
 */
export async function requireManager(shabbatId: string) {
  if (!(await canManage(shabbatId))) redirect(`/invitation/${shabbatId}`);
}
