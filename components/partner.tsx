import type { ReactNode } from "react";

/**
 * Briques du tunnel marchand.
 *
 * Le tunnel est une interface de bureau, à part de la coquille mobile de
 * l'app : un commerçant remplit son dossier sur un ordinateur, avec ses
 * papiers à côté. Ces briques n'ont donc rien à voir avec `components/ui.tsx`,
 * qui dessine une colonne de 430 pixels.
 */

export function WizardStep({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-[20px] bg-white p-7 shadow-[0_10px_24px_rgba(15,39,77,0.10)]">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[21px] font-semibold">{title}</h1>
        {intro && <p className="max-w-[62ch] text-[14px] leading-relaxed text-ink/65">{intro}</p>}
      </div>
      {children}
    </div>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  required = false,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[12px] font-bold text-ink/55">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        className="rounded-[14px] border-[1.5px] border-line bg-sand px-4 py-3 text-[14px] font-bold outline-none focus:border-teal focus:ring-2 focus:ring-teal/25"
      />
      {hint && <span className="text-[11.5px] text-ink/45">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-bold text-ink/55">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        className="rounded-[14px] border-[1.5px] border-line bg-sand px-4 py-3 text-[14px] leading-relaxed outline-none focus:border-teal focus:ring-2 focus:ring-teal/25"
      />
    </label>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: [value: string, label: string][];
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[12px] font-bold text-ink/55">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? undefined}
        className="rounded-[14px] border-[1.5px] border-line bg-sand px-4 py-3 text-[14px] font-bold outline-none focus:border-teal focus:ring-2 focus:ring-teal/25"
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Groupe de cases, rendu en pastilles cochables. */
export function PillChoices({
  legend,
  name,
  options,
  selected = [],
  tone = "teal",
}: {
  legend: string;
  name: string;
  options: [value: string, label: string][];
  selected?: string[];
  tone?: "teal" | "wine" | "gold" | "olive";
}) {
  const tones = {
    teal: "peer-checked:border-teal peer-checked:bg-teal/12 peer-checked:text-teal-deep",
    wine: "peer-checked:border-[#8A2346] peer-checked:bg-[rgba(138,35,70,0.10)] peer-checked:text-[#8A2346]",
    gold: "peer-checked:border-gold-ink peer-checked:bg-gold-wash peer-checked:text-gold-ink",
    olive: "peer-checked:border-olive peer-checked:bg-olive-wash peer-checked:text-olive-ink",
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-[12px] font-bold text-ink/55">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([value, label]) => (
          <label key={value} className="cursor-pointer">
            <input
              type="checkbox"
              name={name}
              value={value}
              defaultChecked={selected.includes(value)}
              className="peer sr-only"
            />
            <span
              className={`inline-block rounded-full border-[1.5px] border-line bg-white px-3.5 py-2 text-[12.5px] font-bold text-ink/55 ${tones[tone]}`}
            >
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function WizardFooter({
  label,
  back,
  note,
  skip,
}: {
  label: string;
  back?: string;
  note?: string;
  /** Sortie sans rien remplir, quand l'étape est déjà satisfaite. */
  skip?: { href: string; label: string };
}) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-3 border-t border-line-soft pt-5">
      {back && (
        <a
          href={back}
          className="rounded-full border-2 border-line px-5 py-2.5 font-display text-[14px] font-semibold text-ink/60"
        >
          Retour
        </a>
      )}
      <span className="ms-auto flex items-center gap-4">
        {skip && (
          <a href={skip.href} className="text-[12.5px] font-bold text-ink/50 underline underline-offset-4">
            {skip.label}
          </a>
        )}
        {note && <span className="hidden text-[12px] text-ink/45 sm:inline">{note}</span>}
        <button
          type="submit"
          className="rounded-full bg-coral-deep px-6 py-3 font-display text-[14.5px] font-semibold text-white"
        >
          {label}
        </button>
      </span>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-[14px] bg-coral-wash px-4 py-3 text-[13px] font-bold text-coral-deep">
      {message}
    </p>
  );
}
