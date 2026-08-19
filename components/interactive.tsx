"use client";

import { useState, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Onglets segmentés (pilule blanche, segment actif encre)              */
/* ------------------------------------------------------------------ */

export function SegmentedTabs({
  tabs,
  panels,
  className = "",
}: {
  tabs: string[];
  panels?: ReactNode[];
  className?: string;
}) {
  const [active, setActive] = useState(0);
  return (
    <>
      <div
        role="tablist"
        className={`flex gap-0.5 rounded-full bg-white p-1 shadow-[var(--shadow-card)] ${className}`}
      >
        {tabs.map((tab, i) => (
          <button
            key={tab}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`flex-1 rounded-full py-2.5 text-[11.5px] font-bold transition-colors ${
              i === active
                ? "bg-ink text-white shadow-[0_2px_6px_rgba(13,43,62,0.25)]"
                : "text-ink/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {panels && (
        <div role="tabpanel" className="animate-[var(--animate-rise)]">
          {panels[active]}
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Sélecteur binaire (Privé / Public, Ce vendredi / Vendredi prochain)  */
/* ------------------------------------------------------------------ */

export function ChoicePills({
  options,
  defaultIndex = 0,
  onChange,
}: {
  options: string[];
  defaultIndex?: number;
  onChange?: (index: number) => void;
}) {
  const [active, setActive] = useState(defaultIndex);
  return (
    <div className="flex gap-2">
      {options.map((option, i) => (
        <button
          key={option}
          onClick={() => {
            setActive(i);
            onChange?.(i);
          }}
          className={`flex-1 rounded-full py-2.5 text-[12.5px] font-bold transition-colors ${
            i === active
              ? "bg-ink text-white"
              : "border-[1.5px] border-line-soft bg-white text-ink shadow-[var(--shadow-pill)]"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Compteur – / +                                                       */
/* ------------------------------------------------------------------ */

export function Stepper({
  defaultValue,
  min = 1,
  max = 40,
  suffix,
}: {
  defaultValue: number;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="flex items-center justify-between rounded-field bg-white px-4 py-2.5 shadow-[var(--shadow-card)]">
      <button
        aria-label="Retirer"
        onClick={() => setValue((v) => Math.max(min, v - 1))}
        disabled={value <= min}
        className="flex size-[30px] items-center justify-center rounded-full bg-line-soft text-base font-bold text-ink disabled:opacity-40"
      >
        –
      </button>
      <span className="font-display text-base font-semibold">
        {value}
        {suffix ? ` ${suffix}` : ""}
      </span>
      <button
        aria-label="Ajouter"
        onClick={() => setValue((v) => Math.min(max, v + 1))}
        disabled={value >= max}
        className="flex size-[30px] items-center justify-center rounded-full bg-teal text-base font-bold text-white disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Interrupteur                                                         */
/* ------------------------------------------------------------------ */

export function Toggle({
  label,
  defaultOn = false,
}: {
  label: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => setOn((v) => !v)}
      className="flex w-full items-center justify-between px-3.5 py-3.5 text-left"
    >
      <span className="text-[12.5px] font-bold">{label}</span>
      <span
        className={`relative h-6 w-10 rounded-full transition-colors ${on ? "bg-teal" : "bg-line"}`}
      >
        <span
          className={`absolute top-[2.5px] size-[19px] rounded-full bg-white transition-all ${on ? "left-[18.5px]" : "left-[2.5px]"}`}
        />
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Champs de saisie contrôlés localement (maquette cliquable)           */
/* ------------------------------------------------------------------ */

export function EditableRow({
  defaultValue,
  placeholder,
  multiline = false,
}: {
  defaultValue?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const shared =
    "w-full rounded-field bg-white px-4 py-3.5 text-[13px] font-bold shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40";
  return multiline ? (
    <textarea
      rows={3}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={`${shared} resize-none font-normal`}
    />
  ) : (
    <input defaultValue={defaultValue} placeholder={placeholder} className={shared} />
  );
}
