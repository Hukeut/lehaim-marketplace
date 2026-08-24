import { redirect } from "next/navigation";

/** Pas de tableau de bord dédié : le service du jour est l'écran d'accueil naturel du commerçant. */
export default function TraiteurIndex() {
  redirect("/traiteur/service");
}
