"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/user";
import { marketplaceClient } from "@/lib/shops";
import { getCurrentProfile } from "@/lib/profile";
import { createPaymentProcess, pageCodeCardBit } from "@/lib/grow";

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/**
 * Ajouter une carte au portefeuille — sans la charger (sum=1,
 * chargeType=3, saveCardToken=1). Grow renverra le jeton sur
 * /api/grow/webhook/wallet, qu'on rapproche de cette demande via la table
 * payment_method_intents (voir supabase/migrations/0022).
 */
export async function addPaymentMethod(): Promise<void> {
  const user = await currentUser();
  if (!user) {
    redirect("/connexion?suite=/profil/paiement");
    return;
  }

  const profile = await getCurrentProfile();
  if (!profile || !profile.phone || profile.fullName.split(" ").filter(Boolean).length < 2) {
    // Grow exige un nom complet et un téléphone valides — on ne les devine
    // pas : un profil incomplet renvoie compléter sa fiche plutôt que
    // d'envoyer une valeur bidon à Grow.
    redirect("/profil/modifier?suite=/profil/paiement");
    return;
  }
  const fullName = profile.fullName;
  const phone = profile.phone;

  const supabase = await marketplaceClient();
  const origin = await siteOrigin();

  let process: { processId: string; processToken: string; url: string };
  try {
    process = await createPaymentProcess({
      pageCode: pageCodeCardBit(),
      sum: 1,
      chargeType: 3,
      saveCardToken: true,
      successUrl: `${origin}/profil/paiement?added=1`,
      cancelUrl: `${origin}/profil/paiement`,
      description: "Enregistrement d'une carte",
      fullName,
      phone,
      email: user.email ?? undefined,
      notifyUrl: `${origin}/api/grow/webhook/wallet`,
    });
  } catch (err) {
    console.error("[lehaim] addPaymentMethod —", user.id, err);
    redirect("/profil/paiement?error=1");
    return;
  }

  const { error } = await supabase.from("payment_method_intents").insert({
    user_id: user.id,
    process_id: process.processId,
    process_token: process.processToken,
  });
  if (error) {
    console.error("[lehaim] addPaymentMethod/intent —", user.id, error.message);
    redirect("/profil/paiement?error=1");
    return;
  }

  redirect(process.url);
}

export async function deletePaymentMethod(formData: FormData): Promise<void> {
  const user = await currentUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await marketplaceClient();
  await supabase.from("payment_methods").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/profil/paiement");
}

export async function setDefaultPaymentMethod(formData: FormData): Promise<void> {
  const user = await currentUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await marketplaceClient();
  await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", user.id);
  await supabase.from("payment_methods").update({ is_default: true }).eq("id", id).eq("user_id", user.id);

  revalidatePath("/profil/paiement");
}
