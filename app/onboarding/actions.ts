"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Update } from "@/lib/supabase/rows";
import { userMessage } from "@/lib/db";
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
  payload: Update<"profiles">,
  nextStep: OnboardingStep,
): Promise<StepState | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion?suite=/onboarding/prenom");

  const row: Update<"profiles"> = { ...payload, onboarding_step: nextStep };
  if (nextStep === "done") row.onboarding_done_at = new Date().toISOString();

  const { error } = await supabase.from("profiles").update(row).eq("id", user.id);

  // Le cas « colonne inconnue » (42703) portait ici un message d'ingénieur,
  // affiché tel quel à la personne en train de s'inscrire. Le code SQLSTATE
  // part désormais au journal, seul endroit où il sert à quelqu'un.
  if (error) return { error: await userMessage("saveOnboardingStep", error) };

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
