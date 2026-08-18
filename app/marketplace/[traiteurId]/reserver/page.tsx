"use client";

import { use, useActionState, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createOrder, type CartLine } from "@/app/marketplace/actions";
import type { ActionState } from "@/app/actions";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";
import { Button, Card, StickyFooter } from "@/components/ui";

const initial: ActionState = { ok: false, message: null };

const SLOTS = ["14h00–14h30", "14h30–15h00", "15h00–15h30", "15h30–16h00"];

function nextFriday() {
  const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

function cartKey(traiteurId: string) {
  return `lehaim-marketplace-cart-${traiteurId}`;
}

export default function Reserver({
  params,
}: {
  params: Promise<{ traiteurId: string }>;
}) {
  const { traiteurId } = use(params);
  const [state, formAction, pending] = useActionState(createOrder, initial);

  const [lines, setLines] = useState<CartLine[]>([]);
  const [traiteurName, setTraiteurName] = useState("Traiteur");
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [fulfillment, setFulfillment] = useState<"retrait" | "livraison">("retrait");
  const [date, setDate] = useState(nextFriday());
  const [slot, setSlot] = useState(SLOTS[1]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let quantities: Record<string, number> = {};
      try {
        quantities = JSON.parse(window.localStorage.getItem(cartKey(traiteurId)) ?? "{}");
      } catch {
        quantities = {};
      }
      const productIds = Object.keys(quantities);
      if (!productIds.length) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const [{ data: products }, { data: traiteur }] = await Promise.all([
        supabase.from("traiteur_products").select("id, title, price").in("id", productIds),
        supabase.from("traiteurs").select("name, delivery_available").eq("id", traiteurId).maybeSingle(),
      ]);

      if (cancelled) return;

      const built: CartLine[] = (products ?? []).map((p) => ({
        productId: p.id as string,
        title: p.title as string,
        price: Number(p.price),
        quantity: quantities[p.id as string] ?? 1,
      }));

      setLines(built);
      if (traiteur?.name) setTraiteurName(traiteur.name as string);
      setDeliveryAvailable(Boolean(traiteur?.delivery_available));
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [traiteurId]);

  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-3 flex items-center gap-2.5">
          <BackButton fallback={`/marketplace/${traiteurId}`} />
          <h1 className="flex-1 font-display text-[18px] font-semibold">Récupération</h1>
        </div>
      </div>

      <form action={formAction} className="flex flex-1 flex-col">
        <input type="hidden" name="traiteur_id" value={traiteurId} />
        <input type="hidden" name="fulfillment" value={fulfillment} />
        <input type="hidden" name="pickup_date" value={date} />
        <input type="hidden" name="pickup_slot" value={slot} />
        <input type="hidden" name="cart" value={JSON.stringify(lines)} />

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {loading && <p className="text-[12.5px] text-ink/50">Chargement…</p>}

          {!loading && !lines.length && (
            <p className="rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-6 text-center text-[12.5px] text-ink/45">
              Votre panier est vide.
            </p>
          )}

          {!loading && lines.length > 0 && (
            <>
              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillment("retrait")}
                  className={`flex-1 rounded-full py-2.5 text-[12.5px] font-bold transition-colors ${
                    fulfillment === "retrait"
                      ? "bg-ink text-white"
                      : "border-[1.5px] border-line-soft bg-white text-ink shadow-[var(--shadow-pill)]"
                  }`}
                >
                  Retrait
                </button>
                <button
                  type="button"
                  disabled={!deliveryAvailable}
                  onClick={() => setFulfillment("livraison")}
                  className={`flex-1 rounded-full py-2.5 text-[12.5px] font-bold transition-colors disabled:opacity-40 ${
                    fulfillment === "livraison"
                      ? "bg-ink text-white"
                      : "border-[1.5px] border-line-soft bg-white text-ink shadow-[var(--shadow-pill)]"
                  }`}
                >
                  Livraison
                </button>
              </div>

              <label className="mb-3 block text-[11px] font-bold text-ink/55">
                Date
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1.5 w-full rounded-field bg-white px-4 py-3 text-[12.5px] font-bold shadow-[var(--shadow-card)] outline-none"
                />
              </label>

              <div className="mb-4">
                <div className="mb-1.5 text-[11px] font-bold text-ink/55">Créneau</div>
                <div className="grid grid-cols-2 gap-2">
                  {SLOTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlot(s)}
                      className={`rounded-[8px] py-2.5 text-[11.5px] font-bold ${
                        slot === s ? "bg-teal text-white" : "bg-white text-ink shadow-[var(--shadow-pill)]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Card className="rounded-field p-3.5">
                <div className="mb-2 text-[9.5px] font-extrabold tracking-[0.04em] text-ink/45 uppercase">
                  {traiteurName}
                </div>
                <ul className="mb-2.5 flex flex-col gap-1.5">
                  {lines.map((line) => (
                    <li key={line.productId} className="flex justify-between text-[12px]">
                      <span className="text-ink/70">
                        {line.quantity} × {line.title}
                      </span>
                      <span className="font-bold">{(line.price * line.quantity).toFixed(0)}₪</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between border-t border-line-soft pt-2.5">
                  <span className="text-[12px] font-extrabold">Total</span>
                  <span className="text-[12px] font-extrabold">{total.toFixed(0)}₪</span>
                </div>
              </Card>

              <div className="mt-3 rounded-card bg-teal/10 p-3.5">
                <p className="text-[11.5px] font-bold leading-relaxed text-teal-deep">
                  💵 À régler sur place, directement auprès du traiteur.
                </p>
              </div>
            </>
          )}

          {state.message && (
            <p
              role="alert"
              className="mt-3 rounded-field bg-coral-wash px-3.5 py-2.5 text-[12px] font-bold text-coral-deep"
            >
              {state.message}
            </p>
          )}
        </div>

        <StickyFooter className="px-5">
          <Button type="submit" size="lg" disabled={pending || !lines.length}>
            {pending ? "Confirmation…" : "Confirmer la réservation"}
          </Button>
        </StickyFooter>
      </form>
    </main>
  );
}
