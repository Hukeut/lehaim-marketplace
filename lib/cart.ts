import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/supabase/user";
import { run } from "@/lib/db";

/**
 * Le panier, côté lecture.
 *
 * Il ne porte aucun prix : les montants se lisent sur les produits à
 * l'affichage et ne se figent qu'à la commande, dans `place_order`. Un panier
 * qui mémoriserait ses prix afficherait un total que la base ne reconnaîtrait
 * pas au moment de valider.
 *
 * Un panier par commerce, parce que le créneau, les frais et le minimum de
 * commande sont propres à un commerce.
 */

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  available: boolean;
  note: string | null;
};

export type Cart = {
  shopId: string;
  shopSlug: string;
  shopName: string;
  lines: CartLine[];
  /** Somme des lignes encore disponibles. */
  total: number;
  count: number;
};

export const myCart = cache(async function myCart(shopId: string): Promise<Cart | null> {
  const [supabase, user] = await Promise.all([createClient(), currentUser()]);
  if (!user) return null;

  const { data: cart } = await run(
    "myCart",
    supabase
      .from("carts")
      // i18n-ignore : liste de colonnes, pas du texte affiché.
      .select("id, shops(id, slug, name)")
      .eq("customer_id", user.id)
      .eq("shop_id", shopId)
      .maybeSingle(),
  );
  if (!cart) return null;

  const row = cart as unknown as {
    id: string;
    shops: { id: string; slug: string; name: string } | null;
  };
  if (!row.shops) return null;

  const { data: items } = await run(
    "myCart/items",
    supabase
      .from("cart_items")
      .select("product_id, quantity, note, shop_products(name, price, available)")
      .eq("cart_id", row.id),
  );

  const lines: CartLine[] = ((items ?? []) as unknown as {
    product_id: string;
    quantity: number;
    note: string | null;
    shop_products: { name: string; price: number; available: boolean } | null;
  }[])
    .filter((i) => i.shop_products)
    .map((i) => ({
      productId: i.product_id,
      name: i.shop_products!.name,
      price: Number(i.shop_products!.price),
      quantity: i.quantity,
      available: i.shop_products!.available,
      note: i.note,
    }));

  return {
    shopId: row.shops.id,
    shopSlug: row.shops.slug,
    shopName: row.shops.name,
    lines,
    // Un produit retiré de la carte ne compte plus : c'est ce que
    // `place_order` fera de son côté, l'écran doit dire la même chose.
    total: lines.filter((l) => l.available).reduce((sum, l) => sum + l.price * l.quantity, 0),
    count: lines.filter((l) => l.available).reduce((sum, l) => sum + l.quantity, 0),
  };
});

/** Le panier en cours, quel que soit le commerce — pour la barre flottante. */
export const anyCart = cache(async function anyCart(): Promise<Cart | null> {
  const [supabase, user] = await Promise.all([createClient(), currentUser()]);
  if (!user) return null;

  const { data } = await run(
    "anyCart",
    supabase
      .from("carts")
      .select("shop_id")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  if (!data) return null;
  return myCart((data as unknown as { shop_id: string }).shop_id);
});

