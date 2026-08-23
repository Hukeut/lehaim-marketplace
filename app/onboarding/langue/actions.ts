"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/locale";

type ChoiceState = { error: string | null };

/** Un an : le choix survit largement à la création du compte. */
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * O01b · Enregistre la langue choisie. L'écran précède la création de
 * compte : rien à écrire en base, seulement le cookie que lit `i18n/request`.
 */
export async function saveLanguage(
  _previous: ChoiceState,
  formData: FormData,
): Promise<ChoiceState> {
  const choice = formData.get("locale");

  if (!isLocale(choice)) {
    const t = await getTranslations("onboarding.language");
    return { error: t("required") };
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, choice, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });

  redirect("/connexion?mode=signup&suite=/onboarding/prenom");
}
