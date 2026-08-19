import Link from "next/link";
import { getApprovedTraiteurs, getTraiteurScore } from "@/lib/marketplace";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";
import { ReactivityBadge } from "@/components/marketplace/ReactivityBadge";
import { Sparkles } from "@/components/marketplace/Sparkles";
import { Card } from "@/components/ui";
import { MapPin, Basket } from "@/components/icons";

export default async function Marketplace() {
  const traiteurs = await getApprovedTraiteurs();
  const scores = await Promise.all(traiteurs.map((t) => getTraiteurScore(t.id)));

  // "Traiteur du mois" : le palier Or avec la meilleure série de commandes
  // honorées d'affilée (départage par le temps de réponse le plus rapide).
  // Pas de mise en avant si personne n'est encore au palier Or.
  const spotlightIndex = scores.reduce<number | null>((best, s, i) => {
    if (s.tier !== "or") return best;
    if (best === null) return i;
    const bestScore = scores[best];
    if (s.streak !== bestScore.streak) return s.streak > bestScore.streak ? i : best;
    return (s.avgResponseMinutes ?? Infinity) < (bestScore.avgResponseMinutes ?? Infinity)
      ? i
      : best;
  }, null);
  const spotlight = spotlightIndex !== null ? traiteurs[spotlightIndex] : null;

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-1 flex items-center gap-2.5">
          <BackButton fallback="/accueil" />
          <h1 className="flex-1 font-display text-[18px] font-semibold">Marketplace</h1>
        </div>
        <p className="mb-4 text-[12.5px] text-ink/55">
          Complétez votre Shabbat auprès de nos traiteurs partenaires.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {!traiteurs.length && (
          <p className="rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-6 text-center text-[12.5px] text-ink/45">
            Aucun traiteur disponible pour l&apos;instant.
          </p>
        )}

        {spotlight && (
          <Link
            href={`/marketplace/${spotlight.id}`}
            className="relative mb-3.5 block overflow-hidden rounded-card bg-gradient-to-br from-gold-wash via-white to-teal-wash p-4 shadow-[var(--shadow-card-lg)]"
          >
            <Sparkles />
            <div className="relative flex items-center gap-3">
              <span className="flex size-12 shrink-0 animate-[glow-pulse_2s_ease-out_infinite] items-center justify-center rounded-full bg-gold text-[22px]">
                🏆
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[9.5px] font-extrabold tracking-[0.06em] text-gold-ink uppercase">
                  Traiteur du mois
                </div>
                <div className="truncate font-display text-[15px] font-semibold">
                  {spotlight.name}
                </div>
                <div className="mt-0.5 text-[10.5px] text-ink/50">
                  Le plus réactif en ce moment — répond en un éclair 🔥
                </div>
              </div>
            </div>
          </Link>
        )}

        <ul className="flex flex-col gap-2.5">
          {traiteurs.map((traiteur, i) => (
            <Card as="li" key={traiteur.id} className="rounded-field">
              <Link href={`/marketplace/${traiteur.id}`} className="flex items-center gap-3 px-3.5 py-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-coral/12 text-coral-deep">
                  <Basket size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className="truncate text-[13.5px] font-bold">{traiteur.name}</div>
                    <ReactivityBadge tier={scores[i].tier} />
                  </div>
                  {traiteur.address && (
                    <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-ink/50">
                      <MapPin size={11} className="shrink-0" />
                      {traiteur.address}
                    </div>
                  )}
                  {traiteur.deliveryAvailable && (
                    <span className="mt-1 inline-block rounded-full bg-teal/12 px-2 py-0.5 text-[9.5px] font-extrabold text-teal-deep">
                      Livraison disponible
                    </span>
                  )}
                </div>
              </Link>
            </Card>
          ))}
        </ul>
      </div>
    </main>
  );
}
