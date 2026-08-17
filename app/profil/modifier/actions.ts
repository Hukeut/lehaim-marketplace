"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SaveState = { ok: boolean; message: string | null };

/** Enregistre le profil dans la table `profiles` existante. */
export async function saveProfile(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "Vous n'êtes pas connecté." };

  const text = (name: string) => {
    const value = formData.get(name);
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed.length ? trimmed : null;
  };

  const payload: Record<string, string | null> = {
    first_name: text("first_name"),
    last_name: text("last_name"),
    phone: text("phone"),
    about: text("about"),
  };

  let { error } = await supabase.from("profiles").update(payload).eq("id", user.id);

  // La colonne `about` n'existe qu'après la migration v2 : on réessaie sans.
  if (error?.code === "42703" || error?.message?.includes("about")) {
    delete payload.about;
    ({ error } = await supabase.from("profiles").update(payload).eq("id", user.id));
  }

  if (error) return { ok: false, message: error.message };

  revalidatePath("/profil");
  revalidatePath("/accueil");
  return { ok: true, message: "Modifications enregistrées" };
}
