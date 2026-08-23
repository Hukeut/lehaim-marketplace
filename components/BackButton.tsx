"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "./icons";

/**
 * Retour arrière. On repasse par l'historique quand il existe, sinon on
 * retombe sur `fallback` — indispensable quand l'écran est ouvert
 * directement par un lien partagé.
 */
export function BackButton({
  fallback = "/accueil",
  label,
  className = "",
}: {
  fallback?: string;
  label?: string;
  className?: string;
}) {
  const t = useTranslations("common");
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label ?? t("back")}
      className={`-ms-1 flex size-8 shrink-0 items-center justify-center rounded-full text-ink transition-colors active:bg-line-soft ${className}`}
    >
      <ChevronLeft size={18} />
    </button>
  );
}

/** Variante posée par-dessus une illustration plein cadre. */
export function FloatingBackButton({ fallback = "/accueil" }: { fallback?: string }) {
  const t = useTranslations("common");
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={t("back")}
      className="absolute top-[54px] start-[18px] z-20 flex size-9 items-center justify-center rounded-full bg-white/92 text-ink shadow-[0_2px_10px_rgba(15,39,77,0.18)] backdrop-blur-sm transition-transform active:scale-95"
    >
      <ChevronLeft size={18} />
    </button>
  );
}
