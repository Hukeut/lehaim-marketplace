"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { backOfficeRole } from "@/lib/admin";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length ? trimmed : null;
}

/** Crée ou met à jour une boutique. Les politiques RLS font le tri des droits. */
export async function saveShop(formData: FormData) {
  if (!(await backOfficeRole())) return;
  const supabase = await createClient();

  const id = text(formData, "id");
  const name = text(formData, "name") ?? "Boutique";
  const payload = {
    name,
    category: String(formData.get("category") ?? "grocery"),
    description: text(formData, "description"),
    address: text(formData, "address"),
    city: text(formData, "city"),
    phone: text(formData, "phone"),
    emoji: text(formData, "emoji") ?? "🛍️",
    status: String(formData.get("status") ?? "draft"),
  };

  if (id) {
    await supabase.from("shops").update(payload).eq("id", id);
    revalidatePath(`/admin/marchands/${id}`);
  } else {
    const { data } = await supabase
      .from("shops")
      .insert({ ...payload, slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}` })
      .select("id")
      .single();
    revalidatePath("/admin/marchands");
    if (data) redirect(`/admin/marchands/${data.id}`);
  }

  revalidatePath("/admin/marchands");
  revalidatePath("/marketplace");
}

export async function deleteShop(id: string) {
  if ((await backOfficeRole()) !== "admin") return;
  const supabase = await createClient();
  await supabase.from("shops").delete().eq("id", id);
  revalidatePath("/admin/marchands");
  redirect("/admin/marchands");
}

/** Ajout d'un produit. Pensé pour la saisie en rafale : on reste sur place. */
export async function addProduct(formData: FormData) {
  if (!(await backOfficeRole())) return;
  const supabase = await createClient();

  const shopId = String(formData.get("shop_id") ?? "");
  const name = text(formData, "name");
  if (!shopId || !name) return;

  const { count } = await supabase
    .from("shop_products")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", shopId);

  await supabase.from("shop_products").insert({
    shop_id: shopId,
    name,
    hint: text(formData, "hint"),
    price: Number(String(formData.get("price") ?? "0").replace(",", ".")) || 0,
    category: String(formData.get("category") ?? "other"),
    position: count ?? 0,
  });

  revalidatePath(`/admin/marchands/${shopId}`);
  revalidatePath("/marketplace");
}

export async function toggleProduct(shopId: string, productId: string, available: boolean) {
  if (!(await backOfficeRole())) return;
  const supabase = await createClient();
  await supabase.from("shop_products").update({ available: !available }).eq("id", productId);
  revalidatePath(`/admin/marchands/${shopId}`);
}

export async function removeProduct(shopId: string, productId: string) {
  if (!(await backOfficeRole())) return;
  const supabase = await createClient();
  await supabase.from("shop_products").delete().eq("id", productId);
  revalidatePath(`/admin/marchands/${shopId}`);
}

/** Change le rôle de back-office de quelqu'un. La fonction en base revérifie. */
export async function setBackOfficeRole(userId: string, role: string | null) {
  if ((await backOfficeRole()) !== "admin") return;
  const supabase = await createClient();
  // `admin_set_role` accepte explicitement NULL — c'est ainsi qu'on retire
  // un rôle (0012 : `if next_role is not null and next_role not in ...`).
  // Le générateur ne modélise pas la nullabilité des paramètres SQL et
  // déclare `string` : ici la conversion est plus juste que le type.
  await supabase.rpc("admin_set_role", { target: userId, next_role: role as string });
  revalidatePath("/admin/utilisateurs");
}
