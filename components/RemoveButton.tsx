"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";

/**
 * Retirer une ligne, en disant ce qu'on perd.
 *
 * Le composant enveloppe la ligne entière plutôt que de poser une croix à
 * côté : la confirmation REMPLACE la ligne, elle ne se déplie pas dans un
 * coin. Une question de sécurité tassée dans quarante pixels ne se lit pas.
 *
 * Deux temps plutôt qu'un `confirm()` du navigateur : celui-ci sort de l'app,
 * ne se traduit pas, et ne peut pas nommer les personnes concernées. Or c'est
 * tout l'enjeu — supprimer un apport emporte les prises en cascade, et celui
 * qui l'avait pris perd son rôle sans rien voir passer.
 */
export function RemoveRow({
  action,
  label,
  warning,
  children,
  className = "",
}: {
  /** Action serveur déjà liée à ce qu'elle doit supprimer. */
  action: () => Promise<void>;
  /** Ce qu'on supprime, en clair : « Plat principal », « 4 chaises ». */
  label: string;
  /** Ce que la suppression emporte, s'il y a lieu. */
  warning?: string;
  /** La ligne telle qu'elle s'affiche normalement. */
  children: ReactNode;
  className?: string;
}) {
  const t = useTranslations("common.remove");
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();

  if (asking) {
    return (
      <div
        className={`flex flex-col gap-2 bg-violet-wash px-4 py-3.5 ${className}`}
      >
        <p className="text-[13px] leading-snug font-bold text-violet">
          {t("confirm", { name: label })}
        </p>
        {warning && (
          <p className="text-[12px] leading-snug text-violet/80">{warning}</p>
        )}
        <div className="mt-0.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAsking(false)}
            className="text-[12.5px] font-bold text-ink/55 underline underline-offset-4"
          >
            {t("keep")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => action())}
            className="ms-auto rounded-full bg-violet px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-50"
          >
            {pending ? t("removing") : t("action")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      {children}
      <button
        type="button"
        onClick={() => setAsking(true)}
        aria-label={t("label", { name: label })}
        className="me-1.5 flex size-8 shrink-0 items-center justify-center rounded-full text-[17px] leading-none text-ink/30 transition-colors active:bg-line-soft"
      >
        ×
      </button>
    </div>
  );
}
