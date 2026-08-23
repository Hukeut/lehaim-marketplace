import type { Option } from "@/lib/onboarding";
import type { Locale } from "@/lib/i18n/locale";

/**
 * O01b · Choix de la langue.
 *
 * Les libellés sont des endonymes — « Français », « עברית » — et ne se
 * traduisent donc pas d'une langue à l'autre : on lit toujours le nom d'une
 * langue dans cette langue. Idem pour la petite phrase de confirmation, qui
 * s'affiche dans la langue qu'on vient de choisir plutôt que dans celle
 * encore active.
 */
export const LANGUAGE_OPTIONS: Option<Locale>[] = [
  {
    value: "fr",
    emoji: "🇫🇷",
    labelKey: "language.fr.label",
    reaction: { emoji: "🇫🇷", textKey: "language.fr.reaction", tone: "teal" },
  },
  {
    value: "en",
    emoji: "🇬🇧",
    labelKey: "language.en.label",
    reaction: { emoji: "🇬🇧", textKey: "language.en.reaction", tone: "teal" },
  },
  {
    value: "he",
    emoji: "🇮🇱",
    labelKey: "language.he.label",
    reaction: { emoji: "🇮🇱", textKey: "language.he.reaction", tone: "teal" },
  },
  {
    value: "es",
    emoji: "🇪🇸",
    labelKey: "language.es.label",
    reaction: { emoji: "🇪🇸", textKey: "language.es.reaction", tone: "teal" },
  },
  {
    value: "ru",
    emoji: "🇷🇺",
    labelKey: "language.ru.label",
    reaction: { emoji: "🇷🇺", textKey: "language.ru.reaction", tone: "teal" },
  },
];
