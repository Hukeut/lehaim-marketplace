import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyOrders } from "@/lib/marketplace";
import { OrderProgress } from "@/components/marketplace/OrderProgress";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";
import { Card, Overline } from "@/components/ui";
import type { Order } from "@/lib/marketplace-types";

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function formatDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function OrderCard({ order }: { order: Order }) {
  return (
    <Card className="p-3.5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[13px] font-bold">{order.traiteurName}</span>
        <span className="text-[11px] font-extrabold text-coral-deep">
          {order.totalAmount.toFixed(0)}₪
        </span>
      </div>
      <div className="mb-2 text-[11px] text-ink/50">
        {order.fulfillment === "livraison" ? "Livraison" : "Retrait"}
        {order.pickupDate ? ` · ${formatDate(order.pickupDate)}` : ""}
        {order.pickupSlot ? ` · ${order.pickupSlot}` : ""}
      </div>
      {order.pickupCode && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-teal-wash px-2.5 py-1 text-[10.5px] font-extrabold text-teal-deep">
          Code · {order.pickupCode}
        </div>
      )}

      <ul className="mb-3 flex flex-col gap-1">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between text-[11.5px]">
            <span className="text-ink/70">
              {item.quantity} × {item.title}
            </span>
          </li>
        ))}
      </ul>

      {order.status === "annulee" ? (
        <p className="text-[11px] font-bold text-coral-deep">
          {order.cancelledBy === "client"
            ? "Annulée par vous"
            : order.cancelledBy === "traiteur"
              ? "Annulée par le traiteur"
              : "Annulée"}
        </p>
      ) : (
        <OrderProgress status={order.status} />
      )}

      <Link
        href={`/marketplace/commande/${order.id}`}
        className="mt-3 block rounded-full bg-line-soft px-3 py-2 text-center text-[11px] font-bold text-ink"
      >
        Voir le détail et discuter
      </Link>
    </Card>
  );
}

/** Les commandes marketplace passées pour ce Shabbat précis (retraits chez un traiteur). */
export default async function ShabbatCommandes({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?suite=/shabbat/${id}/commandes`);

  const orders = await getMyOrders(id);
  const ongoing = orders.filter((o) => o.status !== "annulee");
  const cancelled = orders.filter((o) => o.status === "annulee");

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-3 flex items-center gap-2.5">
          <BackButton fallback={`/shabbat/${id}`} />
          <h1 className="flex-1 font-display text-[18px] font-semibold">Commandes</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {!orders.length && (
          <>
            <p className="mb-4 rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-8 text-center text-[12.5px] text-ink/45">
              Aucune commande passée pour ce Shabbat pour l&apos;instant.
            </p>
            <Link
              href="/marketplace"
              className="block rounded-full bg-ink px-4 py-3 text-center text-[12.5px] font-bold text-white"
            >
              Commander chez un traiteur
            </Link>
          </>
        )}

        {ongoing.length > 0 && (
          <section className="mb-4">
            <Overline>En cours</Overline>
            <div className="flex flex-col gap-3">
              {ongoing.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}

        {cancelled.length > 0 && (
          <section>
            <Overline>Annulées</Overline>
            <div className="flex flex-col gap-3">
              {cancelled.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
