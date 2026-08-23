import type { LehaimIconName } from "@/components/LehaimIcon";

/**
 * Illustration d'un apport, déduite de son titre.
 *
 * Le titre est ce que l'hôte a écrit ou choisi au catalogue ; la catégorie
 * est trop large (« food » couvre aussi bien la challah que le dessert).
 * Les apports écrits à la main qui ne ressemblent à rien de connu gardent
 * l'illustration générique plutôt qu'une icône à côté de la plaque.
 */
const ICON_BY_KEYWORD: [RegExp, LehaimIconName][] = [
  [/plata|plaque|chauffante|réchaud/i, "daytime-meal"],
  [/challah|hallot|pain/i, "challah"],
  [/dessert|gâteau|pâtiss/i, "dessert"],
  [/salade/i, "salad"],
  [/entrée|mezz|houmous|apéritif/i, "starter"],
  [/vin|kiddouch|kiddush/i, "wine"],
  [/jus|soft|boisson/i, "soft-drinks"],
  [/glaç|glacière|frais/i, "ice"],
  [/vaisselle|assiette|couvert/i, "dishes"],
  [/chaise|assise/i, "chair"],
  [/matelas|couchage|couverture/i, "mattress"],
  [/nappe|serviette|linge/i, "napkins"],
  [/bougie/i, "candles"],
  [/table/i, "shabbat-table"],
  [/plat|chaud|viande|poisson|poulet|cocotte/i, "main-dish"],
  [/course|marché|épicerie/i, "grocery-bag"],
  [/fleur|bouquet/i, "flowers"],
];

export function iconForMission(title: string): LehaimIconName {
  for (const [pattern, icon] of ICON_BY_KEYWORD) {
    if (pattern.test(title)) return icon;
  }
  return "other";
}
