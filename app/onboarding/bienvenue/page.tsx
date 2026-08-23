import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ButtonLink, GlowCircle, Screen } from "@/components/ui";
import { getOnboardingState } from "@/lib/onboarding-state";

/** O06 · Fin de création de compte */
export default async function BienvenuePage() {
  const state = await getOnboardingState();
  if (!state) redirect("/connexion?mode=signup&suite=/onboarding/prenom");

  const t = await getTranslations("onboarding.welcome");

  return (
    <Screen>
      <div className="relative flex flex-1 flex-col overflow-hidden bg-ink sm:rounded-[36px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/celebration-confirmation.webp"
          alt=""
          className="absolute inset-0 size-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 to-ink/92" />

        <div className="relative flex flex-1 flex-col items-center justify-center gap-3.5 px-[30px] text-center text-white">
          <div className="relative">
            <GlowCircle size={88} glow="rgba(255,209,102,0.35)">
              <div className="flex size-[88px] items-center justify-center rounded-full bg-olive/22">
                <svg
                  viewBox="0 0 24 24"
                  width="38"
                  height="38"
                  fill="none"
                  stroke="#7FA35A"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12l4 4 10-10" />
                </svg>
              </div>
            </GlowCircle>
            <svg
              viewBox="0 0 24 24"
              width="11"
              height="11"
              fill="#FFD166"
              aria-hidden="true"
              className="absolute -top-1 start-0.5"
            >
              <path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />
            </svg>
          </div>

          <h1 className="font-display text-2xl font-semibold">
            {t("title", { name: state.firstName ?? "" })}
          </h1>
          <p className="max-w-[260px] text-[15px] leading-relaxed text-white/75">
            {t("subtitle")}
          </p>
        </div>

        <div className="relative px-[30px] pb-[34px]">
          <ButtonLink href="/accueil" size="lg" className="shadow-[var(--shadow-coral-lg)]">
            {t("cta")}
          </ButtonLink>
        </div>
      </div>
    </Screen>
  );
}
