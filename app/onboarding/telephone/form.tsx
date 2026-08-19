"use client";

import { useActionState, useState } from "react";
import { Screen } from "@/components/ui";
import { StepBody, StepFooter, StepHero } from "@/components/onboarding";
import { COUNTRIES, countryByCode, formatNationalNumber } from "@/lib/onboarding";
import { savePhone } from "../actions";

export function PhoneForm({
  initialCode,
  initialDigits,
}: {
  initialCode: string;
  initialDigits: string;
}) {
  const [state, action, pending] = useActionState(savePhone, { error: null });
  const [code, setCode] = useState(initialCode);
  const [digits, setDigits] = useState(initialDigits);
  const [touched, setTouched] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const country = countryByCode(code);
  const complete = digits.length === country.digits;
  // On n'agresse personne pendant la frappe : l'erreur n'apparaît qu'une fois
  // le champ quitté, ou quand le serveur a refusé.
  const showError = (touched && digits.length > 0 && !complete) || Boolean(state.error);

  return (
    <Screen>
      <form action={action} className="relative flex flex-1 flex-col bg-cream">
        <input type="hidden" name="country_code" value={code} />
        <input type="hidden" name="digits" value={digits} />

        <StepHero
          image="/illustrations/hote-invite-connexion.jpg"
          height={190}
          step={2}
          back="/onboarding/prenom"
        />

        <StepBody
          padX={26}
          title="Ton numéro, pour te retrouver"
          subtitle="Jamais partagé, jamais spammé. Pas de code à saisir."
        >
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
              className="flex shrink-0 items-center gap-1.5 rounded-card border-2 border-transparent bg-white px-3.5 py-4 shadow-[var(--shadow-float)]"
            >
              <span className="text-base" aria-hidden="true">
                {country.flag}
              </span>
              <span className="font-display text-[15px] font-semibold">{country.dial}</span>
              <span className="text-[10px] text-ink/40" aria-hidden="true">
                ▾
              </span>
            </button>

            <input
              inputMode="tel"
              autoComplete="tel-national"
              aria-label="Numéro de téléphone"
              aria-invalid={showError}
              placeholder="6 12 34 56 78"
              value={formatNationalNumber(digits)}
              onBlur={() => setTouched(true)}
              onChange={(event) =>
                setDigits(event.target.value.replace(/\D/g, "").slice(0, country.digits))
              }
              className={`min-w-0 flex-1 rounded-card border-2 px-[18px] py-4 font-display text-[17px] font-semibold shadow-[var(--shadow-float)] outline-none placeholder:font-normal placeholder:text-ink/30 ${
                showError
                  ? "border-coral-deep bg-coral/8 text-coral-deep"
                  : "border-teal bg-white"
              }`}
            />
          </div>

          {showError && (
            <p role="alert" className="mt-2 text-[12px] font-bold text-coral-deep">
              {state.error ?? "Il manque quelques chiffres"}
            </p>
          )}
        </StepBody>

        <StepFooter
          label="C'est parti"
          padX={26}
          disabled={!complete}
          pending={pending}
        />

        {sheetOpen && (
          <CountrySheet
            selected={code}
            onSelect={(next) => {
              setCode(next);
              setDigits("");
              setTouched(false);
              setSheetOpen(false);
            }}
            onClose={() => setSheetOpen(false)}
          />
        )}
      </form>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* O03b · Sélecteur d'indicatif                                         */
/* ------------------------------------------------------------------ */

function CountrySheet({
  selected,
  onSelect,
  onClose,
}: {
  selected: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-ink/45"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choisir un indicatif"
        className="relative max-h-[70%] animate-[var(--animate-rise)] rounded-t-sheet bg-cream pb-[22px]"
      >
        <div className="mx-auto mt-3 mb-3.5 h-[5px] w-10 rounded-full bg-line" />
        <div className="px-[22px] pb-3 font-display text-base font-semibold">
          Choisir un indicatif
        </div>

        <div className="max-h-[280px] overflow-y-auto px-3.5 pb-1">
          {COUNTRIES.map((country) => {
            const active = country.code === selected;
            return (
              <button
                key={country.code}
                type="button"
                onClick={() => onSelect(country.code)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-3 text-left ${
                  active ? "bg-teal/10" : ""
                }`}
              >
                <span className="text-[17px]" aria-hidden="true">
                  {country.flag}
                </span>
                <span className="flex-1 text-[13.5px] font-bold">{country.name}</span>
                <span
                  className={`text-[13px] font-bold ${active ? "text-teal" : "text-ink/50"}`}
                >
                  {country.dial}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
