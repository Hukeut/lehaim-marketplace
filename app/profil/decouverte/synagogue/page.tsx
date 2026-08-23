import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("survey.synagogueStep");

  return (
    <ChoiceStep<SynagogueHabit>
      action={saveSynagogue}
      name="synagogue_habit"
      namespace="survey"
      options={SYNAGOGUE_HABITS}
      initial={(survey?.synagogueHabit as SynagogueHabit | null) ?? null}
      image="/illustrations/amis-retrouvailles.webp"
      imagePosition="center 28%"
      step={3}
      close="/accueil"
      title={t("title")}
      cta={t("cta")}
    />
  );
}
