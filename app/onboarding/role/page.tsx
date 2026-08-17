import { redirect } from "next/navigation";
import { ChoiceStep } from "@/components/onboarding";
import { HOSTING_STYLES, type HostingStyle } from "@/lib/onboarding";
import { getOnboardingState } from "@/lib/onboarding-state";
import { saveHostingStyle } from "../actions";

/** O05 · Hôte ou invité (4 / 4) */
export default async function RolePage() {
  const state = await getOnboardingState();
  if (!state) redirect("/connexion?mode=signup&suite=/onboarding/role");

  return (
    <ChoiceStep<HostingStyle>
      action={saveHostingStyle}
      name="hosting_style"
      options={HOSTING_STYLES}
      initial={(state.hostingStyle as HostingStyle | null) ?? null}
      image="/illustrations/accueil-invites-porte.jpg"
      step={4}
      back="/onboarding/frequence"
      title="Ça se passe plutôt chez toi, ou tu es de passage ?"
      cta="Dernière étape"
      large
    />
  );
}
