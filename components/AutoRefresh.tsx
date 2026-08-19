"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Sonde en continu et force un re-render serveur à intervalle régulier.
 * Utile sur les pages "live" côté traiteur/organisateur (listes de
 * commandes, discussions) où de nouveaux événements peuvent arriver à
 * tout moment sans qu'on sache quand s'arrêter de sonder — contrairement
 * à `OrderStatusWatcher`, qui sait s'arrêter une fois un état atteint.
 */
export function AutoRefresh({ intervalMs = 8000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs, router]);

  return null;
}
