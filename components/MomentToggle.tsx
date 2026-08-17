"use client";

import { useTransition } from "react";
import { toggleMoment } from "@/app/mission-actions";
import { Card } from "./ui";

const TONE = {
  gold: "bg-gold/28",
  coral: "bg-coral/14",
  violet: "bg-violet/14",
} as const;

/** Ligne « moment » avec interrupteur (S04a et S06 côté hôte). */
export function MomentToggle({
  shabbatId,
  kind,
  label,
  detail,
  emoji,
  tone,
  enabled,
}: {
  shabbatId: string;
  kind: string;
  label: string;
  detail: string;
  emoji: string;
  tone: keyof typeof TONE;
  enabled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Card className={pending ? "opacity-60" : ""}>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => startTransition(() => toggleMoment(shabbatId, kind, enabled))}
        className="flex w-full items-center gap-3 p-3.5 text-left"
      >
        <span
          className={`flex size-[38px] shrink-0 items-center justify-center rounded-xl text-[17px] ${TONE[tone]}`}
        >
          {emoji}
        </span>
        <span className="flex-1">
          <span className="block text-[13.5px] font-bold">{label}</span>
          <span className="block text-[10.5px] text-ink/50">{detail}</span>
        </span>
        <span
          className={`relative h-[26px] w-11 shrink-0 rounded-full transition-colors ${enabled ? "bg-teal" : "bg-line"}`}
        >
          <span
            className={`absolute top-[3px] size-5 rounded-full bg-white shadow-sm transition-all ${enabled ? "left-[21px]" : "left-[3px]"}`}
          />
        </span>
      </button>
    </Card>
  );
}
