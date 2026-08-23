import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ButtonLink, ProgressBar, Screen } from "@/components/ui";
import { STEP_PATH, stepProgress, stepsLeft } from "@/lib/onboarding";
import { getOnboardingState } from "@/lib/onboarding-state";

/** O01 · Bienvenue — ou O07 · Reprise si le parcours a déjà commencé. */
export default async function OnboardingEntry() {
  const state = await getOnboardingState();

  if (state?.step === "done") redirect("/accueil");
  if (state && state.step !== "prenom") {
    return <Resume step={state.step} firstName={state.firstName} />;
  }
  if (state) redirect(STEP_PATH.prenom);

  return <Welcome />;
}

/* ------------------------------------------------------------------ */
/* O01 · Bienvenue                                                      */
/* ------------------------------------------------------------------ */

async function Welcome() {
  const t = await getTranslations("onboarding.intro");
  const tCommon = await getTranslations("common");

  return (
    <Screen>
      <div className="relative flex flex-1 flex-col bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/famille-table-shabbat.webp"
          alt=""
          className="h-[420px] w-full shrink-0 object-cover object-[center_22%] sm:rounded-t-[36px]"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[110px] bg-gradient-to-b from-black/35 to-transparent sm:rounded-t-[36px]" />

        <div className="flex flex-1 flex-col items-center gap-2 px-[30px] pt-[22px] pb-[30px] text-center">
          <div className="font-display text-[38px] leading-none font-semibold">
            {tCommon("appName")}
          </div>
          <h1 className="mt-1 font-display text-[22px] leading-[1.3] font-semibold">
            {t("title")}
          </h1>
          <p className="max-w-[280px] text-[15px] leading-relaxed text-ink/60">
            {t("subtitle")}
          </p>

          <div className="mt-auto flex w-full flex-col gap-2.5 pt-6">
            <ButtonLink
              href="/onboarding/langue"
              size="lg"
              className="shadow-[var(--shadow-coral-lg)]"
            >
              {t("cta")}
            </ButtonLink>
            <p className="text-center text-xs text-ink/65">
              {t("loginPrompt")}{" "}
              <Link href="/connexion?suite=/accueil" className="font-bold text-teal">
                {t("loginCta")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* O07 · Reprise                                                        */
/* ------------------------------------------------------------------ */

async function Resume({
  step,
  firstName,
}: {
  step: Parameters<typeof stepProgress>[0];
  firstName: string | null;
}) {
  const t = await getTranslations("onboarding.resume");
  const left = stepsLeft(step);

  return (
    <Screen>
      <div className="relative flex flex-1 flex-col bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/etat-vide-table.webp"
          alt=""
          className="h-[260px] w-full shrink-0 object-cover object-[center_30%] sm:rounded-t-[36px]"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[90px] bg-gradient-to-b from-black/30 to-transparent sm:rounded-t-[36px]" />

        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-[30px] pt-5 text-center">
          <div className="text-[34px]" aria-hidden="true">
            👋
          </div>
          <h1 className="font-display text-[21px] font-semibold">
            {t("greeting", { name: firstName ?? "" })}
          </h1>
          <p className="max-w-[250px] text-[14.5px] leading-relaxed text-ink/60">
            {t("questionsLeft", { count: left })}
          </p>
          <div className="mt-1.5 w-full">
            <ProgressBar value={stepProgress(step)} height={4} />
          </div>
        </div>

        <div className="px-[30px] pt-4 pb-[34px]">
          <ButtonLink href={STEP_PATH[step]}>{t("cta")}</ButtonLink>
        </div>
      </div>
    </Screen>
  );
}
