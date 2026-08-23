import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/supabase/user";
import { STEP_ORDER, type OnboardingQuestion, type OnboardingStep } from "@/lib/onboarding";

export type OnboardingState = {
  userId: string;
  /** Prénom déjà connu, pour tutoyer dès l'écran de reprise. */
  firstName: string | null;
  /** Étape qu'il reste à faire. `done` = compte prêt. */
  step: OnboardingStep;
  /** Vrai tant que la migration 0007 n'a pas été passée. */
  columnsMissing: boolean;
  phone: string | null;
  countryCode: string | null;
  frequency: string | null;
  hostingStyle: string | null;
};

const COLUMNS =
  "first_name, phone, country_code, shabbat_frequency, hosting_style, onboarding_step";

/**
 * État du parcours de la personne connectée, ou null si personne ne l'est.
 *
 * L'étape stockée fait foi ; à défaut (compte créé avant l'onboarding v2) on
 * la déduit des réponses déjà présentes, ce qui évite de reposer une question
 * à quelqu'un qui y a déjà répondu.
 */
export async function getOnboardingState(): Promise<OnboardingState | null> {
  const supabase = await createClient();
  const user = await currentUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (error?.code === "42703") {
    const fallback = await supabase
      .from("profiles")
      .select("first_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    return {
      userId: user.id,
      firstName: trimmed(fallback.data?.first_name),
      step: "prenom",
      columnsMissing: true,
      phone: trimmed(fallback.data?.phone),
      countryCode: null,
      frequency: null,
      hostingStyle: null,
    };
  }

  const row = (data ?? {}) as Record<string, string | null>;
  const stored = row.onboarding_step as OnboardingStep | null;

  return {
    userId: user.id,
    firstName: trimmed(row.first_name),
    step: stored ?? deriveStep(row),
    columnsMissing: false,
    phone: trimmed(row.phone),
    countryCode: trimmed(row.country_code),
    frequency: trimmed(row.shabbat_frequency),
    hostingStyle: trimmed(row.hosting_style),
  };
}

/**
 * Première question sans réponse.
 *
 * Un prénom déjà enregistré vaut parcours terminé : les trois autres
 * questions sont du confort, et les reposer à chaque reconnexion donnait
 * l'impression de repartir de zéro. Elles restent accessibles depuis le
 * profil pour qui veut les compléter.
 */
function deriveStep(row: Record<string, string | null>): OnboardingStep {
  if (trimmed(row.first_name)) return "done";

  const answered: Record<OnboardingQuestion, boolean> = {
    prenom: Boolean(trimmed(row.first_name)),
    telephone: Boolean(trimmed(row.phone)),
    frequence: Boolean(trimmed(row.shabbat_frequency)),
    role: Boolean(trimmed(row.hosting_style)),
  };

  return STEP_ORDER.find((step) => !answered[step]) ?? "done";
}

function trimmed(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length ? text : null;
}
