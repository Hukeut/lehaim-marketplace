import "server-only";
import { cache } from "react";
import { currentUser } from "@/lib/supabase/user";
import { run } from "@/lib/db";
import { marketplaceClient } from "@/lib/shops";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/merchant";

/**
 * Les commandes, côté client — portées sur marketplace_orders (voir
 * lib/merchant.ts pour la même table côté commerçant, et lib/shops.ts pour le
 * client Supabase hors typage généré).
 */

export { ORDER_STATUSES, type OrderStatus };

/** Les cinq états d'un parcours qui se passe bien, dans l'ordre. */
export const HAPPY_PATH: OrderStatus[] = ["nouvelle", "acceptee", "en_preparation", "prete", "recuperee"];

export type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed";

export type OrderCard = {
  id: string;
  status: OrderStatus;
  mode: "retrait" | "livraison";
  shopId: string;
  shopName: string;
  total: number;
  placedAt: string;
  pickupDate: string | null;
  pickupSlot: string | null;
  paymentStatus: PaymentStatus;
};

export type OrderDetail = OrderCard & {
  shopPhone: string | null;
  shopAddress: string | null;
  deliveryAddress: string | null;
  customerNote: string | null;
  refusalReason: string | null;
  items: { name: string; price: number; quantity: number }[];
  /** L'heure à laquelle chaque étape a été atteinte, quand elle l'a été. */
  stepTimes: Partial<Record<OrderStatus, string>>;
};

const CARD_FIELDS =
  "id, status, fulfillment, total_amount, created_at, pickup_date, pickup_slot, payment_status, traiteurs(id, name, phone, address)";

type CardRow = Record<string, unknown> & {
  traiteurs: { id: string; name: string; phone: string | null; address: string | null } | null;
};

function toCard(row: CardRow): OrderCard {
  return {
    id: row.id as string,
    status: row.status as OrderStatus,
    mode: row.fulfillment as "retrait" | "livraison",
    shopId: row.traiteurs?.id ?? "",
    shopName: row.traiteurs?.name ?? "Traiteur",
    total: Number(row.total_amount ?? 0),
    placedAt: row.created_at as string,
    pickupDate: (row.pickup_date as string) ?? null,
    pickupSlot: (row.pickup_slot as string) ?? null,
    paymentStatus: (row.payment_status as PaymentStatus) ?? "unpaid",
  };
}

/** Les commandes passées par la personne connectée, tous traiteurs confondus. */
export const myOrders = cache(async function myOrders(): Promise<OrderCard[]> {
  const [supabase, user] = await Promise.all([marketplaceClient(), currentUser()]);
  if (!user) return [];

  const { data } = await run(
    "myOrders",
    supabase
      .from("marketplace_orders")
      .select(CARD_FIELDS)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40),
  );

  return ((data ?? []) as unknown as CardRow[]).map(toCard);
});

/** Une commande précise, avec ses lignes — la RLS n'ouvre qu'à son client ou son traiteur. */
export const orderByReference = cache(async function orderByReference(id: string): Promise<OrderDetail | null> {
  const supabase = await marketplaceClient();

  const { data } = await run(
    "orderByReference",
    supabase
      .from("marketplace_orders")
      .select(`${CARD_FIELDS}, notes, delivery_address, refusal_reason`)
      .eq("id", id)
      .maybeSingle(),
  );
  if (!data) return null;

  const row = data as unknown as CardRow & {
    notes: string | null;
    delivery_address: string | null;
    refusal_reason: string | null;
  };

  const [{ data: items }, { data: events }] = await Promise.all([
    run(
      "orderByReference/items",
      supabase.from("marketplace_order_items").select("title, price, quantity").eq("order_id", id),
    ),
    run(
      "orderByReference/events",
      supabase
        .from("marketplace_order_events")
        .select("status, created_at")
        .eq("order_id", id)
        .order("created_at"),
    ),
  ]);

  // La première fois qu'un statut est atteint : un statut peut, en théorie,
  // apparaître plusieurs fois si une commande annulée était réactivée, ce que
  // ce backend ne fait pas — mais autant garder la première date plutôt que
  // la dernière si ça change un jour.
  const stepTimes: Partial<Record<OrderStatus, string>> = {};
  for (const e of (events ?? []) as unknown as { status: OrderStatus; created_at: string }[]) {
    if (!stepTimes[e.status]) stepTimes[e.status] = e.created_at;
  }

  return {
    ...toCard(row),
    shopPhone: row.traiteurs?.phone ?? null,
    shopAddress: row.traiteurs?.address ?? null,
    deliveryAddress: row.delivery_address ?? null,
    customerNote: row.notes ?? null,
    refusalReason: row.refusal_reason ?? null,
    items: ((items ?? []) as unknown as { title: string; price: number; quantity: number }[]).map((i) => ({
      name: i.title,
      price: Number(i.price),
      quantity: i.quantity,
    })),
    stepTimes,
  };
});

/* ------------------------------------------------------------------ */
/* Avis client                                                          */
/* ------------------------------------------------------------------ */

/** L'avis déjà laissé par la personne connectée sur une commande, s'il existe. */
export const myReviewForOrder = cache(async function myReviewForOrder(
  orderId: string,
): Promise<{ rating: number; comment: string | null } | null> {
  const [supabase, user] = await Promise.all([marketplaceClient(), currentUser()]);
  if (!user) return null;

  const { data } = await run(
    "myReviewForOrder",
    supabase
      .from("marketplace_reviews")
      .select("rating, comment")
      .eq("order_id", orderId)
      .eq("author_id", user.id)
      .maybeSingle(),
  );
  if (!data) return null;
  const row = data as unknown as { rating: number; comment: string | null };
  return { rating: Number(row.rating), comment: row.comment ?? null };
});
