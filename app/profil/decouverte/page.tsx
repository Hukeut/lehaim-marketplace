import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button, ButtonLink, Screen } from "@/components/ui";
import { getOnboardingState } from "@/lib/onboarding-state";
import { skipSurvey } from "./actions";

/** P00 · Intro du profil enrichi — facultatif, jamais bloquant. */
export default async function DecouvertePage() {
  const state = await getOnboardingState();
  if (!state) redirect("/connexion?suite=/profil/decouverte");

  const t = await getTranslations("survey.intro");

  return (
    <Screen>
      <div className="flex flex-1 flex-col bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/mes-proches-communaute.webp"
          alt=""
          className="h-[280px] w-full shrink-0 object-cover object-[center_28%] sm:rounded-t-[36px]"
        />

        <div className="flex flex-1 flex-col items-center px-7 pt-6 text-center">
          <h1 className="font-display text-[21px] leading-[1.35] font-semibold">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-[270px] text-[14.5px] leading-relaxed text-ink/55">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 px-7 pt-3 pb-[22px]">
          <ButtonLink href="/profil/decouverte/plat">{t("cta")}</ButtonLink>
          <form action={skipSurvey}>
            <Button type="submit" variant="ghost" size="sm">
              {t("later")}
            </Button>
          </form>
        </div>
      </div>
    </Screen>
  );
}
