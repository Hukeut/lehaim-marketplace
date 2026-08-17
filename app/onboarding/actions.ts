"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  COUNTRIES,
  FREQUENCIES,
  HOSTING_STYLES,
  STEP_PATH,
  type OnboardingStep,
} from "@/lib/onboarding";

export type StepState = { error: string | null };

/**
 * Enregistre une réponse sur `profiles` et avance le curseur de progression.
 * Le curseur porte l'étape qu'il RESTE à faire : c'est lui que lit l'écran
 * de reprise pour savoir où reprendre.
 */
async function saveStep(
  payload: Record<string, unknown>,
  nextStep: OnboardingStep,
): Promise<StepState | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion?suite=/onboarding/prenom");

  const row: Record<string, unknown> = { ...payload, onboarding_step: nextStep };
  if (nextStep === "done") row.onboarding_done_at = new Date().toISOString();

  const { error } = await supabase.from("profiles").update(row).eq("id", user.id);

  if (error) {
    // 42703 = colonne inconnue : la migration 0007 n'a pas encore été passée.
    if (error.code === "42703") {
      return {
        error:
          "La base n'est pas à jour : la migration 0007_onboarding.sql n'a pas encore été exécutée.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/profil");
  revalidatePath("/accueil");
  redirect(STEP_PATH[nextStep]);
}

/* ------------------------------------------------------------------ */
/* O02 · Prénom                                                         */
/* ------------------------------------------------------------------ */

export async function saveFirstName(
  _previous: StepState,
  formData: FormData,
): Promise<StepState> {
  const firstName = String(formData.get("first_name") ?? "").trim();
  if (!firstName) return { error: "Il nous faut un prénom pour t'accueillir." };

  return saveStep({ first_name: firstName }, "telephone");
}

/* ------------------------------------------------------------------ */
/* O03 · Téléphone                                                      */
/* ------------------------------------------------------------------ */

export async function savePhone(
  _previous: StepState,
  formData: FormData,
): Promise<StepState> {
  const code = String(formData.get("country_code") ?? "");
  const digits = String(formData.get("digits") ?? "").replace(/\D/g, "");
  const country = COUNTRIES.find((c) => c.code === code);

  if (!country) return { error: "Indicatif inconnu." };
  if (digits.length !== country.digits) return { error: "Il manque quelques chiffres" };

  return saveStep(
    { country_code: country.code, phone: `${country.dial}${digits}` },
    "frequence",
  );
}

/* ------------------------------------------------------------------ */
/* O04 · Fréquence                                                      */
/* ------------------------------------------------------------------ */

export async function saveFrequency(
  _previous: StepState,
  formData: FormData,
): Promise<StepState> {
  const value = String(formData.get("shabbat_frequency") ?? "");
  if (!FREQUENCIES.some((f) => f.value === value)) {
    return { error: "Choisis une réponse pour continuer." };
  }

  return saveStep({ shabbat_frequency: value }, "role");
}

/* ------------------------------------------------------------------ */
/* O05 · Hôte ou invité                                                 */
/* ------------------------------------------------------------------ */

export async function saveHostingStyle(
  _previous: StepState,
  formData: FormData,
): Promise<StepState> {
  const value = String(formData.get("hosting_style") ?? "");
  if (!HOSTING_STYLES.some((h) => h.value === value)) {
    return { error: "Choisis une réponse pour continuer." };
  }

  return saveStep({ hosting_style: value }, "done");
}
