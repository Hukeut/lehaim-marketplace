"use client";

import { useState } from "react";
import { acceptOrder } from "./actions";

/**
 * Accepter, en confirmant le temps de préparation.
 *
 * Le chiffre est prérempli avec celui de la boutique et modifiable d'un
 * appui. Le nouveau chiffre vaut pour la suite du service.
 */
export function AcceptPanel({
  id,
  defaultMinutes,
}: {
  id: string;
  defaultMinutes: number;
}) {
  const [minutes, setMinutes] = useState(defaultMinutes);
  const choices = [...new Set([15, 20, 30, 45, 60, defaultMinutes])].sort((a, b) => a - b);

  return (
    <form action={acceptOrder} className="flex w-full flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="prep_minutes" value={minutes} />

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11.5px] font-bold text-ink/50">Prêt dans</span>
        {choices.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMinutes(m)}
            className={`rounded-full border-[1.5px] px-2.5 py-1 text-[11.5px] font-bold ${
              minutes === m ? "border-teal bg-teal/12 text-teal-deep" : "border-line bg-white text-ink/55"
            }`}
          >
            {m} min
          </button>
        ))}
      </div>

      <button
        type="submit"
        className="rounded-full bg-olive px-4 py-2.5 font-display text-[13px] font-semibold text-white"
      >
        Accepter · prêt dans {minutes} min
      </button>
    </form>
  );
}
