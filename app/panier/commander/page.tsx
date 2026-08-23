import { redirect } from "next/navigation";

/**
 * Remplacé par /marketplace/[slug]/reserver — le tunnel de commande
 * appartient désormais à la fiche du traiteur, plutôt qu'à un panier
 * multi-commerces que ce backend ne porte pas.
 */
export default function Commander() {
  redirect("/marketplace");
}
