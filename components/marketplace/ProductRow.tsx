"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toggleProductActive, deleteProduct } from "@/app/marketplace/actions";
import { Card } from "@/components/ui";
import { CATEGORY_LABEL, type Product } from "@/lib/marketplace-types";

export function ProductRow({ product }: { product: Product }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="rounded-field p-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold">{product.title}</div>
          <div className="text-[10.5px] text-ink/50">
            {CATEGORY_LABEL[product.category]} · {product.price.toFixed(0)}₪
            {!product.active && <span className="ml-1.5 font-bold text-coral-deep">· Masqué</span>}
          </div>
        </div>
        <Link
          href={`/devenir-traiteur/menu/${product.id}`}
          className="rounded-full border-[1.5px] border-line-soft bg-white px-3 py-1.5 text-[11px] font-bold shadow-[var(--shadow-pill)]"
        >
          Modifier
        </Link>
      </div>
      <div className="mt-2 flex gap-2 border-t border-line-soft pt-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => toggleProductActive(product.id, !product.active))}
          className="flex-1 rounded-full bg-line-soft px-3 py-1.5 text-[10.5px] font-bold text-ink disabled:opacity-50"
        >
          {product.active ? "Masquer" : "Afficher"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (confirm(`Supprimer « ${product.title} » ?`)) {
              startTransition(() => deleteProduct(product.id));
            }
          }}
          className="flex-1 rounded-full bg-coral-wash px-3 py-1.5 text-[10.5px] font-bold text-coral-deep disabled:opacity-50"
        >
          Supprimer
        </button>
      </div>
    </Card>
  );
}
