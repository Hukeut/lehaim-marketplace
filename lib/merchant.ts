import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createTypedClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/supabase/user";
import { backOfficeRole } from "@/lib/admin";
import { run } from "@/lib/db";

/**
 * Le client Supabase, hors du typage généré.
 *
 * `database.types.ts` ne connaît pas encore traiteurs/traiteur_products/
 * traiteur_slots/marketplace_orders : ces tables arrivent avec la migration
 * 0035_marketplace_traiteurs.sql, et le typage se régénère avec `npm run
 * types` une fois la migration appliquée sur le projet Supabase lié — chose
 * qu'on ne peut pas faire depuis ce bac à sable. En attendant, ces requêtes
 * sortent volontairement du typage strict plutôt que de mentir dessus.
 */
export async function createClient(): Promise<SupabaseClient> {
  const supabase = await createTypedClient();
  return supabase as unknown as SupabaseClient;
}

/**
 * Le back-office, côté commerçant.
 *
 * Ce fichier ne lit plus shops/orders : il lit le schéma marketplace porté
 * depuis lehaim-marketplace (traiteurs / traiteur_products / traiteur_slots /
 * marketplace_orders — voir la migration 0035_marketplace_traiteurs.sql).
 * Les écrans de ce dépôt (le design) restent en place ; c'est ce backend-là,
 * testé et corrigé côté lehaim-marketplace, qu'on rebranche dessous.
 *
 * Un commerçant ne voit qu'une boutique : la sienne. Toutes les fonctions
 * d'ici partent donc de `myShop()` plutôt que d'un identifiant passé en
 * paramètre.
 */

export const ORDER_STATUSES = [
  "nouvelle",
  "acceptee",
  "en_preparation",
  "prete",
  "recuperee",
  "annulee",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  nouvelle: "acceptee",
  acceptee: "en_preparation",
  en_preparation: "prete",
  prete: "recuperee",
};

/**
 * Notre schéma ne distingue pas d'étape « en route » pour la livraison :
 * qu'elle soit à retirer ou à livrer, une commande passe de « prête » à
 * « récupérée » une fois remise. Le paramètre de mode reste accepté (les
 * appelants passent `order.mode`) mais n'est pas utilisé.
 */
export function nextStatus(status: OrderStatus, _mode?: "retrait" | "livraison"): OrderStatus | null {
  return NEXT[status] ?? null;
}

export type MerchantShop = {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  description: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  /** Suspension décidée par le commerçant, distincte du statut de validation. */
  paused: boolean;
  prepMinutes: number;
  logoUrl: string | null;
  coverUrl: string | null;
  // Repris tels quels pour /admin/reversements : pas de modèle de commission
  // dans ce schéma pour l'instant (chantier finance, non commencé — voir le
  // même report côté panneau IBAN de "Ma boutique").
  commissionRate: number;
  payoutFrequency: string;
  iban: string | null;
};

function shopFrom(row: Record<string, unknown>): MerchantShop {
  return {
    id: row.id as string,
    name: row.name as string,
    status: row.status as MerchantShop["status"],
    description: (row.description as string) ?? null,
    address: (row.address as string) ?? null,
    city: (row.city as string) ?? null,
    phone: (row.phone as string) ?? null,
    paused: Boolean(row.paused),
    prepMinutes: Number(row.prep_minutes ?? 20),
    logoUrl: (row.logo_url as string) ?? null,
    coverUrl: (row.cover_url as string) ?? null,
    commissionRate: 0,
    payoutFrequency: "weekly",
    iban: null,
  };
}

export const myShop = cache(async function myShop(): Promise<MerchantShop | null> {
  const [supabase, user] = await Promise.all([createClient(), currentUser()]);
  if (!user) return null;

  // .limit(1) plutôt que .maybeSingle() : reste robuste même si un compte
  // finit par posséder plusieurs lignes, au lieu d'échouer silencieusement.
  const { data } = await run(
    "myShop",
    supabase
      .from("traiteurs")
      .select(
        "id, name, status, description, address, city, phone, paused, prep_minutes, logo_url, cover_url",
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1),
  );

  const row = (data as unknown as Record<string, unknown>[] | null)?.[0];
  return row ? shopFrom(row) : null;
});

