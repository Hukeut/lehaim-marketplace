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

const NEXT_ACTION_LABEL: Record<OrderStatus, string | null> = {
  nouvelle: "Accepter →",
  acceptee: "Démarrer la préparation →",
  en_preparation: "Marquer prête →",
  prete: "Marquer récupérée →",
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

  function advance(orderId: string, next: OrderStatus) {
    setPendingId(orderId);
    startTransition(async () => {
      await setOrderStatus(orderId, next);
      setPendingId(null);
    });
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {ORDER_STATUS_FLOW.map((status, index) => {
        const columnOrders = orders.filter((o) => o.status === status);
        const nextStatus = ORDER_STATUS_FLOW[index + 1] ?? null;
        return (
          <div key={status}>
            <div className="mb-2 flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${COLUMN_DOT[status]}`} />
              <span className="text-[10.5px] font-extrabold tracking-[0.03em] text-ink/55 uppercase">
                {ORDER_STATUS_LABEL[status]} · {columnOrders.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {columnOrders.map((order) => (
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
                  {nextStatus && (
                    <button
                      type="button"
                      disabled={isPending && pendingId === order.id}
                      onClick={() => advance(order.id, nextStatus)}
                      className="w-full rounded-full bg-ink px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"
                    >
                      {isPending && pendingId === order.id
                        ? "…"
                        : NEXT_ACTION_LABEL[status]}
                    </button>
                  )}
                </Card>
              ))}

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
