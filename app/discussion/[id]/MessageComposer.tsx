"use client";

import { useActionState, useRef } from "react";
import { sendMessage, type ActionState } from "@/app/actions";
import { ArrowRight } from "@/components/icons";

const initial: ActionState = { ok: false, message: null };

export function MessageComposer({ shabbatId }: { shabbatId: string }) {
  const [state, formAction, pending] = useActionState(sendMessage, initial);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={(fd) => {
        formAction(fd);
        if (inputRef.current) inputRef.current.value = "";
      }}
      className="bg-white px-3.5 pt-2.5 pb-[22px] shadow-[0_-6px_18px_rgba(13,43,62,0.06)]"
    >
      <input type="hidden" name="shabbat_id" value={shabbatId} />
      <div className="flex items-center gap-2.5">
        <input
          ref={inputRef}
          name="body"
          required
          placeholder="Écrire un message…"
          className="flex-1 rounded-full bg-line-soft px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-teal/40"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Envoyer"
          className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-coral text-white active:scale-95 disabled:opacity-50"
        >
          <ArrowRight size={16} />
        </button>
      </div>
      {state.message && (
        <p className="mt-2 text-[11.5px] font-bold text-coral-deep">{state.message}</p>
      )}
    </form>
  );
}
