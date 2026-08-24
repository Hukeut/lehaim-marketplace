"use client";

import { useState, useActionState } from "react";
import { approveTraiteur, rejectTraiteur } from "@/app/marketplace/actions";
import type { ActionState } from "@/app/actions";

const initial: ActionState = { ok: false, message: null };

/**
 * Approuver ou rejeter — porté depuis Rraven666/lehaim, sans le troisième
 * geste "demander un complément" : ce backend n'a qu'un statut de refus, pas
 * d'aller-retour de dossier.
 *
 * `useActionState` plutôt qu'un simple `<form action={...}>` : les deux
 * actions renvoient désormais un résultat (voir app/marketplace/actions.ts),
 * et il fallait un endroit pour l'afficher — avant, un refus de la garde
 * admin ou une erreur base passait inaperçu, le bouton semblant ne rien
 * faire.
 */
export function DecisionPanel({ id }: { id: string }) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const ready = reason.trim().length > 0;

  // `useActionState` appelle l'action avec (état précédent, payload) : un
  // simple `.bind(null, id)` aurait glissé cet état précédent à la place du
  // motif de refus attendu par `rejectTraiteur`. Ces enveloppes remettent les
  // arguments dans le bon ordre.
  const [approveState, approveAction, approving] = useActionState(
    async (_prev: ActionState) => approveTraiteur(id),
    initial,
  );
  const [rejectState, rejectAction, rejecting] = useActionState(
    async (_prev: ActionState, motif: string) => rejectTraiteur(id, motif),
    initial,
  );

  return (
    <div className="flex flex-col gap-3">
      {approveState.message && (
        <p
          role="alert"
          className="rounded-field bg-coral-wash px-3.5 py-2.5 text-[12px] leading-snug font-bold text-coral-deep"
        >
          {approveState.message}
        </p>
      )}

      <form action={approveAction}>
        <button
          type="submit"
          disabled={approving}
          className="w-full rounded-full bg-coral-deep px-5 py-3 font-display text-[14.5px] font-semibold text-white disabled:opacity-50"
        >
          {approving ? "Approbation…" : "Approuver et mettre en ligne"}
        </button>
      </form>

      {!showReject ? (
        <button
          type="button"
          onClick={() => setShowReject(true)}
          className="w-full rounded-full border-2 border-[rgba(138,35,70,0.35)] px-4 py-2.5 font-display text-[13.5px] font-semibold text-[#8A2346]"
        >
          Rejeter
        </button>
      ) : (
        <form action={() => rejectAction(reason)} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-ink/55">Motif du refus</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              autoFocus
              placeholder="Le certificat de cacherout n'est pas reconnu."
              className="rounded-[14px] bg-white px-3.5 py-3 text-[13.5px] leading-relaxed shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40"
            />
          </label>

          <p className="text-[12px] leading-relaxed text-ink/50">
            Ce texte est envoyé tel quel au traiteur.
          </p>

          {rejectState.message && (
            <p
              role="alert"
              className="rounded-field bg-coral-wash px-3.5 py-2.5 text-[12px] leading-snug font-bold text-coral-deep"
            >
              {rejectState.message}
            </p>
          )}

          <div className="flex gap-2.5">
            <button
              type="submit"
              disabled={!ready || rejecting}
              className="flex-1 rounded-full bg-ink px-4 py-2.5 font-display text-[13.5px] font-semibold text-white disabled:opacity-40"
            >
              {rejecting ? "Envoi…" : "Confirmer le refus"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReject(false);
                setReason("");
              }}
              className="rounded-full border-2 border-line px-4 py-2.5 font-display text-[13.5px] font-semibold text-ink/60"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
