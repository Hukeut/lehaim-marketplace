"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { money } from "@/lib/money";
import type { Product } from "@/lib/shops";

/**
 * La carte d'un traiteur, panier compris.
 *
 * Pas de panier en base : les quantités vivent dans localStorage, comme dans
 * lehaim-marketplace (un produit ajouté sur cet écran, retrouvé sur l'écran
 * de réservation). Pas de variantes non plus — un produit s'ajoute d'un
 * geste, il n'y a rien à configurer.
 */

function cartKey(shopId: string) {
  return `lehaim-cart-${shopId}`;
}

function readCart(shopId: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(cartKey(shopId)) ?? "{}");
  } catch {
    return {};
  }
}

function writeCart(shopId: string, cart: Record<string, number>) {
  window.localStorage.setItem(cartKey(shopId), JSON.stringify(cart));
}

export function Catalogue({
  shopId,
  products,
  disabled,
}: {
  shopId: string;
  products: Product[];
  /** La fiche est en pause : aucun ajout n'est possible. */
  disabled: boolean;
}) {
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    setCart(readCart(shopId));
  }, [shopId]);

  function setQty(productId: string, quantity: number) {
    setCart((was) => {
      const next = { ...was };
      if (quantity <= 0) delete next[productId];
      else next[productId] = Math.min(99, quantity);
      writeCart(shopId, next);
      return next;
    });
  }

  const count = Object.values(cart).reduce((sum, q) => sum + q, 0);
  const total = products.reduce((sum, p) => sum + (cart[p.id] ?? 0) * p.price, 0);

  return (
    <div className="flex flex-col gap-3.5 pb-24">
      <div className="grid grid-cols-2 gap-3.5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={cart[product.id] ?? 0}
            onChange={(q) => setQty(product.id, q)}
            disabled={disabled}
          />
        ))}
      </div>

      {count > 0 && (
        <Link
          href={`/marketplace/${shopId}/reserver`}
          className="fixed inset-x-[18px] bottom-[92px] z-20 mx-auto flex max-w-[394px] items-center gap-3 rounded-full bg-ink px-5 py-3.5 text-white shadow-[var(--shadow-dock)]"
        >
          <span className="min-w-0 flex-1 truncate font-display text-[14.5px] font-semibold">
            {count} article{count > 1 ? "s" : ""}
          </span>
          <span className="font-display text-[14.5px] font-semibold">{money(total)}</span>
        </Link>
      )}
    </div>
  );
}

function ProductCard({
  product,
  quantity,
  onChange,
  disabled,
}: {
  product: Product;
  quantity: number;
  onChange: (quantity: number) => void;
  disabled: boolean;
}) {
  const blocked = disabled || !product.available;

  return (
    <div className="flex flex-col overflow-hidden rounded-card bg-white shadow-[var(--shadow-card)]">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt=""
          className={`h-28 w-full object-cover ${product.available ? "" : "grayscale"}`}
        />
      ) : (
        <span className="flex h-28 w-full items-center justify-center bg-[repeating-linear-gradient(45deg,var(--color-sand),var(--color-sand)_8px,var(--color-line-soft)_8px,var(--color-line-soft)_16px)] font-mono text-[10px] text-ink/40">
          photo
        </span>
      )}

      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="font-display text-[14.5px] leading-tight font-semibold">{product.name}</span>
        <span className="font-display text-[16px] font-semibold">{money(product.price)}</span>

        {product.allergens.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1">
            {product.allergens.slice(0, 2).map((a) => (
              <span
                key={a}
                className="rounded-full bg-[rgba(138,35,70,0.10)] px-2 py-0.5 text-[9.5px] font-extrabold text-[#8A2346]"
              >
                {a}
              </span>
            ))}
          </div>
        )}

        {!product.available ? (
          <span className="mt-1 text-[11px] font-bold text-ink/45">Indisponible</span>
        ) : blocked ? (
          <span className="mt-1 text-[11px] font-bold text-ink/45">En pause</span>
        ) : (
          <div className="mt-1 flex items-center gap-2.5">
            <button
              type="button"
              aria-label="−"
              onClick={() => onChange(quantity - 1)}
              disabled={quantity === 0}
              className="flex size-7 items-center justify-center rounded-full border-2 border-line-soft text-[14px] font-bold disabled:opacity-30"
            >
              −
            </button>
            <span className="min-w-4 text-center text-[13px] font-extrabold">{quantity}</span>
            <button
              type="button"
              aria-label="+"
              onClick={() => onChange(quantity + 1)}
              className="flex size-7 items-center justify-center rounded-full bg-teal/12 text-[14px] font-bold text-teal-deep"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
