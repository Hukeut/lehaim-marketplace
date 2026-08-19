"use client";

import { useActionState, useTransition } from "react";
import { addSlot, deleteSlot } from "@/app/marketplace/actions";
import type { ActionState } from "@/app/actions";
import { Button, Field, Overline } from "@/components/ui";
import { Close } from "@/components/icons";
import type { TraiteurSlot } from "@/lib/marketplace-types";

const initial: ActionState = { ok: false, message: null };

const inputClass =
  "w-full rounded-field bg-white px-4 py-3.5 text-[13px] font-bold shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40";

function formatDate(value: string) {
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export function SlotsManager({ slots }: { slots: TraiteurSlot[] }) {
  const [state, formAction, pending] = useActionState(addSlot, initial);
  const [deletingId, startDelete] = useTransition();

  const byDate = new Map<string, TraiteurSlot[]>();
  for (const slot of slots) {
    const list = byDate.get(slot.date) ?? [];
    list.push(slot);
    byDate.set(slot.date, list);
  }

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-3">
        <Overline>Proposer un créneau</Overline>
        <div className="flex gap-2.5">
          <Field label="Date" className="flex-1">
            <input type="date" name="slot_date" required className={inputClass} />
          </Field>
          <Field label="Horaire" className="flex-1">
            <input
              name="slot_label"
              required
              placeholder="14h00–14h30"
              className={inputClass}
            />
          </Field>
        </div>

        {state.message && (
          <p
            role="alert"
            className={`rounded-field px-3.5 py-2.5 text-[12px] font-bold ${
              state.ok ? "bg-olive-wash text-olive-ink" : "bg-coral-wash text-coral-deep"
            }`}
          >
            {state.message}
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Ajout…" : "Ajouter ce créneau"}
        </Button>
      </form>

      <div>
        <Overline>Créneaux proposés</Overline>
        {!slots.length && (
          <p className="mt-2 rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-6 text-center text-[12.5px] text-ink/45">
            Aucun créneau pour l&apos;instant. Les clients ne peuvent pas encore réserver.
          </p>
        )}
        <div className="mt-2 flex flex-col gap-3">
          {Array.from(byDate.entries()).map(([date, daySlots]) => (
            <div key={date}>
              <div className="mb-1.5 text-[10.5px] font-extrabold tracking-[0.02em] text-ink/45 capitalize">
                {formatDate(date)}
              </div>
              <div className="flex flex-col gap-1.5">
                {daySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between rounded-field bg-white px-3.5 py-2.5 shadow-[var(--shadow-card)]"
                  >
                    <span className="text-[12px] font-bold text-ink">{slot.label}</span>
                    <button
                      type="button"
                      disabled={deletingId}
                      aria-label="Supprimer ce créneau"
                      onClick={() => startDelete(() => deleteSlot(slot.id))}
                      className="flex size-6 items-center justify-center rounded-full text-ink/35 disabled:opacity-50"
                    >
                      <Close size={13} strokeWidth={2.3} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
