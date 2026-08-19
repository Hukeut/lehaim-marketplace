"use client";

import { useActionState, useState, type ReactNode } from "react";
import { FloatingBackButton } from "./BackButton";
import { Button, Screen } from "./ui";
import type { Option } from "@/lib/onboarding";

/* ------------------------------------------------------------------ */
/* Ossature d'une étape                                                 */
/* ------------------------------------------------------------------ */

/**
 * Bandeau illustré des étapes : image, dégradé de lisibilité, retour et
 * compteur « n / 4 ». La hauteur varie selon la densité de l'écran —
 * 190px quand il n'y a qu'un champ, 170px quand il y a une liste de choix.
 */
export function StepHero({
  image,
  height = 170,
  position = "center 25%",
  step,
  total = 4,
  back,
  close,
}: {
  image: string;
  height?: number;
  position?: string;
  step?: number;
  total?: number;
  /** Destination de repli du retour quand il n'y a pas d'historique. */
  back?: string;
  /** Remplace le retour par une croix de sortie (parcours facultatif). */
  close?: string;
}) {
  return (
    <div className="relative shrink-0" style={{ height }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        className="size-full object-cover"
        style={{ objectPosition: position }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent" />

      {close ? <CloseButton href={close} /> : back && <FloatingBackButton fallback={back} />}

      {step !== undefined && (
        <span className="absolute top-[60px] right-5 rounded-full bg-white/92 px-[11px] py-[5px] text-[11px] font-extrabold text-ink backdrop-blur-sm">
          {step} / {total}
        </span>
      )}
    </div>
  );
}

function CloseButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      aria-label="Quitter"
      className="absolute top-[54px] left-[18px] z-20 flex size-9 items-center justify-center rounded-full bg-white/92 text-[17px] text-ink shadow-[0_2px_10px_rgba(13,43,62,0.18)] backdrop-blur-sm transition-transform active:scale-95"
    >
      ✕
    </a>
  );
}

/**
 * Corps scrollable d'une étape : titre, sous-titre, contenu.
 * La maquette respire un peu plus large (26px) sur les écrans de saisie que
 * sur les listes de choix (22px), d'où `padX`.
 */
export function StepBody({
  title,
  subtitle,
  children,
  padX = 22,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  padX?: 22 | 26;
}) {
  return (
    <div
      className="flex-1 overflow-y-auto pt-5"
      style={{ paddingLeft: padX, paddingRight: padX }}
    >
      <h1 className="font-display text-[21px] leading-[1.3] font-semibold">{title}</h1>
      {subtitle && <p className="mt-1.5 text-[13px] text-ink/55">{subtitle}</p>}
      {children && <div className={subtitle ? "mt-4" : "mt-3.5"}>{children}</div>}
    </div>
  );
}

/**
 * Barre d'action de l'étape. La maquette pose un CTA plein, et un gris franc
 * (pas un coral délavé) quand la saisie n'est pas encore valable.
 */
