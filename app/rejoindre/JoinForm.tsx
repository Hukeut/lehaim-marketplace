"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

/** Extrait le jeton d'un lien collé, ou rend la saisie telle quelle. */
function tokenFromLink(value: string) {
  const match = value.match(/\/s\/([A-Za-z0-9_-]+)/);
  return match?.[1] ?? null;
}

/**
 * Rejoindre un Shabbat, par lien ou par code. Les deux voies aboutissent au
 * même endroit : on accepte donc une seule saisie et on devine laquelle
 * c'est, plutôt que d'imposer un choix avant même d'avoir collé quoi que ce
 * soit.
 */
export function JoinForm() {
  const t = useTranslations("shabbat.join");
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleaned = value.trim();
  const token = tokenFromLink(cleaned);
  const code = cleaned.replace(/\s/g, "").toUpperCase();

  async function join() {
    if (!cleaned) return;
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = token
      ? await supabase.rpc("join_by_token", { token })
      : await supabase.rpc("join_by_code", { code });

    if (rpcError || !data) {
      setBusy(false);
      setError(rpcError?.message ?? t("notFound"));
      return;
    }

    router.push(`/shabbat/${data}`);
    router.refresh();
  }

  return (
    <Card className="p-4">
      <label className="mb-1.5 block text-[14.5px] font-bold">{t("fieldLabel")}</label>
      <p className="mb-2.5 text-[13.5px] leading-relaxed text-ink/55">{t("fieldHint")}</p>
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        placeholder={t("placeholder")}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        className="mb-3 w-full rounded-field border-[1.5px] border-line bg-white px-4 py-3.5 text-[15px] font-bold tracking-[0.06em] outline-none focus:ring-2 focus:ring-teal/40"
      />
      {error && (
        <p role="alert" className="mb-2.5 text-[14px] font-bold text-coral-deep">
          {error}
        </p>
      )}
      <Button type="button" onClick={join} disabled={busy || !cleaned}>
        {busy ? t("joining") : t("joinButton")}
      </Button>
      {!token && cleaned.length > 0 && cleaned.length !== 6 && !cleaned.includes("/") && (
        <p className="mt-2 text-center text-[13px] text-ink/45">{t("codeLength")}</p>
      )}
    </Card>
  );
}
