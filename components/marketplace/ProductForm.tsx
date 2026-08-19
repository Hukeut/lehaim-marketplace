"use client";

import { useActionState, useTransition } from "react";
import { addProduct, updateProduct, deleteProduct } from "@/app/marketplace/actions";
import type { ActionState } from "@/app/actions";
import { Button, Field } from "@/components/ui";
import { ALLERGEN_LABEL, type Allergen, type Product } from "@/lib/marketplace-types";

const initial: ActionState = { ok: false, message: null };

const ALLERGEN_OPTIONS = Object.keys(ALLERGEN_LABEL) as Allergen[];

const inputClass =
  "w-full rounded-field bg-white px-4 py-3.5 text-[13px] font-bold shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40";

export function ProductForm({ product }: { product?: Product }) {
  const action = product ? updateProduct : addProduct;
  const [state, formAction, pending] = useActionState(action, initial);
  const [deleting, startDelete] = useTransition();

  function remove() {
    if (!product) return;
    if (confirm(`Supprimer « ${product.title} » ?`)) {
      startDelete(() => deleteProduct(product.id));
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {product && <input type="hidden" name="product_id" value={product.id} />}

      <Field label="Nom du plat">
        <input
          name="title"
          required
          defaultValue={product?.title}
          placeholder="Plat principal pour 8 personnes"
          className={inputClass}
        />
      </Field>
      <Field label="Description (optionnel)">
        <input
          name="description"
          defaultValue={product?.description ?? ""}
          placeholder="Poulet rôti, pommes de terre..."
          className={inputClass}
        />
      </Field>
      <div className="flex gap-2.5">
        <Field label="Prix (₪)" className="flex-1">
          <input
            name="price"
            required
            inputMode="decimal"
            defaultValue={product?.price}
            placeholder="120"
            className={inputClass}
          />
        </Field>
        <Field label="Catégorie" className="flex-1">
          <select name="category" defaultValue={product?.category ?? "plat"} className={inputClass}>
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
          name="quantity_hint"
          defaultValue={product?.quantityHint ?? ""}
          placeholder="Pour 8 personnes"
          className={inputClass}
        />
      </Field>

      <div>
        <div className="mb-1.5 text-[11px] font-bold text-ink/55">Allergènes potentiels (optionnel)</div>
        <div className="flex flex-wrap gap-2">
          {ALLERGEN_OPTIONS.map((code) => (
            <label
              key={code}
              className="flex items-center gap-1.5 rounded-full border-[1.5px] border-line-soft bg-white px-3 py-2 text-[11.5px] font-bold shadow-[var(--shadow-pill)] has-[:checked]:border-coral has-[:checked]:bg-coral-wash"
            >
              <input
                type="checkbox"
                name="allergens"
                value={code}
                defaultChecked={product?.allergens.includes(code)}
                className="size-3.5"
              />
              {ALLERGEN_LABEL[code].emoji} {ALLERGEN_LABEL[code].label}
            </label>
          ))}
        </div>
      </div>

      {state.message && (
        <p role="alert" className="rounded-field bg-coral-wash px-3.5 py-2.5 text-[12px] font-bold text-coral-deep">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Enregistrement…" : product ? "Enregistrer" : "Ajouter au menu"}
      </Button>

      {product && (
        <button
          type="button"
          disabled={deleting}
          onClick={remove}
          className="py-1.5 text-center text-[12px] font-bold text-coral-deep disabled:opacity-50"
        >
          {deleting ? "Suppression…" : "Supprimer ce plat"}
        </button>
      )}
    </form>
  );
}
