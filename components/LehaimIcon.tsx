import Image from "next/image";

/**
 * Icônes illustrées de la marque, en PNG. Distinctes de `icons.tsx`, qui
 * regroupe les pictogrammes au trait : celles-ci sont des dessins, on ne
 * peut pas les recolorer par `currentColor`.
 */
export const LEHAIM_ICONS = [
  "bed",
  "board",
  "bookmark-heart",
  "calendar",
  "candles",
  "chair",
  "challah",
  "chat",
  "contributions",
  "daytime-meal",
  "dessert",
  "dishes",
  "door",
  "envelope",
  "flowers",
  "grocery-bag",
  "guests",
  "handshake",
  "home-pin",
  "ice",
  "join-code",
  "kiddush",
  "main-dish",
  "maps",
  "mattress",
  "napkins",
  "olive-branch",
  "other",
  "reminder-bell",
  "receipt",
  "salad",
  "search-home",
  "shabbat-table",
  "soft-drinks",
  "starter",
  "step-buy",
  "step-celebrate",
  "step-invite",
  "step-setup",
  "step-share",
  "synagogue",
  "whatsapp",
  "waze",
  "wine",
] as const;

export type LehaimIconName = (typeof LEHAIM_ICONS)[number];

export function LehaimIcon({
  name,
  size = 28,
  className = "",
  alt = "",
}: {
  name: LehaimIconName;
  size?: number;
  className?: string;
  /** Vide par défaut : l'icône accompagne un libellé, elle ne le remplace pas. */
  alt?: string;
}) {
  return (
    <Image
      src={`/lehaim/${name}.png`}
      alt={alt}
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      // `unoptimized` était posé ici, ce qui court-circuitait l'optimiseur :
      // le PNG partait tel quel, quelle que soit la taille d'affichage. Les
      // icônes sont demandées entre 18 et 72 px et les sources faisaient
      // 256 px — le commentaire d'origine parlait de « 17 icônes, 400 Ko »,
      // il y en a 44 pour 2,5 Mo. Les sources sont redescendues à 160 px et
      // l'optimiseur sert désormais du WebP à la taille demandée.
      priority={false}
    />
  );
}
