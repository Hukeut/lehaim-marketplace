import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { Heart, HeartSolid, StarSolid } from "@/components/icons";
import { ReactivityBadge } from "@/components/marketplace/ReactivityBadge";
import { MilestoneBadges } from "@/components/marketplace/MilestoneBadges";
import { money, myFavoriteIds, shopBySlug, shopRating, shopReviews } from "@/lib/shops";
import { traiteurMilestones, traiteurScore } from "@/lib/gamification";
import { toggleFavorite } from "@/app/marketplace/actions";

/**
 * La fiche d'un traiteur.
 *
 * Version simplifiée : pas d'horaires — juste ce que le commerçant a
 * renseigné (voir /traiteur/boutique), la note moyenne calculée depuis les avis
 * clients, et deux produits pour donner une idée avant d'aller voir la carte
 * complète.
 */
export default async function Boutique({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [shop, favorites, rating, reviews, score, milestones] = await Promise.all([
    shopBySlug(slug),
    myFavoriteIds(),
    shopRating(slug),
    shopReviews(slug),
    traiteurScore(slug),
    traiteurMilestones(slug),
  ]);
  if (!shop) notFound();

  const achievedMilestones = milestones.filter((m) => m.achieved);

  const liked = favorites.has(shop.id);
  const preview = shop.products.filter((p) => p.available).slice(0, 2);

  return (
    <main className="flex min-h-dvh flex-1 flex-col pb-28 sm:min-h-0">
      <div className="relative h-[140px] shrink-0 bg-[repeating-linear-gradient(45deg,var(--color-sand),var(--color-sand)_8px,var(--color-line-soft)_8px,var(--color-line-soft)_16px)]">
        {shop.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.coverUrl} alt="" className="size-full object-cover" />
        )}
        <div className="absolute start-4 top-[54px] flex size-10 items-center justify-center rounded-full bg-white/92 shadow-[var(--shadow-card)] backdrop-blur-sm">
          <BackButton fallback="/marketplace" />
        </div>
        <form action={toggleFavorite} className="absolute end-4 top-[54px]">
          <input type="hidden" name="shop_id" value={shop.id} />
          <input type="hidden" name="on" value={liked ? "0" : "1"} />
          <button
            type="submit"
            aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
            aria-pressed={liked}
            className="flex size-10 items-center justify-center rounded-full bg-white/92 shadow-[var(--shadow-card)] backdrop-blur-sm"
          >
            {liked ? (
              <HeartSolid size={19} className="text-coral-deep" />
            ) : (
              <Heart size={19} className="text-ink/45" />
            )}
          </button>
        </form>
      </div>

      <div className="-mt-6 flex flex-col gap-3.5 rounded-t-[28px] bg-white px-5 pt-5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[24px] leading-tight font-semibold">{shop.name}</h1>
            <ReactivityBadge tier={score.tier} />
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink/60">
            <span>{shop.city ?? "Traiteur"}</span>
            {rating.count > 0 && (
              <span className="flex items-center gap-0.5 font-bold text-ink">
                <StarSolid size={13} className="text-gold" />
                {rating.average.toLocaleString("fr-FR")} · {rating.count} avis
              </span>
            )}
          </div>
          {achievedMilestones.length > 0 && (
            <div className="mt-2">
              <MilestoneBadges badges={achievedMilestones} />
            </div>
          )}
        </div>

        {shop.hechsherName ? (
          <span className="w-fit rounded-full bg-teal/12 px-3 py-1.5 text-[11.5px] font-extrabold text-teal-deep">
            {shop.hechsherName}
          </span>
        ) : (
          <p className="text-[12.5px] text-ink/55">Cacherout non renseignée</p>
        )}

        {shop.paused && (
          <p className="rounded-card bg-gold-wash px-4 py-3 text-[13px] leading-relaxed font-bold text-gold-ink">
            Ce traiteur a suspendu les commandes pour l&apos;instant. Sa fiche reste visible.
          </p>
        )}

        <div className="flex flex-col gap-1.5 rounded-[20px] border border-line-soft bg-sand p-3.5 text-[12.5px] text-ink/65">
          <span>
            {shop.deliveryAvailable ? "Retrait et livraison" : "Retrait uniquement"}
            {shop.deliveryZone && ` · ${shop.deliveryZone}`}
          </span>
          {shop.address && <span>{shop.address}</span>}
        </div>

        {shop.description && (
          <p className="text-[13px] leading-relaxed text-ink/65">{shop.description}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 bg-white px-5 pb-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-[18px] font-semibold">La carte</h2>
          <Link
            href={`/marketplace/${slug}/carte`}
            className="text-[13px] font-bold text-teal underline underline-offset-4"
          >
            Voir tout
          </Link>
        </div>

        {preview.length === 0 ? (
          <p className="rounded-card bg-sand px-4 py-6 text-center text-[13px] text-ink/55">
            Aucun produit pour l&apos;instant.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {preview.map((product) => (
              <Link
                key={product.id}
                href={`/marketplace/${slug}/carte`}
                className="flex flex-col overflow-hidden rounded-card bg-white shadow-[var(--shadow-card)]"
              >
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt="" className="h-28 w-full object-cover" />
                ) : (
                  <span className="flex h-28 w-full items-center justify-center bg-[repeating-linear-gradient(45deg,var(--color-sand),var(--color-sand)_8px,var(--color-line-soft)_8px,var(--color-line-soft)_16px)] font-mono text-[10px] text-ink/40">
                    photo
                  </span>
                )}
                <div className="flex flex-col gap-1 p-3">
                  <span className="font-display text-[14.5px] leading-tight font-semibold">
                    {product.name}
                  </span>
                  <span className="font-display text-[16px] font-semibold">{money(product.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="flex flex-col gap-3 bg-white px-5 pb-8">
          <h2 className="font-display text-[18px] font-semibold">Avis clients</h2>
          <div className="flex flex-col gap-2.5">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-card bg-sand p-3.5">
                <div className="mb-1 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <StarSolid
                      key={n}
                      size={13}
                      className={n <= review.rating ? "text-gold" : "text-line"}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-[12.5px] leading-relaxed text-ink/65">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
