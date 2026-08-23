/**
 * Catalogue de plats illustrés. Sert de suggestions à qui vient de prendre
 * une mission de cuisine : on choisit une vignette plutôt que de partir
 * d'un champ vide. La clé est stockée dans `mission_claims.dish_key`, le
 * libellé et l'image se résolvent ici.
 */

export type DishCourse = "starter" | "salad" | "main" | "side" | "dessert";

export type Dish = { key: string; label: string; course: DishCourse };

export const DISHES: Dish[] = [
  { key: "salade-verte", label: "Salade verte", course: "salad" },
  { key: "salades-cuites", label: "Assortiment de salades", course: "starter" },
  { key: "salade-betteraves", label: "Salade de betteraves", course: "salad" },
  { key: "shakshuka", label: "Shakshuka", course: "starter" },
  { key: "riz-legumes", label: "Riz aux petits légumes", course: "side" },
  { key: "salade-chou", label: "Salade de chou", course: "salad" },
  { key: "boulettes", label: "Boulettes sauce tomate", course: "main" },
  { key: "mousse-chocolat", label: "Mousse au chocolat", course: "dessert" },
  { key: "carottes", label: "Carottes confites", course: "side" },
  { key: "caviar-aubergines", label: "Caviar d'aubergines", course: "starter" },
  { key: "poivrons-grilles", label: "Poivrons grillés", course: "starter" },
  { key: "salade-olives", label: "Salade aux olives", course: "starter" },
  { key: "saumon", label: "Saumon rôti aux légumes", course: "main" },
  { key: "escalopes", label: "Escalopes panées", course: "main" },
  { key: "couscous-legumes", label: "Couscous aux légumes", course: "main" },
  { key: "roti-boeuf", label: "Rôti de bœuf", course: "main" },
  { key: "semoule", label: "Semoule", course: "side" },
  { key: "pommes-de-terre", label: "Pommes de terre au four", course: "side" },
  { key: "legumes-rotis", label: "Légumes rôtis", course: "side" },
  { key: "poulet-roti", label: "Poulet rôti", course: "main" },
  { key: "poivrons-farcis", label: "Poivrons farcis", course: "main" },
  { key: "poulet-petits-pois", label: "Poulet aux petits pois", course: "main" },
  { key: "boeuf-mijote", label: "Bœuf mijoté", course: "main" },
  { key: "bourekas", label: "Bourekas", course: "starter" },
  { key: "cigares", label: "Cigares à la viande", course: "starter" },
  { key: "assortiment-cigares", label: "Bourekas et cigares", course: "starter" },
  { key: "matbucha", label: "Matbucha", course: "starter" },
  { key: "taboule", label: "Taboulé", course: "salad" },
  { key: "taboule-betterave", label: "Taboulé de betteraves", course: "salad" },
];

const BY_KEY = new Map(DISHES.map((d) => [d.key, d]));

export function dishByKey(key: string | null) {
  return key ? (BY_KEY.get(key) ?? null) : null;
}

export function dishImage(key: string) {
  return `/plats/${key}.jpg`;
}

/**
 * Quels plats proposer pour une mission donnée. On se cale sur le titre :
 * c'est lui que l'hôte a choisi, la catégorie est trop large (« food »
 * couvre aussi bien la challah que le dessert).
 */
const COURSES_BY_TITLE: [RegExp, DishCourse[]][] = [
  [/dessert|pâtiss|gâteau/i, ["dessert"]],
  [/salade/i, ["salad", "starter"]],
  [/entrée|apéritif|mezz/i, ["starter", "salad"]],
  [/accompagnement|riz|semoule|légume/i, ["side"]],
  [/plat|chaud|viande|poisson|poulet/i, ["main", "side"]],
];

export function suggestionsFor(title: string): Dish[] {
  for (const [pattern, courses] of COURSES_BY_TITLE) {
    if (pattern.test(title)) return DISHES.filter((d) => courses.includes(d.course));
  }
  return [];
}

/** Vignette du catalogue dont le nom recoupe celui d'un article de boutique. */
export function dishForProduct(name: string): Dish | null {
  const haystack = name.toLowerCase();
  return (
    DISHES.find((dish) => haystack.includes(dish.label.toLowerCase())) ??
    DISHES.find((dish) => dish.label.toLowerCase().split(" ").some((word) =>
      word.length > 4 && haystack.includes(word),
    )) ??
    null
  );
}
