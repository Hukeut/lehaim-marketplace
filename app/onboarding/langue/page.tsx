import { getLocale, getTranslations } from "next-intl/server";
import { ChoiceStep } from "@/components/onboarding";
import { LANGUAGE_OPTIONS } from "@/lib/languages";
import type { Locale } from "@/lib/i18n/locale";
import { saveLanguage } from "./actions";

/** O01b · Dans quelle langue ? — avant même la création du compte. */
export default async function LanguePage() {
  const t = await getTranslations("onboarding.language");
  const locale = (await getLocale()) as Locale;

  return (
    <ChoiceStep<Locale>
      action={saveLanguage}
      name="locale"
      namespace="onboarding"
      options={LANGUAGE_OPTIONS}
      // La langue déjà détectée est présélectionnée : le plus souvent,
      // il n'y a qu'à confirmer.
      initial={locale}
      image="/illustrations/amis-retrouvailles.webp"
      back="/onboarding"
      title={t("title")}
      subtitle={t("subtitle")}
      cta={t("cta")}
    />
  );
}
