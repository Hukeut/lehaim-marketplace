"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className = "" }: { className?: string }) {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    // Rechargement complet (pas de router.push) : le cache client du
    // routeur Next.js peut sinon réafficher une page déjà visitée
    // (profil, accueil...) avec ses données périmées d'avant déconnexion.
    window.location.href = "/onboarding";
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className={`text-[12.5px] font-bold text-coral-deep disabled:opacity-50 ${className}`}
    >
      {busy ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}
