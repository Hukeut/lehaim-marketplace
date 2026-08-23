import { redirect } from "next/navigation";

/**
 * Le panier n'a plus d'écran à part : il vit sur la carte de chaque traiteur
 * (voir components/marketplace/Catalogue.tsx) et se valide directement sur
 * /marketplace/[slug]/reserver. Cette route reste en redirection pour ne pas
 * casser un lien déjà partagé.
 */
export default function Panier() {
  redirect("/marketplace");
}
