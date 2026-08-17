import type { ReactionTone } from "@/components/onboarding";

/* ------------------------------------------------------------------ */
/* Étapes                                                               */
/* ------------------------------------------------------------------ */

/** Étape qu'il reste à faire. `done` = compte prêt. */
export type OnboardingStep = "prenom" | "telephone" | "frequence" | "role" | "done";

/** Question à poser, hors état terminal. */
export type OnboardingQuestion = Exclude<OnboardingStep, "done">;

/** Ordre du parcours obligatoire, dans l'ordre des écrans O02 → O05. */
export const STEP_ORDER: OnboardingQuestion[] = [
  "prenom",
  "telephone",
  "frequence",
  "role",
];

export const STEP_PATH: Record<OnboardingStep, string> = {
  prenom: "/onboarding/prenom",
  telephone: "/onboarding/telephone",
  frequence: "/onboarding/frequence",
  role: "/onboarding/role",
  done: "/onboarding/bienvenue",
};

/** 0 → 100. Sert la barre de l'écran de reprise (O07). */
export function stepProgress(step: OnboardingStep): number {
  if (step === "done") return 100;
  return (STEP_ORDER.indexOf(step) / STEP_ORDER.length) * 100;
}

/** Nombre de questions encore devant soi. */
export function stepsLeft(step: OnboardingStep): number {
  if (step === "done") return 0;
  return STEP_ORDER.length - STEP_ORDER.indexOf(step);
}

/* ------------------------------------------------------------------ */
/* Indicatifs                                                           */
/* ------------------------------------------------------------------ */

export type Country = {
  code: string;
  flag: string;
  name: string;
  dial: string;
  /** Nombre de chiffres attendus après l'indicatif. */
  digits: number;
};

export const COUNTRIES: Country[] = [
  { code: "FR", flag: "🇫🇷", name: "France", dial: "+33", digits: 9 },
  { code: "IL", flag: "🇮🇱", name: "Israël", dial: "+972", digits: 9 },
  { code: "GB", flag: "🇬🇧", name: "Royaume-Uni", dial: "+44", digits: 10 },
  { code: "US", flag: "🇺🇸", name: "États-Unis", dial: "+1", digits: 10 },
];

export function countryByCode(code: string | null | undefined): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

