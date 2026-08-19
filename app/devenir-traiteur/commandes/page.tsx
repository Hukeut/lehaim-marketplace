import { redirect } from "next/navigation";
import { getMyTraiteur, getTraiteurOrders } from "@/lib/marketplace";
import { OrdersKanban } from "@/components/marketplace/OrdersKanban";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";

/** Kanban de suivi des commandes, côté traiteur — pensé "office first". */
export default async function TraiteurCommandes() {
  const traiteur = await getMyTraiteur();
  if (!traiteur) redirect("/devenir-traiteur");

  const orders = await getTraiteurOrders(traiteur.id);

  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-teal-wash sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-3 flex items-center gap-2.5">
          <BackButton fallback="/devenir-traiteur" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[18px] font-semibold">Commandes</h1>
            <p className="truncate text-[11px] text-ink/50">{traiteur.name}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {orders.length ? (
          <OrdersKanban orders={orders} />
        ) : (
          <p className="rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-8 text-center text-[12.5px] text-ink/45">
            Aucune commande pour l&apos;instant.
          </p>
        )}
      </div>
    </main>
  );
}
