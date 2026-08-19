/**
 * Recommandation de préparation (S04) — estimation simple des quantités
 * en fonction du nombre d'invités visé. Le minimum vital d'un Chabbat :
 * un plat principal, des hallot et du vin (brachot / kiddouch).
 */

export type RecommendedItem = {
  title: string;
  emoji: string;
  quantity: string;
  essential: boolean;
};

export function recommendQuantities(guestTarget: number): RecommendedItem[] {
  const guests = Math.max(1, guestTarget);
  const plural = (n: number) => (n > 1 ? "s" : "");

  const challot = Math.max(2, Math.ceil(guests / 8) * 2);
  const bottles = Math.max(1, Math.ceil(guests / 6));
  const sides = Math.max(1, Math.ceil(guests / 4));
  const desserts = Math.max(1, Math.ceil(guests / 8));

  return [
    {
      title: "Plat principal",
      emoji: "🍲",
      quantity: `Pour ${guests} personne${plural(guests)} (~150-200g/pers.)`,
      essential: true,
    },
    {
      title: "Challah",
      emoji: "🥖",
      quantity: `${challot} pain${plural(challot)}`,
      essential: true,
    },
    {
      title: "Vin & boissons",
      emoji: "🍷",
      quantity: `${bottles} bouteille${plural(bottles)} (kiddouch)`,
      essential: true,
    },
    {
      title: "Entrées & salades",
      emoji: "🥗",
      quantity: `${sides} plat${plural(sides)}`,
      essential: false,
    },
    {
      title: "Dessert",
      emoji: "🍰",
      quantity: `${desserts} dessert${plural(desserts)}`,
      essential: false,
    },
  ];
}
