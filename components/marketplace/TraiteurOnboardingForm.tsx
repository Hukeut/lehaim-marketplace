"use client";

import { useState, useActionState } from "react";
import { registerTraiteur } from "@/app/marketplace/actions";
import type { ActionState } from "@/app/actions";
import { Button, Field, Overline } from "@/components/ui";

const initial: ActionState = { ok: false, message: null };

const STEPS = ["Informations de base", "Documents & livraison"];

const inputClass =
  "w-full rounded-field bg-white px-4 py-3.5 text-[13px] font-bold shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40";

/**
 * Porté depuis lehaim-marketplace (TraiteurOnboardingForm) : deux étapes,
 * une seule soumission. Le premier produit ne fait plus partie du dossier —
 * il se remplit ensuite dans /traiteur/carte, qui a déjà son propre
 * formulaire d'ajout (voir CatalogueEditor.tsx).
 *
 * `mode` ne change que le texte du bouton final : "application" (dossier pas
 * encore envoyé) parle de validation à venir, "setup" (dossier déjà approuvé,
 * ligne créée dès l'inscription — voir app/connexion/page.tsx) parle
 * d'enregistrer la fiche, puisqu'il n'y a plus rien à valider.
 */
export function TraiteurOnboardingForm({
  mode = "application",
}: {
  mode?: "application" | "setup";
}) {
  const [state, formAction, pending] = useActionState(registerTraiteur, initial);
  const [step, setStep] = useState(0);

  // Contrôlé : les trois étapes restent montées dans le DOM (juste masquées
  // en CSS) pour que la FormData contienne bien tous les champs à l'envoi
  // final, quelle que soit l'étape affichée.
  const [name, setName] = useState("");

  const canContinueStep0 = name.trim().length > 0;

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex gap-1.5">
        {STEPS.map((_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-coral" : "bg-line-soft"}`}
          />
        ))}
      </div>
      <div>
        <div className="mb-1 text-[10px] font-extrabold tracking-[0.04em] text-coral-deep uppercase">
          Étape {step + 1}/{STEPS.length}
        </div>
        <div className="font-display text-[16px] font-semibold text-ink">{STEPS[step]}</div>
      </div>

      <section className={step === 0 ? "flex flex-col gap-3" : "hidden"}>
        <Field label="Nom du commerce">
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Traiteur Simha"
            className={inputClass}
          />
        </Field>
        <Field label="Adresse">
          <input name="address" placeholder="12 rue de la Paix, Paris" className={inputClass} />
        </Field>
        <Field label="Téléphone">
          <input name="phone" placeholder="06 00 00 00 00" className={inputClass} />
        </Field>
      </section>

      <section className={step === 1 ? "flex flex-col gap-3" : "hidden"}>
        <Overline>Documents justificatifs</Overline>
        <Field label="Numéro de patente / licence commerciale">
          <input name="patente_number" placeholder="Numéro d'entreprise" className={inputClass} />
        </Field>
        <Field label="Certificat de cacherout (si applicable)">
          <input name="hechsher_name" placeholder="Ex : Beth Din de Paris" className={inputClass} />
        </Field>
        <p className="text-[11px] leading-relaxed text-ink/45">
          L&apos;équipe lehaim vérifie ces informations avant la mise en ligne de votre profil.
        </p>

        <div className="mt-1">
          <Overline>Livraison</Overline>
        </div>
        <label className="flex items-center gap-2.5 rounded-field bg-white px-4 py-3.5 shadow-[var(--shadow-card)]">
          <input type="checkbox" name="delivery_available" className="size-4" />
          <span className="text-[12.5px] font-bold">Je propose la livraison</span>
        </label>
        <Field label="Zone de livraison (optionnel)">
          <input name="delivery_zone" placeholder="Paris et proche banlieue" className={inputClass} />
        </Field>
      </section>

      {state.message && (
        <p role="alert" className="rounded-field bg-coral-wash px-3.5 py-2.5 text-[12px] font-bold text-coral-deep">
          {state.message}
        </p>
      )}

      <div className="mt-1 flex gap-2.5">
        {step > 0 && (
          <Button type="button" variant="secondary" size="lg" full={false} onClick={back}>
            Précédent
          </Button>
        )}
        <div className="flex-1">
          {step < STEPS.length - 1 ? (
            <Button type="button" size="lg" disabled={step === 0 && !canContinueStep0} onClick={next}>
              Continuer
            </Button>
          ) : (
            <Button type="submit" size="lg" disabled={pending}>
              {pending
                ? "Envoi…"
                : mode === "setup"
                  ? "Enregistrer ma fiche"
                  : "Soumettre pour validation"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
