import { redirect } from "next/navigation";
import { getMyDossier, STEPS } from "@/lib/partner";

/**
 * L'entrée du tunnel ne montre rien : elle ramène là où on s'est arrêté.
 * C'est le comportement qu'on attend d'un dossier qu'on reprend.
 */
export default async function ReprendreDossier() {
  const dossier = await getMyDossier();
  if (!dossier) redirect("/partenaire/dossier/entreprise");

  const slug = STEPS[Math.min(dossier.application.step, 8) - 1].slug;
  redirect(`/partenaire/dossier/${slug === "compte" ? "entreprise" : slug}`);
}
