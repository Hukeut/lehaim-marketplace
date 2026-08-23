import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * En-têtes de sécurité, appliqués à toutes les réponses.
 *
 * Le plus important ici est `Referrer-Policy`. Les jetons de partage et de
 * co-organisation vivent dans le chemin de l'URL (`/s/[token]`, `/co/[token]`)
 * et ces pages portent des liens sortants — WhatsApp, Waze, Google Maps. Sans
 * cet en-tête, le navigateur envoie l'URL complète, jeton compris, au domaine
 * de destination. `strict-origin-when-cross-origin` ne laisse partir que
 * l'origine dès qu'on quitte le site.
 *
 * Pas de Content-Security-Policy complète pour l'instant : Next injecte ses
 * propres scripts en ligne, une CSP écrite à l'aveugle casserait l'app. Seule
 * `frame-ancestors` est posée, elle ne concerne pas les scripts.
 */
const securityHeaders = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Sans `preload` : l'inscription sur la liste des navigateurs est
  // difficilement réversible, et ce n'est pas une décision de P0.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // L'app ne se sert d'aucune de ces API. Le presse-papiers, lui, est utilisé
  // par les boutons de copie de lien : il n'est pas restreint.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
