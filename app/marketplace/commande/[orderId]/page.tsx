import { notFound } from "next/navigation";
import { getOrderThread, ORDER_STATUS_LABEL } from "@/lib/marketplace";
import { ClearCart } from "@/components/marketplace/ClearCart";
import { OrderThread } from "@/components/marketplace/OrderThread";
import { CancelOrderButton } from "@/components/marketplace/CancelOrderButton";
import { BrandMark } from "@/components/BrandMark";
import { Clock, XCircle } from "@/components/icons";
import { ButtonLink, Card, StatusPill } from "@/components/ui";

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function formatDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export default async function CommandeConfirmee({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const thread = await getOrderThread(orderId);
  if (!thread) notFound();
  const { order, messages } = thread;

  const isWaiting = order.status === "nouvelle";
  const isCancelled = order.status === "annulee";

  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center px-7 pt-[64px] text-center sm:min-h-0">
      <ClearCart traiteurId={order.traiteurId} />
      <BrandMark className="mb-6" />

      {isCancelled ? (
        <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-coral/16 text-coral-deep">
          <XCircle size={26} />
        </span>
      ) : isWaiting ? (
        <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-gold/22 text-gold-ink">
          <Clock size={26} />
        </span>
      ) : (
        <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-olive/16 text-2xl text-olive-deep">
          ✓
        </span>
      )}

      <h1 className="mb-1.5 font-display text-[18px] font-semibold">
        {isCancelled ? "Commande annulée" : isWaiting ? "En attente de confirmation" : "Réservation confirmée"}
      </h1>
      <p className="mb-5 text-[12.5px] text-ink/55">
        {isWaiting
          ? `${order.traiteurName} doit encore confirmer votre commande.`
          : `Commande chez ${order.traiteurName}`}
      </p>

      <Card className="mb-3 w-full p-4 text-left">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-extrabold tracking-[0.04em] text-ink/45 uppercase">
            {order.fulfillment === "livraison" ? "Livraison" : "Retrait"}
          </span>
          <StatusPill tone={isCancelled ? "urgent" : isWaiting ? "warning" : "info"}>
            {ORDER_STATUS_LABEL[order.status]}
          </StatusPill>
        </div>
        <div className="mb-3 text-[13px] font-bold">
          {formatDate(order.pickupDate)} {order.pickupSlot ? `· ${order.pickupSlot}` : ""}
        </div>
        <ul className="flex flex-col gap-1.5 border-t border-line-soft pt-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-[12px]">
              <span className="text-ink/70">
                {item.quantity} × {item.title}
              </span>
              <span className="font-bold">{(item.price * item.quantity).toFixed(0)}₪</span>
            </li>
          ))}
        </ul>
      </Card>

      {isWaiting && (
        <div className="mb-3 w-full rounded-card bg-gold/22 p-3.5">
          <p className="text-[11.5px] font-bold leading-relaxed text-gold-ink">
            ⏳ Vous pouvez déjà échanger avec le traiteur ci-dessous pendant qu&apos;il traite
            votre commande.
          </p>
        </div>
      )}

      {!isCancelled && (
        <div className="mb-3 w-full rounded-card bg-gold/22 p-3.5">
          <p className="text-[11.5px] font-bold leading-relaxed text-gold-ink">
            💵 {order.totalAmount.toFixed(0)}₪ à régler sur place, directement auprès du traiteur.
          </p>
        </div>
      )}

      <div className="mb-3 w-full">
        <OrderThread orderId={order.id} messages={messages} />
      </div>

      {["nouvelle", "acceptee", "en_preparation"].includes(order.status) && (
        <div className="mb-3 w-full">
          <CancelOrderButton orderId={order.id} />
        </div>
      )}

      <div className="flex w-full flex-col gap-2">
        <ButtonLink href="/marketplace/mes-commandes" size="sm">
          Suivre mes commandes
        </ButtonLink>
        <ButtonLink href="/marketplace" variant="secondary" size="sm">
          Retour à la marketplace
        </ButtonLink>
        <ButtonLink href="/accueil" variant="secondary" size="sm">
          Retour à l&apos;accueil
        </ButtonLink>
      </div>
    </main>
  );
}
