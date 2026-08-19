"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Petite bannière qui apparaît quand le statut change pendant que la page
 * est ouverte (grâce à `AutoRefresh`, qui refait un rendu serveur toutes
 * les quelques secondes). On compare au statut précédent via une ref :
 * pas de bruit au premier chargement, seulement sur un vrai changement.
 */
export function OrderStatusToast({ status, label }: { status: string; label: string }) {
  const previous = useRef<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const changed = previous.current !== null && previous.current !== status;
    previous.current = status;
    if (!changed) return;

    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timeout);
  }, [status]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-3 z-50 flex justify-center px-5">
      <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[12px] font-bold text-white shadow-[var(--shadow-float)]">
        🔔 Commande {label.toLowerCase()}
      </div>
    </div>
  );
}
