import { Medal } from "@/components/icons";
import { REACTIVITY_TIER_LABEL, type ReactivityTier } from "@/lib/marketplace-types";

const TIER_STYLE: Record<ReactivityTier, string> = {
  or: "bg-gold/24 text-gold-ink",
  argent: "bg-ink/8 text-ink/55",
  bronze: "bg-coral/14 text-coral-deep",
};

/**
 * Badge de réactivité d'un traiteur. N'affiche rien si le traiteur n'a pas
 * encore assez d'historique pour être noté (voir getTraiteurScore) — pas de
 * badge plutôt qu'un badge trompeur. Le palier Or a un léger reflet animé,
 * façon objet légendaire de jeu vidéo — réservé au meilleur palier pour ne
 * pas diluer l'effet.
 */
export function ReactivityBadge({
  tier,
  className = "",
}: {
  tier: ReactivityTier | null;
  className?: string;
}) {
  if (!tier) return null;
  return (
    <span
      className={`relative inline-flex items-center gap-1 overflow-hidden rounded-full px-2 py-0.5 text-[9.5px] font-extrabold ${TIER_STYLE[tier]} ${className}`}
    >
      <Medal size={11} />
      {REACTIVITY_TIER_LABEL[tier]}
      {tier === "or" && (
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-[40%] animate-[shine-sweep_3.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
