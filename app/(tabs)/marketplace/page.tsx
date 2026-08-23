import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { Basket, Heart, Search } from "@/components/icons";
import { Card, ScreenBody, StatusPill } from "@/components/ui";
import { listShops, type ShopCard } from "@/lib/shops";

/**
 * La place de marché — les traiteurs cachers, en retrait ou en livraison.
 *
 * Version portée depuis Rraven666/lehaim, simplifiée : pas de notes/avis, pas
 * d'horaires (donc pas de badge ouvert/fermé) — ce que le backend traiteur
 * sait dire aujourd'hui, c'est son nom, sa carte, ses favoris et s'il est en
 * pause.
 */
export default async function Marketplace() {
  const shops = await listShops();

  return (
    <ScreenBody className="pb-28">
      <BrandMark className="mb-3" />
      <h1 className="mb-0.5 font-display text-[21px] font-semibold">Marketplace</h1>
      <p className="mb-3.5 text-xs text-ink/55">Les traiteurs cachers, en retrait ou en livraison.</p>

      <Link
        href="/marketplace/recherche"
        className="mb-3 flex items-center gap-2.5 rounded-field border-[1.5px] border-line-soft bg-white px-3.5 py-2.5 shadow-[var(--shadow-card)]"
      >
        <Search size={15} className="text-ink" />
        <span className="text-[14px] text-ink/40">Rechercher un traiteur</span>
      </Link>

      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <Link
          href="/commandes"
          className="flex items-center gap-2.5 rounded-card bg-white px-3.5 py-3 shadow-[var(--shadow-card)]"
        >
          <Basket size={17} className="text-teal" />
          <span className="text-[13px] font-bold">Mes commandes</span>
        </Link>
        <Link
          href="/marketplace/favoris"
          className="flex items-center gap-2.5 rounded-card bg-white px-3.5 py-3 shadow-[var(--shadow-card)]"
        >
          <Heart size={17} className="text-coral-deep" />
          <span className="text-[13px] font-bold">Favoris</span>
        </Link>
      </div>

      {shops.length === 0 ? (
        <Card className="flex flex-col gap-2 p-5 text-center">
          <span className="font-display text-[16px] font-semibold">Aucun traiteur pour l&apos;instant</span>
          <p className="text-[13px] leading-relaxed text-ink/60">
            Revenez bientôt — les premiers traiteurs sont en cours de validation.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {shops.map((shop) => (
            <ShopRow key={shop.id} shop={shop} />
          ))}
        </ul>
      )}
    </ScreenBody>
  );
}

function ShopRow({ shop }: { shop: ShopCard }) {
  return (
    <Card as="li" className="overflow-hidden rounded-panel">
      <Link href={`/marketplace/${shop.id}`} className="flex gap-3 p-3">
        {shop.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.logoUrl} alt="" className="size-16 shrink-0 rounded-card object-cover" />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-card bg-teal/12 text-2xl">
            🍲
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="truncate font-display text-[16px] font-semibold">{shop.name}</span>
            {shop.paused && <StatusPill tone="warning">En pause</StatusPill>}
          </div>
          <div className="mt-0.5 truncate text-[12.5px] text-ink/65">
            {shop.city ?? "Traiteur"}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {shop.hechsherName && (
              <span className="rounded-full bg-teal/12 px-2.5 py-1 text-[10.5px] font-extrabold text-teal-deep">
                {shop.hechsherName}
              </span>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}
