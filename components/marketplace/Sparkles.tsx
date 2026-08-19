import { StarSolid } from "@/components/icons";

const POSITIONS = [
  { top: "-6%", left: "4%", size: 10, delay: "0s" },
  { top: "8%", left: "88%", size: 8, delay: "0.5s" },
  { top: "78%", left: "92%", size: 9, delay: "1s" },
  { top: "86%", left: "10%", size: 7, delay: "1.4s" },
];

/**
 * Petites étoiles qui scintillent en boucle, positionnées en absolu autour
 * du conteneur parent (qui doit être `relative`). Décoration pure : côté
 * jeu vidéo, réservée aux éléments "au top" (palier Or, spotlight du mois,
 * badge tout juste débloqué) pour ne pas diluer l'effet.
 */
export function Sparkles({ color = "#ffd166" }: { color?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {POSITIONS.map((p, i) => (
        <span
          key={i}
          className="absolute animate-[sparkle-twinkle_2.2s_ease-in-out_infinite]"
          style={{ top: p.top, left: p.left, animationDelay: p.delay, color }}
        >
          <StarSolid size={p.size} />
        </span>
      ))}
    </div>
  );
}
