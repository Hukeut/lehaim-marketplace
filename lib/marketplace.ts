import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  Traiteur,
  Product,
  Order,
  TraiteurStatus,
  ProductCategory,
  OrderStatus,
  Fulfillment,
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

  const { data } = await supabase
    .from("traiteurs")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  return data ? traiteurFrom(data) : null;
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

/** Une commande + ses lignes, pour la page de confirmation. */
export async function getOrder(id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data: orderRow } = await supabase
    .from("marketplace_orders")
    .select("*, traiteurs(name)")
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
    userId: orderRow.user_id as string,
    status: orderRow.status as OrderStatus,
    fulfillment: orderRow.fulfillment as Fulfillment,
    pickupDate: (orderRow.pickup_date as string) ?? null,
    pickupSlot: (orderRow.pickup_slot as string) ?? null,
    totalAmount: Number(orderRow.total_amount ?? 0),
    notes: (orderRow.notes as string) ?? null,
    createdAt: orderRow.created_at as string,
    items: (itemRows ?? []).map((row) => ({
      id: row.id as string,
      productId: (row.product_id as string) ?? null,
      title: row.title as string,
      price: Number(row.price ?? 0),
      quantity: Number(row.quantity ?? 1),
    })),
  };
}
