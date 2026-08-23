/**
 * Recommandation de préparation — estimation des quantités à prévoir selon le
 * nombre d'invités. Le minimum d'un Shabbat : un plat principal, des hallot,
 * du vin pour le kiddouch.
 *
 * La fonction ne rend que des NOMBRES et des clés. Les libellés et les
 * pluriels vivent dans `messages/`, comme partout ailleurs : la version
 * d'origine écrivait « pain{s} » à la main, ce qui ne se traduit ni en hébreu
 * (duel) ni en russe (trois formes).
 */
export type RecommendedKey = "main" | "challah" | "wine" | "sides" | "dessert";

export type RecommendedItem = {
  key: RecommendedKey;
  emoji: string;
  /** Nombre à injecter dans le message pluralisé. */
  count: number;
  essential: boolean;
};

export function recommendQuantities(guestTarget: number): RecommendedItem[] {
  const guests = Math.max(1, guestTarget);

  return [
    { key: "main", emoji: "🍲", count: guests, essential: true },
    // Deux hallot par tranche de huit : la brakha en demande deux, on double
    // au-delà pour que chacun en ait un morceau.
    { key: "challah", emoji: "🥖", count: Math.max(2, Math.ceil(guests / 8) * 2), essential: true },
    { key: "wine", emoji: "🍷", count: Math.max(1, Math.ceil(guests / 6)), essential: true },
    { key: "sides", emoji: "🥗", count: Math.max(1, Math.ceil(guests / 4)), essential: false },
    { key: "dessert", emoji: "🍰", count: Math.max(1, Math.ceil(guests / 8)), essential: false },
  ];
}
