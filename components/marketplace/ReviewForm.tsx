"use client";

import { useActionState, useState } from "react";
import { submitReview } from "@/app/marketplace/actions";
import type { ActionState } from "@/app/actions";
import { StarSolid } from "@/components/icons";
import { Card } from "@/components/ui";

const initial: ActionState = { ok: false, message: null };

/**
 * Formulaire d'avis, affiché une fois la commande récupérée et tant que la
 * personne n'a pas encore noté. Un avis par commande (contrainte unique côté
 * DB), pas d'édition — porté depuis lehaim-marketplace (0018_marketplace_
 * reviews.sql + components/marketplace/ReviewForm.tsx).
 */
export function ReviewForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(submitReview, initial);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);

  if (state.ok) {
    return (
      <Card className="mb-3 w-full p-4 text-center">
        <p className="text-[12.5px] font-bold text-olive-deep">Merci pour votre avis !</p>
      </Card>
    );
  }

  return (
    <Card className="mb-3 w-full p-4 text-left">
      <div className="mb-2 text-[11px] font-extrabold tracking-[0.03em] text-ink/50 uppercase">
        Comment s&apos;est passée votre commande ?
      </div>
      <form action={formAction}>
        <input type="hidden" name="order_id" value={orderId} />
        <input type="hidden" name="rating" value={rating} />
        <div className="mb-3 flex items-center justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(n)}
              className={`transition-transform active:scale-90 ${
                n <= (hovered || rating) ? "text-gold" : "text-line"
              }`}
            >
              <StarSolid size={28} />
            </button>
          ))}
        </div>
        <textarea
          name="comment"
          placeholder="Un mot pour le traiteur (optionnel)…"
          rows={2}
          className="mb-3 w-full resize-none rounded-field bg-line-soft/60 px-3.5 py-2.5 text-[12.5px] outline-none focus:ring-2 focus:ring-teal/40"
        />
        <button
          type="submit"
          disabled={pending || rating === 0}
          className="w-full rounded-full bg-ink px-4 py-2.5 text-[12.5px] font-bold text-white disabled:opacity-45"
        >
          {pending ? "Envoi…" : "Envoyer mon avis"}
        </button>
        {state.message && (
          <p className="mt-2 text-center text-[10.5px] font-bold text-coral-deep">{state.message}</p>
        )}
      </form>
    </Card>
  );
}
