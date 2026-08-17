"use client";

import { useActionState, useState } from "react";
import { Screen } from "@/components/ui";
import { StepBody, StepFooter, StepHero } from "@/components/onboarding";
import { saveFirstName } from "../actions";

export function FirstNameForm({ initial }: { initial: string }) {
  const [state, action, pending] = useActionState(saveFirstName, { error: null });
  const [name, setName] = useState(initial);

  const trimmed = name.trim();

  return (
    <Screen>
      <form action={action} className="flex flex-1 flex-col bg-cream">
        <StepHero
          image="/illustrations/amis-retrouvailles.jpg"
          height={190}
          step={1}
          back="/onboarding"
        />

        <StepBody
          padX={26}
          title="Comment on t'appelle ?"
          subtitle="On aime bien connaître les gens qu'on invite."
        >
          <input
            name="first_name"
            autoFocus
            autoComplete="given-name"
            maxLength={40}
            placeholder="Hugo"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-card border-2 border-teal bg-white px-[18px] py-4 font-display text-[17px] font-semibold shadow-[var(--shadow-float)] outline-none placeholder:font-normal placeholder:text-ink/30"
          />

          {trimmed.length > 0 && (
            <p className="mt-2.5 animate-[var(--animate-rise)] text-[12.5px] font-bold text-olive-deep">
              Enchanté, {trimmed} 👋
            </p>
          )}

          {state.error && (
            <p role="alert" className="mt-2.5 text-[12px] font-bold text-coral-deep">
              {state.error}
            </p>
          )}
        </StepBody>

        <StepFooter label="Continuer" padX={26} disabled={!trimmed} pending={pending} />
      </form>
    </Screen>
  );
}
