import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  Traiteur,
  Product,
  Order,
  OrderWithClient,
  TraiteurStatus,
  ProductCategory,
  OrderStatus,
  Fulfillment,
  Allergen,
  TraiteurSlot,
  ReactivityTier,
  TraiteurScore,
  MilestoneBadge,
} from "@/lib/marketplace-types";

/** Types et constantes ré-exportés pour compat : voir lib/marketplace-types.ts (safe côté client). */
export * from "@/lib/marketplace-types";

function traiteurFrom(row: Record<string, unknown>): Traiteur {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    name: row.name as string,
    address: (row.address as string) ?? null,
    phone: (row.phone as string) ?? null,
    patenteNumber: (row.patente_number as string) ?? null,
    hechsherName: (row.hechsher_name as string) ?? null,
    deliveryAvailable: Boolean(row.delivery_available),
    deliveryZone: (row.delivery_zone as string) ?? null,
    status: row.status as TraiteurStatus,
    rejectionReason: (row.rejection_reason as string) ?? null,
    createdAt: row.created_at as string,
    lastSeenTier: (row.last_seen_tier as ReactivityTier) ?? null,
  };
}

function productFrom(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    traiteurId: row.traiteur_id as string,
    title: row.title as string,
    description: (row.description as string) ?? null,
    price: Number(row.price ?? 0),
    imageUrl: (row.image_url as string) ?? null,
    category: row.category as ProductCategory,
    quantityHint: (row.quantity_hint as string) ?? null,
    active: Boolean(row.active),
    allergens: ((row.allergens as string[]) ?? []) as Allergen[],
  };
}

/** Traiteurs approuvés, visibles sur la marketplace. */
export async function getApprovedTraiteurs(): Promise<Traiteur[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("traiteurs")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return (data ?? []).map(traiteurFrom);
}

/** Un traiteur approuvé + son catalogue actif, pour la page publique. */
export async function getTraiteurWithProducts(
  id: string,
): Promise<{ traiteur: Traiteur; products: Product[] } | null> {
  const supabase = await createClient();
  const { data: traiteurRow } = await supabase
    .from("traiteurs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!traiteurRow) return null;

  const { data: productRows } = await supabase
    .from("traiteur_products")
    .select("*")
    .eq("traiteur_id", id)
    .eq("active", true)
    .order("created_at", { ascending: true });

  return {
    traiteur: traiteurFrom(traiteurRow),
    products: (productRows ?? []).map(productFrom),
  };
}

/** Le profil traiteur de la personne connectée, quel que soit son statut. */
export async function getMyTraiteur(): Promise<Traiteur | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // .limit(1) plutôt que .maybeSingle() : reste robuste même si un compte
  // finit par posséder plusieurs lignes (ex. données de test), au lieu
  // d'échouer silencieusement et de repasser par le formulaire vierge.
  const { data } = await supabase
    .from("traiteurs")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);
  return data?.[0] ? traiteurFrom(data[0]) : null;
}

/** Vrai si la personne connectée fait partie de la liste blanche admin. */
export async function isMarketplaceAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_marketplace_admin");
  if (error) return false;
  return Boolean(data);
}

/** Tous les traiteurs (tous statuts), pour l'espace admin. Réservé aux admins par RLS. */
export async function getAllTraiteursForAdmin(): Promise<Traiteur[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("traiteurs")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(traiteurFrom);
}

/** Tous les produits d'un traiteur (actifs et inactifs), pour la gestion de son menu. */
export async function getMyTraiteurProducts(traiteurId: string): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("traiteur_products")
    .select("*")
    .eq("traiteur_id", traiteurId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(productFrom);
}

/** Un produit précis, pour son formulaire de modification (l'appelant doit vérifier la propriété). */
export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("traiteur_products").select("*").eq("id", id).maybeSingle();
  return data ? productFrom(data) : null;
}

