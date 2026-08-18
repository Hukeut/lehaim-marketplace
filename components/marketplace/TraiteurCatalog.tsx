"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, StickyFooter, Button, Overline } from "@/components/ui";
import { CATEGORY_LABEL, type Product } from "@/lib/marketplace";

type CartState = Record<string, number>;

function cartKey(traiteurId: string) {
  return `lehaim-marketplace-cart-${traiteurId}`;
}

export function TraiteurCatalog({
  traiteurId,
  traiteurName,
  products,
}: {
  traiteurId: string;
  traiteurName: string;
  products: Product[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartState>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(cartKey(traiteurId));
      if (raw) setCart(JSON.parse(raw));
    } catch {
      // panier vide par défaut
    }
  }, [traiteurId]);

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) => {
      const next = { ...prev, [productId]: Math.max(0, (prev[productId] ?? 0) + delta) };
      if (next[productId] === 0) delete next[productId];
      try {
        window.localStorage.setItem(cartKey(traiteurId), JSON.stringify(next));
      } catch {
        // stockage indisponible : le panier reste en mémoire pour la session
      }
      return next;
    });
  }

  const byCategory = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    for (const product of products) {
      (groups[product.category] ??= []).push(product);
    }
    return groups;
  }, [products]);

  const { count, total } = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const product of products) {
      const qty = cart[product.id] ?? 0;
      count += qty;
      total += qty * product.price;
    }
    return { count, total };
  }, [cart, products]);

  function goToReservation() {
    try {
      window.localStorage.setItem(
        `lehaim-marketplace-reservation-${traiteurId}`,
        JSON.stringify({ traiteurName }),
      );
    } catch {
      // rien de bloquant si le stockage échoue
    }
    router.push(`/marketplace/${traiteurId}/reserver`);
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {!products.length && (
          <p className="rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-6 text-center text-[12.5px] text-ink/45">
            Ce traiteur n&apos;a pas encore de produits en ligne.
          </p>
        )}

        {Object.entries(byCategory).map(([category, items]) => (
          <section key={category} className="mb-4">
            <Overline>{CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL] ?? category}</Overline>
            <ul className="flex flex-col gap-2">
              {items.map((product) => {
                const qty = cart[product.id] ?? 0;
                return (
                  <Card as="li" key={product.id} className="rounded-field p-3">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-bold">{product.title}</div>
                        {product.description && (
                          <div className="truncate text-[11px] text-ink/50">{product.description}</div>
                        )}
                        <div className="mt-0.5 text-[11.5px] font-bold text-coral-deep">
                          {product.price.toFixed(0)}₪
                          {product.quantityHint ? (
                            <span className="ml-1.5 font-normal text-ink/40">
                              · {product.quantityHint}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {qty > 0 && (
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1)}
                            className="flex size-7 items-center justify-center rounded-full bg-line-soft text-sm font-bold text-ink"
                          >
                            –
                          </button>
                        )}
                        {qty > 0 && (
                          <span className="w-4 text-center text-[12.5px] font-bold">{qty}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, 1)}
                          className="flex size-7 items-center justify-center rounded-full bg-teal text-sm font-bold text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {count > 0 && (
        <StickyFooter className="px-5">
          <Button onClick={goToReservation} className="flex items-center justify-between px-5">
            <span>{count} article{count > 1 ? "s" : ""}</span>
            <span>{total.toFixed(0)}₪ · Choisir un créneau</span>
          </Button>
        </StickyFooter>
      )}
    </>
  );
}
