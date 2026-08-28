import { NextResponse } from "next/server";
import { approveTransaction, growCField, parseGrowCallback } from "@/lib/grow";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Callback serveur-à-serveur de Grow pour le paiement d'une commande
 * (notifyUrl fourni à createPaymentProcess dans createOrder).
 *
 * Pas de session utilisateur ici (appel machine-à-machine) — tout passe par
 * le client service_role, et la sécurité repose sur la correspondance
 * processId/processToken avec ce qu'on a stocké sur la commande au moment
 * de l'ouverture du paiement (Grow ne signe pas ses callbacks).
 */
export async function POST(req: Request) {
  const fields = await parseGrowCallback(req);
  const orderId = growCField(fields, 1);
  if (!orderId) {
    console.error("[lehaim] grow/webhook/order — cField1 (id de commande) manquant");
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const supabase = createServiceClient();
  const { data: order, error } = await supabase
    .from("marketplace_orders")
    .select("id, user_id, grow_process_id, grow_process_token, grow_page_code, payment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    console.error("[lehaim] grow/webhook/order — commande introuvable", orderId, error?.message);
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const processMatches =
    order.grow_process_id === fields.processId && order.grow_process_token === fields.processToken;
  if (!processMatches) {
    console.error("[lehaim] grow/webhook/order — processId/processToken ne correspondent pas", orderId);
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  if (order.payment_status === "paid") {
    // Grow peut renvoyer le même callback plusieurs fois — on acquitte sans rejouer.
    return NextResponse.json({ ok: true });
  }

  const { error: updateError } = await supabase
    .from("marketplace_orders")
    .update({
      payment_status: "paid",
      grow_transaction_id: fields.transactionId ?? null,
      grow_transaction_token: fields.transactionToken ?? null,
      grow_asmachta: fields.asmachta ?? null,
    })
    .eq("id", orderId);

  if (updateError) {
    console.error("[lehaim] grow/webhook/order/update —", orderId, updateError.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // La présence de cardToken signifie que le client a coché "mémoriser
  // cette carte" — c'est la seule condition dont on a besoin, saveCardToken
  // n'était demandé à Grow que si l'utilisateur l'a explicitement voulu.
  if (fields.cardToken) {
    const { data: existingCards } = await supabase
      .from("payment_methods")
      .select("id")
      .eq("user_id", order.user_id);

    await supabase.from("payment_methods").upsert(
      {
        user_id: order.user_id,
        card_token: fields.cardToken,
        card_brand: fields.cardBrand ?? null,
        card_suffix: fields.cardSuffix ?? null,
        card_exp: fields.cardExp ?? null,
        is_default: !existingCards || existingCards.length === 0,
      },
      { onConflict: "user_id,card_token" },
    );
  }

  if (order.grow_page_code) {
    try {
      await approveTransaction(order.grow_page_code, fields);
    } catch (err) {
      console.error("[lehaim] grow/webhook/order/approve —", orderId, err);
      // Statut non-200 : Grow réessaiera le callback, ce qui nous laisse une
      // chance de rattraper une panne transitoire côté approveTransaction.
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
