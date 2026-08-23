"use client";

import { useTranslations } from "next-intl";
import { StarSolid } from "./icons";

/** Le bloc logo : carré encre à coins arrondis + étoile or. */
export function LogoTile({ size = 64, radius = 20 }: { size?: number; radius?: number }) {
  return (
    <span
      className="flex items-center justify-center bg-ink text-gold"
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <StarSolid size={Math.round(size * 0.47)} />
    </span>
  );
}

export function Wordmark({ className = "text-2xl" }: { className?: string }) {
  const t = useTranslations("common");
  return <span className={`font-display font-semibold ${className}`}>{t("appName")}</span>;
}