function slotFrom(row: Record<string, unknown>): TraiteurSlot {
  return {
    id: row.id as string,
    traiteurId: row.traiteur_id as string,
    date: row.slot_date as string,
    label: row.slot_label as string,
  };
}

/** Les créneaux à venir proposés par un traiteur (pour la page de réservation ou sa gestion). */
export async function getTraiteurSlots(traiteurId: string): Promise<TraiteurSlot[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("traiteur_slots")
    .select("*")
    .eq("traiteur_id", traiteurId)
    .gte("slot_date", new Date().toISOString().slice(0, 10))
    .order("slot_date", { ascending: true })
    .order("slot_label", { ascending: true });
  return (data ?? []).map(slotFrom);
}

/** Les commandes d'un traiteur (toutes, hors annulées), pour son kanban de suivi. */
export async function getTraiteurOrders(traiteurId: string): Promise<OrderWithClient[]> {
  const supabase = await createClient();
  const { data: orderRows } = await supabase
    .from("marketplace_orders")
    .select("*, profiles(first_name, last_name)")
    .eq("traiteur_id", traiteurId)
    .neq("status", "annulee")
    .order("pickup_slot", { ascending: true });
  if (!orderRows?.length) return [];

  const orderIds = orderRows.map((row) => row.id as string);
  const { data: itemRows } = await supabase
    .from("marketplace_order_items")
    .select("*")
    .in("order_id", orderIds);

  return orderRows.map((row) => {
    const profile = row.profiles as { first_name?: string; last_name?: string } | null;
    const clientName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || "Client";

    return {
      id: row.id as string,
      traiteurId: row.traiteur_id as string,
      traiteurName: "",
      traiteurPhone: null,
      userId: row.user_id as string,
      status: row.status as OrderStatus,
      fulfillment: row.fulfillment as Fulfillment,
      pickupDate: (row.pickup_date as string) ?? null,
      pickupSlot: (row.pickup_slot as string) ?? null,
      totalAmount: Number(row.total_amount ?? 0),
      notes: (row.notes as string) ?? null,
      createdAt: row.created_at as string,
      pickupCode: (row.pickup_code as string) ?? null,
      cancelledBy: (row.cancelled_by as "client" | "traiteur") ?? null,
      clientName,
      items: (itemRows ?? [])
        .filter((item) => item.order_id === row.id)
        .map((item) => ({
          id: item.id as string,
          productId: (item.product_id as string) ?? null,
          title: item.title as string,
          price: Number(item.price ?? 0),
          quantity: Number(item.quantity ?? 1),
        })),
    };
  });
}

/**
 * Les commandes passées par la personne connectée, tous traiteurs confondus.
 * `shabbatId` filtre sur les commandes rattachées à un Shabbat précis.
 */
export async function getMyOrders(shabbatId?: string): Promise<Order[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("marketplace_orders")
    .select("*, traiteurs(name, phone)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (shabbatId) query = query.eq("shabbat_id", shabbatId);

  const { data: orderRows } = await query;
  if (!orderRows?.length) return [];

  const orderIds = orderRows.map((row) => row.id as string);
  const { data: itemRows } = await supabase
    .from("marketplace_order_items")
    .select("*")
    .in("order_id", orderIds);

  return orderRows.map((row) => ({
    id: row.id as string,
    traiteurId: row.traiteur_id as string,
    traiteurName: ((row.traiteurs as { name?: string } | null)?.name as string) ?? "Traiteur",
    traiteurPhone: (row.traiteurs as { phone?: string } | null)?.phone ?? null,
    userId: row.user_id as string,
    status: row.status as OrderStatus,
    fulfillment: row.fulfillment as Fulfillment,
    pickupDate: (row.pickup_date as string) ?? null,
    pickupSlot: (row.pickup_slot as string) ?? null,
    totalAmount: Number(row.total_amount ?? 0),
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
    pickupCode: (row.pickup_code as string) ?? null,
    cancelledBy: (row.cancelled_by as "client" | "traiteur") ?? null,
    items: (itemRows ?? [])
      .filter((item) => item.order_id === row.id)
      .map((item) => ({
        id: item.id as string,
        productId: (item.product_id as string) ?? null,
        title: item.title as string,
        price: Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 1),
      })),
  }));
}

