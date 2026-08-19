import { redirect } from "next/navigation";
import { getOnboardingState } from "@/lib/onboarding-state";
import { countryByCode } from "@/lib/onboarding";
import { PhoneForm } from "./form";

/** O03 · Téléphone (2 / 4) — sans SMS, pas de code à saisir. */
export default async function TelephonePage() {
  const state = await getOnboardingState();
  if (!state) redirect("/connexion?mode=signup&suite=/onboarding/telephone");

  const country = countryByCode(state.countryCode);
  const digits = state.phone?.startsWith(country.dial)
    ? state.phone.slice(country.dial.length)
    : "";

  return <PhoneForm initialCode={country.code} initialDigits={digits} />;
}
