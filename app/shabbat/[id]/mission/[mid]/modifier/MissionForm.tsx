"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { deleteMission, saveMission } from "@/app/mission-actions";
import { Button, Field, StickyFooter } from "@/components/ui";
import type { ActionState } from "@/app/actions";
import type { Category } from "@/lib/missions";

const initial: ActionState = { ok: false, message: null };

const CATEGORIES: Category[] = ["food", "drinks", "equipment"];

const inputClass =
  "w-full rounded-field border-[1.5px] border-line-soft bg-white px-4 py-3.5 text-[14.5px] font-bold shadow-[0_2px_8px_rgba(15,39,77,0.06)] outline-none focus:ring-2 focus:ring-teal/40";

export function MissionForm({
  shabbatId,
  mission,
  retour,
}: {
  shabbatId: string;
  /** Où revenir une fois l'apport enregistré. */
  retour: string;
  mission: {
    id: string | null;
    title: string;
    emoji: string;
    category: Category;
    slots: number;
    quantity: string | null;
    priority: "essential" | "standard";
    notes: string | null;
  };
}) {
  const t = useTranslations("missions.form");
  const tCategory = useTranslations("missions.category");
  const tPriority = useTranslations("shabbat.create.missionsStep");
  const tp = useTranslations("profile.edit");
  const [state, formAction, pending] = useActionState(saveMission, initial);
  const [category, setCategory] = useState<Category>(mission.category);
  const [slots, setSlots] = useState(mission.slots);
  const [priority, setPriority] = useState(mission.priority);

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <input type="hidden" name="shabbat_id" value={shabbatId} />
      <input type="hidden" name="retour" value={retour} />
      {mission.id && <input type="hidden" name="mission_id" value={mission.id} />}
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="slots" value={slots} />
      <input type="hidden" name="priority" value={priority} />

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5.5 pt-3 pb-4">
        <Field label={t("categoryLabel")}>
          <div className="flex gap-2">
            {CATEGORIES.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                  category === key
                    ? "bg-ink text-white shadow-[var(--shadow-inset-pill)]"
                    : "border-[1.5px] border-line-soft bg-white text-ink shadow-[var(--shadow-pill)]"
                }`}
              >
                {tCategory(key)}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex gap-2.5">
          <Field label={t("emojiLabel")} className="w-20 shrink-0">
            <input
              name="emoji"
              defaultValue={mission.emoji}
              maxLength={4}
              className={`${inputClass} text-center text-lg`}
            />
          </Field>
          <Field label={t("titleLabel")} className="min-w-0 flex-1">
            <input
              name="title"
              required
              defaultValue={mission.title}
              placeholder={t("titlePlaceholder")}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex gap-3">
          <Field label={t("slotsLabel")} className="flex-1">
            <div className="flex items-center justify-between rounded-field bg-white px-3.5 py-3 shadow-[0_2px_8px_rgba(15,39,77,0.06)]">
              <button
                type="button"
                aria-label={t("decreaseSlotsAria")}
                onClick={() => setSlots((s) => Math.max(1, s - 1))}
                className="flex size-6 items-center justify-center rounded-full bg-line-soft font-bold"
              >
                –
              </button>
              <span className="font-display font-semibold">{slots}</span>
              <button
                type="button"
                aria-label={t("increaseSlotsAria")}
                onClick={() => setSlots((s) => Math.min(20, s + 1))}
                className="flex size-6 items-center justify-center rounded-full bg-teal font-bold text-white"
              >
                +
              </button>
            </div>
          </Field>
          <Field label={t("quantityLabel")} className="flex-1">
            <input
              name="quantity"
              defaultValue={mission.quantity ?? ""}
              placeholder={t("quantityPlaceholder")}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label={t("priorityLabel")}>
          <div className="flex gap-2">
            {(["essential", "standard"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPriority(value)}
                className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                  priority === value
                    ? "bg-ink text-white shadow-[var(--shadow-inset-pill)]"
                    : "border-[1.5px] border-line-soft bg-white text-ink shadow-[var(--shadow-pill)]"
                }`}
              >
                {value === "essential" ? tPriority("priority") : t("priorityStandard")}
              </button>
            ))}
          </div>
        </Field>

        <Field label={t("notesLabel")}>
          <textarea
            name="notes"
            rows={2}
            defaultValue={mission.notes ?? ""}
            placeholder={t("notesPlaceholder")}
            className={`${inputClass} resize-none font-normal`}
          />
        </Field>

        {mission.id && (
          // `formAction` sur le bouton : évite un <form> imbriqué, invalide en HTML.
          <button
            type="submit"
            formAction={deleteMission.bind(null, shabbatId, mission.id, undefined)}
            className="w-full py-1.5 text-center text-[14px] font-bold text-coral-deep"
          >
            {t("deleteMission")}
          </button>
        )}

        {state.message && (
          <p
            role="status"
            className={`rounded-field px-3.5 py-2.5 text-[13.5px] font-bold ${
              state.ok ? "bg-olive-wash text-olive-deep" : "bg-coral-wash text-coral-deep"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>

      <StickyFooter className="px-5.5">
        <Button type="submit" disabled={pending}>
          {pending ? tp("saving") : tp("save")}
        </Button>
      </StickyFooter>
    </form>
  );
}
