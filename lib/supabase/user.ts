import "server-only";
import { cache } from "react";
import { createClient } from "./server";

/**
 * Personne connectée, mémoïsée sur la requête.
 *
 * `auth.getUser()` n'est pas une lecture locale : elle valide le jeton auprès
 * de Supabase, donc chaque appel est un aller-retour réseau. Un écran qui
 * charge le profil, le Shabbat et les missions en déclenchait trois, en série.
 * Ici on n'en fait qu'un, réutilisé par tous les appelants du rendu.
 */
export const currentUser = cache(async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
