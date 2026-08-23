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
  /** Chemin de la clé de traduction, relatif à "onboarding.phone". */
  nameKey: string;
  dial: string;
  /** Nombre de chiffres attendus après l'indicatif. */
  digits: number;
};

export const COUNTRIES: Country[] = [
  { code: "FR", flag: "🇫🇷", nameKey: "countryNames.fr", dial: "+33", digits: 9 },
  { code: "IL", flag: "🇮🇱", nameKey: "countryNames.il", dial: "+972", digits: 9 },
  { code: "GB", flag: "🇬🇧", nameKey: "countryNames.gb", dial: "+44", digits: 10 },
  { code: "US", flag: "🇺🇸", nameKey: "countryNames.us", dial: "+1", digits: 10 },
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
  /** Chemin de la clé de traduction, relatif à l'espace de noms passé à ChoiceStep. */
  labelKey: string;
  hintKey?: string;
  /** Le petit mot affiché sous la liste dès que l'option est choisie. */
  reaction: { emoji: string; textKey: string; tone: ReactionTone };
};

export type Frequency = "weekly" | "biweekly" | "sometimes" | "discovering";

export const FREQUENCIES: Option<Frequency>[] = [
  {
    value: "weekly",
    emoji: "🔥",
    labelKey: "frequency.weekly.label",
    reaction: { emoji: "🔥", textKey: "frequency.weekly.reaction", tone: "gold" },
  },
  {
    value: "biweekly",
    emoji: "📅",
    labelKey: "frequency.biweekly.label",
    reaction: { emoji: "📅", textKey: "frequency.biweekly.reaction", tone: "gold" },
  },
  {
    value: "sometimes",
    emoji: "🌤️",
    labelKey: "frequency.sometimes.label",
    reaction: { emoji: "🌤️", textKey: "frequency.sometimes.reaction", tone: "teal" },
  },
  {
    value: "discovering",
    emoji: "🌱",
    labelKey: "frequency.discovering.label",
    reaction: { emoji: "🌱", textKey: "frequency.discovering.reaction", tone: "olive" },
  },
];

export type HostingStyle = "host" | "guest" | "both";

export const HOSTING_STYLES: Option<HostingStyle>[] = [
  {
    value: "host",
    emoji: "🏠",
    labelKey: "hostingStyle.host.label",
    hintKey: "hostingStyle.host.hint",
    reaction: { emoji: "🏠", textKey: "hostingStyle.host.reaction", tone: "teal" },
  },
  {
    value: "guest",
    emoji: "🎁",
    labelKey: "hostingStyle.guest.label",
    hintKey: "hostingStyle.guest.hint",
    reaction: { emoji: "🎁", textKey: "hostingStyle.guest.reaction", tone: "coral" },
  },
  {
    value: "both",
    emoji: "🤝",
    labelKey: "hostingStyle.both.label",
    hintKey: "hostingStyle.both.hint",
    reaction: { emoji: "🤝", textKey: "hostingStyle.both.reaction", tone: "olive" },
  },
];

export type DishSpecialty = "wine" | "dessert" | "cooked" | "bought";

export const DISH_SPECIALTIES: Option<DishSpecialty>[] = [
  {
    value: "wine",
    emoji: "🍷",
    labelKey: "dish.wine.label",
    hintKey: "dish.wine.hint",
    reaction: { emoji: "🍷", textKey: "dish.wine.reaction", tone: "coral" },
  },
  {
    value: "dessert",
    emoji: "🍰",
    labelKey: "dish.dessert.label",
    hintKey: "dish.dessert.hint",
    reaction: { emoji: "🍰", textKey: "dish.dessert.reaction", tone: "coral" },
  },
  {
    value: "cooked",
    emoji: "🥗",
    labelKey: "dish.cooked.label",
    hintKey: "dish.cooked.hint",
    reaction: { emoji: "🥗", textKey: "dish.cooked.reaction", tone: "olive" },
  },
  {
    value: "bought",
    emoji: "🛍️",
    labelKey: "dish.bought.label",
    hintKey: "dish.bought.hint",
    reaction: { emoji: "🛍️", textKey: "dish.bought.reaction", tone: "teal" },
  },
];

export type DietTag = "casher" | "vegetarien" | "sans-gluten" | "sans-lactose";

export const DIET_TAGS: { value: DietTag; emoji: string; labelKey: string }[] = [
  { value: "casher", emoji: "🕎", labelKey: "diet.casher.label" },
  { value: "vegetarien", emoji: "🥦", labelKey: "diet.vegetarien.label" },
  { value: "sans-gluten", emoji: "🌾", labelKey: "diet.sans-gluten.label" },
  { value: "sans-lactose", emoji: "🥛", labelKey: "diet.sans-lactose.label" },
];

export type SynagogueHabit = "always" | "sometimes" | "rarely" | "never";

export const SYNAGOGUE_HABITS: Option<SynagogueHabit>[] = [
  {
    value: "always",
    emoji: "🕍",
    labelKey: "synagogue.always.label",
    reaction: { emoji: "🕍", textKey: "synagogue.always.reaction", tone: "gold" },
  },
  {
    value: "sometimes",
    emoji: "🕍",
    labelKey: "synagogue.sometimes.label",
    reaction: { emoji: "🕍", textKey: "synagogue.sometimes.reaction", tone: "gold" },
  },
  {
    value: "rarely",
    emoji: "☕",
    labelKey: "synagogue.rarely.label",
    reaction: { emoji: "☕", textKey: "synagogue.rarely.reaction", tone: "teal" },
  },
  {
    value: "never",
    emoji: "🛌",
    labelKey: "synagogue.never.label",
    reaction: { emoji: "🛌", textKey: "synagogue.never.reaction", tone: "teal" },
  },
];

export type ContentPref = "recipes" | "places" | "both";

export const CONTENT_PREFS: Option<ContentPref>[] = [
  {
    value: "recipes",
    emoji: "📖",
    labelKey: "contentPref.recipes.label",
    reaction: { emoji: "📖", textKey: "contentPref.recipes.reaction", tone: "olive" },
  },
  {
    value: "places",
    emoji: "📍",
    labelKey: "contentPref.places.label",
    reaction: { emoji: "📍", textKey: "contentPref.places.reaction", tone: "olive" },
  },
  {
    value: "both",
    emoji: "✨",
    labelKey: "contentPref.both.label",
    reaction: { emoji: "✨", textKey: "contentPref.both.reaction", tone: "olive" },
  },
];
