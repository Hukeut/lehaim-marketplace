"use client";

import { useTransition } from "react";
import { setOrderStatus } from "@/app/marketplace/actions";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();

  function cancel() {
    if (!confirm("Annuler cette commande ?")) return;
    startTransition(() => setOrderStatus(orderId, "annulee"));
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={cancel}
      className="w-full rounded-full px-3.5 py-2.5 text-center text-[11.5px] font-bold text-coral-deep/70 disabled:opacity-50"
    >
      {pending ? "Annulation…" : "Annuler ma commande"}
    </button>
  );
}
