"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { deleteShabbat } from "@/app/mission-actions";
import { Card } from "./ui";

/**
 * Suppression définitive. En deux temps : la confirmation évite le geste
 * malheureux, et le texte annonce ce qui part avec (missions, invités,
 * discussion).
 */
export function DeleteShabbat({ shabbatId, title }: { shabbatId: string; title: string }) {
  const t = useTranslations("shabbat.danger");
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Card className="mt-4 rounded-field border-[1.5px] border-coral/30 px-3.5 py-3">
      <div className="text-[14px] font-bold text-coral-deep">{t("title")}</div>
      <p className="mt-0.5 mb-2.5 text-[12.5px] leading-relaxed text-ink/55">
        {armed ? t("confirmText", { title }) : t("text")}
      </p>
      {armed ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setArmed(false)}
            className="flex-1 rounded-full border-[1.5px] border-line py-2 text-[13px] font-bold text-ink/60"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => deleteShabbat(shabbatId))}
            className="flex-1 rounded-full bg-coral py-2 text-[13px] font-bold text-white disabled:opacity-50"
          >
            {t("confirm")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="rounded-full border-[1.5px] border-coral/40 px-4 py-2 text-[13px] font-bold text-coral-deep"
        >
          {t("delete")}
        </button>
      )}
    </Card>
  );
}
