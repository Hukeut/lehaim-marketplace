"use client";

import { useEffect } from "react";

/** Vide le panier localStorage du traiteur juste commandé, une fois la commande confirmée. */
export function ClearCart({ shopId }: { shopId: string | null }) {
  useEffect(() => {
    if (!shopId) return;
    window.localStorage.removeItem(`lehaim-cart-${shopId}`);
  }, [shopId]);

  return null;
}
