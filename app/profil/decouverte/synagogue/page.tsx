import { redirect } from "next/navigation";
import { ChoiceStep } from "@/components/onboarding";
import { SYNAGOGUE_HABITS, type SynagogueHabit } from "@/lib/onboarding";
import { getOnboardingState } from "@/lib/onboarding-state";
import { saveSynagogue } from "../actions";
import { readSurvey } from "@/lib/survey";

/** P03 · Synagogue (3 / 4) */
export default async function SynagoguePage() {
  const state = await getOnboardingState();
  if (!state) redirect("/connexion?suite=/profil/decouverte/synagogue");

  const survey = await readSurvey();

  return (
    <ChoiceStep<SynagogueHabit>
      action={saveSynagogue}
      name="synagogue_habit"
      options={SYNAGOGUE_HABITS}
      initial={(survey?.synagogueHabit as SynagogueHabit | null) ?? null}
      image="/illustrations/amis-retrouvailles.jpg"
      imagePosition="center 28%"
      step={3}
      close="/accueil"
      title="Le samedi matin, direction…"
      cta="Continuer"
    />
  );
}
