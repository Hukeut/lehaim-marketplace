import "server-only";
import { cache } from "react";
import { currentUser } from "@/lib/supabase/user";
import { marketplaceClient } from "@/lib/shops";
import { run } from "@/lib/db";

/**
 * Le portefeuille client — cartes mémorisées via la tokenisation Grow (voir
 * supabase/migrations/0022_marketplace_payments_grow.sql et lib/grow.ts).
 */

export type SavedCard = {
  id: string;
  cardToken: string;
  cardBrand: string | null;
  cardSuffix: string | null;
  cardExp: string | null;
  isDefault: boolean;
};

type Row = {
  id: string;
  card_token: string;
  card_brand: string | null;
  card_suffix: string | null;
  card_exp: string | null;
  is_default: boolean;
};

function toCard(row: Row): SavedCard {
  return {
    id: row.id,
    cardToken: row.card_token,
    cardBrand: row.card_brand,
    cardSuffix: row.card_suffix,
    cardExp: row.card_exp,
    isDefault: row.is_default,
  };
}

/** Les cartes mémorisées par la personne connectée, la carte par défaut en premier. */
export const myPaymentMethods = cache(async function myPaymentMethods(): Promise<SavedCard[]> {
  const [supabase, user] = await Promise.all([marketplaceClient(), currentUser()]);
  if (!user) return [];

  const { data } = await run(
    "myPaymentMethods",
    supabase
      .from("payment_methods")
      .select("id, card_token, card_brand, card_suffix, card_exp, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
  );

  return ((data ?? []) as unknown as Row[]).map(toCard);
});
