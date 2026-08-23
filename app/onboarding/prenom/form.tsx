"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Screen } from "@/components/ui";
import { StepBody, StepFooter, StepHero } from "@/components/onboarding";
import { saveFirstName } from "../actions";

export function FirstNameForm({ initial }: { initial: string }) {
  const t = useTranslations("onboarding.firstName");
  const [state, action, pending] = useActionState(saveFirstName, { error: null });
  const [name, setName] = useState(initial);

  const trimmed = name.trim();

  return (
    <Screen>
      <form action={action} className="flex flex-1 flex-col bg-cream">
        <StepHero
          image="/illustrations/amis-retrouvailles.webp"
          height={190}
          step={1}
          back="/onboarding"
        />

        <StepBody
          padX={26}
          title={t("title")}
          subtitle={t("subtitle")}
        >
          <input
            name="first_name"
            autoFocus
            autoComplete="given-name"
            maxLength={40}
            placeholder={t("placeholder")}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-card border-2 border-teal bg-white px-[18px] py-4 font-display text-[19px] font-semibold shadow-[var(--shadow-float)] outline-none placeholder:font-normal placeholder:text-ink/30"
          />

          {trimmed.length > 0 && (
            <p className="mt-2.5 animate-[var(--animate-rise)] text-[14px] font-bold text-olive-deep">
              {t("greeting", { name: trimmed })}
            </p>
          )}

          {state.error && (
            <p role="alert" className="mt-2.5 text-[13.5px] font-bold text-coral-deep">
              {state.error}
            </p>
          )}
        </StepBody>

        <StepFooter label={t("cta")} padX={26} disabled={!trimmed} pending={pending} />
      </form>
    </Screen>
  );
}
