"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function JoinButton({ token }: { token: string }) {
  const t = useTranslations("invitation.shareLanding");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setBusy(true);
    setError(null);
    const { data, error } = await createClient().rpc("join_by_token", { token });

    if (error || !data) {
      setBusy(false);
      setError(error?.message ?? t("linkNoLongerValid"));
      return;
    }

    router.push(`/invitation/${data}`);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={join}
        disabled={busy}
        className="flex w-full items-center justify-center rounded-full bg-coral py-4 font-display text-[15px] font-semibold text-white shadow-[var(--shadow-coral)] active:scale-[0.985] disabled:opacity-50"
      >
        {busy ? t("aMoment") : t("joinThisTable")}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-center text-[13.5px] font-bold text-coral-deep">
          {error}
        </p>
      )}
    </>
  );
}
