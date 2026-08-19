import { notFound, redirect } from "next/navigation";
import { getMyTraiteur, getProductById } from "@/lib/marketplace";
import { ProductForm } from "@/components/marketplace/ProductForm";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";

/** Espace fournisseur · Modifier un plat du menu. */
export default async function ModifierPlat({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const traiteur = await getMyTraiteur();
  if (!traiteur) redirect("/devenir-traiteur");

  const product = await getProductById(productId);
  if (!product || product.traiteurId !== traiteur.id) notFound();

  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-teal-wash sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-4 flex items-center gap-2.5">
          <BackButton fallback="/devenir-traiteur/menu" />
          <h1 className="flex-1 truncate font-display text-[18px] font-semibold">
            {product.title}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <ProductForm product={product} />
      </div>
    </main>
  );
}
