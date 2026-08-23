import { getTranslations } from "next-intl/server";
import { asMessageKey } from "@/lib/db";
import { Banner } from "./States";

/**
 * Le mot qu'on doit à quelqu'un dont l'action vient d'être refusée par la base.
 *
 * Les actions concernées redirigent avec `?refus=<clé>` plutôt que de retourner
 * un état : elles n'ont pas de formulaire pour le porter, et elles changent de
 * page de toute façon. La clé est validée avant traduction — un paramètre
 * d'adresse se bricole à la main.
 *
 * Ne rend rien quand il n'y a rien à dire, pour pouvoir être posé sans
 * condition dans les pages.
 */
export async function RefusBanner({ refus }: { refus?: string | string[] }) {
  const key = asMessageKey(Array.isArray(refus) ? refus[0] : refus);
  if (!key) return null;

  const t = await getTranslations("errors.db");

  return (
    <div className="mb-3.5">
      <Banner tone="warning">{t(key)}</Banner>
    </div>
  );
}