/** Découpe en paquets lisibles : « 6 12 34 56 78 ». */
export function formatNationalNumber(digits: string): string {
  const [head, ...rest] = [digits.slice(0, 1), ...(digits.slice(1).match(/.{1,2}/g) ?? [])];
  return [head, ...rest].filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/* Catalogues de réponses                                               */
/* ------------------------------------------------------------------ */

export type Option<T extends string> = {
  value: T;
  emoji: string;
  label: string;
  hint?: string;
  /** Le petit mot affiché sous la liste dès que l'option est choisie. */
  reaction: { emoji: string; text: string; tone: ReactionTone };
};

export type Frequency = "weekly" | "biweekly" | "sometimes" | "discovering";

export const FREQUENCIES: Option<Frequency>[] = [
  {
    value: "weekly",
    emoji: "🔥",
    label: "Toutes les semaines",
    reaction: { emoji: "🔥", text: "Un vrai habitué ! On va te faire gagner un temps fou.", tone: "gold" },
  },
  {
    value: "biweekly",
    emoji: "📅",
    label: "Deux fois par mois",
    reaction: { emoji: "📅", text: "Le bon rythme : assez souvent pour que ça reste simple.", tone: "gold" },
  },
  {
    value: "sometimes",
    emoji: "🌤️",
    label: "De temps en temps",
    reaction: { emoji: "🌤️", text: "Parfait. On te préviendra sans jamais te presser.", tone: "teal" },
  },
  {
    value: "discovering",
    emoji: "🌱",
    label: "Je découvre",
    reaction: { emoji: "🌱", text: "Bienvenue ! On t'accompagne pas à pas pour le premier.", tone: "olive" },
  },
];

export type HostingStyle = "host" | "guest" | "both";

export const HOSTING_STYLES: Option<HostingStyle>[] = [
  {
    value: "host",
    emoji: "🏠",
    label: "J'organise chez moi",
    hint: "Je suis souvent l'hôte",
    reaction: { emoji: "🏠", text: "Les hosts comme toi vont gagner un temps fou.", tone: "teal" },
  },
  {
    value: "guest",
    emoji: "🎁",
    label: "Je suis invité",
    hint: "Je participe chez les autres",
    reaction: { emoji: "🎁", text: "On te trouvera toujours une place à table.", tone: "coral" },
  },
  {
    value: "both",
    emoji: "🤝",
    label: "Les deux, ça dépend",
    hint: "Selon les semaines",
    reaction: { emoji: "🤝", text: "L'équilibre parfait. L'app s'adapte aux deux.", tone: "olive" },
  },
];

export type DishSpecialty = "wine" | "dessert" | "cooked" | "bought";

export const DISH_SPECIALTIES: Option<DishSpecialty>[] = [
  {
    value: "wine",
    emoji: "🍷",
    label: "J'arrive avec du vin",
    hint: "Toujours, sans réfléchir",
    reaction: { emoji: "🍷", text: "Tu vas vite devenir le spécialiste des bonnes bouteilles.", tone: "coral" },
  },
  {
    value: "dessert",
    emoji: "🍰",
    label: "Je cuisine un dessert",
    hint: "J'adore ça",
    reaction: { emoji: "🍰", text: "On te réservera les desserts, personne ne s'en plaindra.", tone: "coral" },
  },
  {
    value: "cooked",
    emoji: "🥗",
    label: "Salade ou plat, ça dépend",
    hint: "Selon l'inspiration",
    reaction: { emoji: "🥗", text: "Polyvalent : on te proposera ce qui manque le jour J.", tone: "olive" },
  },
  {
    value: "bought",
    emoji: "🛍️",
    label: "Je préfère acheter tout fait",
    hint: "Pas de honte à ça",
    reaction: { emoji: "🛍️", text: "Aucun souci. On te glissera les bonnes adresses.", tone: "teal" },
  },
];

export type DietTag = "casher" | "vegetarien" | "sans-gluten" | "sans-lactose";

export const DIET_TAGS: { value: DietTag; emoji: string; label: string }[] = [
  { value: "casher", emoji: "✅", label: "Casher" },
  { value: "vegetarien", emoji: "🥦", label: "Végétarien" },
  { value: "sans-gluten", emoji: "🌾", label: "Sans gluten" },
  { value: "sans-lactose", emoji: "🥛", label: "Sans lactose" },
];

export type SynagogueHabit = "always" | "sometimes" | "rarely" | "never";

export const SYNAGOGUE_HABITS: Option<SynagogueHabit>[] = [
  {
    value: "always",
    emoji: "🕍",
    label: "La synagogue, toujours",
    reaction: { emoji: "🕍", text: "On te proposera les départs groupés du samedi matin.", tone: "gold" },
  },
  {
    value: "sometimes",
    emoji: "🕍",
    label: "Parfois",
    reaction: { emoji: "🕍", text: "On te signalera les offices quand ça tombe bien.", tone: "gold" },
  },
  {
    value: "rarely",
    emoji: "☕",
    label: "Rarement",
    reaction: { emoji: "☕", text: "Noté. On mettra plutôt l'accent sur la table.", tone: "teal" },
  },
  {
    value: "never",
    emoji: "🛌",
    label: "Jamais",
    reaction: { emoji: "🛌", text: "C'est noté, on ne t'en parlera pas.", tone: "teal" },
  },
];

export type ContentPref = "recipes" | "places" | "both";

export const CONTENT_PREFS: Option<ContentPref>[] = [
  {
    value: "recipes",
    emoji: "📖",
    label: "Des idées de recettes",
    reaction: { emoji: "📖", text: "On te glissera des idées, jamais de spam.", tone: "olive" },
  },
  {
    value: "places",
    emoji: "📍",
    label: "De bonnes adresses",
    reaction: { emoji: "📍", text: "Traiteurs, caves, pâtisseries : on ouvre le carnet.", tone: "olive" },
  },
  {
    value: "both",
    emoji: "✨",
    label: "Les deux",
    reaction: { emoji: "✨", text: "Le meilleur des deux, sans jamais encombrer.", tone: "olive" },
  },
];
