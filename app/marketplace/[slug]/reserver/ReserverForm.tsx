"use client";

import { useActionState, useEffect, useState } from "react";
import { createOrder } from "@/app/marketplace/actions";
import { money } from "@/lib/money";
import type { ActionState } from "@/app/actions";
import type { Product, ShopSlot } from "@/lib/shops";
import type { SavedCard } from "@/lib/payment-methods";

const initial: ActionState = { ok: true, message: null };

function readCart(shopId: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(`lehaim-cart-${shopId}`) ?? "{}");
  } catch {
    return {};
  }
}

const PAYMENT_METHOD_LABEL: Record<"card_bit" | "google_pay" | "apple_pay", string> = {
  card_bit: "Carte bancaire ou Bit",
  google_pay: "Google Pay",
  apple_pay: "Apple Pay",
};

/**
 * La réservation — un seul écran : mode, créneau, note, et on envoie.
 *
 * Le panier est relu depuis localStorage au chargement, pas transmis par
 * l'écran précédent : c'est la même source que la carte, donc jamais
 * désynchronisé avec elle.
 */
export function ReserverForm({
  shopId,
  products,
  deliveryAvailable,
  slots,
  defaultFullName,
  defaultPhone,
  savedCards,
}: {
  shopId: string;
  products: Product[];
  deliveryAvailable: boolean;
  slots: ShopSlot[];
  defaultFullName: string;
  defaultPhone: string;
  savedCards: SavedCard[];
}) {
  const [state, formAction, pending] = useActionState(createOrder, initial);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<"retrait" | "livraison">("retrait");
  const [fullName, setFullName] = useState(defaultFullName);
  const [phone, setPhone] = useState(defaultPhone);
  const defaultCard = savedCards.find((c) => c.isDefault) ?? savedCards[0] ?? null;
  const [savedCardId, setSavedCardId] = useState<string>(defaultCard ? defaultCard.id : "new");
  const [method, setMethod] = useState<"card_bit" | "google_pay" | "apple_pay">("card_bit");
  const [saveCard, setSaveCard] = useState(true);

  useEffect(() => {
    setCart(readCart(shopId));
  }, [shopId]);

  const lines = products
    .map((product) => ({ product, quantity: cart[product.id] ?? 0 }))
    .filter((l) => l.quantity > 0);
  const total = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  if (lines.length === 0) {
    return (
      <p className="px-[18px] py-16 text-center text-[13.5px] leading-relaxed text-ink/55">
        Votre panier est vide. Retournez à la carte pour ajouter des produits.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <input type="hidden" name="shop_id" value={shopId} />
      <input
        type="hidden"
        name="cart"
        value={JSON.stringify(lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })))}
      />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="full_name" value={fullName} />
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="saved_card_id" value={savedCardId === "new" ? "" : savedCardId} />
      <input type="hidden" name="payment_method" value={method} />
      <input type="hidden" name="save_card" value={savedCardId === "new" && saveCard ? "on" : ""} />

      <div className="flex-1 overflow-y-auto px-[18px] pb-5">
        {!state.ok && state.message && (
          <p className="mb-3 rounded-card bg-coral-wash px-4 py-3 text-[13px] font-bold text-coral-deep">
            {state.message}
          </p>
        )}

        <div className="mb-3 rounded-card bg-white p-4 shadow-[var(--shadow-card)]">
          <span className="mb-2 block font-display text-[15px] font-semibold">Votre commande</span>
          <ul className="flex flex-col gap-1.5">
            {lines.map((l) => (
              <li key={l.product.id} className="flex items-baseline gap-2 text-[13.5px]">
                <span className="font-bold">{l.quantity}×</span>
                <span className="min-w-0 flex-1">{l.product.name}</span>
                <span className="font-bold">{money(l.product.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>

        {deliveryAvailable && (
          <div className="mb-3 inline-flex rounded-full border-[1.5px] border-line bg-white p-1">
            <button
              type="button"
              onClick={() => setMode("retrait")}
              className={`rounded-full px-4 py-1.5 font-display text-[13px] font-semibold ${
                mode === "retrait" ? "bg-teal text-white" : "text-ink/55"
              }`}
            >
              Retrait
            </button>
            <button
              type="button"
              onClick={() => setMode("livraison")}
              className={`rounded-full px-4 py-1.5 font-display text-[13px] font-semibold ${
                mode === "livraison" ? "bg-teal text-white" : "text-ink/55"
              }`}
            >
              Livraison
            </button>
          </div>
        )}

        {mode === "livraison" && (
          <label className="mb-3 flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-ink/55">Adresse de livraison</span>
            <input
              name="address"
              required
              placeholder="Votre adresse"
              className="w-full rounded-field border-[1.5px] border-line-soft bg-sand px-3.5 py-3 text-[14px] font-bold outline-none focus:border-teal"
            />
          </label>
        )}

        <div className="mb-3 rounded-card bg-white p-4 shadow-[var(--shadow-card)]">
          <span className="mb-2 block font-display text-[15px] font-semibold">Créneau</span>
          {slots.length === 0 ? (
            <p className="text-[12.5px] text-ink/60">Aucun créneau proposé pour l&apos;instant.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <label key={slot.id} className="cursor-pointer">
                  <input type="radio" name="slot_id" value={slot.id} className="peer sr-only" />
                  <span className="inline-block rounded-full border-[1.5px] border-line-soft bg-white px-3 py-2 text-[12px] font-bold text-ink/60 peer-checked:border-teal peer-checked:bg-teal/12 peer-checked:text-teal-deep">
                    {new Date(`${slot.date}T12:00:00`).toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    · {slot.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <label className="mb-3 flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-ink/55">Note pour le traiteur</span>
          <textarea
            name="note"
            rows={2}
            placeholder="Une précision utile ?"
            className="w-full rounded-field border-[1.5px] border-line-soft bg-sand px-3.5 py-3 text-[13.5px] leading-relaxed outline-none focus:border-teal"
          />
        </label>

        <div className="mb-3 rounded-card bg-white p-4 shadow-[var(--shadow-card)]">
          <span className="mb-2 block font-display text-[15px] font-semibold">Vos coordonnées</span>
          <label className="mb-2.5 flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-ink/55">Nom complet</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Prénom Nom"
              className="w-full rounded-field border-[1.5px] border-line-soft bg-sand px-3.5 py-3 text-[14px] font-bold outline-none focus:border-teal"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-ink/55">Téléphone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              type="tel"
              placeholder="05X-XXXXXXX"
              className="w-full rounded-field border-[1.5px] border-line-soft bg-sand px-3.5 py-3 text-[14px] font-bold outline-none focus:border-teal"
            />
          </label>
        </div>

        <div className="mb-3 rounded-card bg-white p-4 shadow-[var(--shadow-card)]">
          <span className="mb-2 block font-display text-[15px] font-semibold">Moyen de paiement</span>

          {savedCards.length > 0 && (
            <div className="mb-2.5 flex flex-col gap-1.5">
              {savedCards.map((card) => (
                <label
                  key={card.id}
                  className="flex cursor-pointer items-center gap-2 rounded-field border-[1.5px] border-line-soft bg-sand px-3.5 py-3 has-[:checked]:border-teal has-[:checked]:bg-teal/10"
                >
                  <input
                    type="radio"
                    name="_saved_card_pick"
                    checked={savedCardId === card.id}
                    onChange={() => setSavedCardId(card.id)}
                    className="accent-teal"
                  />
                  <span className="text-[13.5px] font-bold">
                    {card.cardBrand ?? "Carte"} •••• {card.cardSuffix ?? "????"}
                    {card.isDefault && (
                      <span className="ml-1.5 text-[11px] font-bold text-teal-deep">par défaut</span>
                    )}
                  </span>
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-2 rounded-field border-[1.5px] border-line-soft bg-sand px-3.5 py-3 has-[:checked]:border-teal has-[:checked]:bg-teal/10">
                <input
                  type="radio"
                  name="_saved_card_pick"
                  checked={savedCardId === "new"}
                  onChange={() => setSavedCardId("new")}
                  className="accent-teal"
                />
                <span className="text-[13.5px] font-bold">Un autre moyen de paiement</span>
              </label>
            </div>
          )}

          {savedCardId === "new" && (
            <>
              <div className="mb-2.5 flex flex-wrap gap-2">
                {(Object.keys(PAYMENT_METHOD_LABEL) as (keyof typeof PAYMENT_METHOD_LABEL)[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMethod(key)}
                    className={`rounded-full border-[1.5px] px-3.5 py-2 text-[12.5px] font-bold ${
                      method === key
                        ? "border-teal bg-teal/12 text-teal-deep"
                        : "border-line-soft bg-sand text-ink/60"
                    }`}
                  >
                    {PAYMENT_METHOD_LABEL[key]}
                  </button>
                ))}
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-ink/60">
                <input
                  type="checkbox"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                  className="accent-teal"
                />
                Mémoriser ce moyen de paiement pour la prochaine fois
              </label>
            </>
          )}
        </div>

        <p className="text-[11.5px] leading-relaxed text-ink/50">
          {savedCardId === "new"
            ? "Vous serez redirigé vers un paiement sécurisé pour régler votre commande en ligne."
            : "Votre carte mémorisée sera débitée immédiatement, sans redirection."}
        </p>
      </div>

      <div className="border-t border-line-soft bg-white px-[18px] pt-3 pb-[22px]">
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="font-display text-[15px] font-semibold">Total</span>
          <span className="font-display text-[20px] font-semibold">{money(total)}</span>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-coral-deep py-3.5 text-center font-display text-[14.5px] font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Paiement…" : `Payer ${money(total)}`}
        </button>
      </div>
    </form>
  );
}
