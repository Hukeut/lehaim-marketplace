"use client";

import { useEffect, useRef, useState } from "react";
import type { OrderStatus } from "@/lib/marketplace-types";

const COLORS = ["#ff7a59", "#2aa7a1", "#ffd166", "#7fa35a", "#b94a2e"];

type Piece = { id: number; left: number; color: string; size: number; delay: number; duration: number };

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.random() * 100,
    color: COLORS[id % COLORS.length],
    size: 5 + Math.random() * 4,
    delay: Math.random() * 0.4,
    duration: 1.5 + Math.random() * 1.1,
  }));
}

/**
 * Pluie de confettis, déclenchée quand une commande sort de "nouvelle"
 * pendant que la page est ouverte (grâce à AutoRefresh, qui refait un
 * rendu serveur toutes les quelques secondes) — le moment où le traiteur
 * vient d'accepter. Comparaison au statut précédent via une ref pour ne
 * jouer l'animation qu'une fois, sur un vrai changement, jamais au premier
 * chargement.
 */
export function ConfirmationCelebration({ status }: { status: OrderStatus }) {
  const previous = useRef<OrderStatus | null>(null);
  const [pieces, setPieces] = useState<Piece[] | null>(null);

  useEffect(() => {
    const justConfirmed =
      previous.current === "nouvelle" && status !== "nouvelle" && status !== "annulee";
    previous.current = status;
    if (justConfirmed) {
      setPieces(makePieces(28));
      const timeout = setTimeout(() => setPieces(null), 2200);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  if (!pieces) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="absolute top-0 rounded-[1px]"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size * 0.4,
            backgroundColor: piece.color,
            animation: `confetti-fall ${piece.duration}s linear ${piece.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
