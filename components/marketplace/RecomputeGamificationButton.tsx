"use client";

import { useState, useTransition } from "react";
import { recomputeGamificationSubject } from "@/app/marketplace/actions";

/**
 * Bouton admin : recalcul manuel de l'état de gamification d'un sujet
 * (§16/§19 du cahier des charges — correction après un changement de
 * règle ou une donnée requalifiée). Le recalcul se fait aussi tout seul à
 * chaque événement pertinent ; ce bouton est le filet de sécurité.
 */
export function RecomputeGamificationButton({
  subjectType,
  subjectId,
}: {
  subjectType: "traiteur" | "organizer";
  subjectId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await recomputeGamificationSubject(subjectType, subjectId);
          setDone(true);
        })
      }
      className="rounded-full border-[1.5px] border-line-soft bg-white px-4 py-2 text-[11.5px] font-bold text-ink disabled:opacity-50"
    >
      {isPending ? "Recalcul…" : done ? "Recalculé ✓" : "Recalculer le score de gamification"}
    </button>
  );
}
