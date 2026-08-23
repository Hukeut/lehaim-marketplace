import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/supabase/user";

export type AdminRole = "admin" | "merchant";

export type Shop = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  emoji: string;
  status: "draft" | "live" | "suspended";
  ownerId: string | null;
  productCount: number;
  createdAt: string;
};

/**
 * Rôle de la personne dans le back-office, ou null si elle n'y a pas sa
 * place. Mémoïsé : la coquille et la page posent la même question.
 */
export const backOfficeRole = cache(async function backOfficeRole(): Promise<AdminRole | null> {
  const supabase = await createClient();
  const user = await currentUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("back_office_role")
    .eq("id", user.id)
    .maybeSingle();
  const role = data?.back_office_role as string | undefined;

  if (role === "admin") return "admin";
  if (role === "merchant") return "merchant";
  return null;
});

/** Garde du back-office : renvoie à l'app ceux qui n'y ont rien à faire. */
export async function requireBackOffice(): Promise<AdminRole> {
  const role = await backOfficeRole();
  if (!role) redirect("/accueil");
  return role;
}

/** Chiffres du tableau de bord, calculés à la volée. */
export async function adminMetrics() {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const [accounts, shabbats, upcoming, invitations, confirmed, shops, products] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("shabbats").select("*", { count: "exact", head: true }),
    supabase.from("shabbats").select("*", { count: "exact", head: true }).gte("starts_at", since),
    supabase.from("invitations").select("*", { count: "exact", head: true }),
    supabase
      .from("invitations")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed"),
    supabase.from("shops").select("*", { count: "exact", head: true }),
    supabase.from("shop_products").select("*", { count: "exact", head: true }),
  ]);

  const invited = invitations.count ?? 0;
  return {
    accounts: accounts.count ?? 0,
    shabbats: shabbats.count ?? 0,
    upcoming: upcoming.count ?? 0,
    invitations: invited,
    confirmed: confirmed.count ?? 0,
    acceptance: invited ? Math.round(((confirmed.count ?? 0) / invited) * 100) : 0,
    shops: shops.count ?? 0,
    products: products.count ?? 0,
  };
}

/** Les boutiques visibles par la personne connectée, avec leur catalogue. */
export async function listShops(): Promise<Shop[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shops")
    .select("*, shop_products(id)")
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    category: row.category as string,
    description: (row.description as string) ?? null,
    address: (row.address as string) ?? null,
    city: (row.city as string) ?? null,
    phone: (row.phone as string) ?? null,
    emoji: (row.emoji as string) ?? "🛍️",
    status: row.status as Shop["status"],
    ownerId: (row.owner_id as string) ?? null,
    productCount: ((row.shop_products ?? []) as unknown[]).length,
    createdAt: row.created_at as string,
  }));
}

export async function getShop(id: string) {
  const supabase = await createClient();
  const [shop, products] = await Promise.all([
    supabase.from("shops").select("*").eq("id", id).maybeSingle(),
    supabase.from("shop_products").select("*").eq("shop_id", id).order("position"),
  ]);
  if (!shop.data) return null;
  return { shop: shop.data as Record<string, unknown>, products: products.data ?? [] };
}
