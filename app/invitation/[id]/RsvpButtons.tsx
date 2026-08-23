"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { respondToInvitation } from "@/app/actions";

export function RsvpButtons({
  shabbatId,
  status,
}: {
  shabbatId: string;
  status: "pending" | "confirmed" | "declined";
}) {
  const t = useTranslations("invitation.rsvp");
  const tConfirmee = useTranslations("invitation.confirmee");
  const tc = useTranslations("common");
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
        {status === "confirmed" ? tConfirmee("badge") : t("imComing")}
      </button>
      <button
        onClick={() => respond("declined")}
        disabled={pending}
        className={`rounded-full border-2 px-5 py-3.5 font-display text-[14.5px] font-semibold transition-colors disabled:opacity-60 ${
          status === "declined"
            ? "border-line bg-line text-mist"
            : "border-line bg-white text-ink"
        }`}
      >
        {status === "declined" ? tc("status.declined") : t("notThisTime")}
      </button>
    </div>
  );
}
