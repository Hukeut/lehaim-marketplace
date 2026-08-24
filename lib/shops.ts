import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createTypedClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/supabase/user";
import { run } from "@/lib/db";

// Réexporté pour que les écrans n'aient qu'un import à faire.
export { money } from "@/lib/money";

/**
 * La place de marché, côté client — portée sur le schéma traiteurs de
 * lehaim-marketplace (voir supabase/migrations/0035_marketplace_traiteurs.sql).
 *
 * Volontairement plus simple que l'écran d'origine de Rraven666/lehaim : pas
 * de variantes de produit, pas de zones de livraison à frais, pas de notes ni
 * d'avis, pas de favoris, pas d'horaires (le même choix qu'à /traiteur/creneaux,
 * resté à ajout manuel). Ce que ce backend sait faire aujourd'hui, pas plus —
 * décision prise avec l'utilisateur plutôt que devinée.
 */

/**
 * Hors du typage généré : `database.types.ts` ne connaît pas encore les
 * tables de la migration 0035 (voir lib/merchant.ts pour la même remarque).
 */
export async function marketplaceClient(): Promise<SupabaseClient> {
  const supabase = await createTypedClient();
  return supabase as unknown as SupabaseClient;
}

export const PRODUCT_CATEGORIES = ["plat", "entree", "salade", "dessert", "boisson", "autre"] as const;

export const CATEGORY_LABEL: Record<string, string> = {
  plat: "Plat",
  entree: "Entrée",
  salade: "Salade",
  dessert: "Dessert",
  boisson: "Boisson",
  autre: "Autre",
};

export type ShopCard = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  description: string | null;
  /** Un seul nom d'organisme, pas une liste de certificats avec mentions/échéance. */
  hechsherName: string | null;
  deliveryAvailable: boolean;
  deliveryZone: string | null;
  /** Suspension décidée par le commerçant : la fiche reste visible. */
  paused: boolean;
  logoUrl: string | null;
  coverUrl: string | null;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  available: boolean;
  /** Une seule liste d'allergènes, pas trois niveaux (voir la même décision côté carte marchande). */
  allergens: string[];
  imageUrl: string | null;
};

export type ShopDetail = ShopCard & {
  phone: string | null;
  products: Product[];
};

export type ShopSlot = { id: string; date: string; label: string };

const SHOP_FIELDS =
  "id, name, city, address, description, hechsher_name, delivery_available, delivery_zone, paused, logo_url, cover_url";

function shopFrom(row: Record<string, unknown>): ShopCard {
  return {
    id: row.id as string,
    name: row.name as string,
    city: (row.city as string) ?? null,
    address: (row.address as string) ?? null,
    description: (row.description as string) ?? null,
    hechsherName: (row.hechsher_name as string) ?? null,
    deliveryAvailable: Boolean(row.delivery_available),
    deliveryZone: (row.delivery_zone as string) ?? null,
    paused: Boolean(row.paused),
    logoUrl: (row.logo_url as string) ?? null,
    coverUrl: (row.cover_url as string) ?? null,
  };
}

function toProduct(p: Record<string, unknown>): Product {
  return {
    id: p.id as string,
    name: p.title as string,
    description: (p.description as string) ?? null,
    price: Number(p.price ?? 0),
    category: (p.category as string) ?? "autre",
    available: Boolean(p.active),
    allergens: (p.allergens as string[]) ?? [],
    imageUrl: (p.image_url as string) ?? null,
  };
}

/** Les traiteurs approuvés, visibles sur la place de marché. */
export const listShops = cache(async function listShops(filters?: {
  search?: string;
}): Promise<ShopCard[]> {
  const supabase = await marketplaceClient();
  let query = supabase.from("traiteurs").select(SHOP_FIELDS).eq("status", "approved");

  if (filters?.search) {
    const needle = filters.search.replace(/[,()]/g, " ").trim();
    if (needle) query = query.ilike("name", `%${needle}%`);
  }

  const { data } = await run("listShops", query.order("name"));
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(shopFrom);
});

