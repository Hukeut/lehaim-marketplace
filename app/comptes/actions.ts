"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACCOUNTS_COOKIE, ACCOUNTS_COOKIE_OPTIONS, parseAccounts, serializeAccounts } from "@/lib/accounts";

/**
 * Basculer sur un compte déjà enregistré — sans repasser par /connexion.
 *
 * setSession() avec des jetons potentiellement expirés déclenche un
 * rafraîchissement automatique côté client Supabase si besoin (tant que le
 * refresh_token est encore valide) ; c'est ce rafraîchissement qui réécrit
 * le cookie de session actif via lib/supabase/server.ts.
 */
export async function switchAccount(formData: FormData): Promise<void> {
  const userId = String(formData.get("user_id") ?? "");
  if (!userId) return;

  const store = await cookies();
  const accounts = parseAccounts(store.get(ACCOUNTS_COOKIE)?.value);
  const target = accounts.find((a) => a.userId === userId);
  if (!target) {
    redirect("/comptes?erreur=introuvable");
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({
    access_token: target.accessToken,
    refresh_token: target.refreshToken,
  });

  if (error) {
    // Jeton révoqué ou trop ancien (l'utilisateur ne s'est pas reconnecté à
    // ce compte depuis longtemps) — on le retire plutôt que de laisser un
    // bouton qui échoue silencieusement à chaque fois.
    const filtered = accounts.filter((a) => a.userId !== userId);
    store.set(ACCOUNTS_COOKIE, serializeAccounts(filtered), ACCOUNTS_COOKIE_OPTIONS);
    redirect("/connexion?erreur=session_expiree");
  }

  redirect("/accueil");
}

/**
 * Retirer un compte de la liste. S'il s'agit du compte actif, on bascule
 * automatiquement sur le suivant plutôt que de tout déconnecter d'un coup.
 */
export async function removeAccount(formData: FormData): Promise<void> {
  const userId = String(formData.get("user_id") ?? "");
  if (!userId) return;

  const store = await cookies();
  const accounts = parseAccounts(store.get(ACCOUNTS_COOKIE)?.value);
  const filtered = accounts.filter((a) => a.userId !== userId);
  store.set(ACCOUNTS_COOKIE, serializeAccounts(filtered), ACCOUNTS_COOKIE_OPTIONS);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id === userId) {
    await supabase.auth.signOut();

    const next = filtered[0];
    if (next) {
      await supabase.auth.setSession({ access_token: next.accessToken, refresh_token: next.refreshToken });
      redirect("/accueil");
    }
    redirect("/onboarding");
  }

  revalidatePath("/comptes");
}

/**
 * Ajouter un compte : ne vide QUE la session active (pas la liste
 * enregistrée), puis renvoie vers la connexion. Le nouveau compte
 * rejoindra la liste automatiquement via le middleware dès qu'il sera
 * connecté (voir proxy.ts).
 */
export async function addAccount(): Promise<void> {
  const supabase = await createClient();
  // scope "local" : vide seulement le cookie de session actif, sans révoquer
  // le refresh_token de ce compte côté Supabase — sinon on ne pourrait plus
  // jamais rebasculer dessus depuis la liste enregistrée.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/connexion?suite=/comptes");
}
