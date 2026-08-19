import { redirect } from "next/navigation";
import { ChoiceStep } from "@/components/onboarding";
import { CONTENT_PREFS, type ContentPref } from "@/lib/onboarding";
import { getOnboardingState } from "@/lib/onboarding-state";
import { saveContentPref } from "../actions";
import { readSurvey } from "@/lib/survey";

/** P04 · Préférence de contenu (4 / 4) */
export default async function InspirationPage() {
  const state = await getOnboardingState();
  if (!state) redirect("/connexion?suite=/profil/decouverte/inspiration");

  const survey = await readSurvey();

  return (
    <ChoiceStep<ContentPref>
      action={saveContentPref}
      name="content_pref"
      options={CONTENT_PREFS}
      initial={(survey?.contentPref as ContentPref | null) ?? null}
      // Écart assumé avec la maquette, qui demandait `envoyer-invitation.jpg` :
      // celle-ci n'apparaît nulle part ailleurs dans le parcours.
      image="/illustrations/choisir-un-shabbat.jpg"
      imagePosition="center 30%"
      step={4}
      close="/accueil"
      title="Pour t'inspirer, tu préfères plutôt…"
      cta="Dernière étape"
      large
    />
  );
}
