"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

/**
 * Mot-symbole « Lehaim ». Sans pictogramme : le nom se suffit à lui-même,
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
  const t = useTranslations("common");
  const label = (
    <span
      className={`font-display font-semibold ${size} ${light ? "text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]" : "text-ink"}`}
    >
      {t("appName")}
    </span>
  );

  return href ? (
    <Link href={href} aria-label={t("brandHome")} className={`inline-flex ${className}`}>
      {label}
    </Link>
  ) : (
    <span className={`inline-flex ${className}`}>{label}</span>
  );
}
