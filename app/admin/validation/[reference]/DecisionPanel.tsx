"use client";

import { useState } from "react";
import { approveTraiteur, rejectTraiteur } from "@/app/marketplace/actions";

/**
 * Approuver ou rejeter — porté depuis Rraven666/lehaim, sans le troisième
 * geste "demander un complément" : ce backend n'a qu'un statut de refus, pas
 * d'aller-retour de dossier.
 */
export function DecisionPanel({ id }: { id: string }) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const ready = reason.trim().length > 0;

  return (
    <div className="flex flex-col gap-3">
      <form action={approveTraiteur.bind(null, id)}>
        <button
          type="submit"
          className="w-full rounded-full bg-coral-deep px-5 py-3 font-display text-[14.5px] font-semibold text-white"
        >
          Approuver et mettre en ligne
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
        <form action={rejectTraiteur.bind(null, id, reason)} className="flex flex-col gap-3">
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

          <div className="flex gap-2.5">
            <button
              type="submit"
              disabled={!ready}
              className="flex-1 rounded-full bg-ink px-4 py-2.5 font-display text-[13.5px] font-semibold text-white disabled:opacity-40"
            >
              Confirmer le refus
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
