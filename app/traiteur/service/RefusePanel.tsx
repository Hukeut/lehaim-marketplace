"use client";

import { useState } from "react";
import { refuseOrder } from "./actions";

const REASONS = [
  "Produit épuisé",
  "Plus de créneau disponible",
  "Trop loin de notre zone",
  "Fermeture imprévue",
];

/**
 * Refuser demande un motif, et le bouton reste désarmé tant qu'il n'y en a
 * pas. C'est le seul texte que le client lira.
 */
export function RefusePanel({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border-2 border-line px-4 py-2 text-[12.5px] font-bold text-ink/60"
      >
        Refuser
      </button>
    );
  }

  return (
    <form action={refuseOrder} className="flex w-full flex-col gap-2.5">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="reason" value={reason} />

      <div className="flex flex-wrap gap-1.5">
        {REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className={`rounded-full border-[1.5px] px-3 py-1.5 text-[11.5px] font-bold ${
              reason === r
                ? "border-[#8A2346] bg-[rgba(138,35,70,0.10)] text-[#8A2346]"
                : "border-line bg-white text-ink/55"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <textarea
        rows={2}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Le motif que le client lira"
        className="rounded-[12px] border-[1.5px] border-line bg-sand px-3 py-2 text-[12.5px] outline-none focus:border-teal"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[12px] font-bold text-ink/45 underline underline-offset-4"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={reason.trim().length === 0}
          className="ms-auto rounded-full bg-[#8A2346] px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-40"
        >
          Confirmer le refus
        </button>
      </div>
    </form>
  );
}
