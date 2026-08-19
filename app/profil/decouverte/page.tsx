import { redirect } from "next/navigation";
import { Button, ButtonLink, Screen } from "@/components/ui";
import { getOnboardingState } from "@/lib/onboarding-state";
import { skipSurvey } from "./actions";

/** P00 · Intro du profil enrichi — facultatif, jamais bloquant. */
export default async function DecouvertePage() {
  const state = await getOnboardingState();
  if (!state) redirect("/connexion?suite=/profil/decouverte");

  return (
    <Screen>
      <div className="flex flex-1 flex-col bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/mes-proches-communaute.jpg"
          alt=""
          className="h-[280px] w-full shrink-0 object-cover object-[center_28%] sm:rounded-t-[36px]"
        />

        <div className="flex flex-1 flex-col items-center px-7 pt-6 text-center">
          <h1 className="font-display text-[21px] leading-[1.35] font-semibold">
            Mieux on te connaît,
            <br />
            meilleures seront nos suggestions
          </h1>
          <p className="mt-2 max-w-[270px] text-[13px] leading-relaxed text-ink/55">
            4 petites questions, 30 secondes. Tu peux t&apos;arrêter à tout moment.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 px-7 pt-3 pb-[22px]">
          <ButtonLink href="/profil/decouverte/plat">On y va</ButtonLink>
          <form action={skipSurvey}>
            <Button type="submit" variant="ghost" size="sm">
              Plus tard
            </Button>
          </form>
        </div>
      </div>
    </Screen>
  );
}
