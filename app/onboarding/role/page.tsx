import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChoiceStep } from "@/components/onboarding";
import { HOSTING_STYLES, type HostingStyle } from "@/lib/onboarding";
import { getOnboardingState } from "@/lib/onboarding-state";
import { saveHostingStyle } from "../actions";

/** O05 · Hôte ou invité (4 / 4) */
export default async function RolePage() {
  const state = await getOnboardingState();
  if (!state) redirect("/connexion?mode=signup&suite=/onboarding/role");

  const t = await getTranslations("onboarding.roleStep");

  return (
    <ChoiceStep<HostingStyle>
      action={saveHostingStyle}
      name="hosting_style"
      namespace="onboarding"
      options={HOSTING_STYLES}
      initial={(state.hostingStyle as HostingStyle | null) ?? null}
      image="/illustrations/accueil-invites-porte.webp"
      step={4}
      back="/onboarding/frequence"
      title={t("title")}
      cta={t("cta")}
      large
    />
  );
}
