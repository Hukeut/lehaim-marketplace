/**
 * Modèles de Shabbat (S03). Le document produit prévoit une gestion via
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
  icon: string;
  tone: "gold" | "coral" | "violet";
}[] = [
  { kind: "friday_dinner", label: "Vendredi soir", detail: "Dîner", icon: "candles", tone: "gold" },
  { kind: "saturday_lunch", label: "Samedi midi", detail: "Déjeuner", icon: "daytime-meal", tone: "coral" },
  { kind: "sleepover", label: "Couchage sur place", detail: "Matelas ou canapé", icon: "bed", tone: "violet" },
  { kind: "synagogue_evening", label: "Synagogue le soir", detail: "Accueil du Shabbat", icon: "synagogue", tone: "gold" },
  { kind: "synagogue_morning", label: "Synagogue le matin", detail: "Départ groupé", icon: "synagogue", tone: "gold" },
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
    name: "Shabbat complet",
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

/**
 * Rôles, par clé.
 *
 * Le premier motif qui correspond gagne — d'où l'ordre : « salade » avant
 * « plat », sinon « salade composée » deviendrait un plat.
 *
 * La fonction ne rend qu'une clé : les libellés vivent dans `messages/*.json`
 * (`roles.<clé>.name` et `.tagline`). Ils étaient du français en dur injecté
 * dans des phrases traduites, ce qui donnait « Le chef du chaud » au milieu
 * d'un écran en hébreu.
 *
 * Les mêmes motifs existent en SQL, dans 0033, pour rattraper les prises déjà
 * faites. Les deux doivent rester d'accord — ils ne servent qu'une fois
 * chacun, au moment où le rôle est attribué.
 */
/**
 * La première règle qui accepte l'emporte : les motifs précis doivent donc
 * passer avant les larges. Trois apports tombaient sur la mauvaise règle
 * faute de cet ordre :
 *
 * - « Boissons softs » sur « boisson » — celui qui apportait les softs se
 *   voyait annoncer qu'il était le caviste, bouteille de vin à l'appui ;
 * - « Plata » sur « plat » — la plaque chauffante devenait le plat principal,
 *   et deux convives partageaient « Le chef du chaud » ;
 * - « Tables d'appoint » sur « table », règle écrite pour la nappe — porter
 *   une table n'est pas décorer.
 */
const ROLE_BY_KEYWORD: [RegExp, RoleKey][] = [
  [/plata/i, "support"],
  [/soft|jus|soda|frais|glaç/i, "cold"],
  [/dessert|pâtiss|gâteau/i, "pastry"],
  [/vin|caviste|boisson/i, "wine"],
  [/salade/i, "salad"],
  [/challah|hallot|pain/i, "bread"],
  [/plat|chaud/i, "main"],
  [/vaisselle|assiette|table/i, "table"],
  [/chaise|assise|tabouret/i, "seats"],
  [/matelas|couchage|couverture|drap/i, "bedding"],
  [/bougie|flamme/i, "candles"],
  [/entrée/i, "starter"],
  [/nappe|décor|fleur|bouquet/i, "decor"],
];

export const ROLE_KEYS = [
  "pastry", "wine", "salad", "bread", "main", "cold",
  "table", "seats", "bedding", "candles", "starter", "decor", "support",
] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];

/** Le rôle que vaut un titre de mission. `support` par défaut. */
export function roleKeyFor(title: string): RoleKey {
  for (const [pattern, key] of ROLE_BY_KEYWORD) {
    if (pattern.test(title)) return key;
  }
  return "support";
}

/** Valide une clé lue en base : une colonne texte accepte n'importe quoi. */
export function asRoleKey(value: unknown): RoleKey {
  return ROLE_KEYS.includes(value as RoleKey) ? (value as RoleKey) : "support";
}


/* ------------------------------------------------------------------ */
/* Catalogue de missions                                                */
/* ------------------------------------------------------------------ */

/**
 * Missions proposées à l'ajout. Remplace l'écran « choisir un modèle » :
 * on part d'un Shabbat vide et on pioche ce dont on a besoin, plutôt que
 * de retirer ce dont on n'a pas besoin.
 */
export const MISSION_PRESETS: (MissionSeed & { key: string })[] = [
  { key: "entrees", title: "Entrées", emoji: "🥗", category: "food", slots: 1 },
  { key: "plat", title: "Plat principal", emoji: "🍲", category: "food", slots: 1 },
  { key: "second-plat", title: "Second plat", emoji: "🍛", category: "food", slots: 1 },
  { key: "salades", title: "Salades", emoji: "🥙", category: "food", slots: 1 },
  { key: "dessert", title: "Dessert", emoji: "🍰", category: "food", slots: 1 },
  { key: "challah", title: "Hallot", emoji: "🥖", category: "food", slots: 1 },
  { key: "vin", title: "Vin", emoji: "🍷", category: "drinks", slots: 1 },
  { key: "softs", title: "Boissons softs", emoji: "🧃", category: "drinks", slots: 1 },
  { key: "glacons", title: "Glaçons", emoji: "🧊", category: "drinks", slots: 1 },
  { key: "vaisselle", title: "Vaisselle", emoji: "🍽️", category: "equipment", slots: 1 },
  { key: "chaises", title: "Chaises", emoji: "🪑", category: "equipment", slots: 1 },
  { key: "tables", title: "Tables d'appoint", emoji: "🪵", category: "equipment", slots: 1 },
  { key: "matelas", title: "Matelas d'appoint", emoji: "🛏️", category: "equipment", slots: 1 },
  { key: "bougies", title: "Bougies", emoji: "🕯️", category: "equipment", slots: 1 },
  { key: "plata", title: "Plata", emoji: "🔥", category: "equipment", slots: 1 },
];
