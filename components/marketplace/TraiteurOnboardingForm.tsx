"use client";

import { useActionState } from "react";
import { registerTraiteur } from "@/app/marketplace/actions";
import type { ActionState } from "@/app/actions";
import { Button, Field, Overline } from "@/components/ui";

const initial: ActionState = { ok: false, message: null };

const inputClass =
  "w-full rounded-field bg-white px-4 py-3.5 text-[13px] font-bold shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40";

export function TraiteurOnboardingForm() {
  const [state, formAction, pending] = useActionState(registerTraiteur, initial);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <section>
        <Overline>Informations de base</Overline>
        <div className="flex flex-col gap-3">
          <Field label="Nom du commerce">
            <input name="name" required placeholder="Traiteur Simha" className={inputClass} />
          </Field>
          <Field label="Adresse">
            <input name="address" placeholder="12 rue Dizengoff, Tel Aviv" className={inputClass} />
          </Field>
          <Field label="Téléphone">
            <input name="phone" placeholder="050-000-0000" className={inputClass} />
          </Field>
        </div>
      </section>

      <section>
        <Overline>Documents justificatifs</Overline>
        <div className="flex flex-col gap-3">
          <Field label="Numéro de patente / licence commerciale">
            <input name="patente_number" placeholder="Numéro d'entreprise" className={inputClass} />
          </Field>
          <Field label="Certificat de cacherout (si applicable)">
            <input
              name="hechsher_name"
              placeholder="Ex : Rabbanout Tel Aviv"
              className={inputClass}
            />
          </Field>
          <p className="text-[11px] leading-relaxed text-ink/45">
            L&apos;équipe lehaim vérifie ces informations avant la mise en ligne de votre profil.
          </p>
        </div>
      </section>

      <section>
        <Overline>Livraison</Overline>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2.5 rounded-field bg-white px-4 py-3.5 shadow-[var(--shadow-card)]">
            <input type="checkbox" name="delivery_available" className="size-4" />
            <span className="text-[12.5px] font-bold">Je propose la livraison</span>
          </label>
          <Field label="Zone de livraison (optionnel)">
            <input name="delivery_zone" placeholder="Tel Aviv et alentours" className={inputClass} />
          </Field>
        </div>
      </section>

      <section>
        <Overline>Votre premier produit</Overline>
        <div className="flex flex-col gap-3">
          <Field label="Nom du plat">
            <input
              name="product_title"
              required
              placeholder="Plat principal pour 8 personnes"
              className={inputClass}
            />
          </Field>
          <Field label="Description (optionnel)">
            <input name="product_description" placeholder="Poulet rôti, pommes de terre..." className={inputClass} />
          </Field>
          <div className="flex gap-2.5">
            <Field label="Prix (₪)" className="flex-1">
              <input
                name="product_price"
                required
                inputMode="decimal"
                placeholder="120"
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
            <input
              name="product_quantity_hint"
              placeholder="Pour 8 personnes"
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {state.message && (
        <p
          role="alert"
          className="rounded-field bg-coral-wash px-3.5 py-2.5 text-[12px] font-bold text-coral-deep"
        >
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="shadow-[var(--shadow-coral-lg)]">
        {pending ? "Envoi…" : "Soumettre pour validation"}
      </Button>
    </form>
  );
}
