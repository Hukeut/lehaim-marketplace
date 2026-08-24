"use client";

import { useActionState, useState } from "react";
import { saveProduct } from "./actions";
import { ImageUploader } from "@/components/marketplace/ImageUploader";
import type { ActionState } from "@/app/actions";
import type { MerchantProduct } from "@/lib/merchant";

const initial: ActionState = { ok: true, message: null };

const CATEGORIES: [string, string][] = [
  ["plat", "Plat"],
  ["entree", "Entrée"],
  ["salade", "Salade"],
  ["dessert", "Dessert"],
  ["boisson", "Boisson"],
  ["autre", "Autre"],
];

const ALLERGENS: [string, string][] = [
  ["gluten", "Gluten"],
  ["fruits_a_coque", "Fruits à coque"],
  ["oeufs", "Œufs"],
  ["lactose", "Lactose"],
  ["soja", "Soja"],
  ["arachide", "Arachide"],
  ["poisson", "Poisson"],
  ["sesame", "Sésame"],
];

const input =
  "rounded-[14px] border-[1.5px] border-line bg-sand px-4 py-3 text-[14px] font-bold outline-none focus:border-teal";

/**
 * Ajouter ou modifier un produit.
 *
 * Porté depuis Rraven666/lehaim, avec un écart vis-à-vis de l'écran
 * d'origine : les allergènes tiennent sur une seule liste plutôt que trois
 * niveaux — c'est ce que sait faire le backend traiteur aujourd'hui. La photo
 * part bien vers le stockage (seau `shop-media`, voir ImageUploader) : pas
 * encore d'id de produit pour un nouveau produit, donc l'URL obtenue au
 * dépôt attend dans un champ caché jusqu'au submit du formulaire.
 */
export function ProductForm({
  shopId,
  product,
  onDone,
}: {
  shopId: string;
  product?: MerchantProduct;
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveProduct, initial);
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {product && <input type="hidden" name="id" value={product.id} />}

      {!state.ok && state.message && (
        <p className="rounded-[14px] bg-coral-wash px-4 py-3 text-[13px] font-bold text-coral-deep">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="flex min-w-0 flex-[2] flex-col gap-1.5">
          <span className="text-[12px] font-bold text-ink/55">Nom</span>
          <input name="name" defaultValue={product?.name} required className={input} />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-[12px] font-bold text-ink/55">Prix (€)</span>
          <input
            name="price"
            defaultValue={product ? String(product.price).replace(".", ",") : ""}
            required
            className={input}
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-[12px] font-bold text-ink/55">Catégorie</span>
          <select name="category" defaultValue={product?.category ?? "plat"} className={input}>
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-bold text-ink/55">Description</span>
        <textarea
          name="description"
          rows={2}
          defaultValue={product?.description ?? ""}
          className="rounded-[14px] border-[1.5px] border-line bg-sand px-4 py-3 text-[14px] leading-relaxed outline-none focus:border-teal"
        />
      </label>

      <input type="hidden" name="image_url" value={imageUrl} />
      <ImageUploader
        shopId={shopId}
        kind={`product-${product?.id ?? "new"}`}
        label="Photo"
        currentUrl={imageUrl || null}
        onUploaded={setImageUrl}
        shape="square"
      />

      <div className="flex flex-col gap-3.5 rounded-[16px] bg-sand p-4">
        <p className="text-[12.5px] leading-snug text-ink/60">
          Allergènes présents dans ce produit.
        </p>
        <Pills name="allergens" options={ALLERGENS} selected={product?.allergens} />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-bold text-ink/55">Note d&apos;atelier</span>
        <input
          name="workshop_note"
          defaultValue={product?.workshopNote ?? ""}
          placeholder="Interne : visible par vous et votre équipe, jamais par le client."
          className={input}
        />
      </label>

      <div className="flex items-center gap-3 border-t border-line-soft pt-4">
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-full border-2 border-line px-5 py-2.5 text-[13px] font-bold text-ink/60"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="ms-auto rounded-full bg-coral-deep px-6 py-3 font-display text-[14px] font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : product ? "Enregistrer" : "Ajouter à ma carte"}
        </button>
      </div>
    </form>
  );
}

function Pills({
  name,
  options,
  selected = [],
}: {
  name: string;
  options: [string, string][];
  selected?: string[];
}) {
  return (
    <fieldset className="flex flex-wrap gap-1.5">
      {options.map(([value, label]) => (
        <label key={value} className="cursor-pointer">
          <input
            type="checkbox"
            name={name}
            value={value}
            defaultChecked={selected.includes(value)}
            className="peer sr-only"
          />
          <span className="inline-block rounded-full border-[1.5px] border-line bg-white px-3 py-1.5 text-[12px] font-bold text-ink/55 peer-checked:border-[#8A2346] peer-checked:bg-[rgba(138,35,70,0.10)] peer-checked:text-[#8A2346]">
            {label}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