/** Un traiteur approuvé et son catalogue actif, pour sa fiche et sa carte. */
export const shopBySlug = cache(async function shopBySlug(id: string): Promise<ShopDetail | null> {
  const supabase = await marketplaceClient();
  const { data } = await run(
    "shopBySlug",
    supabase
      .from("traiteurs")
      .select(`${SHOP_FIELDS}, phone`)
      .eq("id", id)
      .eq("status", "approved")
      .maybeSingle(),
  );
  if (!data) return null;
  const row = data as unknown as Record<string, unknown>;

  const { data: productRows } = await run(
    "shopBySlug/products",
    supabase
      .from("traiteur_products")
      .select("id, title, description, price, category, active, allergens, image_url")
      .eq("traiteur_id", id)
      .order("created_at", { ascending: false }),
  );

  return {
    ...shopFrom(row),
    phone: (row.phone as string) ?? null,
    products: ((productRows ?? []) as unknown as Record<string, unknown>[]).map(toProduct),
  };
});

export type AdminTraiteur = ShopCard & {
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  createdAt: string;
};

/**
 * Tous les traiteurs, tous statuts — réservé à l'administration (RLS
 * `is_admin()`, voir supabase/migrations/0036_marketplace_admin_rls.sql).
 * `shopBySlug`/`listShops` ne montrent que les fiches approuvées : ces
 * fonctions-ci sont celles de la file de validation.
 */
export const allTraiteursForAdmin = cache(async function allTraiteursForAdmin(): Promise<AdminTraiteur[]> {
  const supabase = await marketplaceClient();
  const { data } = await run(
    "allTraiteursForAdmin",
    supabase
      .from("traiteurs")
      .select(`${SHOP_FIELDS}, status, rejection_reason, created_at`)
      .order("created_at", { ascending: true }),
  );

  return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => ({
    ...shopFrom(row),
    status: row.status as AdminTraiteur["status"],
    rejectionReason: (row.rejection_reason as string) ?? null,
    createdAt: row.created_at as string,
  }));
});

export type AdminTraiteurDetail = AdminTraiteur & {
  phone: string | null;
  patenteNumber: string | null;
  products: Product[];
};

/** Un dossier traiteur complet, tous statuts — pour /admin/validation/[id]. */
export const traiteurForAdmin = cache(async function traiteurForAdmin(
  id: string,
): Promise<AdminTraiteurDetail | null> {
  const supabase = await marketplaceClient();
  const { data } = await run(
    "traiteurForAdmin",
    supabase
      .from("traiteurs")
      .select(`${SHOP_FIELDS}, status, rejection_reason, created_at, phone, patente_number`)
      .eq("id", id)
      .maybeSingle(),
  );
  if (!data) return null;
  const row = data as unknown as Record<string, unknown>;

  const { data: productRows } = await run(
    "traiteurForAdmin/products",
    supabase
      .from("traiteur_products")
      .select("id, title, description, price, category, active, allergens, image_url")
      .eq("traiteur_id", id)
      .order("created_at", { ascending: false }),
  );

  return {
    ...shopFrom(row),
    status: row.status as AdminTraiteurDetail["status"],
    rejectionReason: (row.rejection_reason as string) ?? null,
    createdAt: row.created_at as string,
    phone: (row.phone as string) ?? null,
    patenteNumber: (row.patente_number as string) ?? null,
    products: ((productRows ?? []) as unknown as Record<string, unknown>[]).map(toProduct),
  };
});

/**
 * Les créneaux à venir proposés par le traiteur, pour la réservation.
 *
 * Un créneau complet (capacité atteinte par des commandes actives) est
 * simplement retiré de la liste — pas de case grisée « complet » à gérer
 * côté formulaire, en cohérence avec le reste du parcours simplifié.
 */
export const shopSlots = cache(async function shopSlots(id: string): Promise<ShopSlot[]> {
  const supabase = await marketplaceClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: slotRows }, { data: bookingRows }] = await Promise.all([
    run(
      "shopSlots",
      supabase
        .from("traiteur_slots")
        .select("id, slot_date, slot_label, capacity")
        .eq("traiteur_id", id)
        .gte("slot_date", today)
        .order("slot_date")
        .order("slot_label")
        .limit(60),
    ),
    run(
      "shopSlots/bookings",
      supabase
        .from("marketplace_orders")
        .select("slot_id")
        .eq("traiteur_id", id)
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
  )
    .filter((s) => s.capacity === null || (booked.get(s.id) ?? 0) < s.capacity)
    .map((s) => ({ id: s.id, date: s.slot_date, label: s.slot_label }));
});

