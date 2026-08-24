import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { Search } from "@/components/icons";
import { Card } from "@/components/ui";
import { listShops } from "@/lib/shops";

/**
 * La recherche — par nom de traiteur uniquement (pas de catégories de
 * commerce dans ce schéma : seuls les produits en ont une, voir /traiteur/carte).
 */
export default async function Recherche({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const search = (q ?? "").trim();
  const shops = search ? await listShops({ search }) : [];

  return (
    <main className="flex min-h-dvh flex-1 flex-col pb-28 sm:min-h-0">
      <div className="flex items-center gap-2.5 px-[18px] pt-[54px] pb-1.5">
        <BackButton fallback="/marketplace" />
        <form action="/marketplace/recherche" className="flex-1">
          <div className="flex items-center gap-2.5 rounded-field border-[1.5px] border-teal bg-white px-3.5 py-2.5">
            <Search size={15} className="text-teal" />
            <input
              name="q"
              defaultValue={search}
              autoFocus
              placeholder="Rechercher un traiteur"
              className="min-w-0 flex-1 bg-transparent text-[14px] font-bold outline-none"
            />
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto px-[18px] pb-5">
        {!search ? (
          <p className="pt-6 text-center text-[13px] text-ink/50">
            Tapez le nom d&apos;un traiteur pour commencer.
          </p>
        ) : shops.length === 0 ? (
          <Card className="mt-2 flex flex-col gap-2 p-5 text-center">
            <span className="font-display text-[16px] font-semibold">Aucun résultat pour « {search} »</span>
            <p className="text-[13px] leading-relaxed text-ink/60">Essayez un autre nom.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2.5 pt-2">
            {shops.map((shop) => (
              <Card as="li" key={shop.id}>
                <Link href={`/marketplace/${shop.id}`} className="flex items-center gap-3 p-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-card bg-teal/12 text-xl">
                    🍲
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[15px] font-semibold">{shop.name}</div>
                    <div className="truncate text-[12.5px] text-ink/60">{shop.city ?? "Traiteur"}</div>
                  </div>
                </Link>
              </Card>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
