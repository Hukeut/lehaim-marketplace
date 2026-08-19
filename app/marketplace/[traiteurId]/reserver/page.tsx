"use client";

import { use, useActionState, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createOrder, type CartLine } from "@/app/marketplace/actions";
import type { ActionState } from "@/app/actions";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";
import { Button, Card, StickyFooter } from "@/components/ui";

const initial: ActionState = { ok: false, message: null };

function cartKey(traiteurId: string) {
  return `lehaim-marketplace-cart-${traiteurId}`;
}

type ShabbatOption = { id: string; title: string; startsAt: string; pickupCode: string | null };

function formatShabbatOption(s: ShabbatOption) {
  const date = new Date(s.startsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return `${s.title} · ${date}`;
}

type Slot = { id: string; date: string; label: string };

function formatSlotDate(value: string) {
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
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
  const [slots, setSlots] = useState<Slot[]>([]);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [loading, setLoading] = useState(true);
  const [shabbats, setShabbats] = useState<ShabbatOption[]>([]);
  const [shabbatId, setShabbatId] = useState("");

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
      const today = new Date().toISOString().slice(0, 10);
      const [{ data: products }, { data: traiteur }, { data: shabbatRows }, { data: slotRows }] =
        await Promise.all([
          supabase.from("traiteur_products").select("id, title, price").in("id", productIds),
          supabase.from("traiteurs").select("name, delivery_available").eq("id", traiteurId).maybeSingle(),
          // La RLS limite déjà aux Shabbats dont on est membre (hôte ou invité).
          supabase
            .from("shabbats")
            .select("id, title, starts_at, pickup_code")
            .order("starts_at", { ascending: false }),
          // Le traiteur propose ses créneaux : le client ne choisit que parmi ceux-ci.
          supabase
            .from("traiteur_slots")
            .select("id, slot_date, slot_label")
            .eq("traiteur_id", traiteurId)
            .gte("slot_date", today)
            .order("slot_date", { ascending: true })
            .order("slot_label", { ascending: true }),
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
      const builtShabbats: ShabbatOption[] = (shabbatRows ?? []).map((s) => ({
        id: s.id as string,
        title: s.title as string,
        startsAt: s.starts_at as string,
        pickupCode: (s.pickup_code as string) ?? null,
      }));
      setShabbats(builtShabbats);
      // Présélectionné plutôt que laissé sur "Aucun" : sans ça, le code de
      // retrait n'arrive jamais au traiteur si le client oublie ce champ.
      if (builtShabbats.length) setShabbatId(builtShabbats[0].id);

      const builtSlots: Slot[] = (slotRows ?? []).map((s) => ({
        id: s.id as string,
        date: s.slot_date as string,
        label: s.slot_label as string,
      }));
      setSlots(builtSlots);
      if (builtSlots.length) {
        setDate(builtSlots[0].date);
        setSlot(builtSlots[0].label);
      }
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
        <input type="hidden" name="shabbat_id" value={shabbatId} />

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

              {!slots.length ? (
                <p className="mb-4 rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-5 text-center text-[12px] leading-relaxed text-ink/50">
                  {traiteurName} n&apos;a pas encore proposé de créneau de retrait. Revenez un peu
                  plus tard.
                </p>
              ) : (
                <>
                  <div className="mb-3">
                    <div className="mb-1.5 text-[11px] font-bold text-ink/55">Date</div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {Array.from(new Set(slots.map((s) => s.date))).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setDate(d);
                            const first = slots.find((s) => s.date === d);
                            if (first) setSlot(first.label);
                          }}
                          className={`shrink-0 rounded-full px-3.5 py-2 text-[11.5px] font-bold capitalize ${
                            date === d
                              ? "bg-ink text-white"
                              : "bg-white text-ink shadow-[var(--shadow-pill)]"
                          }`}
                        >
                          {formatSlotDate(d)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1.5 text-[11px] font-bold text-ink/55">Créneau</div>
                    <div className="grid grid-cols-2 gap-2">
                      {slots
                        .filter((s) => s.date === date)
                        .map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSlot(s.label)}
                            className={`rounded-[8px] py-2.5 text-[11.5px] font-bold ${
                              slot === s.label
                                ? "bg-teal text-white"
                                : "bg-white text-ink shadow-[var(--shadow-pill)]"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                    </div>
                  </div>
                </>
              )}

              {shabbats.length > 0 && (
                <label className="mb-4 block text-[11px] font-bold text-ink/55">
                  Rattacher à un Shabbat (optionnel)
                  <select
                    value={shabbatId}
                    onChange={(e) => setShabbatId(e.target.value)}
                    className="mt-1.5 w-full rounded-field bg-white px-4 py-3 text-[12.5px] font-bold shadow-[var(--shadow-card)] outline-none"
                  >
                    <option value="">Aucun</option>
                    {shabbats.map((s) => (
                      <option key={s.id} value={s.id}>
                        {formatShabbatOption(s)}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1.5 block text-[10.5px] font-normal text-ink/40">
                    Le traiteur verra le code de ce Shabbat au lieu de votre nom.
                  </span>
                </label>
              )}

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
          <Button type="submit" size="lg" disabled={pending || !lines.length || !date || !slot}>
            {pending ? "Confirmation…" : "Confirmer la réservation"}
          </Button>
        </StickyFooter>
      </form>
    </main>
  );
}
