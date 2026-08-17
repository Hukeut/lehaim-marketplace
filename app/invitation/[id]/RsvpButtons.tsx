"use client";

import { useTransition } from "react";
import { respondToInvitation } from "@/app/actions";

export function RsvpButtons({
  shabbatId,
  status,
}: {
  shabbatId: string;
  status: "pending" | "confirmed" | "declined";
}) {
  const [pending, startTransition] = useTransition();

  function respond(next: "confirmed" | "declined") {
    startTransition(() => {
      respondToInvitation(shabbatId, next);
    });
  }

  return (
    <div className="flex gap-2.5">
      <button
        onClick={() => respond("confirmed")}
        disabled={pending}
        className={`flex-1 rounded-full py-3.5 font-display text-[14px] font-semibold transition-colors disabled:opacity-60 ${
          status === "confirmed"
            ? "bg-olive text-white"
            : "bg-coral text-white shadow-[var(--shadow-coral)]"
        }`}
      >
        {status === "confirmed" ? "Vous y êtes" : "Je viens"}
      </button>
      <button
        onClick={() => respond("declined")}
        disabled={pending}
        className={`rounded-full border-2 px-5 py-3.5 font-display text-[13px] font-semibold transition-colors disabled:opacity-60 ${
          status === "declined"
            ? "border-line bg-line text-mist"
            : "border-line bg-white text-ink"
        }`}
      >
        {status === "declined" ? "Décliné" : "Pas cette fois"}
      </button>
    </div>
  );
}
