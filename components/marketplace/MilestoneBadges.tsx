import type { MilestoneBadge } from "@/lib/marketplace-types";

/**
 * Rangée de badges d'ancienneté / volume. Les badges non débloqués restent
 * visibles mais grisés : ça donne un objectif clair plutôt que de les
 * cacher, comme les succès verrouillés d'un jeu.
 */
export function MilestoneBadges({ badges }: { badges: MilestoneBadge[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span
          key={badge.id}
          className={`relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.5 text-[10.5px] font-bold ${
            badge.achieved
              ? "bg-gold-wash text-gold-ink shadow-[var(--shadow-pill)]"
              : "bg-line-soft text-ink/30 grayscale"
          }`}
        >
          <span className={badge.achieved ? "" : "opacity-40"}>{badge.emoji}</span>
          {badge.label}
          {badge.achieved && (
            <span
              className="pointer-events-none absolute inset-y-0 left-0 w-[35%] animate-[shine-sweep_3.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent"
              aria-hidden="true"
            />
          )}
        </span>
      ))}
    </div>
  );
}
