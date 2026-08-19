"use client";

import { useActionState } from "react";
import { updateTraiteurProfile } from "@/app/marketplace/actions";
import type { ActionState } from "@/app/actions";
import { Button, Field, Overline } from "@/components/ui";
import type { Traiteur } from "@/lib/marketplace-types";

const initial: ActionState = { ok: false, message: null };

const inputClass =
  "w-full rounded-field bg-white px-4 py-3.5 text-[13px] font-bold shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40";

export function TraiteurProfileForm({ traiteur }: { traiteur: Traiteur }) {
  const [state, formAction, pending] = useActionState(updateTraiteurProfile, initial);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Overline>Établissement</Overline>
      <Field label="Nom du commerce">
        <input name="name" required defaultValue={traiteur.name} className={inputClass} />
      </Field>
      <Field label="Adresse">
        <input name="address" defaultValue={traiteur.address ?? ""} className={inputClass} />
      </Field>
      <Field label="Téléphone">
        <input name="phone" defaultValue={traiteur.phone ?? ""} className={inputClass} />
      </Field>

      <div className="mt-1">
        <Overline>Documents</Overline>
      </div>
      <Field label="Numéro de patente / licence commerciale">
        <input name="patente_number" defaultValue={traiteur.patenteNumber ?? ""} className={inputClass} />
      </Field>
      <Field label="Certificat de cacherout (si applicable)">
        <input name="hechsher_name" defaultValue={traiteur.hechsherName ?? ""} className={inputClass} />
      </Field>

      <div className="mt-1">
        <Overline>Livraison</Overline>
      </div>
      <label className="flex items-center gap-2.5 rounded-field bg-white px-4 py-3.5 shadow-[var(--shadow-card)]">
        <input
          type="checkbox"
          name="delivery_available"
          defaultChecked={traiteur.deliveryAvailable}
          className="size-4"
        />
        <span className="text-[12.5px] font-bold">Je propose la livraison</span>
      </label>
      <Field label="Zone de livraison (optionnel)">
        <input name="delivery_zone" defaultValue={traiteur.deliveryZone ?? ""} className={inputClass} />
      </Field>

      {traiteur.status !== "pending" && (
        <p className="text-[11px] leading-relaxed text-ink/45">
          Les modifications importantes (patente, cacherout) peuvent être revues par l&apos;équipe
          lehaim.
        </p>
      )}

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
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
