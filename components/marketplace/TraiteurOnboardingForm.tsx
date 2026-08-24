"use client";

import { useState, useActionState } from "react";
import { registerTraiteur } from "@/app/marketplace/actions";
import type { ActionState } from "@/app/actions";
import { Button, Field, Overline } from "@/components/ui";

const initial: ActionState = { ok: false, message: null };

const ALLERGEN_OPTIONS: [string, string][] = [
  ["gluten", "🌾 Gluten"],
  ["fruits_a_coque", "🥜 Fruits à coque"],
  ["oeufs", "🥚 Œufs"],
  ["lactose", "🥛 Lactose"],
  ["soja", "🫘 Soja"],
  ["arachide", "🥜 Arachide"],
  ["poisson", "🐟 Poisson"],
  ["sesame", "🫙 Sésame"],
];

const STEPS = ["Informations de base", "Documents & livraison", "Votre premier produit"];

const inputClass =
  "w-full rounded-field bg-white px-4 py-3.5 text-[13px] font-bold shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40";

/**
 * Porté depuis lehaim-marketplace (TraiteurOnboardingForm) : trois étapes,
 * une seule soumission — un traiteur sans catalogue n'aurait rien à montrer
 * une fois approuvé, donc son premier produit fait partie du dossier.
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
  const [productTitle, setProductTitle] = useState("");
  const [productPrice, setProductPrice] = useState("");

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

      <section className={step === 2 ? "flex flex-col gap-3" : "hidden"}>
        <Field label="Nom du plat">
          <input
            name="product_title"
            value={productTitle}
            onChange={(e) => setProductTitle(e.target.value)}
            placeholder="Plat principal pour 8 personnes"
            className={inputClass}
          />
        </Field>
        <Field label="Description (optionnel)">
          <input name="product_description" placeholder="Poulet rôti, pommes de terre…" className={inputClass} />
        </Field>
        <div className="flex gap-2.5">
          <Field label="Prix (€)" className="flex-1">
            <input
              name="product_price"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              inputMode="decimal"
              placeholder="45"
              className={inputClass}
            />
          </Field>
          <Field label="Catégorie" className="flex-1">
            <select name="product_category" defaultValue="plat" className={inputClass}>
              <option value="plat">Plat</option>
              <option value="entree">Entrée</option>
              <option value="salade">Salade</option>
              <option value="dessert">Dessert</option>
              <option value="boisson">Boisson</option>
              <option value="autre">Autre</option>
            </select>
          </Field>
        </div>
        <Field label="Quantité (optionnel)">
          <input name="product_quantity_hint" placeholder="Pour 8 personnes" className={inputClass} />
        </Field>

        <div>
          <div className="mb-1.5 text-[11px] font-bold text-ink/55">Allergènes potentiels (optionnel)</div>
          <div className="flex flex-wrap gap-2">
            {ALLERGEN_OPTIONS.map(([code, label]) => (
              <label
                key={code}
                className="flex items-center gap-1.5 rounded-full border-[1.5px] border-line-soft bg-white px-3 py-2 text-[11.5px] font-bold shadow-[var(--shadow-pill)] has-[:checked]:border-coral has-[:checked]:bg-coral-wash"
              >
                <input type="checkbox" name="product_allergens" value={code} className="size-3.5" />
                {label}
              </label>
            ))}
          </div>
        </div>
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
            <Button type="submit" size="lg" disabled={pending || !productTitle.trim() || !productPrice.trim()}>
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
