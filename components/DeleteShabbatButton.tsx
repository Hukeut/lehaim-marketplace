"use client";

import { useTransition } from "react";
import { deleteShabbat } from "@/app/actions";

export function DeleteShabbatButton({ shabbatId, title }: { shabbatId: string; title: string }) {
  const [pending, startTransition] = useTransition();

  function remove() {
    const sure = confirm(
      `Supprimer définitivement « ${title} » ?\n\nInvitations, menu, courses, dépenses et messages liés seront supprimés. Vos commandes en cours chez un traiteur pour ce Shabbat seront automatiquement annulées.\n\nCette action est irréversible.`,
    );
    if (!sure) return;
    startTransition(() => deleteShabbat(shabbatId));
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={remove}
      className="w-full rounded-full px-3.5 py-3 text-center text-[12px] font-bold text-coral-deep disabled:opacity-50"
    >
      {pending ? "Suppression…" : "Supprimer ce Shabbat"}
    </button>
  );
}
