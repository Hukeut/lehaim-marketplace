import { notFound, redirect } from "next/navigation";
import {
  getMyTraiteur,
  getTraiteurScore,
  getTraiteurMilestones,
  REACTIVITY_TIER_LABEL,
} from "@/lib/marketplace";
import type { ReactivityTier } from "@/lib/marketplace-types";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";
import { Card, ProgressBar, Overline } from "@/components/ui";
import { Medal } from "@/components/icons";
import { Sparkles } from "@/components/marketplace/Sparkles";
import { MilestoneBadges } from "@/components/marketplace/MilestoneBadges";
import { TierLevelUp } from "@/components/marketplace/TierLevelUp";

const TIER_ORDER: ReactivityTier[] = ["bronze", "argent", "or"];

function formatMinutes(value: number | null) {
  if (value === null) return "—";
  if (value < 60) return `${Math.round(value)} min`;
  const h = Math.floor(value / 60);
  const m = Math.round(value % 60);
  return `${h}h${m.toString().padStart(2, "0")}`;
}

const TIER_VISUAL: Record<ReactivityTier, { badge: string; bar: "gold" | "teal" | "coral"; caption: string }> = {
  or: {
    badge: "bg-gold text-gold-ink",
    bar: "gold",
    caption: "Vous êtes au meilleur palier — continuez à répondre vite pour le garder.",
  },
  argent: {
    badge: "bg-ink/10 text-ink/55",
    bar: "teal",
    caption: "Répondez en moyenne sous 15 min pour passer au palier Or.",
  },
  bronze: {
    badge: "bg-coral/16 text-coral-deep",
    bar: "coral",
    caption: "Répondez en moyenne sous 45 min pour passer au palier Argent.",
  },
};

export default async function MonScore() {
  const traiteur = await getMyTraiteur();
  if (!traiteur) redirect("/devenir-traiteur");
  if (traiteur.status !== "approved") notFound();

  const [score, milestones] = await Promise.all([
    getTraiteurScore(traiteur.id),
    getTraiteurMilestones(traiteur.id),
  ]);
  const visual = score.tier ? TIER_VISUAL[score.tier] : null;
  // Sans palier encore débloqué, on affiche une jauge à peine amorcée plutôt que vide.
  const progress = score.tier ? (TIER_ORDER.indexOf(score.tier) + 1) * (100 / 3) : 8;
  const leveledUp =
    score.tier !== null &&
    (traiteur.lastSeenTier === null || TIER_ORDER.indexOf(score.tier) > TIER_ORDER.indexOf(traiteur.lastSeenTier));

  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-teal-wash sm:min-h-0">
      {score.tier && (
        <TierLevelUp traiteurId={traiteur.id} tier={score.tier} leveledUp={leveledUp} />
      )}
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-4 flex items-center gap-2.5">
          <BackButton fallback="/devenir-traiteur" />
          <h1 className="flex-1 font-display text-[18px] font-semibold">Mon score</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <Card className="relative mb-3.5 flex flex-col items-center overflow-hidden p-6 text-center">
          {score.tier === "or" && <Sparkles />}
          <span
            className={`relative mb-3 flex size-16 items-center justify-center rounded-full ${visual?.badge ?? "bg-line-soft text-ink/30"} ${
              score.tier === "or" ? "animate-[glow-pulse_2s_ease-out_infinite]" : ""
            }`}
          >
            <Medal size={30} />
          </span>
          <div className="font-display text-[16px] font-semibold">
            {score.tier ? `Palier ${REACTIVITY_TIER_LABEL[score.tier]}` : "Pas encore de palier"}
          </div>
          <p className="mt-1 text-[11.5px] text-ink/50">
            Temps de réponse moyen · {formatMinutes(score.avgResponseMinutes)}
          </p>

          <div className="mt-4 w-full">
            <ProgressBar value={progress} tone={visual?.bar ?? "coral"} height={7} />
          </div>
          <p className="mt-2 text-[11px] font-bold text-ink/55">
            {visual?.caption ??
              "Traitez quelques commandes pour débloquer votre badge de réactivité."}
          </p>
        </Card>

        <div className="mb-3.5 grid grid-cols-2 gap-2.5">
          <Card className="rounded-field p-4 text-center">
            <div className="font-display text-[18px] font-semibold">
              {formatMinutes(score.avgResponseMinutes)}
            </div>
            <div className="mt-0.5 text-[10.5px] font-bold text-ink/50">Temps de réponse moyen</div>
          </Card>
          <Card className="rounded-field p-4 text-center">
            <div className="font-display text-[18px] font-semibold">🔥 {score.streak}</div>
            <div className="mt-0.5 text-[10.5px] font-bold text-ink/50">
              Commandes honorées d&apos;affilée
            </div>
          </Card>
        </div>

        <Overline>Badges</Overline>
        <MilestoneBadges badges={milestones} />

        <p className="mt-4 text-center text-[11px] text-ink/40">
          Le badge et les succès débloqués sont visibles par les clients sur la marketplace.
        </p>
      </div>
    </main>
  );
}
