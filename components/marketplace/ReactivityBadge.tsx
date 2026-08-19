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
 * badge plutôt qu'un badge trompeur.
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
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold ${TIER_STYLE[tier]} ${className}`}
    >
      <Medal size={11} />
      {REACTIVITY_TIER_LABEL[tier]}
    </span>
  );
}
