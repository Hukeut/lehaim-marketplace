import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  localeFromAcceptLanguage,
} from "@/lib/i18n/locale";

/**
 * Le middleware a normalement déjà posé le cookie. On refait quand même le
 * repli sur l'en-tête pour les requêtes qu'il ne couvre pas (fichiers
 * statiques exclus du matcher, premier passage).
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;

  let locale = isLocale(fromCookie) ? fromCookie : null;

  if (!locale) {
    const headerStore = await headers();
    locale = localeFromAcceptLanguage(headerStore.get("accept-language"));
  }

  locale ??= DEFAULT_LOCALE;

  const fr = (await import(`../messages/fr.json`)).default;
  const messages =
    locale === DEFAULT_LOCALE
      ? fr
      : deepMerge(fr, (await import(`../messages/${locale}.json`)).default);

  return { locale, messages };
});

/**
 * Le français sert de socle : une clé absente d'une autre langue retombe sur
 * sa version française plutôt que d'afficher la clé brute à l'écran.
 */
function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    // Un tableau doit remplacer celui du français, pas se fondre avec lui
    // index par index (typeof [] === "object" le ferait sinon entrer dans
    // la fusion récursive et mélanger deux langues dans un seul tableau).
    result[key] =
      current &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
        ? deepMerge(current as Record<string, unknown>, value as Record<string, unknown>)
        : value;
  }
  return result;
}
