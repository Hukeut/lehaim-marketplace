import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { ButtonLink, Card, StatusPill, type PillTone } from "@/components/ui";
import { money } from "@/lib/money";
import { myOrders, type OrderStatus } from "@/lib/orders";

const TONE: Record<OrderStatus, PillTone> = {
  nouvelle: "warning",
  acceptee: "warning",
  en_preparation: "warning",
  prete: "success",
  recuperee: "success",
  annulee: "neutral",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  nouvelle: "En attente",
  acceptee: "Acceptée",
  en_preparation: "En préparation",
  prete: "Prête",
  recuperee: "Récupérée",
  annulee: "Annulée",
};

const LIVE: OrderStatus[] = ["nouvelle", "acceptee", "en_preparation", "prete"];

/** Mes commandes — celles en cours d'abord, puis l'historique. */
export default async function Commandes() {
  const orders = await myOrders();

  const live = orders.filter((o) => LIVE.includes(o.status));
  const past = orders.filter((o) => !LIVE.includes(o.status));

  const dateFormat = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="flex items-center gap-2.5 px-[18px] pt-[54px] pb-1.5">
        <BackButton fallback="/marketplace" />
        <span className="flex-1 font-display text-[19px] font-semibold">Mes commandes</span>
      </div>

      <div className="flex-1 overflow-y-auto px-[18px] pb-5">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 pt-16 text-center">
            <span className="text-4xl">🧾</span>
            <span className="font-display text-[17px] font-semibold">Aucune commande pour l&apos;instant</span>
            <p className="text-[13.5px] leading-relaxed text-ink/60">
              Vos commandes chez les traiteurs de la marketplace apparaîtront ici.
            </p>
            <ButtonLink href="/marketplace" full={false} className="mt-2">
              Voir la marketplace
            </ButtonLink>
          </div>
        ) : (
          <>
            {live.length > 0 && (
              <section className="mb-5">
                <h2 className="mb-2 text-[12px] font-bold text-ink/55">En cours</h2>
                <ul className="flex flex-col gap-2.5">
                  {live.map((order) => (
                    <Card as="li" key={order.id}>
                      <Link href={`/commandes/${order.id}`} className="flex flex-col gap-1.5 p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-[15px] font-semibold">{order.shopName}</span>
                          <StatusPill tone={TONE[order.status]}>{STATUS_LABEL[order.status]}</StatusPill>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-[12.5px] text-ink/55">
                            {order.mode === "retrait" ? "Retrait" : "Livraison"}
                            {order.pickupDate &&
                              ` · ${new Date(`${order.pickupDate}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
                            {order.pickupSlot && ` · ${order.pickupSlot}`}
                          </span>
                          <span className="font-display text-[15px] font-semibold">{money(order.total)}</span>
                        </div>
                      </Link>
                    </Card>
                  ))}
                </ul>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="mb-2 text-[12px] font-bold text-ink/55">Historique</h2>
                <ul className="flex flex-col gap-2.5">
                  {past.map((order) => (
                    <Card as="li" key={order.id}>
                      <Link href={`/commandes/${order.id}`} className="flex items-center gap-3 p-3.5">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-display text-[14.5px] font-semibold">
                            {order.shopName}
                          </div>
                          <div className="text-[12px] text-ink/55">
                            {dateFormat.format(new Date(order.placedAt))} · {STATUS_LABEL[order.status]}
                          </div>
                        </div>
                        <span className="text-[14px] font-bold">{money(order.total)}</span>
                      </Link>
                    </Card>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
