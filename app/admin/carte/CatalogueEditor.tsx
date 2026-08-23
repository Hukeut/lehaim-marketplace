"use client";

import { useState } from "react";
import { StatusTag } from "@/components/admin";
import { ProductForm } from "./ProductForm";
import { toggleAvailability } from "./actions";
import type { MerchantProduct } from "@/lib/merchant";

const CATEGORY_LABEL: Record<string, string> = {
  plat: "Plats",
  entree: "Entrées",
  salade: "Salades",
  dessert: "Desserts",
  boisson: "Boissons",
  autre: "Autres",
};

const ALLERGEN_LABEL: Record<string, string> = {
  gluten: "gluten",
  fruits_a_coque: "fruits à coque",
  oeufs: "œufs",
  lactose: "lactose",
  soja: "soja",
  arachide: "arachide",
  poisson: "poisson",
  sesame: "sésame",
};

const price = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

/**
 * La carte, éditable sur place.
 *
 * Un seul formulaire ouvert à la fois : ouvrir le suivant referme le
 * précédent, ce qui évite de croire qu'on a enregistré deux fiches quand on
 * n'en a enregistré qu'une.
 *
 * Porté depuis Rraven666/lehaim. Les allergènes restent sur une seule liste,
 * pas les trois niveaux (contient / traces / garanti sans) de l'écran
 * d'origine.
 */
export function CatalogueEditor({
  products,
  shopId,
}: {
  products: MerchantProduct[];
  shopId: string;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[18px] bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="mb-3.5 font-display text-[16px] font-semibold">
          {editing === "new" ? "Nouveau produit" : "Ajouter un produit"}
        </div>
        {editing === "new" ? (
          <ProductForm shopId={shopId} onDone={() => setEditing(null)} />
        ) : (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="rounded-full bg-coral-deep px-5 py-2.5 font-display text-[13.5px] font-semibold text-white"
          >
            Ajouter à ma carte
          </button>
        )}
      </section>

      {products.length === 0 ? (
        <div className="rounded-[18px] border-[1.5px] border-dashed border-line bg-white/60 px-6 py-12 text-center">
          <div className="mb-1.5 font-display text-[17px] font-semibold">Votre carte est vide</div>
          <p className="mx-auto max-w-[46ch] text-[13.5px] leading-relaxed text-ink/55">
            Ajoutez au moins un produit : c&apos;est ce que verront vos clients sur votre fiche.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex flex-col gap-3 rounded-[16px] bg-white p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-wrap items-start gap-3">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="size-16 shrink-0 rounded-[12px] object-cover"
                  />
                ) : (
                  <span className="flex size-16 shrink-0 items-center justify-center rounded-[12px] border-[1.5px] border-dashed border-line bg-sand font-mono text-[9px] text-ink/40">
                    photo
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-[15px] font-semibold">{product.name}</span>
                    <StatusTag
                      status={product.available ? "ok" : "draft"}
                      label={product.available ? "En vente" : "Retiré"}
                    />
                    <span className="text-[11.5px] font-bold text-ink/45">
                      {CATEGORY_LABEL[product.category] ?? product.category}
                    </span>
                  </div>
                  {product.description && (
                    <p className="mt-0.5 text-[12.5px] leading-snug text-ink/60">
                      {product.description}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {product.allergens.map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-[rgba(138,35,70,0.10)] px-2 py-0.5 text-[10.5px] font-extrabold text-[#8A2346]"
                      >
                        contient {ALLERGEN_LABEL[a] ?? a}
                      </span>
                    ))}
                  </div>
                </div>

                <span className="font-display text-[16px] font-semibold">
                  {price.format(product.price)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 border-t border-line-soft pt-3">
                {/* Un produit ne se supprime pas : il se retire de la vente.
                    Les commandes passées pointent dessus. */}
                <form action={toggleAvailability}>
                  <input type="hidden" name="id" value={product.id} />
                  <input type="hidden" name="available" value={product.available ? "0" : "1"} />
                  <button
                    type="submit"
                    className="rounded-full border-2 border-line px-4 py-2 text-[12.5px] font-bold text-ink/60"
                  >
                    {product.available ? "Retirer de la vente" : "Remettre en vente"}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setEditing(editing === product.id ? null : product.id)}
                  className="ms-auto text-[12.5px] font-bold text-teal underline underline-offset-4"
                >
                  {editing === product.id ? "Fermer" : "Modifier"}
                </button>
              </div>

              {editing === product.id && (
                <div className="flex flex-col gap-5 border-t border-line-soft pt-4">
                  <ProductForm shopId={shopId} product={product} onDone={() => setEditing(null)} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
