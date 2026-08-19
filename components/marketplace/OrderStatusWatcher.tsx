"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Tant que la commande est "nouvelle", on n'a aucun moyen de savoir que le
 * traiteur vient de l'accepter sans revenir sur la page : `revalidatePath`
 * (côté serveur) ne pousse rien vers un onglet déjà ouvert. On sonde donc
 * doucement et on force un re-render serveur — dès que le statut change,
 * ce composant reçoit un nouveau prop et arrête de lui-même (plus besoin
 * de sonder une commande déjà traitée).
 */
export function OrderStatusWatcher({ status }: { status: string }) {
  const router = useRouter();

  useEffect(() => {
    if (status !== "nouvelle") return;
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [status, router]);

  return null;
}
