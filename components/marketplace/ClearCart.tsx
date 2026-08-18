"use client";

import { useEffect } from "react";

/** Vide le panier local une fois la commande confirmée côté serveur. */
export function ClearCart({ traiteurId }: { traiteurId: string }) {
  useEffect(() => {
    try {
      window.localStorage.removeItem(`lehaim-marketplace-cart-${traiteurId}`);
    } catch {
      // rien de bloquant
    }
  }, [traiteurId]);

  return null;
}
