"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Revérifie régulièrement la page côté serveur, sans rechargement complet —
 * pour la file de validation admin (voir app/admin/layout.tsx) : un nouveau
 * dossier fournisseur ou une candidature déposée par un autre membre de
 * l'équipe doit apparaître sans que la personne ait à rafraîchir la page à
 * la main.
 */
export function AutoRefresh({ intervalMs = 20_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
