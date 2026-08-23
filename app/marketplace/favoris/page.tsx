import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { ButtonLink, Card, StatusPill } from "@/components/ui";
import { favoriteShops } from "@/lib/shops";
import { currentUser } from "@/lib/supabase/user";

/** Mes favoris — les fiches marquées d'un cœur sur la marketplace. */
export default async function Favoris() {
  const [shops, user] = await Promise.all([favoriteShops(), currentUser()]);

  return (
    <main className="flex min-h-dvh flex-1 flex-col pb-28 sm:min-h-0">
      <div className="flex items-center gap-2.5 px-[18px] pt-[54px] pb-1.5">
        <BackButton fallback="/marketplace" />
        <span className="flex-1 font-display text-[19px] font-semibold">Favoris</span>
      </div>

      <div className="flex-1 overflow-y-auto px-[18px] pb-5">
        {shops.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 pt-16 text-center">
            <span className="text-4xl">🤍</span>
            <span className="font-display text-[17px] font-semibold">Aucun favori pour l&apos;instant</span>
            <p className="text-[13.5px] leading-relaxed text-ink/60">
              {user
                ? "Le cœur sur la fiche d'un traiteur l'ajoute ici."
                : "Connectez-vous pour retrouver vos traiteurs favoris."}
            </p>
            <ButtonLink href="/marketplace" full={false} className="mt-2">
              Voir la marketplace
            </ButtonLink>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5 pt-2">
            {shops.map((shop) => (
              <Card as="li" key={shop.id}>
                <Link href={`/marketplace/${shop.id}`} className="flex items-center gap-3 p-3">
                  {shop.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shop.logoUrl} alt="" className="size-12 shrink-0 rounded-card object-cover" />
                  ) : (
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-card bg-teal/12 text-xl">
                      🍲
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[15px] font-semibold">{shop.name}</div>
                    <div className="truncate text-[12.5px] text-ink/60">{shop.city ?? "Traiteur"}</div>
                  </div>
                  {shop.paused && <StatusPill tone="warning">En pause</StatusPill>}
                </Link>
              </Card>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
