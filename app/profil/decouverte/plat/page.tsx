import { redirect } from "next/navigation";
import { ChoiceStep } from "@/components/onboarding";
import { DISH_SPECIALTIES, type DishSpecialty } from "@/lib/onboarding";
import { getOnboardingState } from "@/lib/onboarding-state";
import { saveSpecialty } from "../actions";
import { readSurvey } from "@/lib/survey";

/** P01 · Spécialité (1 / 4) */
export default async function PlatPage() {
  const state = await getOnboardingState();
  if (!state) redirect("/connexion?suite=/profil/decouverte/plat");

  const survey = await readSurvey();

  return (
    <ChoiceStep<DishSpecialty>
      action={saveSpecialty}
      name="dish_specialty"
      options={DISH_SPECIALTIES}
      initial={(survey?.dishSpecialty as DishSpecialty | null) ?? null}
      image="/illustrations/dresser-la-table.jpg"
      imagePosition="center 30%"
      step={1}
      close="/accueil"
      title="Si on te demande d'apporter un plat…"
      cta="Continuer"
    />
  );
}
