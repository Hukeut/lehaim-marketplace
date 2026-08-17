"use client";

import { useActionState, useRef } from "react";
import { addExpense, type ActionState } from "@/app/actions";
import { contribute } from "@/app/mission-actions";

const initial: ActionState = { ok: false, message: null };

const field =
  "rounded-field bg-white px-3.5 py-3 text-[13px] font-bold shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40";

export function ExpenseForm({ shabbatId }: { shabbatId: string }) {
  const [state, formAction, pending] = useActionState(addExpense, initial);
  const form = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={form}
      action={(fd) => {
        formAction(fd);
        form.current?.reset();
      }}
      className="flex gap-2"
    >
      <input type="hidden" name="shabbat_id" value={shabbatId} />
      <input
        name="label"
        required
        placeholder="Courses Monoprix"
        className={`${field} min-w-0 flex-1`}
      />
      <input
        name="amount"
        required
        inputMode="decimal"
        placeholder="45"
        className={`${field} w-16 shrink-0 text-center`}
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-field bg-coral px-4 text-[13px] font-bold text-white disabled:opacity-50"
      >
        Ajouter
      </button>
      {state.message && (
        <span className="sr-only" role="alert">
          {state.message}
        </span>
      )}
    </form>
  );
}

export function ContributionForm({ shabbatId }: { shabbatId: string }) {
  const [state, formAction, pending] = useActionState(contribute, initial);
  const form = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={form}
      action={(fd) => {
        formAction(fd);
        form.current?.reset();
      }}
    >
      <input type="hidden" name="shabbat_id" value={shabbatId} />
      <div className="flex gap-2">
        <input
          name="amount"
          required
          inputMode="decimal"
          placeholder="20"
          className={`${field} min-w-0 flex-1 text-center`}
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-coral px-5 py-3 font-display text-[14px] font-semibold text-white shadow-[var(--shadow-coral)] disabled:opacity-50"
        >
          Participer à la cagnotte
        </button>
      </div>
      {state.message && (
        <p className="mt-2 text-[11.5px] font-bold text-coral-deep">{state.message}</p>
      )}
    </form>
  );
}
