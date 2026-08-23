"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Share, User } from "@/components/icons";
import { Card } from "@/components/ui";
import { MESSAGE_TABS, type MessageKind } from "@/lib/whatsapp";

/** S16 · Messages WhatsApp prêts à l'emploi. Éditables avant envoi. */
export function MessagePicker({
  messages,
  shareUrlPath,
}: {
  messages: Record<MessageKind, { body: string; audience: string }>;
  shareUrlPath: string;
}) {
  const t = useTranslations("shabbat.whatsapp");
  const [kind, setKind] = useState<MessageKind>("invitation");
  const [drafts, setDrafts] = useState<Partial<Record<MessageKind, string>>>({});
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const body = drafts[kind] ?? messages[kind].body;
  const label = MESSAGE_TABS.find((t) => t.key === kind)!.label;

  function fullText() {
    return `${body}\n${window.location.origin}${shareUrlPath}`;
  }

  async function copy() {
    await navigator.clipboard.writeText(fullText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function share() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(fullText())}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <>
      <div className="no-scrollbar mb-4.5 flex gap-2 overflow-x-auto pb-0.5">
        {MESSAGE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setKind(tab.key);
              setEditing(false);
            }}
            className={`shrink-0 rounded-full px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition-colors ${
              kind === tab.key
                ? "bg-ink text-white shadow-[var(--shadow-inset-pill)]"
                : "border-[1.5px] border-line-soft bg-white text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="mb-4 rounded-[22px] p-5 shadow-[var(--shadow-card-lg)]">
        <div className="mb-3.5 flex items-center gap-2">
          <span className="flex size-[26px] items-center justify-center rounded-full bg-teal text-white">
            <Share size={13} strokeWidth={2.2} />
          </span>
          <span className="text-[12px] font-extrabold tracking-[0.04em] text-ink/45 uppercase">
            {t("previewLabel", { label: label.replace(/^\S+\s/, "") })}
          </span>
        </div>

        {editing ? (
          <textarea
            value={body}
            onChange={(e) => setDrafts({ ...drafts, [kind]: e.target.value })}
            rows={6}
            className="w-full resize-none rounded-[16px_16px_16px_4px] bg-[#EAF6F5] px-3.5 py-3 text-[15px] leading-relaxed text-ink outline-none focus:ring-2 focus:ring-teal/40"
          />
        ) : (
          <div className="rounded-[16px_16px_16px_4px] bg-[#EAF6F5] px-3.5 py-3 text-[15px] leading-relaxed whitespace-pre-line text-ink">
            {body}
          </div>
        )}

        <div className="mt-3 flex items-center gap-1.5">
          <User size={13} strokeWidth={2} className="text-ink/40" />
          <span className="text-[12.5px] text-ink/65">{messages[kind].audience}</span>
        </div>
      </Card>

      <div className="flex gap-2.5">
        <button
          onClick={copy}
          className="flex-1 rounded-full border-2 border-line bg-white py-3 font-display text-[14.5px] font-semibold text-ink"
        >
          {copied ? `${t("copied")} ✓` : t("copyText")}
        </button>
        <button
          onClick={() => setEditing((v) => !v)}
          className="flex-1 rounded-full border-2 border-line bg-white py-3 font-display text-[14.5px] font-semibold text-ink"
        >
          {editing ? t("done") : `✏️ ${t("edit")}`}
        </button>
      </div>

      <button
        onClick={share}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 font-display text-[16px] font-semibold text-white transition-transform active:scale-[0.985]"
      >
        {t("shareOnWhatsapp")}
      </button>
    </>
  );
}
