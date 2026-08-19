"use client";

import { useEffect, useRef, useState } from "react";
import { waShareLink } from "@/lib/whatsapp";
import { Close } from "@/components/icons";

/**
 * Bannière qui apparaît quand le statut change pendant que la page est
 * ouverte (grâce à `AutoRefresh`, qui refait un rendu serveur toutes les
 * quelques secondes). On compare au statut précédent via une ref : pas de
 * bruit au premier chargement, seulement sur un vrai changement.
 *
 * Envoyer un vrai WhatsApp automatique demanderait un compte WhatsApp
 * Business API (Twilio, Meta Cloud API...) qu'on n'a pas ; on propose donc
 * un lien wa.me pré-rempli, prêt à envoyer en un tap vers le contact de
 * son choix (le traiteur, le groupe du Shabbat, etc.).
 */
export function OrderStatusToast({
  status,
  label,
  alertText,
}: {
  status: string;
  label: string;
  alertText: string;
}) {
  const previous = useRef<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const changed = previous.current !== null && previous.current !== status;
    previous.current = status;
    if (changed) setVisible(true);
  }, [status]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-3 z-50 flex justify-center px-5">
      <div className="flex w-full max-w-sm items-center gap-2 rounded-[20px] bg-ink py-2.5 pr-2.5 pl-3.5 text-white shadow-[var(--shadow-float)]">
        <span className="flex-1 text-[11.5px] leading-snug font-bold">
          🔔 Commande {label.toLowerCase()}
        </span>
        <a
          href={waShareLink(alertText)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full bg-[#25D366] px-3 py-2 text-[10.5px] font-extrabold whitespace-nowrap"
        >
          Alerter sur WhatsApp
        </a>
        <button
          type="button"
          aria-label="Fermer"
          onClick={() => setVisible(false)}
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-white/60"
        >
          <Close size={12} strokeWidth={2.3} />
        </button>
      </div>
    </div>
  );
}
