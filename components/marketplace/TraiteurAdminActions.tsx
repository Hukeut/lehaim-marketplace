"use client";

import { useActionState, useState } from "react";
import { approveTraiteur, rejectTraiteur } from "@/app/marketplace/actions";
import type { ActionState } from "@/app/actions";
import { Button } from "@/components/ui";

const initial: ActionState = { ok: false, message: null };

export function TraiteurAdminActions({ traiteurId }: { traiteurId: string }) {
  const [approveState, approveAction, approvePending] = useActionState(approveTraiteur, initial);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectTraiteur, initial);
  const [showReject, setShowReject] = useState(false);

  return (
    <div className="flex flex-col gap-2.5">
      <form action={approveAction}>
        <input type="hidden" name="traiteur_id" value={traiteurId} />
        <Button type="submit" size="lg" disabled={approvePending}>
          {approvePending ? "Approbation…" : "Approuver"}
        </Button>
      </form>

      {!showReject && (
        <Button type="button" variant="secondary" size="sm" onClick={() => setShowReject(true)}>
          Refuser
        </Button>
      )}

      {showReject && (
        <form action={rejectAction} className="flex flex-col gap-2">
          <input type="hidden" name="traiteur_id" value={traiteurId} />
          <textarea
            name="reason"
            rows={3}
            placeholder="Motif du refus (visible par le traiteur)"
            className="w-full rounded-field bg-white px-3.5 py-3 text-[12.5px] shadow-[var(--shadow-card)] outline-none"
          />
          <Button type="submit" variant="secondary" size="sm" disabled={rejectPending}>
            {rejectPending ? "Envoi…" : "Confirmer le refus"}
          </Button>
        </form>
      )}

      {(approveState.message || rejectState.message) && (
        <p
          role="alert"
          className="rounded-field bg-coral-wash px-3.5 py-2.5 text-[12px] font-bold text-coral-deep"
        >
          {approveState.message || rejectState.message}
        </p>
      )}
    </div>
  );
}
