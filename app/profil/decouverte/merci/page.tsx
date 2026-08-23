import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ButtonLink, Screen } from "@/components/ui";
import { getOnboardingState } from "@/lib/onboarding-state";

/** P05 · Fin du profil enrichi */
export default async function MerciPage() {
  const state = await getOnboardingState();
  if (!state) redirect("/connexion?suite=/profil/decouverte");

  const t = await getTranslations("survey.outro");

  return (
    <Screen>
      <div className="relative flex flex-1 flex-col bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/celebration-confirmation.webp"
          alt=""
          className="h-[240px] w-full shrink-0 object-cover object-[center_15%] sm:rounded-t-[36px]"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[90px] bg-gradient-to-b from-black/30 to-transparent sm:rounded-t-[36px]" />

        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-[30px] pt-5 text-center">
          <div className="text-[38px]" aria-hidden="true">
            🥂
          </div>
          <h1 className="font-display text-xl font-semibold">
            {t("title", { name: state.firstName ?? "" })}
          </h1>
          <p className="max-w-[250px] text-[14.5px] leading-relaxed text-ink/60">
            {t("subtitle")}
          </p>
        </div>

        <div className="px-[30px] pt-4 pb-[34px]">
          <ButtonLink href="/accueil">{t("cta")}</ButtonLink>
        </div>
      </div>
    </Screen>
  );
}
