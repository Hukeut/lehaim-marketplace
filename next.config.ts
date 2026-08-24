import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * /devenir-traiteur (tunnel marchand) a été supprimé par la fusion avec
   * lehaim : le back-office marchand vit maintenant sous /admin/**, et la
   * candidature sous /partenaire. D'anciens liens ou favoris pointant encore
   * vers /devenir-traiteur tombaient en 404 — on les renvoie vers l'entrée
   * du nouveau tunnel plutôt que de casser le lien.
   */
  async redirects() {
    return [
      {
        source: "/devenir-traiteur",
        destination: "/partenaire",
        permanent: false,
      },
      {
        source: "/devenir-traiteur/:path*",
        destination: "/partenaire",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
