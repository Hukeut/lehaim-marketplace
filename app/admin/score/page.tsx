import { AdminTitle } from "@/components/admin";
import { Overline, ProgressBar } from "@/components/ui";
import { Medal } from "@/components/icons";
import { ReactivityBadge } from "@/components/marketplace/ReactivityBadge";
import { MilestoneBadges } from "@/components/marketplace/MilestoneBadges";
import { requireMyShop } from "@/lib/merchant";
import { traiteurMilestones, traiteurProgress, traiteurScore } from "@/lib/gamification";

const LEVEL_BADGE_TONE: Record<string, string> = {
  debutant: "bg-line-soft text-ink/40",
  confirme: "bg-teal/16 text-teal-deep",
  expert: "bg-coral/16 text-coral-deep",
  elite: "bg-gold text-gold-ink",
};

function clampProgress(value: number) {
  if (!Number.isFinite(value)) return 100;
  return Math.min(100, Math.max(0, value));
}

/**
 * Mon score — niveau, badges et réactivité.
 *
 * Version simplifiée du "Mon score" de lehaim-marketplace : même vitrine
 * (niveau, points, badges d'ancienneté/volume, réactivité), sans le moteur
 * de règles versionnées ni le grand livre XP qui vont avec là-bas — voir
 * lib/gamification.ts pour le détail de ce qui est repris tel quel et ce
 * qui est simplifié.
 */
export default async function MonScore() {
  const shop = await requireMyShop();

  const [progress, milestones, score] = await Promise.all([
    traiteurProgress(shop.id),
    traiteurMilestones(shop.id),
    traiteurScore(shop.id),
  ]);

  const progressToNext =
    progress.nextLevel && progress.nextLevel.minXp > progress.level.minXp
      ? clampProgress(
          ((progress.xp - progress.level.minXp) / (progress.nextLevel.minXp - progress.level.minXp)) * 100,
        )
      : 100;

  return (
    <>
      <AdminTitle title="Mon score" />

      <div className="flex flex-col gap-5">
        <section className="relative flex flex-col items-center overflow-hidden rounded-[18px] bg-white p-6 text-center shadow-[var(--shadow-card)]">
          <span
            className={`relative mb-3 flex size-16 items-center justify-center rounded-full ${
              LEVEL_BADGE_TONE[progress.level.key]
            }`}
          >
            <Medal size={30} />
          </span>
          <div className="flex items-center gap-2 font-display text-[16px] font-semibold">
            {progress.level.name}
            <ReactivityBadge tier={score.tier} />
          </div>
          <p className="mt-1 text-[11.5px] text-ink/50">
            {progress.xp} points
            {progress.nextLevel
              ? ` · encore ${Math.max(0, progress.nextLevel.minXp - progress.xp)} pour ${progress.nextLevel.name}`
              : " · palier maximum atteint"}
          </p>

          <div className="mt-4 w-full max-w-[320px]">
            <ProgressBar value={progressToNext} tone="gold" height={7} />
          </div>

          {score.streak > 0 && (
            <p className="mt-3 text-[11px] font-bold text-ink/55">
              {score.streak} commande{score.streak > 1 ? "s" : ""} honorée
              {score.streak > 1 ? "s" : ""} d&apos;affilée
            </p>
          )}
        </section>

        <div>
          <Overline>Badges</Overline>
          <MilestoneBadges badges={milestones} />
        </div>

        <div className="rounded-[18px] bg-white p-5 text-[12px] leading-relaxed text-ink/55 shadow-[var(--shadow-card)]">
          Le niveau et les points sont recalculés à chaque visite depuis vos commandes servies et
          vos avis — pas de moteur de règles à administrer pour l&apos;instant : +10 points par
          commande servie, +5/-5 par avis positif/négatif, -15 par commande que vous annulez.
        </div>
      </div>
    </>
  );
}
