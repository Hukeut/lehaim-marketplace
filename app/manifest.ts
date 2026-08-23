import type { MetadataRoute } from "next";

/**
 * Manifeste PWA : c'est lui qui donne son nom et son icône à l'app quand
 * quelqu'un l'ajoute à son écran d'accueil depuis Android ou Chrome.
 * `display: standalone` retire la barre d'URL, ce qui compte pour une app
 * dessinée en colonne mobile.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    // C'est ce nom qui s'inscrit sous l'icône, sur l'écran d'accueil du
    // téléphone. Il portait la marque en minuscules — invisible jusqu'ici,
    // puisque le manifeste lui-même était injoignable (cf. `PUBLIC_PATHS`).
    name: "Lehaim",
    short_name: "Lehaim",
    description: "Organisez votre Shabbat, ensemble.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF9F0",
    theme_color: "#FFF9F0",
    // Chrome n'installe une app que sur du PNG : le SVG seul ne suffit pas,
    // et « maskable » évite qu'Android recadre l'icône dans une pastille grise.
    icons: [
      { src: "/logo-192.png", sizes: "192x192", type: "image/png" },
      { src: "/logo-512.png", sizes: "512x512", type: "image/png" },
      { src: "/logo-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/logo-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
