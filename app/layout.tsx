import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  // Nécessaire pour que les images de partage soient servies en URL absolue.
  metadataBase: new URL("https://lehaim.vercel.app"),
  title: "lehaim",
  description: "Organisez votre Shabbat, ensemble.",
  applicationName: "lehaim",
  appleWebApp: { capable: true, title: "lehaim", statusBarStyle: "default" },
  // Le produit vit dans WhatsApp : c'est cette carte que verront les invités.
  openGraph: {
    type: "website",
    siteName: "lehaim",
    locale: "fr_FR",
    title: "lehaim",
    description: "Le Chabbat entre amis, sans le stress.",
    images: [
      {
        url: "/illustrations/famille-table-shabbat.jpg",
        alt: "Une famille attablée pour Chabbat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "lehaim",
    description: "Le Chabbat entre amis, sans le stress.",
    images: ["/illustrations/famille-table-shabbat.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#F4F0E6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="bg-sand">
        {/* Colonne mobile : plein écran sur téléphone, maquette centrée au-delà.
            Une page qui se déclare `data-fullwidth` (le back-office traiteur,
            /admin et /partenaire) la relâche : c'est une interface d'ordinateur
            et de tablette, pas un écran d'app mobile. */}
        <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-cream has-[[data-fullwidth]]:max-w-none sm:my-6 sm:min-h-[calc(100dvh-3rem)] sm:rounded-[36px] sm:shadow-[0_30px_70px_rgba(13,43,62,0.16)] sm:has-[[data-fullwidth]]:my-0 sm:has-[[data-fullwidth]]:min-h-dvh sm:has-[[data-fullwidth]]:rounded-none sm:has-[[data-fullwidth]]:shadow-none">
          {children}
        </div>
      </body>
    </html>
  );
}
