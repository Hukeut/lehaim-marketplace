import { notFound } from "next/navigation";
import { getMyTraiteur, getOrderThread, ORDER_STATUS_LABEL } from "@/lib/marketplace";
import { OrderThread } from "@/components/marketplace/OrderThread";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";
import { Card, StatusPill } from "@/components/ui";

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function formatDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Espace fournisseur · Détail d'une commande + discussion avec le client. */
export default async function TraiteurCommandeDetail({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const traiteur = await getMyTraiteur();
  if (!traiteur) notFound();

  const thread = await getOrderThread(orderId);
  if (!thread || thread.order.traiteurId !== traiteur.id) notFound();
  const { order, messages } = thread;
  const code = order.pickupCode ?? `#${order.id.slice(0, 4).toUpperCase()}`;

  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-teal-wash sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-3 flex items-center gap-2.5">
          <BackButton fallback="/devenir-traiteur/commandes" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[18px] font-semibold">Commande {code}</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <Card className="mb-3 p-4 text-left">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-extrabold tracking-[0.04em] text-ink/45 uppercase">
              {order.fulfillment === "livraison" ? "Livraison" : "Retrait"}
            </span>
            <StatusPill tone={order.status === "annulee" ? "urgent" : "info"}>
              {ORDER_STATUS_LABEL[order.status]}
            </StatusPill>
          </div>
          <div className="mb-3 text-[13px] font-bold">
            {formatDate(order.pickupDate)} {order.pickupSlot ? `· ${order.pickupSlot}` : ""}
          </div>
          <ul className="mb-3 flex flex-col gap-1.5 border-t border-line-soft pt-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-[12px]">
                <span className="text-ink/70">
                  {item.quantity} × {item.title}
                </span>
                <span className="font-bold">{(item.price * item.quantity).toFixed(0)}₪</span>
              </li>
            ))}
          </ul>
          {order.notes && (
            <p className="mb-2 rounded-field bg-line-soft px-3 py-2 text-[11.5px] italic text-ink/60">
              « {order.notes} »
            </p>
          )}
          <div className="flex justify-between border-t border-line-soft pt-2.5">
            <span className="text-[12px] font-extrabold">Total</span>
            <span className="text-[12px] font-extrabold text-coral-deep">
              {order.totalAmount.toFixed(0)}₪
            </span>
          </div>
        </Card>

        <OrderThread orderId={order.id} messages={messages} />
      </div>
    </main>
  );
}
