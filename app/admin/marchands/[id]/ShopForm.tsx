"use client";

import { useTransition } from "react";
import { saveShop } from "@/app/admin/actions";

const CATEGORIES = [
  ["butcher", "Boucherie"],
  ["bakery", "Boulangerie"],
  ["wine", "Cave"],
  ["grocery", "Épicerie"],
  ["caterer", "Traiteur"],
] as const;

const STATUSES = [
  ["draft", "Brouillon"],
  ["live", "En ligne"],
  ["suspended", "Suspendue"],
] as const;

const field =
  "w-full rounded-field border-[1.5px] border-line bg-white px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-teal/40";

/** Fiche d'une boutique : informations générales, puis visibilité. */
export function ShopForm({
  shop,
}: {
  shop: {
    id: string | null;
    name: string;
    category: string;
    description: string;
    address: string;
    city: string;
    phone: string;
    emoji: string;
    status: string;
  };
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => saveShop(formData))}
      className="rounded-[18px] bg-white p-6 shadow-[var(--shadow-card)]"
    >
      {shop.id && <input type="hidden" name="id" value={shop.id} />}

      <div className="mb-4 font-display text-[17px] font-semibold">Informations générales</div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Label label="Nom de la boutique" className="sm:col-span-2">
          <input name="name" defaultValue={shop.name} placeholder="ex. Boucherie Hazan" className={field} required />
        </Label>

        <Label label="Catégorie">
          <select name="category" defaultValue={shop.category} className={field}>
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Label>

        <Label label="Emoji">
          <input name="emoji" defaultValue={shop.emoji} className={field} maxLength={4} />
        </Label>

        <Label label="Description courte" className="sm:col-span-2">
          <input
            name="description"
            defaultValue={shop.description}
            placeholder="Une phrase pour présenter la boutique"
            className={field}
          />
        </Label>

        <Label label="Adresse">
          <input name="address" defaultValue={shop.address} placeholder="Rue des Rosiers" className={field} />
        </Label>

        <Label label="Ville">
          <input name="city" defaultValue={shop.city} placeholder="Paris" className={field} />
        </Label>

        <Label label="Téléphone">
          <input name="phone" defaultValue={shop.phone} placeholder="01 42 …" className={field} />
        </Label>

        <Label label="Statut">
          <select name="status" defaultValue={shop.status} className={field}>
            {STATUSES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-coral px-6 py-3 text-[14px] font-bold text-white shadow-[var(--shadow-coral)] disabled:opacity-60"
      >
        {shop.id ? "Enregistrer" : "Créer la boutique"}
      </button>
    </form>
  );
}

function Label({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[12.5px] font-bold text-ink/60">{label}</span>
      {children}
    </label>
  );
}
