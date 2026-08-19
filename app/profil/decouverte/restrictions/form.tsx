"use client";

import { useActionState, useState } from "react";
import { Screen } from "@/components/ui";
import { CheckCard, InlineReaction, StepBody, StepFooter, StepHero } from "@/components/onboarding";
import { DIET_TAGS, type DietTag } from "@/lib/onboarding";
import { saveDiet } from "../actions";

export function DietForm({ initial }: { initial: DietTag[] }) {
  const [state, action, pending] = useActionState(saveDiet, { error: null });
  const [tags, setTags] = useState<DietTag[]>(initial);

  function toggle(tag: DietTag) {
    setTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
  }

  return (
    <Screen>
      <form action={action} className="flex flex-1 flex-col bg-cream">
        {tags.map((tag) => (
          <input key={tag} type="hidden" name="diet_tags" value={tag} />
        ))}

        <StepHero
          image="/illustrations/famille-table-shabbat.jpg"
          position="center 65%"
          step={2}
          close="/accueil"
        />

        <StepBody
          title="Des restrictions à connaître ?"
          subtitle="Choisis tout ce qui s'applique, ou rien du tout."
        >
          <div className="flex flex-col gap-2">
            {DIET_TAGS.map((tag) => (
              <CheckCard
                key={tag.value}
                emoji={tag.emoji}
                label={tag.label}
                checked={tags.includes(tag.value)}
                onToggle={() => toggle(tag.value)}
              />
            ))}
          </div>

          {tags.length > 0 && (
            <InlineReaction emoji="👍" tone="teal">
              C&apos;est noté, on y pensera pour toi.
            </InlineReaction>
          )}

          {state.error && (
            <p role="alert" className="mt-2.5 text-[12px] font-bold text-coral-deep">
              {state.error}
            </p>
          )}
        </StepBody>

        <StepFooter label="Continuer" pending={pending} />
      </form>
    </Screen>
  );
}
