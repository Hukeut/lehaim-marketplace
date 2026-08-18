import { redirect } from "next/navigation";
import Link from "next/link";
import { ButtonLink, ProgressBar, Screen } from "@/components/ui";
import { Basket } from "@/components/icons";
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

function Welcome() {
  return (
    <Screen>
      <div className="relative flex flex-1 flex-col bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/famille-table-shabbat.jpg"
          alt=""
          className="h-[420px] w-full shrink-0 object-cover object-[center_22%] sm:rounded-t-[36px]"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[110px] bg-gradient-to-b from-black/35 to-transparent sm:rounded-t-[36px]" />

        <div className="flex flex-1 flex-col items-center gap-2 px-[30px] pt-[22px] pb-[30px] text-center">
          <div className="font-display text-[38px] leading-none font-semibold">lehaim</div>
          <h1 className="mt-1 font-display text-[22px] leading-[1.3] font-semibold">
            Le Chabbat entre amis, sans le stress
          </h1>
          <p className="max-w-[280px] text-[13.5px] leading-relaxed text-ink/60">
            WhatsApp reste la conversation. Lehaim s&apos;occupe du reste.
          </p>

          <div className="mt-auto flex w-full flex-col gap-2.5 pt-6">
            <ButtonLink
              href="/connexion?mode=signup&suite=/onboarding/prenom"
              size="lg"
              className="shadow-[var(--shadow-coral-lg)]"
            >
              C&apos;est parti
            </ButtonLink>
            <p className="text-center text-xs text-ink/50">
              Déjà un compte ?{" "}
              <Link href="/connexion?suite=/accueil" className="font-bold text-teal">
                Se connecter
              </Link>
            </p>

            <Link
              href="/devenir-traiteur"
              className="mt-1 flex items-center justify-center gap-2 rounded-full border-[1.5px] border-line-soft bg-white px-4 py-3 text-[12.5px] font-bold text-ink shadow-[var(--shadow-pill)]"
            >
              <Basket size={16} className="text-coral" />
              Fournisseur, traiteur ou restaurateur ?
            </Link>
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* O07 · Reprise                                                        */
/* ------------------------------------------------------------------ */

function Resume({
  step,
  firstName,
}: {
  step: Parameters<typeof stepProgress>[0];
  firstName: string | null;
}) {
  const left = stepsLeft(step);

  return (
    <Screen>
      <div className="relative flex flex-1 flex-col bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/etat-vide-table.jpg"
          alt=""
          className="h-[260px] w-full shrink-0 object-cover object-[center_30%] sm:rounded-t-[36px]"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[90px] bg-gradient-to-b from-black/30 to-transparent sm:rounded-t-[36px]" />

        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-[30px] pt-5 text-center">
          <div className="text-[34px]" aria-hidden="true">
            👋
          </div>
          <h1 className="font-display text-[19px] font-semibold">
            On reprend où tu en étais{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="max-w-[250px] text-[13px] leading-relaxed text-ink/60">
            {left === 1
              ? "Encore une question et ton compte est prêt."
              : `Encore ${left} questions et ton compte est prêt.`}
          </p>
          <div className="mt-1.5 w-full">
            <ProgressBar value={stepProgress(step)} height={4} />
          </div>
        </div>

        <div className="px-[30px] pt-4 pb-[34px]">
          <ButtonLink href={STEP_PATH[step]}>Continuer</ButtonLink>
        </div>
      </div>
    </Screen>
  );
}
