/**
 * Modèles de Chabbat (S03). Le document produit prévoit une gestion via
 * back-office ; en attendant, ils vivent ici, en un seul endroit.
 */

export type MomentKind =
  | "friday_dinner"
  | "saturday_lunch"
  | "sleepover"
  | "synagogue_evening"
  | "synagogue_morning";

export const MOMENTS: {
  kind: MomentKind;
  label: string;
  detail: string;
  emoji: string;
  tone: "gold" | "coral" | "violet";
}[] = [
  { kind: "friday_dinner", label: "Vendredi soir", detail: "Dîner", emoji: "🕯️", tone: "gold" },
  { kind: "saturday_lunch", label: "Samedi midi", detail: "Déjeuner", emoji: "🍲", tone: "coral" },
  { kind: "sleepover", label: "Couchage sur place", detail: "Matelas ou canapé", emoji: "🛏️", tone: "violet" },
  { kind: "synagogue_evening", label: "Synagogue le soir", detail: "Accueil du Chabbat", emoji: "🏛️", tone: "gold" },
  { kind: "synagogue_morning", label: "Synagogue le matin", detail: "Départ groupé", emoji: "🏛️", tone: "gold" },
];

export type MissionSeed = {
  title: string;
  emoji: string;
  category: "food" | "drinks" | "equipment" | "hosting" | "other";
  slots?: number;
  quantity?: string;
  priority?: "essential" | "standard";
};

export type EquipmentSeed = { name: string; emoji: string; owned: number; needed: number };

export type Template = {
  key: string;
  name: string;
  illustration: string;
  difficulty: string;
  recommended?: boolean;
  moments: MomentKind[];
  missions: MissionSeed[];
  equipment: EquipmentSeed[];
};

export const TEMPLATES: Template[] = [
  {
    key: "diner-simple",
    name: "Dîner simple",
    illustration: "/illustrations/dresser-la-table.jpg",
    difficulty: "Facile",
    recommended: true,
    moments: ["friday_dinner", "saturday_lunch"],
    missions: [
      { title: "Plat principal", emoji: "🍲", category: "food", slots: 2, quantity: "Pour 8 personnes", priority: "essential" },
      { title: "Dessert", emoji: "🍰", category: "food", slots: 1, quantity: "Au choix" },
      { title: "Vin & boissons", emoji: "🍷", category: "drinks", slots: 1, quantity: "2 bouteilles", priority: "essential" },
      { title: "Challah", emoji: "🥖", category: "food", slots: 1, quantity: "2 pains", priority: "essential" },
    ],
    equipment: [],
  },
  {
    key: "chabbat-complet",
    name: "Chabbat complet",
    illustration: "/illustrations/famille-table-shabbat.jpg",
    difficulty: "Moyen",
    moments: ["friday_dinner", "saturday_lunch", "synagogue_evening", "synagogue_morning"],
    missions: [
      { title: "Plat principal", emoji: "🍲", category: "food", slots: 2, quantity: "Pour 10 personnes", priority: "essential" },
      { title: "Entrées", emoji: "🥗", category: "food", slots: 2 },
      { title: "Dessert", emoji: "🍰", category: "food", slots: 1 },
      { title: "Challah", emoji: "🥖", category: "food", slots: 1, priority: "essential" },
      { title: "Vin & boissons", emoji: "🍷", category: "drinks", slots: 2, quantity: "4 bouteilles", priority: "essential" },
      { title: "Jus & softs", emoji: "🧃", category: "drinks", slots: 1 },
      { title: "Vaisselle", emoji: "🍽️", category: "equipment", slots: 1 },
      { title: "Chaises supplémentaires", emoji: "🪑", category: "equipment", slots: 1, quantity: "4 chaises" },
      { title: "Bougies", emoji: "🕯️", category: "equipment", slots: 1, priority: "essential" },
    ],
    equipment: [
      { name: "Chaises", emoji: "🪑", owned: 6, needed: 10 },
      { name: "Verres", emoji: "🥃", owned: 6, needed: 10 },
      { name: "Bougies", emoji: "🕯️", owned: 12, needed: 12 },
    ],
  },
  {
    key: "grand-groupe",
    name: "Grand groupe",
    illustration: "/illustrations/mes-proches-communaute.jpg",
    difficulty: "Ambitieux",
    moments: ["friday_dinner", "saturday_lunch", "sleepover", "synagogue_morning"],
    missions: [
      { title: "Plat principal", emoji: "🍲", category: "food", slots: 3, quantity: "Pour 16 personnes", priority: "essential" },
      { title: "Second plat", emoji: "🍛", category: "food", slots: 2 },
      { title: "Entrées", emoji: "🥗", category: "food", slots: 3 },
      { title: "Salades", emoji: "🥙", category: "food", slots: 2 },
      { title: "Dessert", emoji: "🍰", category: "food", slots: 2 },
      { title: "Challah", emoji: "🥖", category: "food", slots: 2, priority: "essential" },
      { title: "Vin & boissons", emoji: "🍷", category: "drinks", slots: 2, quantity: "8 bouteilles", priority: "essential" },
      { title: "Jus & softs", emoji: "🧃", category: "drinks", slots: 1 },
      { title: "Glaçons & glacière", emoji: "🧊", category: "drinks", slots: 1 },
      { title: "Vaisselle", emoji: "🍽️", category: "equipment", slots: 2 },
      { title: "Chaises supplémentaires", emoji: "🪑", category: "equipment", slots: 2, quantity: "8 chaises" },
      { title: "Tables d'appoint", emoji: "🪵", category: "equipment", slots: 1 },
      { title: "Matelas d'appoint", emoji: "🛏️", category: "equipment", slots: 2, quantity: "3 matelas" },
      { title: "Bougies", emoji: "🕯️", category: "equipment", slots: 1, priority: "essential" },
    ],
    equipment: [
      { name: "Chaises", emoji: "🪑", owned: 6, needed: 16 },
      { name: "Vaisselle", emoji: "🍽️", owned: 8, needed: 16 },
      { name: "Matelas d'appoint", emoji: "🛏️", owned: 0, needed: 3 },
      { name: "Couvertures", emoji: "🧣", owned: 8, needed: 6 },
      { name: "Verres", emoji: "🥃", owned: 6, needed: 16 },
      { name: "Tables", emoji: "🪵", owned: 2, needed: 2 },
    ],
  },
];

