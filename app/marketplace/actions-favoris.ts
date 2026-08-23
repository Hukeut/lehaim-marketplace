"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/supabase/user";
import { run } from "@/lib/db";

/**
 * Le cœur de la fiche commerce.
 *
 * Un favori n'appartient qu'à celui qui l'a posé : la RLS ne l'ouvre à
 * personne d'autre, pas même au commerce concerné. Savoir qui vous suit n'est
 * pas la même chose que savoir combien.
 */
export async function toggleFavorite(formData: FormData): Promise<void> {
  const [supabase, user] = await Promise.all([createClient(), currentUser()]);
  const slug = String(formData.get("slug") ?? "");
  const shopId = String(formData.get("shop_id") ?? "");

  if (!user) redirect(`/connexion?suite=/marketplace/${slug}`);
  if (!shopId) return;

  if (formData.get("on") === "1") {
    await run(
      "toggleFavorite/add",
      supabase.from("shop_favorites").upsert(
        { profile_id: user.id, shop_id: shopId },
        { onConflict: "profile_id,shop_id" },
      ),
    );
  } else {
    await run(
      "toggleFavorite/remove",
      supabase.from("shop_favorites").delete().eq("profile_id", user.id).eq("shop_id", shopId),
    );
  }

  revalidatePath(`/marketplace/${slug}`);
  revalidatePath("/marketplace");
}
