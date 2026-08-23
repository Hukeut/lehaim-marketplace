import { redirect } from "next/navigation";
import { getOnboardingState } from "@/lib/onboarding-state";
import { readSurvey } from "@/lib/survey";
import { DietForm } from "./form";

/** P02 · Restrictions (2 / 4) — multi-sélection, « rien » est une réponse. */
export default async function RestrictionsPage() {
  const state = await getOnboardingState();
  if (!state) redirect("/connexion?suite=/profil/decouverte/restrictions");

  const survey = await readSurvey();

  return <DietForm initial={survey?.dietTags ?? []} />;
}
