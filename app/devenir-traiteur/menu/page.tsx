import { redirect } from "next/navigation";
import Link from "next/link";
import { getMyTraiteur, getMyTraiteurProducts } from "@/lib/marketplace";
import { ProductRow } from "@/components/marketplace/ProductRow";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";
import { Overline } from "@/components/ui";
import { Plus } from "@/components/icons";
import type { ProductCategory } from "@/lib/marketplace-types";

const ORDER: ProductCategory[] = ["plat", "entree", "salade", "dessert", "boisson", "autre"];

const CATEGORY_LABEL_PLURAL: Record<ProductCategory, string> = {
  plat: "Plats",
  entree: "Entrées",
  salade: "Salades",
  dessert: "Desserts",
  boisson: "Boissons",
  autre: "Autres",
};

/** Espace fournisseur · Gestion du menu (ajouter, modifier, supprimer un plat). */
export default async function TraiteurMenu() {
  const traiteur = await getMyTraiteur();
  if (!traiteur) redirect("/devenir-traiteur");

  const products = await getMyTraiteurProducts(traiteur.id);

  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-teal-wash sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-3 flex items-center gap-2.5">
          <BackButton fallback="/devenir-traiteur" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[18px] font-semibold">Mon menu</h1>
            <p className="truncate text-[11px] text-ink/50">{traiteur.name}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <Link
          href="/devenir-traiteur/menu/nouveau"
          className="mb-3.5 flex items-center gap-2.5 rounded-field border-[1.5px] border-dashed border-ink/20 px-3.5 py-3"
        >
          <Plus size={16} strokeWidth={2.2} className="text-ink/40" />
          <span className="text-[12.5px] font-bold text-ink/50">Ajouter un plat</span>
        </Link>

        {ORDER.map((category) => {
          const items = products.filter((p) => p.category === category);
          if (!items.length) return null;
          return (
            <section key={category} className="mb-4">
              <Overline>{CATEGORY_LABEL_PLURAL[category]}</Overline>
              <div className="flex flex-col gap-2">
                {items.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </div>
            </section>
          );
        })}

        {!products.length && (
          <p className="rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-6 text-center text-[12.5px] text-ink/45">
            Aucun plat pour l&apos;instant.
          </p>
        )}
      </div>
    </main>
  );
}
