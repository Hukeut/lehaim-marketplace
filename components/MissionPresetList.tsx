"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { addPresetMission } from "@/app/mission-actions";
import { MISSION_PRESETS } from "@/lib/templates";

/** Ordre d'apparition des catégories, du repas au matériel. */
const ORDER = ["food", "drinks", "equipment", "hosting", "other"] as const;
import { Check, Plus } from "./icons";
import { EmojiTile } from "./missions";
import { Card } from "./ui";

/**
 * Catalogue de missions. Remplace l'écran « choisir un modèle » : on part
 * d'un Shabbat vide et on pioche, en voyant d'un coup d'œil ce qui est déjà
 * en place.
 */
export function MissionPresetList({
  shabbatId,
  existingTitles,
  onlyCategory,
}: {
  shabbatId: string;
  existingTitles: string[];
  /** Restreint le catalogue au filtre actif de l'écran. */
  onlyCategory?: string | null;
}) {
  const t = useTranslations("shabbat.create.missionsStep.catalog");
  const tCategory = useTranslations("missions.category");
  const [pending, startTransition] = useTransition();

  const taken = new Set(existingTitles.map((title) => title.toLowerCase()));

  return (
    <section className="mb-4">
      <div className="mb-0.5 text-[14px] font-bold">{t("title")}</div>
      <p className="mb-2 text-[12px] text-ink/65">{t("subtitle")}</p>
      {ORDER.filter((category) => !onlyCategory || category === onlyCategory).map((category) => {
        const presets = MISSION_PRESETS.filter((preset) => preset.category === category);
        if (!presets.length) return null;
        return (
          <div key={category} className="mb-3">
            <div className="mb-1.5 text-[11px] font-extrabold tracking-[0.04em] text-ink/45 uppercase">
              {tCategory(category)}
            </div>
            <ul className={`flex flex-col gap-1.5 ${pending ? "opacity-60" : ""}`}>
        {presets.map((preset) => {
          const already = taken.has(preset.title.toLowerCase());
          return (
            <Card as="li" key={preset.key} className="rounded-field">
              <button
                type="button"
                disabled={already || pending}
                onClick={() => startTransition(() => addPresetMission(shabbatId, preset.key))}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-start disabled:opacity-55"
              >
                <EmojiTile emoji={preset.emoji} category={preset.category} title={preset.title} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold">{preset.title}</span>
                  <span className="block truncate text-[12px] text-ink/65">
                    {already ? t("already") : t("addHint")}
                  </span>
                </span>
                {already ? (
                  <Check size={15} strokeWidth={2.8} className="shrink-0 text-teal" />
                ) : (
                  <Plus size={15} strokeWidth={2.4} className="shrink-0 text-ink/40" />
                )}
              </button>
            </Card>
          );
        })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