export function StepFooter({
  label,
  disabled = false,
  pending = false,
  padX = 22,
  children,
}: {
  label: string;
  disabled?: boolean;
  pending?: boolean;
  padX?: 22 | 26 | 30;
  children?: ReactNode;
}) {
  return (
    <div className="pt-3 pb-[22px]" style={{ paddingLeft: padX, paddingRight: padX }}>
      <Button
        type="submit"
        disabled={disabled || pending}
        className="disabled:bg-line disabled:text-ink/40 disabled:opacity-100 disabled:shadow-none"
      >
        {pending ? "…" : label}
      </Button>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Choix                                                                */
/* ------------------------------------------------------------------ */

/**
 * Carte de choix. La bordure de sélection fait 2px : on la garde
 * transparente à l'état neutre pour que rien ne bouge à la sélection.
 */
export function ChoiceCard({
  emoji,
  title,
  subtitle,
  selected = false,
  onSelect,
  trailing,
  large = false,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  selected?: boolean;
  onSelect: () => void;
  trailing?: ReactNode;
  /** Cartes plus généreuses (écrans à 3 options). */
  large?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={[
        "flex w-full items-center gap-3 border-2 bg-white text-left shadow-[var(--shadow-float)]",
        "transition-transform duration-100 active:scale-[0.99]",
        large ? "rounded-[18px] p-4" : "rounded-card px-[15px] py-3.5",
        selected ? "border-teal" : "border-transparent",
      ].join(" ")}
    >
      <span className={large ? "text-[26px]" : "text-[22px]"} aria-hidden="true">
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[14.5px] font-semibold">{title}</span>
        {subtitle && <span className="block text-[11px] text-ink/50">{subtitle}</span>}
      </span>
      {trailing}
    </button>
  );
}

/** Même carte, en case à cocher (écran des restrictions). */
export function CheckCard({
  emoji,
  label,
  checked = false,
  onToggle,
}: {
  emoji: string;
  label: string;
  checked?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={[
        "flex w-full items-center gap-[11px] rounded-[14px] border-2 bg-white px-[15px] py-3",
        "text-left shadow-[var(--shadow-float)] transition-transform duration-100 active:scale-[0.99]",
        checked ? "border-teal" : "border-transparent",
      ].join(" ")}
    >
      <span className="text-[18px]" aria-hidden="true">
        {emoji}
      </span>
      <span className="flex-1 font-display text-[13.5px] font-semibold">{label}</span>
      {checked && (
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#2AA7A1" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12l4 4 10-10" />
        </svg>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Étape « liste de choix »                                             */
/* ------------------------------------------------------------------ */

type ChoiceState = { error: string | null };

/**
 * Le patron partagé par O04, O05, P01, P03 et P04 : une illustration, une
 * question, une liste d'options exclusives, la réaction inline qui répond au
 * choix, et le CTA de validation manuelle.
 */
export function ChoiceStep<T extends string>({
  action,
  name,
  options,
  initial,
  image,
  imageHeight = 170,
  imagePosition = "center 25%",
  step,
  back,
  close,
  title,
  subtitle,
  cta,
  large = false,
}: {
  action: (previous: ChoiceState, formData: FormData) => Promise<ChoiceState>;
  name: string;
  options: Option<T>[];
  initial: T | null;
  image: string;
  imageHeight?: number;
  imagePosition?: string;
  step: number;
  back?: string;
  close?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  cta: string;
  large?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [choice, setChoice] = useState<T | null>(initial);

  const chosen = options.find((option) => option.value === choice);

  return (
    <Screen>
      <form action={formAction} className="flex flex-1 flex-col bg-cream">
        <input type="hidden" name={name} value={choice ?? ""} />

        <StepHero
          image={image}
          height={imageHeight}
          position={imagePosition}
          step={step}
          back={back}
          close={close}
        />

        <StepBody title={title} subtitle={subtitle}>
          <div role="radiogroup" aria-label={typeof title === "string" ? title : name} className="flex flex-col gap-2.5">
            {options.map((option) => (
              <ChoiceCard
                key={option.value}
                emoji={option.emoji}
                title={option.label}
                subtitle={option.hint}
                selected={option.value === choice}
                onSelect={() => setChoice(option.value)}
                large={large}
              />
            ))}
          </div>

          {chosen && (
            <InlineReaction emoji={chosen.reaction.emoji} tone={chosen.reaction.tone}>
              {chosen.reaction.text}
            </InlineReaction>
          )}

          {state.error && (
            <p role="alert" className="mt-2.5 text-[12px] font-bold text-coral-deep">
              {state.error}
            </p>
          )}
        </StepBody>

        <StepFooter label={cta} disabled={!choice} pending={pending} />
      </form>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Réaction inline                                                      */
/* ------------------------------------------------------------------ */

export type ReactionTone = "gold" | "teal" | "coral" | "olive";

const reactionTones: Record<ReactionTone, string> = {
  gold: "bg-gold-wash text-gold-ink",
  teal: "bg-teal/10 text-teal-deep",
  coral: "bg-coral-wash text-coral-deep",
  olive: "bg-olive-wash text-olive-deep",
};

/**
 * Le petit mot qui répond au choix qu'on vient de faire. La maquette en met
 * un sur presque chaque écran : c'est ce qui donne le ton de l'app.
 */
export function InlineReaction({
  emoji,
  children,
  tone = "teal",
}: {
  emoji: string;
  children: ReactNode;
  tone?: ReactionTone;
}) {
  return (
    <div
      aria-live="polite"
      className={`mt-3 flex animate-[var(--animate-rise)] items-center gap-2.5 rounded-[14px] px-3.5 py-[11px] ${reactionTones[tone]}`}
    >
      <span className="text-base" aria-hidden="true">
        {emoji}
      </span>
      <span className="text-xs font-bold">{children}</span>
    </div>
  );
}