export type MyTraiteur = {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  createdAt: string;
};

/**
 * Le dossier traiteur de la personne connectée, quel que soit son statut —
 * contrairement à `shopBySlug`, qui ne montre que les fiches approuvées.
 * Sert à /partenaire pour savoir quoi afficher : formulaire, suivi, ou refus.
 */
export const myTraiteur = cache(async function myTraiteur(): Promise<MyTraiteur | null> {
  const [supabase, user] = await Promise.all([marketplaceClient(), currentUser()]);
  if (!user) return null;

  // .limit(1) plutôt que .maybeSingle() : reste robuste même si un compte
  // finit par posséder plusieurs lignes.
  const { data } = await run(
    "myTraiteur",
    supabase
      .from("traiteurs")
      .select("id, name, status, rejection_reason, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1),
  );

  const row = (data as unknown as Record<string, unknown>[] | null)?.[0];
  if (!row) return null;

  return {
    id: row.id as string,
    name: row.name as string,
    status: row.status as MyTraiteur["status"],
    rejectionReason: (row.rejection_reason as string) ?? null,
    createdAt: row.created_at as string,
  };
});

/* ------------------------------------------------------------------ */
/* Favoris                                                              */
/* ------------------------------------------------------------------ */

/** Les traiteurs mis en favori par la personne connectée. */
export const myFavoriteIds = cache(async function myFavoriteIds(): Promise<Set<string>> {
  const [supabase, user] = await Promise.all([marketplaceClient(), currentUser()]);
  if (!user) return new Set();

  const { data } = await run(
    "myFavoriteIds",
    supabase.from("traiteur_favorites").select("traiteur_id").eq("profile_id", user.id),
  );

  return new Set(((data ?? []) as unknown as { traiteur_id: string }[]).map((f) => f.traiteur_id));
});

/**
 * Les fiches en favori, prêtes à afficher.
 *
 * Deux requêtes plutôt qu'une jointure : la seconde passe par `listShops`,
 * qui sait déjà quelles fiches sont approuvées — un favori posé sur un
 * traiteur depuis rejeté ne doit pas réapparaître.
 */
export const favoriteShops = cache(async function favoriteShops(): Promise<ShopCard[]> {
  const ids = await myFavoriteIds();
  if (ids.size === 0) return [];

  const shops = await listShops();
  return shops.filter((s) => ids.has(s.id));
});

/* ------------------------------------------------------------------ */
/* Avis client                                                          */
/* ------------------------------------------------------------------ */

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type ShopRating = { average: number; count: number };

/** La note moyenne d'un traiteur, arrondie au dixième — 0 avis, note nulle. */
export const shopRating = cache(async function shopRating(traiteurId: string): Promise<ShopRating> {
  const supabase = await marketplaceClient();
  const { data } = await run(
    "shopRating",
    supabase.from("marketplace_reviews").select("rating").eq("traiteur_id", traiteurId),
  );
  const rows = ((data ?? []) as unknown as { rating: number }[]).map((r) => Number(r.rating));
  if (rows.length === 0) return { average: 0, count: 0 };
  const average = rows.reduce((sum, r) => sum + r, 0) / rows.length;
  return { average: Math.round(average * 10) / 10, count: rows.length };
});

/** Les avis les plus récents sur un traiteur, pour sa fiche. */
export const shopReviews = cache(async function shopReviews(traiteurId: string): Promise<Review[]> {
  const supabase = await marketplaceClient();
  const { data } = await run(
    "shopReviews",
    supabase
      .from("marketplace_reviews")
      .select("id, rating, comment, created_at")
      .eq("traiteur_id", traiteurId)
      .order("created_at", { ascending: false })
      .limit(20),
  );
  return ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    rating: Number(r.rating),
    comment: (r.comment as string) ?? null,
    createdAt: r.created_at as string,
  }));
});

/** Le nombre de dossiers traiteurs en attente — pour le badge de /admin. */
export const pendingTraiteurCount = cache(async function pendingTraiteurCount(): Promise<number> {
  const supabase = await marketplaceClient();
  const { count } = await supabase
    .from("traiteurs")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
});

