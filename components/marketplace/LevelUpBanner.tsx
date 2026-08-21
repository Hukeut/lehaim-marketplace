"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { acknowledgeTier } from "@/app/marketplace/actions";
import { Sparkles } from "@/components/marketplace/Sparkles";
import { Medal } from "@/components/icons";

/**
 * Bannière plein écran "Niveau débloqué", jouée une seule fois quand le
 * palier de gamification vient de monter (comparé à `traiteur.lastSeenTier`,
 * réutilisation de la colonne ajoutée pour l'ancien système de badges —
 * elle stocke maintenant une `level_key` du nouveau moteur). Générique par
 * rapport au niveau (contrairement à l'ancien `TierLevelUp`, propre aux
 * paliers Or/Argent/Bronze de réactivité).
 */
export function LevelUpBanner({
  traiteurId,
  levelKey,
  levelName,
  leveledUp,
}: {
  traiteurId: string;
  levelKey: string;
  levelName: string;
  leveledUp: boolean;
}) {
  const [visible, setVisible] = useState(leveledUp);
  const acknowledged = useRef(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!leveledUp || acknowledged.current) return;
    acknowledged.current = true;
    startTransition(() => {
      acknowledgeTier(traiteurId, levelKey);
    });
    const timeout = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(timeout);
  }, [leveledUp, levelKey, traiteurId]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/55 px-8">
      <div className="relative flex animate-[level-up-in_0.55s_cubic-bezier(0.34,1.56,0.64,1)_both] flex-col items-center rounded-panel bg-white px-7 py-8 text-center shadow-[var(--shadow-float)]">
        <Sparkles />
        <span className="relative mb-3 flex size-16 animate-[glow-pulse_1.6s_ease-out_infinite] items-center justify-center rounded-full bg-gold text-gold-ink">
          <Medal size={30} />
        </span>
        <div className="text-[10px] font-extrabold tracking-[0.08em] text-ink/45 uppercase">
          Niveau débloqué
        </div>
        <div className="mt-1 font-display text-[19px] font-semibold">Palier {levelName} !</div>
        <p className="mt-1.5 max-w-[220px] text-[11.5px] leading-relaxed text-ink/55">
          Votre régularité et vos commandes bien menées ont payé.
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="mt-5 rounded-full bg-ink px-5 py-2.5 text-[12px] font-bold text-white"
        >
          Super !
        </button>
      </div>
    </div>
  );
}
