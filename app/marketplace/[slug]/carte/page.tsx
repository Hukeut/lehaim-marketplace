import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { Catalogue } from "@/components/marketplace/Catalogue";
import { CATEGORY_LABEL, PRODUCT_CATEGORIES, shopBySlug } from "@/lib/shops";

/**
 * La carte d'un traiteur.
 *
 * Le panier se construit ici même (quantités inline, voir Catalogue.tsx) —
 * pas d'écran de configuration à part, puisqu'il n'y a pas de variante à
 * choisir sur ce backend.
 */
export default async function Carte({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const [{ slug }, { c }] = await Promise.all([params, searchParams]);
  const shop = await shopBySlug(slug);
  if (!shop) notFound();

  const filled = PRODUCT_CATEGORIES.filter((k) => shop.products.some((p) => p.category === k));
  const active = filled.find((k) => k === c) ?? null;
  const shown = active ? shop.products.filter((p) => p.category === active) : shop.products;

  return (
    <main className="flex min-h-dvh flex-1 flex-col pb-28 sm:min-h-0">
      <div className="sticky top-0 z-10 flex flex-col gap-3 bg-white px-4 pt-[54px] pb-3 shadow-[0_2px_8px_rgba(23,58,114,0.06)]">
        <div className="flex items-center gap-2.5">
          <BackButton fallback={`/marketplace/${slug}`} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-[16px] font-semibold">{shop.name}</div>
          </div>
        </div>

        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
          <Link href={`/marketplace/${slug}/carte`}>
            <span
              className={`inline-block shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-bold whitespace-nowrap ${
                active ? "border-[1.5px] border-line-soft bg-white text-ink/60" : "bg-teal/12 text-teal-deep"
              }`}
            >
              Tout
            </span>
          </Link>
          {filled.map((key) => (
            <Link key={key} href={`/marketplace/${slug}/carte?c=${key}`}>
              <span
                className={`inline-block shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-bold whitespace-nowrap ${
                  active === key
                    ? "bg-teal/12 text-teal-deep"
                    : "border-[1.5px] border-line-soft bg-white text-ink/60"
                }`}
              >
                {CATEGORY_LABEL[key] ?? key}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pt-4">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display text-[18px] font-semibold">
            {active ? CATEGORY_LABEL[active] : "Toute la carte"}
          </h1>
          <span className="text-[12.5px] text-ink/50">{shown.length} produit{shown.length > 1 ? "s" : ""}</span>
        </div>

        {shown.length === 0 ? (
          <p className="rounded-card bg-white px-4 py-8 text-center text-[13px] text-ink/55 shadow-[var(--shadow-card)]">
            Aucun produit ici pour l&apos;instant.
          </p>
        ) : (
          <Catalogue shopId={shop.id} products={shown} disabled={shop.paused} />
        )}
      </div>
    </main>
  );
}
