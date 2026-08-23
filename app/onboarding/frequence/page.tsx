import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChoiceStep } from "@/components/onboarding";
import { FREQUENCIES, type Frequency } from "@/lib/onboarding";
import { getOnboardingState } from "@/lib/onboarding-state";
import { saveFrequency } from "../actions";

/** O04 · Fréquence (3 / 4) */
export default async function FrequencePage() {
  const state = await getOnboardingState();
  if (!state) redirect("/connexion?mode=signup&suite=/onboarding/frequence");

  const t = await getTranslations("onboarding.frequencyStep");

  return (
    <ChoiceStep<Frequency>
      action={saveFrequency}
      name="shabbat_frequency"
      namespace="onboarding"
      options={FREQUENCIES}
      initial={(state.frequency as Frequency | null) ?? null}
      image="/illustrations/choisir-un-shabbat.webp"
      imagePosition="center 30%"
      step={3}
      back="/onboarding/telephone"
      title={t("title")}
      cta={t("cta")}
    />
  );
}
