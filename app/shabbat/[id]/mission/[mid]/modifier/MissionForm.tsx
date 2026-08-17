"use client";

import { useActionState, useState } from "react";
import { deleteMission, saveMission } from "@/app/mission-actions";
import { Button, Field, StickyFooter } from "@/components/ui";
import type { ActionState } from "@/app/actions";
import type { Category } from "@/lib/missions";

const initial: ActionState = { ok: false, message: null };

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "food", label: "Food" },
  { key: "drinks", label: "Drinks" },
  { key: "equipment", label: "Equipment" },
];

const inputClass =
  "w-full rounded-field border-[1.5px] border-line-soft bg-white px-4 py-3.5 text-[13px] font-bold shadow-[0_2px_8px_rgba(13,43,62,0.06)] outline-none focus:ring-2 focus:ring-teal/40";

export function MissionForm({
  shabbatId,
  mission,
}: {
  shabbatId: string;
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
  const [state, formAction, pending] = useActionState(saveMission, initial);
  const [category, setCategory] = useState<Category>(mission.category);
  const [slots, setSlots] = useState(mission.slots);
  const [priority, setPriority] = useState(mission.priority);

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <input type="hidden" name="shabbat_id" value={shabbatId} />
      {mission.id && <input type="hidden" name="mission_id" value={mission.id} />}
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="slots" value={slots} />
      <input type="hidden" name="priority" value={priority} />

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5.5 pt-3 pb-4">
        <Field label="Catégorie">
          <div className="flex gap-2">
            {CATEGORIES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setCategory(item.key)}
                className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                  category === item.key
                    ? "bg-ink text-white shadow-[var(--shadow-inset-pill)]"
                    : "border-[1.5px] border-line-soft bg-white text-ink shadow-[var(--shadow-pill)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex gap-2.5">
          <Field label="Emoji" className="w-20 shrink-0">
            <input
              name="emoji"
              defaultValue={mission.emoji}
              maxLength={4}
              className={`${inputClass} text-center text-lg`}
            />
          </Field>
          <Field label="Titre de la mission" className="min-w-0 flex-1">
            <input
              name="title"
              required
              defaultValue={mission.title}
              placeholder="Plat principal"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex gap-3">
          <Field label="Places" className="flex-1">
            <div className="flex items-center justify-between rounded-field bg-white px-3.5 py-3 shadow-[0_2px_8px_rgba(13,43,62,0.06)]">
              <button
                type="button"
                aria-label="Moins de places"
                onClick={() => setSlots((s) => Math.max(1, s - 1))}
                className="flex size-6 items-center justify-center rounded-full bg-line-soft font-bold"
              >
                –
              </button>
              <span className="font-display font-semibold">{slots}</span>
              <button
                type="button"
                aria-label="Plus de places"
                onClick={() => setSlots((s) => Math.min(20, s + 1))}
                className="flex size-6 items-center justify-center rounded-full bg-teal font-bold text-white"
              >
                +
              </button>
            </div>
          </Field>
          <Field label="Quantité" className="flex-1">
            <input
              name="quantity"
              defaultValue={mission.quantity ?? ""}
              placeholder="Pour 8 personnes"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Priorité">
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
                {value === "essential" ? "Prioritaire" : "Standard"}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Notes pour le volontaire">
          <textarea
            name="notes"
            rows={2}
            defaultValue={mission.notes ?? ""}
            placeholder="Ex. Merci d'éviter les fruits à coque…"
            className={`${inputClass} resize-none font-normal`}
          />
        </Field>

        {mission.id && (
          // `formAction` sur le bouton : évite un <form> imbriqué, invalide en HTML.
          <button
            type="submit"
            formAction={deleteMission.bind(null, shabbatId, mission.id)}
            className="w-full py-1.5 text-center text-[12.5px] font-bold text-coral-deep"
          >
            Supprimer cette mission
          </button>
        )}

        {state.message && (
          <p
            role="status"
            className={`rounded-field px-3.5 py-2.5 text-[12px] font-bold ${
              state.ok ? "bg-olive-wash text-olive-deep" : "bg-coral-wash text-coral-deep"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>

      <StickyFooter className="px-5.5">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </StickyFooter>
    </form>
  );
}
