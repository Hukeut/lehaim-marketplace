"use client";

import { useState, useTransition } from "react";
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

  function cancel(orderId: string, title: string) {
    if (!confirm(`Annuler la commande de ${title} ?`)) return;
    changeStatus(orderId, "annulee");
  }

  return (
    <div dir="rtl" className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {ORDER_STATUS_FLOW.map((status, index) => {
        const columnOrders = orders.filter((o) => o.status === status);
        const nextStatus = ORDER_STATUS_FLOW[index + 1] ?? null;
        const prevStatus = index > 0 ? ORDER_STATUS_FLOW[index - 1] : null;
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
                return (
                  <Card key={order.id} className="rounded-field p-3">
                    <div className="mb-1 text-[12.5px] font-bold">{order.clientName}</div>
                    <ul className="mb-2 text-[11px] leading-snug text-ink/55">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.quantity}× {item.title}
                        </li>
                      ))}
                    </ul>
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
                      onClick={() => cancel(order.id, order.clientName)}
                      className="mt-1.5 w-full rounded-full px-3 py-1.5 text-[10.5px] font-bold text-coral-deep/70 disabled:opacity-50"
                    >
                      Annuler la commande
                    </button>
                  </Card>
                );
              })}

              {!columnOrders.length && (
                <div className="rounded-field border-[1.5px] border-dashed border-line px-3 py-5 text-center text-[10.5px] text-ink/35">
                  Rien ici
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
