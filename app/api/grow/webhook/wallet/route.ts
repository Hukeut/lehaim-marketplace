import { NextResponse } from "next/server";
import { parseGrowCallback } from "@/lib/grow";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Callback serveur-à-serveur de Grow pour un ajout de carte seul
 * (chargeType=3 + saveCardToken=1, sum=1 — voir "Ajouter une carte" dans
 * app/profil/paiement/actions.ts).
 *
 * Pas d'approveTransaction ici : la doc Grow l'interdit explicitement pour
 * les scénarios d'enregistrement de jeton seul.
 */
export async function POST(req: Request) {
  const fields = await parseGrowCallback(req);
  const processId = fields.processId;
  if (!processId || !fields.cardToken) {
    console.error("[lehaim] grow/webhook/wallet — processId ou cardToken manquant");
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const supabase = createServiceClient();
  const { data: intent, error } = await supabase
    .from("payment_method_intents")
    .select("id, user_id, process_token, consumed_at")
    .eq("process_id", processId)
    .maybeSingle();

  if (error || !intent || intent.process_token !== fields.processToken) {
    console.error("[lehaim] grow/webhook/wallet — intention introuvable ou jeton invalide", processId);
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  if (intent.consumed_at) {
    return NextResponse.json({ ok: true });
  }

  const { data: existingCards } = await supabase
    .from("payment_methods")
    .select("id")
    .eq("user_id", intent.user_id);

  const { error: insertError } = await supabase.from("payment_methods").upsert(
    {
      user_id: intent.user_id,
      card_token: fields.cardToken,
      card_brand: fields.cardBrand ?? null,
      card_suffix: fields.cardSuffix ?? null,
      card_exp: fields.cardExp ?? null,
      is_default: !existingCards || existingCards.length === 0,
    },
    { onConflict: "user_id,card_token" },
  );

  if (insertError) {
    console.error("[lehaim] grow/webhook/wallet/insert —", intent.user_id, insertError.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  await supabase
    .from("payment_method_intents")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", intent.id);

  return NextResponse.json({ ok: true });
}
