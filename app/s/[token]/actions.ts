"use server";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type RespondState = { error: string | null };

/**
 * Répondre à une invitation depuis le lien WhatsApp.
 *
 * Ce seul appel se faisait auparavant depuis le navigateur, ce qui obligeait
 * la page à embarquer le client Supabase : 248 Ko de JavaScript pour un unique
 * POST, sur l'écran d'arrivée de tout invité — souvent en 4G, souvent la
 * première chose qu'il voit de Lehaim. Le serveur a déjà un client sous la
 * main ; il n'y a aucune raison d'en fabriquer un second dans le téléphone.
 */
export async function respond(
  _prev: RespondState,
  formData: FormData,
): Promise<RespondState> {
  const t = await getTranslations("invitation.shareLanding");
  const token = String(formData.get("token") ?? "");
  const answer = String(formData.get("answer") ?? "");

  if (answer !== "confirmed" && answer !== "declined") {
    return { error: t("linkNoLongerValid") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("respond_by_token", { token, answer });

  if (error || !data) {
    return { error: error?.message ?? t("linkNoLongerValid") };
  }

  redirect(answer === "confirmed" ? `/invitation/${data}/confirmee` : `/invitation/${data}`);
}