export function templateByKey(key: string) {
  return TEMPLATES.find((t) => t.key === key);
}

/** Compteurs affichés sur les cartes de modèle. */
export function templateStats(template: Template) {
  return {
    missions: template.missions.length,
    moments: template.moments.length,
  };
}

/* ------------------------------------------------------------------ */
/* Rôles ludiques, dérivés du titre de la mission                       */
/* ------------------------------------------------------------------ */

const ROLE_BY_KEYWORD: [RegExp, string, string][] = [
  [/dessert|pâtiss/i, "Le pâtissier du week-end", "Tu deviendras le pâtissier du week-end"],
  [/vin|boisson|caviste/i, "Le caviste", "Le Kiddoush du vendredi, c'est un peu grâce à toi"],
  [/salade/i, "Le chef des salades", "La fraîcheur de la table repose sur toi"],
  [/challah|hallot|pain/i, "Le gardien des hallot", "Pas de Chabbat sans tes hallot"],
  [/plat|chaud/i, "Le chef du chaud", "Le plat qu'on attend tous, c'est le tien"],
  [/jus|soft|frais|glaç/i, "Le maître du frais", "Personne n'aura soif grâce à toi"],
  [/vaisselle|assiette/i, "Le boss de la table", "La table sera impeccable"],
  [/chaise|assise/i, "Le sauveur des assises", "Quatre convives te devront leur place assise"],
  [/matelas|couchage|couverture/i, "Le maître des matelas", "Ceux qui dorment sur place te remercieront"],
  [/bougie/i, "Le gardien de la flamme", "C'est toi qui fais entrer Chabbat"],
  [/entrée/i, "L'ouvreur de bal", "Tu donnes le ton du repas"],
  [/table|nappe/i, "Le décorateur", "La table aura de l'allure"],
];

export function roleFor(title: string): { name: string; tagline: string } {
  for (const [pattern, name, tagline] of ROLE_BY_KEYWORD) {
    if (pattern.test(title)) return { name, tagline };
  }
  return { name: "Le renfort", tagline: "Un coup de main qui compte" };
}
