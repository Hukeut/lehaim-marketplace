import { notFound, redirect } from "next/navigation";
import { getMyTraiteur, getTraiteurMilestones } from "@/lib/marketplace";
import { recomputeSubjectState, getLedgerHistory } from "@/lib/gamification";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";
import { Card, ProgressBar, Overline } from "@/components/ui";
import { Medal } from "@/components/icons";
import { MilestoneBadges } from "@/components/marketplace/MilestoneBadges";
import { LevelUpBanner } from "@/components/marketplace/LevelUpBanner";

const METRIC_LABEL: Record<string, string> = {
  reliability: "Fiabilité",
  responsiveness: "Réactivité",
  quality: "Qualité",
  activity: "Activité",
  regularity: "Régularité",
};

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
 * Tableau de bord de progression du traiteur, branché sur le moteur de
 * gamification (lib/gamification.ts) plutôt que sur l'ancien système à
 * règles figées (badge de réactivité Or/Argent/Bronze) livré plus tôt
 * dans la session — voir docs/gamification-architecture-proposal.md.
 * Les badges d'ancienneté/volume (MilestoneBadges), eux, restent valables
 * tels quels : ils ne dépendent pas de l'ancien système de paliers.
 *
 * Le recalcul se fait à chaque visite de cette page (en plus du recalcul
 * événementiel déjà déclenché par les actions concernées) : peu coûteux
 * à cette échelle, et ça garde l'affichage toujours à jour même si un
 * recalcul précédent avait échoué silencieusement.
 */
export default async function MonScore() {
  const traiteur = await getMyTraiteur();
  if (!traiteur) redirect("/devenir-traiteur");
  if (traiteur.status !== "approved") notFound();

  const [state, history, milestones] = await Promise.all([
    recomputeSubjectState("traiteur", traiteur.id),
    getLedgerHistory("traiteur", traiteur.id, 10),
    getTraiteurMilestones(traiteur.id),
  ]);

  // `lastSeenTier` est la colonne ajoutée pour l'ancien système de badges,
  // réutilisée ici pour stocker la dernière `level_key` vue (mêmes policy
  // RLS et action `acknowledgeTier`, pas de nouvelle migration nécessaire).
  const leveledUp =
    state.level !== null &&
    traiteur.lastSeenTier !== state.level.levelKey &&
    !(traiteur.lastSeenTier === null && state.level.sortOrder === 0);

  const progressToNext =
    state.nextLevel && state.nextLevel.minXp > (state.level?.minXp ?? 0)
      ? clampProgress(
          ((state.currentXp - (state.level?.minXp ?? 0)) /
            (state.nextLevel.minXp - (state.level?.minXp ?? 0))) *
            100,
        )
      : 100;

  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-teal-wash sm:min-h-0">
      {state.level && (
        <LevelUpBanner
          traiteurId={traiteur.id}
          levelKey={state.level.levelKey}
          levelName={state.level.name}
          leveledUp={leveledUp}
        />
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
          <span
            className={`relative mb-3 flex size-16 items-center justify-center rounded-full ${
              LEVEL_BADGE_TONE[state.level?.levelKey ?? "debutant"]
            }`}
          >
            <Medal size={30} />
          </span>
          <div className="font-display text-[16px] font-semibold">
            {state.level?.name ?? "Débutant"}
          </div>
          <p className="mt-1 text-[11.5px] text-ink/50">
            {state.currentXp} XP
            {state.nextLevel
              ? ` · encore ${Math.max(0, state.nextLevel.minXp - state.currentXp)} XP pour ${state.nextLevel.name}`
              : " · palier maximum atteint"}
          </p>

          <div className="mt-4 w-full">
            <ProgressBar value={progressToNext} tone="gold" height={7} />
          </div>
          <p className="mt-2 text-[11px] font-bold text-ink/55">
            Votre palier peut aussi redescendre si vos indicateurs baissent — c&apos;est votre
            performance récente qui compte, pas ce que vous avez fait il y a longtemps.
          </p>
        </Card>

        <Overline>Mes indicateurs</Overline>
        <div className="mb-3.5 grid grid-cols-2 gap-2.5">
          {Object.entries(state.metrics).map(([key, value]) => (
            <Card key={key} className="rounded-field p-4 text-center">
              <div className="font-display text-[18px] font-semibold">{value}</div>
              <div className="mt-0.5 text-[10.5px] font-bold text-ink/50">
                {METRIC_LABEL[key] ?? key}
              </div>
            </Card>
          ))}
        </div>

        <Overline>Badges</Overline>
        <MilestoneBadges badges={milestones} />

        <div className="mt-4">
          <Overline>Derniers mouvements</Overline>
        </div>
        <div className="flex flex-col gap-1.5">
          {!history.length && (
            <p className="rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-4 text-center text-[11.5px] text-ink/40">
              Pas encore de mouvement — ça se remplit avec vos premières commandes traitées.
            </p>
          )}
          {history.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between rounded-field bg-white px-3.5 py-2.5 shadow-[var(--shadow-card)] ${
                entry.voided ? "opacity-40 line-through" : ""
              }`}
            >
              <span className="text-[11.5px] font-bold text-ink/70">{entry.reason}</span>
              <span
                className={`text-[12px] font-extrabold ${
                  entry.deltaXp >= 0 ? "text-olive-deep" : "text-coral-deep"
                }`}
              >
                {entry.deltaXp >= 0 ? "+" : ""}
                {entry.deltaXp} XP
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
