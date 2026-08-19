"use client";

import { useActionState, useRef, useState } from "react";
import {
  addGuest,
  removeGuest,
  setGuestRole,
  setGuestStatus,
  type ActionState,
} from "@/app/actions";
import { Check, Close, Medal } from "@/components/icons";
import { Avatar, Card, StatusPill } from "@/components/ui";
import type { Invitation } from "@/lib/data";

const initial: ActionState = { ok: false, message: null };

/** Rôles ludiques proposés par le document produit. */
const ROLES = [
  "Le pâtissier",
  "Le caviste",
  "Le chef des salades",
  "Le gardien des hallot",
  "Le chef du chaud",
  "Le maître du frais",
  "Le boss de la table",
  "Le sauveur des assises",
];

export function GuestManager({
  shabbatId,
  invitations,
}: {
  shabbatId: string;
  invitations: Invitation[];
}) {
  const [state, formAction, pending] = useActionState(addGuest, initial);
  const [editing, setEditing] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <ul className="flex flex-col gap-2">
        {invitations.map((guest) => (
          <Card as="li" key={guest.invitationId} className="rounded-field">
            <div className="flex items-center gap-3 px-3.5 py-2.5">
              <Avatar initial={guest.initial} tone={guest.tone} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-bold">{guest.name}</div>
                {guest.role ? (
                  <div className="mt-0.5 flex items-center gap-1">
                    <Medal size={11} strokeWidth={2.6} className="shrink-0 text-coral-deep" />
                    <span className="truncate text-[10.5px] font-bold text-coral-deep">
                      {guest.role}
                      {guest.roleDetail ? ` · ${guest.roleDetail}` : ""}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      setEditing(editing === guest.invitationId ? null : guest.invitationId)
                    }
                    className="text-[10.5px] text-ink/50 underline-offset-2 hover:underline"
                  >
                    Attribuer un rôle
                  </button>
                )}
              </div>

              <StatusPill
                tone={
                  guest.status === "confirmed"
                    ? "success"
                    : guest.status === "declined"
                      ? "neutral"
                      : "warning"
                }
              >
                {guest.status === "confirmed"
                  ? "Confirmé"
                  : guest.status === "declined"
                    ? "Décliné"
                    : "En attente"}
              </StatusPill>

              {guest.status !== "confirmed" && (
                <form
                  action={setGuestStatus.bind(
                    null,
                    shabbatId,
                    guest.invitationId,
                    "confirmed",
                  )}
                >
                  <button
                    type="submit"
                    aria-label={`Marquer ${guest.name} comme présent`}
                    className="flex size-7 items-center justify-center rounded-full bg-olive/14 text-olive"
                  >
                    <Check size={13} />
                  </button>
                </form>
              )}

              <form action={removeGuest.bind(null, shabbatId, guest.invitationId)}>
                <button
                  type="submit"
                  aria-label={`Retirer ${guest.name}`}
                  className="flex size-7 items-center justify-center rounded-full bg-ink/6 text-ink/60"
                >
                  <Close size={12} />
                </button>
              </form>
            </div>

            {editing === guest.invitationId && (
              <RoleForm
                shabbatId={shabbatId}
                invitationId={guest.invitationId}
                onDone={() => setEditing(null)}
              />
            )}
          </Card>
        ))}
      </ul>

      <form
        action={(fd) => {
          formAction(fd);
          if (nameRef.current) nameRef.current.value = "";
        }}
        className="mt-4"
      >
        <input type="hidden" name="shabbat_id" value={shabbatId} />
        <div className="flex gap-2">
          <input
            ref={nameRef}
            name="guest_name"
            required
            placeholder="Prénom de l'invité"
            className="min-w-0 flex-1 rounded-field bg-white px-4 py-3 text-[13px] font-bold shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-field bg-teal px-4 text-[13px] font-bold text-white disabled:opacity-50"
          >
            Ajouter
          </button>
        </div>
        {state.message && (
          <p className="mt-2 text-[11.5px] font-bold text-ink/60">{state.message}</p>
        )}
      </form>
    </>
  );
}

function RoleForm({
  shabbatId,
  invitationId,
  onDone,
}: {
  shabbatId: string;
  invitationId: string;
  onDone: () => void;
}) {
  const [, formAction, pending] = useActionState(setGuestRole, initial);

  return (
    <form
      action={(fd) => {
        formAction(fd);
        onDone();
      }}
      className="border-t border-line-soft px-3.5 py-3"
    >
      <input type="hidden" name="shabbat_id" value={shabbatId} />
      <input type="hidden" name="invitation_id" value={invitationId} />
      <div className="mb-2 flex flex-wrap gap-1.5">
        {ROLES.map((role) => (
          <label key={role} className="cursor-pointer">
            <input type="radio" name="role_name" value={role} className="peer sr-only" />
            <span className="block rounded-full border-[1.5px] border-line-soft bg-white px-2.5 py-1 text-[10.5px] font-bold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white">
              {role}
            </span>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          name="role_detail"
          placeholder="Précision (côtes braisées…)"
          className="min-w-0 flex-1 rounded-field bg-line-soft px-3 py-2 text-[12px] outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-field bg-ink px-3 text-[12px] font-bold text-white disabled:opacity-50"
        >
          OK
        </button>
      </div>
    </form>
  );
}
