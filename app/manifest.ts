import type { MetadataRoute } from "next";

/**
 * Manifeste PWA : c'est lui qui donne son nom et son icône à l'app quand
 * quelqu'un l'ajoute à son écran d'accueil depuis Android ou Chrome.
 * `display: standalone` retire la barre d'URL, ce qui compte pour une app
 * dessinée en colonne mobile.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "lehaim",
    short_name: "lehaim",
    description: "Organisez votre Shabbat, ensemble.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F0E6",
    theme_color: "#F4F0E6",
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
