"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { switchLanguage } from "@/app/actions";
import { LANGUAGE_OPTIONS } from "@/lib/languages";

/**
 * Changement de langue depuis le profil. Le choix vit dans un cookie, que
 * l'action recopie aussi dans le profil : le cookie ne suit qu'un
 * navigateur, la colonne suit la personne.
 */
export function LanguageSwitch() {
  const t = useTranslations("profile");
  const tl = useTranslations("onboarding");
  const current = useLocale();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const active = LANGUAGE_OPTIONS.find((option) => option.value === current);

  return (
    <div className="border-b border-line py-3.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-0.5"
      >
        <span className="text-[14px] font-bold">{t("language")}</span>
        <span className="flex items-center gap-2 text-[14px] text-ink/55">
          {active?.emoji} {active ? tl(active.labelKey) : current}
          <span className="text-ink/30">{open ? "⌄" : "›"}</span>
        </span>
      </button>

      {open && (
        <div className={`mt-2.5 flex flex-wrap gap-1.5 ${pending ? "opacity-60" : ""}`}>
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => switchLanguage(option.value))}
              className={`rounded-full px-3.5 py-2 text-[13.5px] font-bold ${
                option.value === current ? "bg-ink text-white" : "bg-line-soft text-ink/60"
              }`}
            >
              {option.emoji} {tl(option.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
