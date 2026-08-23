"use server";

import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MIN_PASSWORD = 8;

export type AuthState = { error: string | null };

type Translate = Awaited<ReturnType<typeof getTranslations<"auth">>>;

/**
 * L'authentification se faisait entièrement dans le navigateur, ce qui
 * obligeait l'écran de connexion — le deuxième que voit tout nouveau venu — à
 * télécharger les 248 Ko du client Supabase. Le serveur sait faire les mêmes
 * trois appels, et il pose les cookies de session lui-même.
 */

/** Une adresse de retour qui tient debout derrière le proxy de Vercel. */
async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** On ne redirige que vers chez nous : une `suite` venue de l'URL est une entrée. */
function safeSuite(value: FormDataEntryValue | null, fallback: string) {
  const suite = typeof value === "string" ? value : "";
  return suite.startsWith("/") && !suite.startsWith("//") ? suite : fallback;
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getTranslations("auth");
  const mode = formData.get("mode") === "signup" ? "signup" : "signin";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (mode === "signup") {
    if (password.length < MIN_PASSWORD) {
      return { error: t("errors.passwordTooShortSubmit", { count: MIN_PASSWORD }) };
    }
    if (password !== String(formData.get("confirm") ?? "")) {
      return { error: t("errors.passwordsDontMatch") };
    }
  }

  const supabase = await createClient();

  // Le prénom n'est pas demandé ici : c'est la première question de
  // l'onboarding (O02), qui l'écrit dans `profiles`.
  const { data, error } =
    mode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: authErrorMessage(t, error.message, error.code, mode) };
  }

  // Filet de sécurité : si « Confirm email » était réactivé côté Supabase,
  // signUp ne renverrait pas de session et le compte resterait en attente.
  if (!data.session) {
    return { error: t("errors.confirmEmailReminder") };
  }

  // Un compte tout juste créé n'a encore répondu à aucune question.
  redirect(safeSuite(formData.get("suite"), mode === "signup" ? "/onboarding/prenom" : "/accueil"));
}

export async function signInWithGoogle(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getTranslations("auth");
  const suite = safeSuite(formData.get("suite"), "/accueil");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await origin()}/auth/callback?suite=${encodeURIComponent(suite)}`,
    },
  });

  if (error || !data.url) {
    return { error: authErrorMessage(t, error?.message ?? "", error?.code, "signin") };
  }

  redirect(data.url);
}

/** Supabase répond en anglais : on traduit, et on dit quoi faire. */
function authErrorMessage(
  t: Translate,
  message: string,
  code: string | undefined,
  mode: "signin" | "signup",
) {
  if (code === "invalid_credentials" || /invalid login/i.test(message)) {
    return t("errors.invalidCredentials");
  }
  if (code === "user_already_exists" || /already registered/i.test(message)) {
    return t("errors.userExists");
  }
  if (code === "weak_password" || (/password/i.test(message) && /short|weak/i.test(message))) {
    return t("errors.weakPassword", { count: MIN_PASSWORD });
  }
  if (code === "email_address_invalid" || /invalid/i.test(message)) {
    return t("errors.invalidEmail");
  }
  if (code === "over_email_send_rate_limit" || /rate limit/i.test(message)) {
    return t("errors.rateLimit");
  }
  if (code === "email_not_confirmed") {
    return t("errors.emailNotConfirmed");
  }
  if (/network|fetch/i.test(message)) {
    return t("errors.network");
  }
  return mode === "signup" ? t("errors.signupFailed") : t("errors.signinFailed");
}
