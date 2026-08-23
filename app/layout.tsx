import type { Metadata, Viewport } from "next";
import { Assistant, Fredoka, Nunito, Rubik } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { ServiceWorker } from "@/components/ServiceWorker";
import { dirFor, type Locale } from "@/lib/i18n/locale";
import "./globals.css";

/**
 * Polices, déclarées par jeu de glyphes plutôt qu'en un seul bloc.
 *
 * Les quatre familles étaient chargées pour tout le monde, avec leurs sous-
 * ensembles hébreu et cyrillique : un lecteur francophone téléchargeait donc
 * les glyphes hébreux de Fredoka, les cyrilliques de Nunito, plus Assistant et
 * Rubik en entier — soit la moitié du poids typographique pour rien.
 *
 * Le tri se faisait par la classe posée sur `<html>`, et ne marchait pas :
 * `next/font` PRÉCHARGE toute police déclarée, que sa classe soit appliquée
 * ou non. Une page française émettait huit `<link rel=preload as=font>` et
 * téléchargeait 174 Ko — dont Assistant et Rubik en entier, réservées à
 * l'hébreu et au russe, plus les sous-ensembles hébreu et cyrillique des deux
 * autres. Cent sept kilo-octets sur cent soixante-quatorze ne servaient à
 * personne, et arrivaient en tête de file.
 *
 * D'où la règle ici : on ne précharge que le latin des deux familles
 * principales. Le reste attend qu'un caractère le réclame — c'est la plage
 * Unicode qui décide, dans le navigateur, où la décision est juste.
 *
 * Aucune graisse n'est déclarée non plus : sans `weight`, `next/font` sert la
 * version variable, un seul fichier pour toutes les graisses au lieu d'un par
 * graisse.
 *
 */
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

/*
 * Les jeux de glyphes des langues minoritaires, déclarés à part et JAMAIS
 * préchargés. Ils portent le même nom de famille que leur version latine :
 * c'est donc la plage Unicode qui les appelle, au moment où un caractère
 * hébreu ou cyrillique se présente, et pas avant.
 */
const fredokaHebrew = Fredoka({
  variable: "--font-fredoka",
  subsets: ["hebrew"],
  display: "swap",
  preload: false,
});

const nunitoCyrillic = Nunito({
  variable: "--font-nunito",
  subsets: ["cyrillic"],
  display: "swap",
  preload: false,
});

// Nunito ne couvre pas l'hébreu : Assistant prend le relais pour le corps.
const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["hebrew", "latin"],
  display: "swap",
  preload: false,
});

// Fredoka ne couvre pas le cyrillique : Rubik prend le relais pour les titres.
const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["cyrillic", "latin"],
  display: "swap",
  preload: false,
});

/** Les familles à poser sur `<html>`, selon la langue rendue. */
function fontsFor(locale: Locale): string {
  // Les variantes hébraïque et cyrillique posent la même variable CSS que leur
  // version latine : les appliquer ensemble ne change rien à la déclaration,
  // mais garantit que leurs règles `@font-face` sont bien émises.
  if (locale === "he") {
    return `${fredoka.variable} ${fredokaHebrew.variable} ${nunito.variable} ${assistant.variable}`;
  }
  if (locale === "ru") {
    return `${fredoka.variable} ${nunito.variable} ${nunitoCyrillic.variable} ${rubik.variable}`;
  }
  return `${fredoka.variable} ${nunito.variable}`;
}

// Codes de région OpenGraph associés à chaque langue de l'app.
const OG_LOCALE: Record<Locale, string> = {
  fr: "fr_FR",
  en: "en_US",
  es: "es_ES",
  he: "he_IL",
  ru: "ru_RU",
};

/**
 * `generateMetadata` plutôt qu'un export statique `metadata` : c'est ce qui
 * permet de lire la langue de la requête (cookie/en-tête, cf. i18n/request.ts)
 * et de servir un titre/description traduits. Ces textes sont ceux que
 * WhatsApp affiche dans la carte de prévisualisation quand un lien est
 * partagé — précisément le public multilingue visé par ce chantier.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("common");

  return {
    // Nécessaire pour que les images de partage soient servies en URL absolue.
    // L'adresse pointait sur `getlehaim.vercel.app`, qui n'a jamais existé :
    // toutes les cartes de partage WhatsApp cherchaient donc leur image sur un
    // domaine mort. `NEXT_PUBLIC_SITE_URL` permet de la changer sans toucher
    // au code, le jour où un vrai nom de domaine sera choisi.
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://lehaim.vercel.app"),
    title: t("appName"),
    description: t("meta.description"),
    applicationName: t("appName"),
    appleWebApp: { capable: true, title: t("appName"), statusBarStyle: "default" },
    // Le produit vit dans WhatsApp : c'est cette carte que verront les invités.
    openGraph: {
      type: "website",
      siteName: t("appName"),
      locale: OG_LOCALE[locale],
      title: t("appName"),
      description: t("meta.ogDescription"),
      images: [
        {
          url: "/illustrations/famille-table-shabbat.jpg",
          // Les dimensions ne sont pas une formalité : sans elles, WhatsApp
          // renonce souvent à la vignette. Cette image est carrée — 560 × 560
          // — ce qui donne de toute façon une petite vignette collée au texte
          // et non une grande carte. Les pages qui comptent vraiment, comme
          // l'invitation partagée, fabriquent la leur en 1200 × 630.
          width: 560,
          height: 560,
          alt: t("meta.ogImageAlt"),
        },
      ],
    },
    twitter: {
      // `summary` et non `summary_large_image` : l'image par défaut est
      // carrée, annoncer une grande carte donnait un cadre à moitié vide.
      card: "summary",
      title: t("appName"),
      description: t("meta.ogDescription"),
      images: ["/illustrations/famille-table-shabbat.jpg"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#FFF9F0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={fontsFor(locale)}
    >
      <body className="bg-sand">
        <ServiceWorker />
        <NextIntlClientProvider messages={messages}>
          {/* Colonne mobile : plein écran sur téléphone, maquette centrée au-delà.
              Une page qui se déclare `data-fullwidth` (le back-office) la
              relâche : c'est une interface de bureau, pas un écran d'app. */}
          <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-cream has-[[data-fullwidth]]:max-w-none sm:my-6 sm:min-h-[calc(100dvh-3rem)] sm:rounded-[36px] sm:shadow-[0_30px_70px_rgba(15,39,77,0.16)] sm:has-[[data-fullwidth]]:my-0 sm:has-[[data-fullwidth]]:min-h-dvh sm:has-[[data-fullwidth]]:rounded-none sm:has-[[data-fullwidth]]:shadow-none">
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
