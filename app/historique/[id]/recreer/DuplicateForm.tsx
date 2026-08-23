"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { duplicateShabbat } from "@/app/mission-actions";
import { Check } from "@/components/icons";
import { Button, Card, StickyFooter } from "@/components/ui";
import type { ActionState } from "@/app/actions";

const initial: ActionState = { ok: false, message: null };

type OptionKey = "keep_guests" | "keep_missions" | "keep_funding" | "keep_moments";

export function DuplicateForm({
  sourceId,
  options,
}: {
  sourceId: string;
  options: { key: OptionKey; emoji: string; label: string }[];
}) {
  const t = useTranslations("history.recreate");
  const [state, formAction, pending] = useActionState(duplicateShabbat, initial);
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(options.map((o) => [o.key, true])),
  );

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <input type="hidden" name="source_id" value={sourceId} />

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 pb-4">
        {options.map((option) => {
          const on = checked[option.key];
          return (
            <Card key={option.key} className="rounded-field">
              {/* La case reste dans le formulaire : c'est elle qui est envoyée. */}
              <input
                type="checkbox"
                name={option.key}
                checked={on}
                onChange={(e) => setChecked({ ...checked, [option.key]: e.target.checked })}
                className="peer sr-only"
                id={option.key}
              />
              <label
                htmlFor={option.key}
                className="flex cursor-pointer items-center gap-3 px-3.5 py-3"
              >
                <span className="shrink-0 text-base">{option.emoji}</span>
                <span className="flex-1 text-[14px] font-bold">{option.label}</span>
                <span
                  className={`flex size-[22px] shrink-0 items-center justify-center rounded-full transition-colors ${
                    on ? "bg-teal text-white" : "border-2 border-line"
                  }`}
                >
                  {on && <Check size={12} strokeWidth={3} />}
                </span>
              </label>
            </Card>
          );
        })}

        {state.message && (
          <p role="alert" className="mt-2 text-[13px] font-bold text-coral-deep">
            {state.message}
          </p>
        )}
      </div>

      <StickyFooter className="px-5">
        <Button type="submit" disabled={pending}>
          {pending ? t("creating") : t("createWithSettings")}
        </Button>
      </StickyFooter>
    </form>
  );
}
