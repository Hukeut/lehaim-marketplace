"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setOrderStatus } from "@/app/marketplace/actions";
import { Card } from "@/components/ui";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL, type OrderStatus, type OrderWithClient } from "@/lib/marketplace-types";

const COLUMN_DOT: Record<OrderStatus, string> = {
  nouvelle: "bg-coral-deep",
  acceptee: "bg-gold-deep",
  en_preparation: "bg-teal-deep",
  prete: "bg-olive-deep",
  recuperee: "bg-ink/30",
  annulee: "bg-ink/20",
};

// Kanban en RTL (droite → gauche) : l'étape suivante avance donc vers la gauche.
// "Accepter" saute directement à "En préparation" : pour un petit traiteur,
// accepter et commencer à préparer, c'est le même geste.
const NEXT_ACTION_LABEL: Record<OrderStatus, string | null> = {
  nouvelle: "← Accepter",
  acceptee: "← Démarrer la préparation",
  en_preparation: "← Marquer prête",
  prete: "← Marquer récupérée",
  recuperee: null,
  annulee: null,
};

function formatSlot(order: OrderWithClient) {
  if (!order.pickupDate) return order.pickupSlot ?? "—";
  const d = new Date(order.pickupDate);
  const day = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return order.pickupSlot ? `${day} · ${order.pickupSlot}` : day;
}

export function OrdersKanban({ orders }: { orders: OrderWithClient[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function changeStatus(orderId: string, next: OrderStatus) {
    setPendingId(orderId);
    startTransition(async () => {
      await setOrderStatus(orderId, next);
      setPendingId(null);
    });
  }

  function cancel(orderId: string, code: string) {
    if (!confirm(`Annuler la commande ${code} ?`)) return;
    changeStatus(orderId, "annulee");
  }

  // On n'affiche que les colonnes qui contiennent au moins une commande.
  const activeStatuses = ORDER_STATUS_FLOW.filter((status) =>
    orders.some((o) => o.status === status),
  );

  return (
    <div
      dir="rtl"
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${Math.max(activeStatuses.length, 1)}, minmax(0, 1fr))` }}
    >
      {activeStatuses.map((status) => {
        const index = ORDER_STATUS_FLOW.indexOf(status);
        const columnOrders = orders.filter((o) => o.status === status);
        // "nouvelle" ⇄ "en_preparation" sont directement reliées : on saute
        // "acceptee" dans les deux sens (elle reste dans le flux pour les
        // rares commandes qui y seraient déjà, mais on n'y renvoie plus personne).
        const nextStatus: OrderStatus | null =
          status === "nouvelle" ? "en_preparation" : (ORDER_STATUS_FLOW[index + 1] ?? null);
        const prevStatus: OrderStatus | null =
          status === "en_preparation" ? "nouvelle" : index > 0 ? ORDER_STATUS_FLOW[index - 1] : null;
        return (
          <div key={status}>
            <div className="mb-2 flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${COLUMN_DOT[status]}`} />
              <span className="text-[10.5px] font-extrabold tracking-[0.03em] text-ink/55 uppercase">
                {ORDER_STATUS_LABEL[status]} · {columnOrders.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {columnOrders.map((order) => {
                const busy = isPending && pendingId === order.id;
                const code = order.pickupCode ?? `#${order.id.slice(0, 4).toUpperCase()}`;
                return (
                  <Card key={order.id} className="rounded-field p-3">
                    <div className="mb-2 flex items-center gap-1.5">
                      <span className="rounded-full bg-ink px-2.5 py-1 text-[12px] font-extrabold tracking-[0.04em] text-white">
                        {code}
                      </span>
                    </div>

                    <details className="group mb-2">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-full bg-line-soft px-3 py-1.5 text-[10.5px] font-bold text-ink [&::-webkit-details-marker]:hidden">
                        <span>
                          Voir la commande ({order.items.length}{" "}
                          {order.items.length > 1 ? "plats" : "plat"})
                        </span>
                        <span className="text-ink/40 transition-transform group-open:rotate-180">
                          ⌄
                        </span>
                      </summary>
                      <ul className="mt-2 flex flex-col gap-1 px-1 text-[11px] leading-snug text-ink/60">
                        {order.items.map((item) => (
                          <li key={item.id}>
                            {item.quantity}× {item.title}
                          </li>
                        ))}
                        {order.notes && (
                          <li className="mt-1 italic text-ink/45">« {order.notes} »</li>
                        )}
                      </ul>
                    </details>

                    <Link
                      href={`/devenir-traiteur/commandes/${order.id}`}
                      className="mb-2 block rounded-full bg-line-soft px-3 py-1.5 text-center text-[10.5px] font-bold text-ink"
                    >
                      Détail & discuter
                    </Link>

                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10.5px] text-ink/45">
                        {order.fulfillment === "livraison" ? "Livraison" : "Retrait"} ·{" "}
                        {formatSlot(order)}
                      </span>
                      <span className="text-[11px] font-extrabold text-coral-deep">
                        {order.totalAmount.toFixed(0)}₪
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      {prevStatus && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => changeStatus(order.id, prevStatus)}
                          aria-label="Revenir à l'étape précédente"
                          className="rounded-full bg-line-soft px-2.5 py-2 text-[11px] font-bold text-ink disabled:opacity-50"
                        >
                          →
                        </button>
                      )}
                      {nextStatus && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => changeStatus(order.id, nextStatus)}
                          className="flex-1 rounded-full bg-ink px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"
                        >
                          {busy ? "…" : NEXT_ACTION_LABEL[status]}
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => cancel(order.id, code)}
                      className="mt-1.5 w-full rounded-full px-3 py-1.5 text-[10.5px] font-bold text-coral-deep/70 disabled:opacity-50"
                    >
                      Annuler la commande
                    </button>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
