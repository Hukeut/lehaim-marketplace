import Link from "next/link";
import type { Product } from "@/lib/marketplace-types";

/** Ligne compacte : toute la carte mène à l'écran de modification (suppression incluse là-bas). */
export function ProductRow({ product }: { product: Product }) {
  return (
    <Link
      href={`/devenir-traiteur/menu/${product.id}`}
      className="flex items-center justify-between rounded-field bg-white px-3.5 py-3 shadow-[var(--shadow-card)]"
    >
      <span className="truncate text-[12.5px] font-bold text-ink">
        {product.title} · {product.price.toFixed(0)}₪
      </span>
      <span className="text-ink/30">›</span>
    </Link>
  );
}
