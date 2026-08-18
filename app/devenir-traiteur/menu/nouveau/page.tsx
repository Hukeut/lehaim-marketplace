import { redirect } from "next/navigation";
import { getMyTraiteur } from "@/lib/marketplace";
import { ProductForm } from "@/components/marketplace/ProductForm";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";

/** Espace fournisseur · Ajouter un plat au menu. */
export default async function NouveauPlat() {
  const traiteur = await getMyTraiteur();
  if (!traiteur) redirect("/devenir-traiteur");

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-4 flex items-center gap-2.5">
          <BackButton fallback="/devenir-traiteur/menu" />
          <h1 className="flex-1 font-display text-[18px] font-semibold">Ajouter un plat</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <ProductForm />
      </div>
    </main>
  );
}
