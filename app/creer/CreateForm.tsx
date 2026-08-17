"use client";

import { useActionState, useState } from "react";
import { createShabbat, type ActionState } from "@/app/actions";
import { Calendar, Clock, MapPin } from "@/components/icons";
import { StepDots } from "@/components/StepDots";
import { Button, Field, StickyFooter } from "@/components/ui";

const initial: ActionState = { ok: false, message: null };

const inputClass =
  "w-full rounded-field bg-white px-4 py-3.5 text-[13px] font-bold shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40";

/** Prochain vendredi, proposé par défaut. */
function nextFriday() {
  const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

export function CreateForm({ canCreate }: { canCreate: boolean }) {
  const [state, formAction, pending] = useActionState(createShabbat, initial);
  const [guests, setGuests] = useState(8);
  const [visibility, setVisibility] = useState<"invite" | "link">("invite");

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <input type="hidden" name="visibility" value={visibility} />
      <input type="hidden" name="guest_target" value={guests} />

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <StepDots current={1} />
        <h1 className="mb-4.5 font-display text-[19px] font-semibold">Nouveau Shabbat</h1>

        <div className="flex flex-col gap-3">
          <Field label="Titre">
            <input name="title" defaultValue="Shabbat chez vous" className={inputClass} />
          </Field>

          <div className="flex gap-2.5">
            <Field label="Date" className="flex-1">
              <div className="flex items-center gap-2 rounded-field bg-white px-3 py-3 shadow-[var(--shadow-card)] focus-within:ring-2 focus-within:ring-teal/40">
                <Calendar size={15} className="shrink-0 text-teal" />
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={nextFriday()}
                  className="w-full bg-transparent text-[12.5px] font-bold outline-none"
                />
              </div>
            </Field>
            <Field label="Heure" className="flex-1">
              <div className="flex items-center gap-2 rounded-field bg-white px-3 py-3 shadow-[var(--shadow-card)] focus-within:ring-2 focus-within:ring-teal/40">
                <Clock size={15} className="shrink-0 text-teal" />
                <input
                  type="time"
                  name="time"
                  defaultValue="19:30"
                  className="w-full bg-transparent text-[12.5px] font-bold outline-none"
                />
              </div>
            </Field>
          </div>

          <Field label="Adresse">
            <div className="flex items-center gap-2.5 rounded-field bg-white px-4 py-3.5 shadow-[var(--shadow-card)] focus-within:ring-2 focus-within:ring-teal/40">
              <MapPin size={16} className="shrink-0 text-coral" />
              <input
                name="address"
                placeholder="12 rue Lepic, Paris"
                className="w-full bg-transparent text-[13px] outline-none"
              />
            </div>
          </Field>

          <Field label="Quartier">
            <input name="neighbourhood" placeholder="Montmartre" className={inputClass} />
          </Field>

          <Field label="Nombre d'invités">
            <div className="flex items-center justify-between rounded-field bg-white px-4 py-2.5 shadow-[var(--shadow-card)]">
              <button
                type="button"
                aria-label="Retirer un invité"
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                className="flex size-[30px] items-center justify-center rounded-full bg-line-soft text-base font-bold text-ink"
              >
                –
              </button>
              <span className="font-display text-base font-semibold">{guests}</span>
              <button
                type="button"
                aria-label="Ajouter un invité"
                onClick={() => setGuests((g) => Math.min(60, g + 1))}
                className="flex size-[30px] items-center justify-center rounded-full bg-teal text-base font-bold text-white"
              >
                +
              </button>
            </div>
          </Field>

          <Field label="Budget estimé">
            <input name="budget" placeholder="200 €" inputMode="decimal" className={inputClass} />
          </Field>

          <Field label="Visibilité">
            <div className="flex gap-2">
              {(["invite", "link"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVisibility(value)}
                  className={`flex-1 rounded-full py-2.5 text-[12.5px] font-bold transition-colors ${
                    visibility === value
                      ? "bg-ink text-white"
                      : "border-[1.5px] border-line-soft bg-white text-ink shadow-[var(--shadow-pill)]"
                  }`}
                >
                  {value === "invite" ? "Sur invitation" : "Lien partageable"}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {state.message && (
          <p
            role="alert"
            className="mt-4 rounded-field bg-coral-wash px-3.5 py-2.5 text-[12px] font-bold text-coral-deep"
          >
            {state.message}
          </p>
        )}
      </div>

      <StickyFooter className="px-5">
        <Button
          type="submit"
          size="lg"
          disabled={!canCreate || pending}
          className="shadow-[var(--shadow-coral-lg)]"
        >
          {pending ? "Création…" : canCreate ? "Continuer" : "Connectez-vous pour créer"}
        </Button>
      </StickyFooter>
    </form>
  );
}
