"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  CONTENT_PREFS,
  DIET_TAGS,
  DISH_SPECIALTIES,
  SYNAGOGUE_HABITS,
} from "@/lib/onboarding";
import type { StepState } from "@/app/onboarding/actions";

/**
 * Le profil enrichi n'est jamais bloquant : on enregistre au fil de l'eau,
 * et quitter en cours de route laisse simplement les réponses déjà données.
 */
async function save(
  payload: Record<string, unknown>,
  next: string,
): Promise<StepState | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion?suite=/profil/decouverte");

  const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);

  if (error) {
    if (error.code === "42703") {
      return {
        error:
          "La base n'est pas à jour : la migration 0007_onboarding.sql n'a pas encore été exécutée.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/profil");
  redirect(next);
}

export async function saveSpecialty(
  _previous: StepState,
  formData: FormData,
): Promise<StepState> {
  const value = String(formData.get("dish_specialty") ?? "");
  if (!DISH_SPECIALTIES.some((d) => d.value === value)) {
    return { error: "Choisis une réponse pour continuer." };
  }
  return save({ dish_specialty: value }, "/profil/decouverte/restrictions");
}

export async function saveDiet(
  _previous: StepState,
  formData: FormData,
): Promise<StepState> {
  const allowed = new Set(DIET_TAGS.map((d) => d.value as string));
  const tags = formData.getAll("diet_tags").map(String).filter((t) => allowed.has(t));

  // Aucune restriction est une réponse valable : on enregistre un tableau vide.
  return save({ diet_tags: tags }, "/profil/decouverte/synagogue");
}

export async function saveSynagogue(
  _previous: StepState,
  formData: FormData,
): Promise<StepState> {
  const value = String(formData.get("synagogue_habit") ?? "");
  if (!SYNAGOGUE_HABITS.some((s) => s.value === value)) {
    return { error: "Choisis une réponse pour continuer." };
  }
  return save({ synagogue_habit: value }, "/profil/decouverte/inspiration");
}

export async function saveContentPref(
  _previous: StepState,
  formData: FormData,
): Promise<StepState> {
  const value = String(formData.get("content_pref") ?? "");
  if (!CONTENT_PREFS.some((c) => c.value === value)) {
    return { error: "Choisis une réponse pour continuer." };
  }
  return save(
    { content_pref: value, profile_survey_done_at: new Date().toISOString() },
    "/profil/decouverte/merci",
  );
}

/** « Plus tard » : on note le refus pour ne plus reproposer le parcours. */
export async function skipSurvey(): Promise<void | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase
      .from("profiles")
      .update({ profile_survey_skipped_at: new Date().toISOString() })
      .eq("id", user.id);
    revalidatePath("/profil");
  }

  redirect("/accueil");
}
