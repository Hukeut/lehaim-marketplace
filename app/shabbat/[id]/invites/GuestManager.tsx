"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  removeGuest,
  setGuestRole,
  setGuestStatus,
  type ActionState,
} from "@/app/actions";
import { Check, Close, Medal } from "@/components/icons";
import { Avatar, Card, StatusPill } from "@/components/ui";
import type { Invitation } from "@/lib/data";

const initial: ActionState = { ok: false, message: null };

/**
 * Rôles ludiques proposés par le document produit. Volontairement non
 * traduits (Task 6) : la valeur choisie ici est stockée telle quelle dans
 * `invitations.role_name` et réaffichée en texte brut ailleurs (vue invité,
 * jour J) — comme un titre de mission ou un nom de plat, c'est une valeur de
 * donnée plutôt qu'un libellé d'interface figé. La traduire changerait ce
 * qui est stocké et casserait l'affichage existant sur les autres écrans.
 *
 * DETTE ASSUMÉE, pas un oubli : la vraie correction serait de stocker une
 * clé stable (ex. `patissier`) et de résoudre le libellé traduit à chaque
 * affichage (vue invité, jour J, ici) — le même changement de forme déjà
 * fait pour `Category`/`FundingMode` dans lib/missions.ts. Non fait ici
 * parce que ça touche le contrat de la colonne `invitations.role_name` en
 * base (donc potentiellement des lignes déjà écrites) et l'affichage sur
 * plusieurs écrans déjà livrés — un changement de modèle de données, pas
 * une extraction de chaîne, donc hors périmètre de cette tâche.
 */
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
  const t = useTranslations("invitation.guests");
  const tc = useTranslations("common");
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <>
      <ul className="flex flex-col gap-2">
        {invitations.map((guest) => (
          <Card as="li" key={guest.invitationId} className="rounded-field">
            <div className="flex items-center gap-3 px-3.5 py-2.5">
              <Avatar initial={guest.initial} tone={guest.tone} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold">{guest.name}</div>
                {guest.role ? (
                  <div className="mt-0.5 flex items-center gap-1">
                    <Medal size={11} strokeWidth={2.6} className="shrink-0 text-coral-deep" />
                    <span className="truncate text-[12px] font-bold text-coral-deep">
                      {guest.role}
                      {guest.roleDetail ? ` · ${guest.roleDetail}` : ""}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      setEditing(editing === guest.invitationId ? null : guest.invitationId)
                    }
                    className="text-[12px] text-ink/65 underline-offset-2 hover:underline"
                  >
                    {t("assignRole")}
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
                  ? tc("status.confirmed")
                  : guest.status === "declined"
                    ? tc("status.declined")
                    : t("statusPending")}
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
                    aria-label={t("markPresentAria", { name: guest.name })}
                    className="flex size-7 items-center justify-center rounded-full bg-olive/14 text-olive"
                  >
                    <Check size={13} />
                  </button>
                </form>
              )}

              <form action={removeGuest.bind(null, shabbatId, guest.invitationId)}>
                <button
                  type="submit"
                  aria-label={t("removeAria", { name: guest.name })}
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
  const t = useTranslations("invitation.guests");
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
            <span className="block rounded-full border-[1.5px] border-line-soft bg-white px-2.5 py-1 text-[12px] font-bold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white">
              {role}
            </span>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          name="role_detail"
          placeholder={t("roleDetailPlaceholder")}
          className="min-w-0 flex-1 rounded-field bg-line-soft px-3 py-2 text-[13.5px] outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-field bg-ink px-3 text-[13.5px] font-bold text-white disabled:opacity-50"
        >
          OK
        </button>
      </div>
    </form>
  );
}
