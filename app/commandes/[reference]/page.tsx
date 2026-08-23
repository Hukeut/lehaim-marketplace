import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { Card } from "@/components/ui";
import { ReviewForm } from "@/components/marketplace/ReviewForm";
import { money } from "@/lib/money";
import { HAPPY_PATH, myReviewForOrder, orderByReference, type OrderStatus } from "@/lib/orders";
import { cancelOrder } from "@/app/marketplace/actions";
import { ClearCart } from "./ClearCart";

const STEP_LABEL: Record<OrderStatus, string> = {
  nouvelle: "Commande envoyée",
  acceptee: "Acceptée",
  en_preparation: "En préparation",
  prete: "Prête",
  recuperee: "Récupérée",
  annulee: "Annulée",
};

const HEADLINE: Record<OrderStatus, string> = {
  nouvelle: "En attente de réponse du traiteur",
  acceptee: "Votre commande est acceptée",
  en_preparation: "En préparation",
  prete: "Prête à récupérer",
  recuperee: "Commande récupérée",
  annulee: "Commande annulée",
};

/**
 * Le suivi d'une commande.
 *
 * La frise porte désormais une heure par étape franchie (voir
 * marketplace_order_events, journalisé par trigger à chaque changement de
 * statut) — plus seulement où en est la commande, mais depuis quand.
 */
export default async function Commande({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ cleared?: string }>;
}) {
  const [{ reference }, { cleared }] = await Promise.all([params, searchParams]);
  const order = await orderByReference(decodeURIComponent(reference));
  if (!order) notFound();

  const myReview = order.status === "recuperee" ? await myReviewForOrder(order.id) : null;

  const long = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const failed = order.status === "annulee";
  const currentIndex = HAPPY_PATH.indexOf(order.status);

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <ClearCart shopId={cleared ?? null} />

      <div className="flex items-center gap-2.5 px-[18px] pt-[54px] pb-1.5">
        <BackButton fallback="/commandes" />
        <span className="flex-1 font-display text-[19px] font-semibold">{order.shopName}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-[18px] pb-5">
        <div className="mb-3 flex flex-col gap-2 rounded-card bg-ink p-4 text-white shadow-[var(--shadow-card)]">
          <span className="text-[12.5px] opacity-80">{order.shopName}</span>
          <span className="font-display text-[22px] leading-tight font-semibold">
            {HEADLINE[order.status]}
          </span>
          {order.pickupDate && !failed && (
            <span className="text-[13px] opacity-85">
              {order.mode === "retrait" ? "Retrait" : "Livraison"} le{" "}
              {long.format(new Date(`${order.pickupDate}T12:00:00`))}
              {order.pickupSlot && ` · ${order.pickupSlot}`}
            </span>
          )}
          {order.refusalReason && (
            <p className="mt-1 rounded-card bg-white/10 px-3 py-2 text-[12.5px] leading-relaxed">
              {order.refusalReason}
            </p>
          )}
        </div>

        {!failed && (
          <Card className="mb-3 p-4">
            <ol className="flex flex-col">
              {HAPPY_PATH.map((step, index) => {
                const done = currentIndex >= index;
                const last = index === HAPPY_PATH.length - 1;
                const at = order.stepTimes[step];
                return (
                  <li key={step} className="grid grid-cols-[22px_1fr] gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`size-[18px] shrink-0 rounded-full border-2 ${
                          done ? (last ? "border-olive bg-olive" : "border-teal bg-teal") : "border-line-soft bg-white"
                        }`}
                      />
                      {!last && <span className="w-0.5 flex-1 bg-line-soft" />}
                    </div>
                    <div className="pb-4">
                      <div className={`text-[13px] font-bold ${done ? "" : "text-ink/40"}`}>
                        {STEP_LABEL[step]}
                      </div>
                      {done && at && (
                        <div className="text-[11.5px] text-ink/45">{time.format(new Date(at))}</div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        )}

        <Card className="mb-3 flex flex-col gap-2.5 p-4">
          <span className="font-display text-[15px] font-semibold">Détail</span>
          <ul className="flex flex-col gap-1.5">
            {order.items.map((item, index) => (
              <li key={`${item.name}-${index}`} className="flex items-baseline gap-2 text-[13.5px]">
                <span className="font-bold">{item.quantity}×</span>
                <span className="min-w-0 flex-1">{item.name}</span>
                <span className="font-bold">{money(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-1 flex items-baseline justify-between border-t border-line-soft pt-2.5">
            <span className="font-display text-[15px] font-semibold">Total</span>
            <span className="font-display text-[18px] font-semibold">{money(order.total)}</span>
          </div>
        </Card>

        <Card className="mb-3 flex flex-col gap-1.5 p-4 text-[13px]">
          <span className="font-bold">
            {order.mode === "retrait" ? "À retirer chez" : "Livraison à"}
          </span>
          {order.mode === "retrait"
            ? order.shopAddress && <span className="text-ink/65">{order.shopAddress}</span>
            : order.deliveryAddress && <span className="text-ink/65">{order.deliveryAddress}</span>}
          {order.shopPhone && (
            <a href={`tel:${order.shopPhone}`} className="mt-1 font-bold text-teal">
              {order.shopPhone}
            </a>
          )}
          {order.customerNote && (
            <p className="mt-1 text-[12.5px] text-ink/55">Votre note : {order.customerNote}</p>
          )}
        </Card>

        {order.status === "recuperee" && !myReview && <ReviewForm orderId={order.id} />}
        {order.status === "recuperee" && myReview && (
          <Card className="mb-3 w-full p-4 text-center">
            <p className="text-[12.5px] font-bold text-ink/60">
              Vous avez noté cette commande {myReview.rating}/5 — merci !
            </p>
          </Card>
        )}

        {order.status === "nouvelle" && (
          <form action={cancelOrder}>
            <input type="hidden" name="id" value={order.id} />
            <button
              type="submit"
              className="w-full rounded-full border-2 border-line-soft py-3 text-[13.5px] font-bold text-ink/60"
            >
              Annuler la commande
            </button>
          </form>
        )}

        {failed && (
          <Link
            href={`/marketplace/${order.shopId}`}
            className="mt-2 block w-full rounded-full bg-coral-deep py-3.5 text-center font-display text-[14.5px] font-semibold text-white"
          >
            Recommander
          </Link>
        )}
      </div>
    </main>
  );
}
