"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui";
import type { RecommendedItem } from "@/lib/recommendations";

/** Bouton + panneau dépliable : quantités recommandées selon le nombre d'invités. */
export function RecommendationPanel({
  guestTarget,
  items,
}: {
  guestTarget: number;
  items: RecommendedItem[];
}) {
  const t = useTranslations("missions.recommendation");
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-field border-[1.5px] border-teal/30 bg-teal/8 px-3.5 py-3 text-left"
      >
        <span className="text-[12.5px] font-bold text-teal-deep">✨ {t("title")}</span>
        <span
          className={`text-teal-deep transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden="true"
        >
          ›
        </span>
      </button>

      {open && (
        <Card className="mt-2 rounded-field p-3.5">
          <p className="mb-3 text-[11px] leading-relaxed text-ink/50">
            {t("intro", { count: guestTarget })}
          </p>
          <ul className="flex flex-col gap-2.5">
            {items.map((item) => (
              <li key={item.key} className="flex items-center gap-2.5">
                <span className="text-base">{item.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-bold">{t(`items.${item.key}.label`)}</div>
                  <div className="truncate text-[10.5px] text-ink/50">
                    {t(`items.${item.key}.quantity`, { count: item.count })}
                  </div>
                </div>
                {item.essential && (
                  <span className="shrink-0 rounded-full bg-coral/14 px-2 py-1 text-[9px] font-extrabold whitespace-nowrap text-coral-deep">
                    {t("essential")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
