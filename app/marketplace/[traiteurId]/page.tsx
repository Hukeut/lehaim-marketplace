import { notFound } from "next/navigation";
import { getTraiteurWithProducts } from "@/lib/marketplace";
import { TraiteurCatalog } from "@/components/marketplace/TraiteurCatalog";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";
import { MapPin } from "@/components/icons";

export default async function TraiteurPage({
  params,
}: {
  params: Promise<{ traiteurId: string }>;
}) {
  const { traiteurId } = await params;
  const result = await getTraiteurWithProducts(traiteurId);
  if (!result) notFound();

  const { traiteur, products } = result;

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-1 flex items-center gap-2.5">
          <BackButton fallback="/marketplace" />
          <h1 className="flex-1 truncate font-display text-[18px] font-semibold">
            {traiteur.name}
          </h1>
        </div>
        {traiteur.address && (
          <p className="mb-1 flex items-center gap-1.5 text-[12px] text-ink/55">
            <MapPin size={12} />
            {traiteur.address}
          </p>
        )}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {traiteur.hechsherName && (
            <span className="inline-block rounded-full bg-gold-wash px-2.5 py-1 text-[10px] font-extrabold text-gold-ink">
              ✡️ Cacherout vérifiée · {traiteur.hechsherName}
            </span>
          )}
          {traiteur.deliveryAvailable && (
            <span className="inline-block rounded-full bg-teal/12 px-2.5 py-1 text-[10px] font-extrabold text-teal-deep">
              Livraison disponible {traiteur.deliveryZone ? `· ${traiteur.deliveryZone}` : ""}
            </span>
          )}
        </div>
      </div>

      <TraiteurCatalog traiteurId={traiteur.id} traiteurName={traiteur.name} products={products} />
    </main>
  );
}
