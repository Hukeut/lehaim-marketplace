"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Share, WhatsApp } from "./icons";

/**
 * L'origine n'est lue qu'au moment du clic : pas d'état synchronisé sur un
 * effet, donc pas d'écart entre le rendu serveur et le rendu client.
 */
function shareUrl(token: string) {
  return `${window.location.origin}/s/${token}`;
}

export function CopyLink({ token }: { token: string }) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl(token));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex w-full items-center gap-2.5 rounded-field bg-white px-4 py-3 shadow-[var(--shadow-card)]">
      <Share size={15} className="shrink-0 text-ink" />
      <span className="min-w-0 flex-1 truncate text-start text-xs text-ink/55">
        /s/{token}
      </span>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 text-[13px] font-bold text-teal"
      >
        {copied ? t("copyLink.copied") : t("copyLink.copyLink")}
      </button>
    </div>
  );
}

/** Partage WhatsApp — le canal social prévu par le document produit. */
export function WhatsAppShare({
  token,
  message,
  label,
}: {
  token: string;
  message: string;
  /** Sans valeur, retombe sur le libellé traduit — un défaut de paramètre ne
   * peut pas appeler `useTranslations`, la résolution se fait donc ici. */
  label?: string;
}) {
  const t = useTranslations("common");

  function open() {
    const text = encodeURIComponent(`${message}\n${shareUrl(token)}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={open}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 font-display text-[16px] font-semibold text-white transition-transform active:scale-[0.985]"
    >
      {label ?? t("shareOnWhatsapp")}
    </button>
  );
}