/**
 * La boutique du commerçant connecté, ou un renvoi.
 *
 * Le tunnel d'inscription traiteur vit à /partenaire/candidature (voir
 * components/marketplace/TraiteurOnboardingForm.tsx) : un commerçant sans
 * boutique y est renvoyé pour déposer son dossier.
 */
export async function requireMyShop(): Promise<MerchantShop> {
  const [role, shop] = await Promise.all([backOfficeRole(), myShop()]);
  if (!shop) redirect(role === "admin" ? "/admin" : "/partenaire/candidature");
  return shop;
}

export type MerchantOrder = {
  id: string;
  /** Pas de code de commande dédié dans ce schéma : l'identifiant en tient lieu. */
  reference: string;
  status: OrderStatus;
  mode: "retrait" | "livraison";
  customerName: string;
  customerPhone: string | null;
  total: number;
  /** = total : aucune commission n'est modélisée pour l'instant. */
  payout: number;
  placedAt: string;
  pickupDate: string | null;
  pickupSlot: string | null;
  deliveryAddress: string | null;
  customerNote: string | null;
  refusalReason: string | null;
  items: { name: string; quantity: number; note: string | null }[];
};

/** Les états qui occupent le service : ceux qui demandent un geste. */
export const OPEN_STATUSES: OrderStatus[] = ["nouvelle", "acceptee", "en_preparation", "prete"];

const ORDER_FIELDS =
  "id, status, fulfillment, pickup_date, pickup_slot, total_amount, notes, delivery_address, refusal_reason, created_at, profiles(first_name, last_name, phone), marketplace_order_items(title, quantity)";

type OrderRow = Record<string, unknown> & {
  profiles: { first_name?: string; last_name?: string; phone?: string } | null;
  marketplace_order_items: { title: string; quantity: number }[] | null;
};

function toOrder(row: OrderRow): MerchantOrder {
  const profile = row.profiles;
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();

  return {
    id: row.id as string,
    reference: `#${(row.id as string).slice(0, 8).toUpperCase()}`,
    status: row.status as OrderStatus,
    mode: row.fulfillment as "retrait" | "livraison",
    customerName: name || "Client",
    customerPhone: profile?.phone ?? null,
    total: Number(row.total_amount ?? 0),
    payout: Number(row.total_amount ?? 0),
    placedAt: row.created_at as string,
    pickupDate: (row.pickup_date as string) ?? null,
    pickupSlot: (row.pickup_slot as string) ?? null,
    deliveryAddress: (row.delivery_address as string) ?? null,
    customerNote: (row.notes as string) ?? null,
    refusalReason: (row.refusal_reason as string) ?? null,
    items: (row.marketplace_order_items ?? []).map((i) => ({
      name: i.title,
      quantity: i.quantity,
      note: null,
    })),
  };
}

/** Le service en cours : tout ce qui n'est ni clos ni abandonné. */
export const openOrders = cache(async function openOrders(shopId: string): Promise<MerchantOrder[]> {
  const supabase = await createClient();
  const { data } = await run(
    "openOrders",
    supabase
      .from("marketplace_orders")
      .select(ORDER_FIELDS)
      .eq("traiteur_id", shopId)
      .in("status", OPEN_STATUSES)
      .order("created_at"),
  );
  return ((data ?? []) as unknown as OrderRow[]).map(toOrder);
});

export const pastOrders = cache(async function pastOrders(shopId: string): Promise<MerchantOrder[]> {
  const supabase = await createClient();
  const { data } = await run(
    "pastOrders",
    supabase
      .from("marketplace_orders")
      .select(ORDER_FIELDS)
      .eq("traiteur_id", shopId)
      .in("status", ["recuperee", "annulee"])
      .order("created_at", { ascending: false })
      .limit(60),
  );
  return ((data ?? []) as unknown as OrderRow[]).map(toOrder);
});

