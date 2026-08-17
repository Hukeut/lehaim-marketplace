import Link from "next/link";

/**
 * Mot-symbole « lehaim ». Sans pictogramme : le nom se suffit à lui-même,
 * et sans mention « Private » — c'est le produit qui s'affiche, pas son
 * périmètre. Cliquable, il sert aussi de retour à l'accueil.
 */
export function BrandMark({
  light = false,
  href = "/accueil",
  className = "",
  size = "text-[22px]",
}: {
  /** Variante claire, posée sur une illustration. */
  light?: boolean;
  href?: string | false;
  className?: string;
  size?: string;
}) {
  const label = (
    <span
      className={`font-display font-semibold ${size} ${light ? "text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]" : "text-ink"}`}
    >
      lehaim
    </span>
  );

  return href ? (
    <Link href={href} aria-label="lehaim · retour à l'accueil" className={`inline-flex ${className}`}>
      {label}
    </Link>
  ) : (
    <span className={`inline-flex ${className}`}>{label}</span>
  );
}
