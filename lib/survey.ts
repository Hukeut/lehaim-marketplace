import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/supabase/user";
import type { DietTag } from "@/lib/onboarding";

export type Survey = {
  dishSpecialty: string | null;
  dietTags: DietTag[];
  synagogueHabit: string | null;
  contentPref: string | null;
  /** Le questionnaire a été mené jusqu'au bout. */
  completed: boolean;
  /** « Plus tard » a déjà été choisi au moins une fois. */
  postponed: boolean;
};

const EMPTY: Survey = {
  dishSpecialty: null,
  dietTags: [],
  synagogueHabit: null,
  contentPref: null,
  completed: false,
  postponed: false,
};

/**
 * Réponses déjà données au profil enrichi, pour repré-cocher les choix quand
 * on revient sur un écran et pour savoir s'il faut encore le proposer.
 * Renvoie null si personne n'est connecté.
 */
export async function readSurvey(): Promise<Survey | null> {
  const supabase = await createClient();
  const user = await currentUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "dish_specialty, diet_tags, synagogue_habit, content_pref, profile_survey_done_at, profile_survey_skipped_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  // Migration 0007 pas encore passée : on laisse le parcours s'afficher vierge.
  if (error || !data) return EMPTY;

  const row = data as Record<string, unknown>;

  return {
    dishSpecialty: (row.dish_specialty as string) ?? null,
    dietTags: (row.diet_tags as DietTag[]) ?? [],
    synagogueHabit: (row.synagogue_habit as string) ?? null,
    contentPref: (row.content_pref as string) ?? null,
    completed: Boolean(row.profile_survey_done_at),
    postponed: Boolean(row.profile_survey_skipped_at),
  };
}
