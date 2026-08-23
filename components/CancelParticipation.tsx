"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { cancelParticipation } from "@/app/mission-actions";

/**
 * Se décommander. En deux temps, et en annonçant ce que ça déclenche : les
 * apports repartent au pot commun et l'hôte le voit à votre statut.
 */
export function CancelParticipation({ shabbatId }: { shabbatId: string }) {
  const t = useTranslations("invitation.cancel");
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="mt-5 w-full py-2 text-center text-[13.5px] font-bold text-ink/45"
      >
        {t("action")}
      </button>
    );
  }

  return (
    <div className="mt-5 rounded-card border-[1.5px] border-coral/30 bg-white p-4">
      <p className="mb-3 text-[13.5px] leading-relaxed text-ink/60">{t("warning")}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setArmed(false)}
          className="flex-1 rounded-full border-[1.5px] border-line py-2.5 text-[14px] font-bold text-ink/60"
        >
          {t("keep")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => cancelParticipation(shabbatId))}
          className="flex-1 rounded-full bg-coral py-2.5 text-[14px] font-bold text-white disabled:opacity-50"
        >
          {t("confirm")}
        </button>
      </div>
    </div>
  );
}
