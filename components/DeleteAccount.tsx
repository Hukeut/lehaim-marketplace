"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Suppression définitive du compte, en deux temps. La fonction côté base
 * efface la ligne d'authentification ; le profil, les Shabbats organisés et
 * ce qui en dépend partent en cascade.
 */
export function DeleteAccount() {
  const t = useTranslations("profile.deleteAccount");
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("delete_my_account");

    if (rpcError) {
      setBusy(false);
      setError(rpcError.message);
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mt-6 border-t border-line pt-4">
      {armed ? (
        <>
          <p className="mb-2.5 text-[14px] leading-relaxed text-ink/60">{t("warning")}</p>
          {error && (
            <p role="alert" className="mb-2 text-[14px] font-bold text-coral-deep">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setArmed(false)}
              className="flex-1 rounded-full border-[1.5px] border-line py-2.5 text-[14.5px] font-bold text-ink/60"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={remove}
              className="flex-1 rounded-full bg-coral py-2.5 text-[14.5px] font-bold text-white disabled:opacity-50"
            >
              {t("confirm")}
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="text-[14.5px] font-bold text-coral-deep"
        >
          {t("action")}
        </button>
      )}
    </div>
  );
}
