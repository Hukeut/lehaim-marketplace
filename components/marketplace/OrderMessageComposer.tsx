"use client";

import { useActionState, useRef } from "react";
import { sendOrderMessage } from "@/app/marketplace/actions";
import type { ActionState } from "@/app/actions";
import { ArrowRight } from "@/components/icons";

const initial: ActionState = { ok: false, message: null };

export function OrderMessageComposer({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(sendOrderMessage, initial);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={(fd) => {
        formAction(fd);
        if (inputRef.current) inputRef.current.value = "";
      }}
    >
      <input type="hidden" name="order_id" value={orderId} />
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          name="body"
          required
          placeholder="Écrire un message…"
          className="flex-1 rounded-full bg-white px-3.5 py-2.5 text-[12.5px] shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Envoyer"
          className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-coral text-white active:scale-95 disabled:opacity-50"
        >
          <ArrowRight size={14} />
        </button>
      </div>
      {state.message && (
        <p className="mt-1.5 text-[10.5px] font-bold text-coral-deep">{state.message}</p>
      )}
    </form>
  );
}
