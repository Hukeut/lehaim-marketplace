"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { setReadyByExact } from "@/app/mission-actions";
import { Card } from "./ui";

/** Convertit un ISO en valeur `datetime-local` (heure locale, sans fuseau). */
function toLocalValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Date et heure libres pour le compte à rebours, au-delà des raccourcis. */
export function ReadyByPicker({ shabbatId, readyBy }: { shabbatId: string; readyBy: string | null }) {
  const t = useTranslations("shabbat.create.rebours.exact");
  const [state, formAction, pending] = useActionState(setReadyByExact, {
    ok: false,
    message: null,
  });

  return (
    <Card className="mb-4 rounded-field px-3.5 py-3">
      <form action={formAction} className="flex flex-col gap-2.5">
        <input type="hidden" name="shabbat_id" value={shabbatId} />
        <div>
          <div className="text-[14px] font-bold">{t("label")}</div>
          <div className="text-[12px] text-ink/65">{t("hint")}</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            name="ready_by"
            defaultValue={toLocalValue(readyBy)}
            className="min-w-0 flex-1 rounded-xl border-[1.5px] border-line bg-white px-3 py-2 text-[14px] font-bold"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50"
          >
            {t("save")}
          </button>
        </div>
        {state.ok && !pending && (
          <span className="text-[12.5px] font-bold text-teal">{t("saved")}</span>
        )}
      </form>
    </Card>
  );
}
