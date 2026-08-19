"use client";

import { useActionState, useRef } from "react";
import { saveEquipment } from "@/app/mission-actions";
import type { ActionState } from "@/app/actions";

const initial: ActionState = { ok: false, message: null };

const field =
  "rounded-field bg-white px-3 py-2.5 text-[12.5px] font-bold shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40";

export function EquipmentForm({ shabbatId }: { shabbatId: string }) {
  const [state, formAction, pending] = useActionState(saveEquipment, initial);
  const form = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={form}
      action={(fd) => {
        formAction(fd);
        form.current?.reset();
      }}
      className="mt-2 rounded-panel border-[1.5px] border-dashed border-ink/15 p-3"
    >
      <input type="hidden" name="shabbat_id" value={shabbatId} />
      <div className="mb-2 flex gap-2">
        <input name="emoji" defaultValue="📦" maxLength={4} className={`${field} w-14 text-center`} />
        <input name="name" required placeholder="Chaises" className={`${field} min-w-0 flex-1`} />
      </div>
      <div className="flex gap-2">
        <label className="flex flex-1 items-center gap-2">
          <span className="text-[11px] font-bold text-ink/55">J&apos;ai</span>
          <input
            name="owned"
            type="number"
            min={0}
            defaultValue={0}
            className={`${field} w-full min-w-0`}
          />
        </label>
        <label className="flex flex-1 items-center gap-2">
          <span className="text-[11px] font-bold text-ink/55">Il faut</span>
          <input
            name="needed"
            type="number"
            min={0}
            defaultValue={0}
            className={`${field} w-full min-w-0`}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-field bg-teal px-3.5 text-[12.5px] font-bold text-white disabled:opacity-50"
        >
          +
        </button>
      </div>
      {state.message && (
        <p className="mt-2 text-[11.5px] font-bold text-coral-deep">{state.message}</p>
      )}
    </form>
  );
}
