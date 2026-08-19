import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyOrders } from "@/lib/marketplace";
import { OrderProgress } from "@/components/marketplace/OrderProgress";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";
import { Card } from "@/components/ui";

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function formatDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Suivi, côté client, de ses propres commandes marketplace (tous traiteurs confondus). */
export default async function MesCommandes() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion?suite=/marketplace/mes-commandes");

  const orders = await getMyOrders();

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-3 flex items-center gap-2.5">
          <BackButton fallback="/marketplace" />
          <h1 className="flex-1 font-display text-[18px] font-semibold">Mes commandes</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {!orders.length && (
          <p className="rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-8 text-center text-[12.5px] text-ink/45">
            Aucune commande pour l&apos;instant.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Card key={order.id} className="p-3.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[13px] font-bold">{order.traiteurName}</span>
                <span className="text-[11px] font-extrabold text-coral-deep">
                  {order.totalAmount.toFixed(0)}₪
                </span>
              </div>
              <div className="mb-3 text-[11px] text-ink/50">
                {order.fulfillment === "livraison" ? "Livraison" : "Retrait"}
                {order.pickupDate ? ` · ${formatDate(order.pickupDate)}` : ""}
                {order.pickupSlot ? ` · ${order.pickupSlot}` : ""}
              </div>

              <ul className="mb-3 flex flex-col gap-1">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between text-[11.5px]">
                    <span className="text-ink/70">
                      {item.quantity} × {item.title}
                    </span>
                  </li>
                ))}
              </ul>

              <OrderProgress status={order.status} />

              <Link
                href={`/marketplace/commande/${order.id}`}
                className="mt-3 block rounded-full bg-line-soft px-3 py-2 text-center text-[11px] font-bold text-ink"
              >
                Voir le détail et discuter
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
