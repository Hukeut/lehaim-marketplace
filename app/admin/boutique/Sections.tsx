"use client";

import { useActionState } from "react";
import { saveCover, saveIdentity, saveLogo, saveService } from "./actions";
import { ImageUploader } from "@/components/marketplace/ImageUploader";
import type { ActionState } from "@/app/actions";
import type { MerchantShop } from "@/lib/merchant";

const initial: ActionState = { ok: true, message: null };

const input =
  "rounded-[14px] border-[1.5px] border-line bg-sand px-4 py-3 text-[14px] font-bold outline-none focus:border-teal";

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-[18px] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-0.5">
        <span className="font-display text-[16px] font-semibold">{title}</span>
        {hint && <span className="text-[12px] leading-snug text-ink/50">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Saved({ state }: { state: ActionState }) {
  if (!state.ok && state.message) {
    return (
      <p className="rounded-[14px] bg-coral-wash px-4 py-2.5 text-[12.5px] font-bold text-coral-deep">
        {state.message}
      </p>
    );
  }
  return null;
}

function Submit({ pending, label = "Enregistrer" }: { pending: boolean; label?: string }) {
  return (
    <div className="flex border-t border-line-soft pt-4">
      <button
        type="submit"
        disabled={pending}
        className="ms-auto rounded-full bg-coral-deep px-6 py-2.5 font-display text-[13.5px] font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : label}
      </button>
    </div>
  );
}

export function Identity({ shop }: { shop: MerchantShop }) {
  const [state, action, pending] = useActionState(saveIdentity, initial);

  return (
    <Panel title="Votre fiche" hint="Ce que voient les clients sur votre page.">
      <div className="flex flex-col gap-4 sm:flex-row">
        <ImageUploader
          shopId={shop.id}
          kind="logo"
          label="Logo"
          currentUrl={shop.logoUrl}
          onUploaded={(url) => void saveLogo(url)}
          shape="square"
        />
        <ImageUploader
          shopId={shop.id}
          kind="cover"
          label="Photo de couverture"
          hint="Affichée en haut de votre fiche."
          currentUrl={shop.coverUrl}
          onUploaded={(url) => void saveCover(url)}
          shape="wide"
        />
      </div>

      <form action={action} className="flex flex-col gap-4">
        <Saved state={state} />

        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-[12px] font-bold text-ink/55">Nom commercial</span>
            <input name="name" defaultValue={shop.name} required className={input} />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-[12px] font-bold text-ink/55">Téléphone public</span>
            <input name="phone" defaultValue={shop.phone ?? ""} className={input} />
          </label>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex min-w-0 flex-[2] flex-col gap-1.5">
            <span className="text-[12px] font-bold text-ink/55">Adresse</span>
            <input name="address" defaultValue={shop.address ?? ""} className={input} />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-[12px] font-bold text-ink/55">Ville</span>
            <input name="city" defaultValue={shop.city ?? ""} className={input} />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-ink/55">Description</span>
          <textarea
            name="description"
            rows={3}
            defaultValue={shop.description ?? ""}
            className="rounded-[14px] border-[1.5px] border-line bg-sand px-4 py-3 text-[14px] leading-relaxed outline-none focus:border-teal"
          />
        </label>

        <Submit pending={pending} />
      </form>
    </Panel>
  );
}

/**
 * Réglage de service — remplace le panneau "Horaires et remise" de Rraven.
 * Notre schéma ne porte ni grille d'horaires ni capacité par créneau (voir
 * /admin/creneaux, qui reste à ajout manuel) ; seul le temps de préparation
 * par défaut est réellement branché aujourd'hui.
 */
export function ServiceSettings({ shop }: { shop: MerchantShop }) {
  const [state, action, pending] = useActionState(saveService, initial);

  return (
    <Panel
      title="Service"
      hint="Le temps de préparation proposé par défaut quand vous acceptez une commande."
    >
      <form action={action} className="flex flex-col gap-4">
        <Saved state={state} />

        <label className="flex max-w-[220px] flex-col gap-1.5">
          <span className="text-[12px] font-bold text-ink/55">Temps de préparation</span>
          <input
            name="prep_minutes"
            type="number"
            min={5}
            max={240}
            defaultValue={shop.prepMinutes}
            className={input}
          />
        </label>

        <Submit pending={pending} />
      </form>
    </Panel>
  );
}
