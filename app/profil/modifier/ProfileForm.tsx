"use client";

import { useActionState } from "react";
import { Pencil } from "@/components/icons";
import { Avatar, Button, Field, StickyFooter } from "@/components/ui";
import type { AvatarTone } from "@/components/ui";
import { saveProfile, type SaveState } from "./actions";

const initialState: SaveState = { ok: false, message: null };

const inputClass =
  "w-full rounded-field bg-white px-4 py-3.5 text-[13px] font-bold shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40";

export function ProfileForm({
  profile,
  editable,
}: {
  profile: {
    firstName: string;
    lastName: string | null;
    initial: string;
    tone: AvatarTone;
    avatarUrl: string | null;
    phone: string | null;
    about: string | null;
    email: string;
  };
  /** Faux quand personne n'est connecté : le formulaire reste consultable. */
  editable: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveProfile, initialState);

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-6 pt-3 pb-4">
        <div className="mb-5.5 flex justify-center">
          <div className="relative">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                className="size-21 rounded-full object-cover"
              />
            ) : (
              <Avatar initial={profile.initial} tone={profile.tone} size={84} />
            )}
            <span className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full bg-ink text-white ring-3 ring-cream">
              <Pencil size={13} />
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex gap-2.5">
            <Field label="Prénom" className="flex-1">
              <input
                name="first_name"
                defaultValue={profile.firstName}
                className={inputClass}
              />
            </Field>
            <Field label="Nom" className="flex-1">
              <input
                name="last_name"
                defaultValue={profile.lastName ?? ""}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="À propos de moi">
            <textarea
              name="about"
              rows={3}
              defaultValue={profile.about ?? ""}
              placeholder="Parlez un peu de vous à vos proches…"
              className={`${inputClass} resize-none font-normal`}
            />
          </Field>

          <Field label="Numéro de téléphone">
            <input
              name="phone"
              type="tel"
              defaultValue={profile.phone ?? ""}
              placeholder="06 12 34 56 78"
              className={inputClass}
            />
          </Field>

          <Field label="E-mail">
            <input
              value={profile.email}
              readOnly
              className={`${inputClass} text-ink/45`}
              aria-describedby="email-note"
            />
            <p id="email-note" className="mt-1.5 text-[11px] text-ink/45">
              L&apos;adresse sert à vous connecter, elle ne se modifie pas ici.
            </p>
          </Field>
        </div>

        {state.message && (
          <p
            role="status"
            className={`mt-4 rounded-field px-3.5 py-2.5 text-[12px] font-bold ${
              state.ok
                ? "bg-olive-wash text-olive-deep"
                : "bg-coral-wash text-coral-deep"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>

      <StickyFooter className="px-6">
        <Button type="submit" disabled={!editable || pending}>
          {pending ? "Enregistrement…" : editable ? "Enregistrer" : "Connectez-vous pour modifier"}
        </Button>
      </StickyFooter>
    </form>
  );
}
