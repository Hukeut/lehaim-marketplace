import { redirect } from "next/navigation";
import { getOnboardingState } from "@/lib/onboarding-state";
import { FirstNameForm } from "./form";

/** O02 · Prénom (1 / 4) */
export default async function PrenomPage() {
  const state = await getOnboardingState();
  if (!state) redirect("/connexion?mode=signup&suite=/onboarding/prenom");

  return <FirstNameForm initial={state.firstName ?? ""} />;
}
