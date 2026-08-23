"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { setMissionSlots } from "@/app/mission-actions";

/**
 * Réglage du nombre de personnes attendues sur une mission, directement
 * dans la liste : ouvrir la fiche pour changer un chiffre coûtait un
 * aller-retour de trop.
 */
export function MissionSlots({
  shabbatId,
  missionId,
  slots,
  taken,
}: {
  shabbatId: string;
  missionId: string;
  slots: number;
  /** Places déjà prises : on ne descend pas en dessous. */
  taken: number;
}) {
  const t = useTranslations("shabbat.create.missionsStep");
  const [value, setValue] = useState(slots);
  const [, startTransition] = useTransition();

  function change(next: number) {
    const clamped = Math.max(Math.max(1, taken), Math.min(20, next));
    if (clamped === value) return;
    setValue(clamped);
    startTransition(() => setMissionSlots(shabbatId, missionId, clamped));
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        aria-label={t("removeSlot")}
        onClick={() => change(value - 1)}
        disabled={value <= Math.max(1, taken)}
        className="flex size-[26px] items-center justify-center rounded-lg bg-line-soft text-[15px] font-bold text-ink disabled:opacity-40"
      >
        –
      </button>
      <span className="flex items-baseline gap-0.5">
        <span className="min-w-4 text-center font-display text-[15px] font-semibold">{value}</span>
        <span className="text-[11px] font-bold text-ink/45">{t("people")}</span>
      </span>
      <button
        type="button"
        aria-label={t("addSlot")}
        onClick={() => change(value + 1)}
        disabled={value >= 20}
        className="flex size-[26px] items-center justify-center rounded-lg bg-teal text-[15px] font-bold text-white disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
