"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { StarSolid } from "./icons";

const DISMISSED_KEY = "lehaim.install.dismissed";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * G05 · Bannière d'installation. Elle n'apparaît que si le navigateur
 * propose réellement l'installation — pas de fausse promesse à l'écran.
 */
export function InstallBanner() {
  const t = useTranslations("install");
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    function onPrompt(event: Event) {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!prompt) return null;

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setPrompt(null);
  }

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    localStorage.setItem(DISMISSED_KEY, "1");
    setPrompt(null);
  }

  return (
    <div className="mb-3.5 flex items-center gap-3 rounded-[18px] bg-ink p-3.5 shadow-[0_10px_26px_rgba(15,39,77,0.3)]">
      <span className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-teal text-gold">
        <StarSolid size={18} />
      </span>
      <div className="min-w-0 flex-1 text-white">
        <div className="text-[14px] font-bold">{t("title")}</div>
        <div className="text-[12px] text-white/60">{t("subtitle")}</div>
      </div>
      <button
        onClick={install}
        className="shrink-0 rounded-full bg-coral px-3.5 py-2 text-xs font-bold text-white"
      >
        {t("action")}
      </button>
      <button
        onClick={dismiss}
        aria-label={t("dismiss")}
        className="shrink-0 text-lg leading-none text-white/40"
      >
        ×
      </button>
    </div>
  );
}
