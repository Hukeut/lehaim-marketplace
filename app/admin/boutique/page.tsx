import Link from "next/link";
import { AdminTitle, StatusTag } from "@/components/admin";
import { requireMyShop } from "@/lib/merchant";
import { Identity, ServiceSettings } from "./Sections";
import { togglePause } from "./actions";

/**
 * Ma boutique — ce que le tunnel d'inscription posait une fois, et qu'il
 * fallait pouvoir changer.
 *
 * La pause est en tête, et c'est délibéré : c'est le geste qu'on cherche un
 * vendredi midi quand la cuisine ne suit plus. Tout le reste peut attendre le
 * lundi.
 *
 * Écran porté depuis Rraven666/lehaim ; les horaires/créneaux générés
 * automatiquement et les reversements réels (paiement en ligne) ne sont pas
 * encore branchés — cette page ne montre que ce que le backend traiteur sait
 * vraiment faire aujourd'hui. Le logo/la couverture, eux, sont un vrai envoi
 * vers le stockage (voir Identity dans Sections.tsx).
 */
export default async function Boutique() {
  const shop = await requireMyShop();

  return (
    <>
      <AdminTitle
        title="Ma boutique"
        action={
          <Link
            href={`/marketplace/${shop.id}`}
            className="rounded-full border-[1.5px] border-line bg-white px-4 py-2 text-[12.5px] font-bold shadow-[var(--shadow-pill)]"
          >
            Voir ma fiche
          </Link>
        }
      />

      <div className="flex flex-col gap-5">
        <section
          className={`flex flex-wrap items-center gap-4 rounded-[18px] p-5 shadow-[var(--shadow-card)] ${
            shop.paused ? "bg-gold-wash" : "bg-white"
          }`}
        >
          <div className="min-w-[24ch] flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-[16px] font-semibold">
                {shop.paused ? "Commandes suspendues" : "Vous acceptez les commandes"}
              </span>
              <StatusTag
                status={shop.paused ? "alert" : "ok"}
                label={shop.paused ? "En pause" : "Ouvert"}
              />
            </div>
            <p className="mt-1 max-w-[62ch] text-[12.5px] leading-relaxed text-ink/60">
              {shop.paused
                ? "Votre fiche reste visible, marquée en pause. Aucune nouvelle commande ne peut être passée — celles déjà acceptées ne bougent pas."
                : "Mettez en pause quand la cuisine ne suit plus : votre fiche reste en ligne, mais personne ne peut commander. C'est réversible d'un clic."}
            </p>
          </div>

          <form action={togglePause}>
            <input type="hidden" name="paused" value={shop.paused ? "0" : "1"} />
            <button
              type="submit"
              className={`rounded-full px-6 py-3 font-display text-[14px] font-semibold ${
                shop.paused ? "bg-olive text-white" : "border-2 border-line text-ink/70"
              }`}
            >
              {shop.paused ? "Reprendre les commandes" : "Mettre en pause"}
            </button>
          </form>
        </section>

        <Identity shop={shop} />
        <ServiceSettings shop={shop} />
      </div>
    </>
  );
}
