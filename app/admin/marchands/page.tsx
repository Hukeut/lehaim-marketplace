import { redirect } from "next/navigation";

/**
 * Cet annuaire créait des boutiques à la main (table `shops`) — un geste que
 * le modèle traiteur ne connaît pas : un traiteur candidate lui-même via
 * /partenaire/candidature, et /admin/validation gère la suite (approbation,
 * refus, fiche complète). Redirection plutôt que double annuaire.
 */
export default function AdminMarchands() {
  redirect("/admin/validation");
}