/** Une commande + ses lignes, pour la page de confirmation. */
export async function getOrder(id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data: orderRow } = await supabase
    .from("marketplace_orders")
    .select("*, traiteurs(name, phone)")
    .eq("id", id)
    .maybeSingle();
  if (!orderRow) return null;

  const { data: itemRows } = await supabase
    .from("marketplace_order_items")
    .select("*")
    .eq("order_id", id);

  return {
    id: orderRow.id as string,
    traiteurId: orderRow.traiteur_id as string,
    traiteurName: ((orderRow.traiteurs as { name?: string } | null)?.name as string) ?? "Traiteur",
    traiteurPhone: (orderRow.traiteurs as { phone?: string } | null)?.phone ?? null,
    userId: orderRow.user_id as string,
    status: orderRow.status as OrderStatus,
    fulfillment: orderRow.fulfillment as Fulfillment,
    pickupDate: (orderRow.pickup_date as string) ?? null,
    pickupSlot: (orderRow.pickup_slot as string) ?? null,
    totalAmount: Number(orderRow.total_amount ?? 0),
    notes: (orderRow.notes as string) ?? null,
    createdAt: orderRow.created_at as string,
    pickupCode: (orderRow.pickup_code as string) ?? null,
    cancelledBy: (orderRow.cancelled_by as "client" | "traiteur") ?? null,
    items: (itemRows ?? []).map((row) => ({
      id: row.id as string,
      productId: (row.product_id as string) ?? null,
      title: row.title as string,
      price: Number(row.price ?? 0),
      quantity: Number(row.quantity ?? 1),
    })),
  };
}

/**
 * Score de réactivité d'un traiteur : temps de réponse moyen (sur les
 * commandes déjà traitées) et série de commandes honorées d'affilée.
 * `tier` reste `null` tant qu'il n'y a pas assez d'historique — pas de
 * badge affiché plutôt qu'un badge trompeur basé sur 1 ou 2 commandes.
 */
export async function getTraiteurScore(traiteurId: string): Promise<TraiteurScore> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("marketplace_orders")
    .select("status, cancelled_by, created_at, responded_at")
    .eq("traiteur_id", traiteurId)
    .order("created_at", { ascending: false })
    .limit(60);

  const rows = data ?? [];

  const responseTimes = rows
    .filter((row) => row.responded_at)
    .map(
      (row) =>
        (new Date(row.responded_at as string).getTime() -
          new Date(row.created_at as string).getTime()) /
        60000,
    )
    .slice(0, 30);

  const avgResponseMinutes = responseTimes.length
    ? responseTimes.reduce((sum, minutes) => sum + minutes, 0) / responseTimes.length
    : null;

  let tier: ReactivityTier | null = null;
  if (responseTimes.length >= 3 && avgResponseMinutes !== null) {
    if (avgResponseMinutes <= 15) tier = "or";
    else if (avgResponseMinutes <= 45) tier = "argent";
    else tier = "bronze";
  }

  // Série la plus récente d'affilée : on s'arrête à la première commande
  // annulée par le traiteur. Une commande encore "nouvelle" (pas traitée)
  // ne casse pas la série, elle est simplement ignorée dans le comptage.
  let streak = 0;
  for (const row of rows) {
    if (row.status === "nouvelle") continue;
    if (row.cancelled_by === "traiteur") break;
    streak += 1;
  }

  return { tier, avgResponseMinutes, streak };
}

