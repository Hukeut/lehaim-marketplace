"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Share, WhatsApp } from "./icons";
import { Card } from "./ui";

/**
 * Lien de co-organisation. Volontairement distinct du lien d'invitation :
 * celui-ci donne les droits de gestion, on ne l'envoie donc pas au groupe
 * entier mais à une personne précise.
 */
export function CohostLink({ token, title }: { token: string; title: string }) {
  const t = useTranslations("shabbat.cohost");
  const [copied, setCopied] = useState(false);

  const url = () => `${window.location.origin}/co/${token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function whatsapp() {
    const text = encodeURIComponent(`${t("shareMessage", { title })}\n${url()}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <Card className="rounded-field px-3.5 py-3">
      <div className="text-[14px] font-bold">{t("linkTitle")}</div>
      <p className="mt-0.5 mb-2.5 text-[12.5px] leading-relaxed text-ink/55">{t("linkHint")}</p>
      <div className="flex items-center gap-2.5 rounded-field bg-cream/70 px-3 py-2.5">
        <Share size={14} className="shrink-0 text-ink" />
        <span className="min-w-0 flex-1 truncate text-[13px] text-ink/55">/co/{token}</span>
        <button type="button" onClick={copy} className="shrink-0 text-[13px] font-bold text-teal">
          {copied ? t("copied") : t("copy")}
        </button>
      </div>
      <button
        type="button"
        onClick={whatsapp}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-2.5 text-[14px] font-bold text-white transition-transform active:scale-[0.985]"
      >
        <WhatsApp size={15} />
        {t("sendOnWhatsapp")}
      </button>
    </Card>
  );
}
