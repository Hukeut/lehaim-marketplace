"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Accepte le rôle de co-organisateur et bascule sur le tableau de bord. */
export function AcceptCohost({ token }: { token: string }) {
  const t = useTranslations("shabbat.cohost");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    setError(null);

    const { data, error } = await createClient().rpc("become_cohost", { token });

    if (error || !data) {
      setBusy(false);
      setError(error?.message ?? t("linkNoLongerValid"));
      return;
    }

    router.push(`/shabbat/${data}`);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={accept}
        disabled={busy}
        className="flex w-full items-center justify-center rounded-full bg-coral py-4 font-display text-[15px] font-semibold text-white shadow-[var(--shadow-coral)] disabled:opacity-60"
      >
        {t("accept")}
      </button>
      {error && <p className="mt-2 text-center text-[13px] text-coral-deep">{error}</p>}
    </>
  );
}