const VOLUME_MILESTONES = [
  { count: 10, id: "volume-10", emoji: "🎖️", label: "10 commandes servies" },
  { count: 50, id: "volume-50", emoji: "🥈", label: "50 commandes servies" },
  { count: 100, id: "volume-100", emoji: "🏅", label: "100 commandes servies" },
  { count: 250, id: "volume-250", emoji: "👑", label: "250 commandes servies" },
] as const;

const TENURE_MILESTONES = [
  { months: 1, id: "tenure-1", emoji: "🌱", label: "1 mois sur lehaim" },
  { months: 3, id: "tenure-3", emoji: "🌿", label: "3 mois sur lehaim" },
  { months: 6, id: "tenure-6", emoji: "🌳", label: "6 mois sur lehaim" },
  { months: 12, id: "tenure-12", emoji: "🏆", label: "1 an sur lehaim" },
] as const;

/**
 * Badges d'ancienneté et de volume, indépendants du badge de réactivité.
 * On renvoie aussi les badges non débloqués (achieved: false) : les voir
 * grisés donne un objectif à atteindre, plutôt que de les cacher.
 */
export async function getTraiteurMilestones(traiteurId: string): Promise<MilestoneBadge[]> {
  const supabase = await createClient();

  const [{ count: ordersServed }, { data: traiteurRow }] = await Promise.all([
    supabase
      .from("marketplace_orders")
      .select("id", { count: "exact", head: true })
      .eq("traiteur_id", traiteurId)
      .eq("status", "recuperee"),
    supabase.from("traiteurs").select("created_at").eq("id", traiteurId).maybeSingle(),
  ]);

  const monthsSince = traiteurRow?.created_at
    ? (Date.now() - new Date(traiteurRow.created_at as string).getTime()) / (1000 * 60 * 60 * 24 * 30)
    : 0;

  const volumeBadges: MilestoneBadge[] = VOLUME_MILESTONES.map((m) => ({
    id: m.id,
    emoji: m.emoji,
    label: m.label,
    achieved: (ordersServed ?? 0) >= m.count,
  }));

  const tenureBadges: MilestoneBadge[] = TENURE_MILESTONES.map((m) => ({
    id: m.id,
    emoji: m.emoji,
    label: m.label,
    achieved: monthsSince >= m.months,
  }));

  return [...tenureBadges, ...volumeBadges];
}

/** L'avis déjà laissé par la personne connectée sur une commande, s'il existe. */
export async function getMyReviewForOrder(
  orderId: string,
): Promise<{ rating: number; comment: string | null } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("marketplace_reviews")
    .select("rating, comment")
    .eq("order_id", orderId)
    .eq("author_id", user.id)
    .maybeSingle();
  if (!data) return null;
  return { rating: Number(data.rating), comment: (data.comment as string) ?? null };
}

export type OrderMessage = {
  id: string;
  body: string;
  at: string;
  mine: boolean;
  /** "Vous", le nom du traiteur (côté client), ou le code de retrait (côté traiteur — jamais le nom réel du client). */
  authorLabel: string;
};

/**
 * Fil de discussion d'une commande, entre le client et le traiteur.
 * Null si la commande n'existe pas ou si la RLS refuse l'accès (ni client, ni traiteur).
 */
export async function getOrderThread(
  orderId: string,
): Promise<{ order: Order; messages: OrderMessage[] } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const order = await getOrder(orderId);
  if (!order) return null;

  const isClientViewer = order.userId === user.id;
  const code = order.pickupCode ?? `#${order.id.slice(0, 4).toUpperCase()}`;

  const { data } = await supabase
    .from("marketplace_order_messages")
    .select("id, body, created_at, sender_id")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  const messages: OrderMessage[] = (data ?? []).map((row) => {
    const mine = row.sender_id === user.id;
    return {
      id: row.id as string,
      body: row.body as string,
      at: row.created_at as string,
      mine,
      authorLabel: mine ? "Vous" : isClientViewer ? order.traiteurName : code,
    };
  });

  return { order, messages };
}