/**
 * Ce que le commerce a encaissé, mois par mois.
 *
 * Seules les commandes récupérées comptent. `commission`/`payout` valent le
 * brut tel quel : sans modèle de commission, on ne va pas en inventer un ici.
 */
export const payoutSummary = cache(async function payoutSummary(shopId: string) {
  const supabase = await createClient();
  const { data } = await run(
    "payoutSummary",
    supabase
      .from("marketplace_orders")
      .select("total_amount, created_at")
      .eq("traiteur_id", shopId)
      .eq("status", "recuperee")
      .order("created_at", { ascending: false })
      .limit(500),
  );

  const rows = (data ?? []) as unknown as { total_amount: number; created_at: string }[];

  const monthly = new Map<string, { gross: number; count: number }>();
  for (const r of rows) {
    const key = r.created_at.slice(0, 7);
    const bucket = monthly.get(key) ?? { gross: 0, count: 0 };
    bucket.gross += Number(r.total_amount);
    bucket.count += 1;
    monthly.set(key, bucket);
  }

  const total = rows.reduce((s, r) => s + Number(r.total_amount), 0);

  return {
    total,
    commission: 0,
    payout: total,
    count: rows.length,
    months: [...monthly.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, b]) => ({ month, gross: b.gross, commission: 0, payout: b.gross, count: b.count })),
  };
});

export type MerchantProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  available: boolean;
  /** Une seule liste, pas de distinction contient / traces / garanti sans. */
  allergens: string[];
  workshopNote: string | null;
  imageUrl: string | null;
};

export const myProducts = cache(async function myProducts(shopId: string): Promise<MerchantProduct[]> {
  const supabase = await createClient();
  const { data } = await run(
    "myProducts",
    supabase
      .from("traiteur_products")
      .select("id, title, description, price, category, active, allergens, workshop_note, image_url")
      .eq("traiteur_id", shopId)
      .order("created_at", { ascending: false }),
  );

  return ((data ?? []) as unknown as Record<string, unknown>[]).map((p) => ({
    id: p.id as string,
    name: p.title as string,
    description: (p.description as string) ?? null,
    price: Number(p.price ?? 0),
    category: (p.category as string) ?? "autre",
    available: Boolean(p.active),
    allergens: (p.allergens as string[]) ?? [],
    workshopNote: (p.workshop_note as string) ?? null,
    imageUrl: (p.image_url as string) ?? null,
  }));
});

export type MerchantSlot = {
  id: string;
  date: string;
  label: string;
  /** Illimitée si non renseignée. */
  capacity: number | null;
  /** Commandes actives (tout sauf annulée) qui tiennent ce créneau. */
  booked: number;
};

/**
 * Les créneaux à venir — proposés à la main par le traiteur (date + libellé),
 * avec une capacité optionnelle. Pas de génération automatique depuis des
 * horaires : ça reste ajouté un par un, comme avant cette migration.
 */
export const mySlots = cache(async function mySlots(shopId: string): Promise<MerchantSlot[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: slotRows }, { data: bookingRows }] = await Promise.all([
    run(
      "mySlots",
      supabase
        .from("traiteur_slots")
        .select("id, slot_date, slot_label, capacity")
        .eq("traiteur_id", shopId)
        .gte("slot_date", today)
        .order("slot_date")
        .order("slot_label")
        .limit(120),
    ),
    run(
      "mySlots/bookings",
      supabase
        .from("marketplace_orders")
        .select("slot_id")
        .eq("traiteur_id", shopId)
        .not("slot_id", "is", null)
        .neq("status", "annulee"),
    ),
  ]);

  const booked = new Map<string, number>();
  for (const row of (bookingRows ?? []) as unknown as { slot_id: string }[]) {
    booked.set(row.slot_id, (booked.get(row.slot_id) ?? 0) + 1);
  }

  return (
    (slotRows ?? []) as unknown as {
      id: string;
      slot_date: string;
      slot_label: string;
      capacity: number | null;
    }[]
  ).map((s) => ({
    id: s.id,
    date: s.slot_date,
    label: s.slot_label,
    capacity: s.capacity ?? null,
    booked: booked.get(s.id) ?? 0,
  }));
});
