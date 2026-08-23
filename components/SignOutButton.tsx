"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className = "" }: { className?: string }) {
  const t = useTranslations("common");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.push("/connexion");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className={`text-[14px] font-bold text-coral-deep disabled:opacity-50 ${className}`}
    >
      {busy ? t("signingOut") : t("signOut")}
    </button>
  );
}
