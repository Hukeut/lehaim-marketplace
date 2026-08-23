"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STEPS } from "@/lib/steps";

/**
 * Rail des huit étapes, et bandeau de progression.
 *
 * L'étape courante se lit dans l'URL, pas dans le dossier : `application.step`
 * dit jusqu'où on est allé, ce qui n'est pas la même chose que ce qu'on
 * regarde. Revenir corriger son adresse doit surligner « Informations
 * entreprise », pas la dernière étape atteinte.
 *
 * D'où un composant client : un layout serveur ne connaît pas le chemin.
 */

function viewedIndex(pathname: string) {
  const slug = pathname.split("/").filter(Boolean).pop();
  const index = STEPS.findIndex((step) => step.slug === slug);
  return index === -1 ? 1 : index + 1;
}

export function WizardRail({ reached }: { reached: number }) {
  const viewed = viewedIndex(usePathname());

  return (
    <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto rounded-[20px] bg-white p-3.5 shadow-[var(--shadow-card)] lg:w-[268px] lg:flex-col lg:self-start">
      <div className="hidden px-3 pb-3 lg:block">
        <div className="font-display text-[15px] font-semibold">Votre dossier</div>
        <div className="mt-0.5 text-[11.5px] text-ink/45">Enregistré à chaque étape</div>
      </div>

      {STEPS.map((step, index) => {
        const number = index + 1;
        const current = number === viewed;
        const done = number < reached && !current;
        // L'étape « Compte » est franchie par le simple fait d'être connecté.
        const reachable = number < reached && !current && step.slug !== "compte";

        const inner = (
          <>
            <span
              className={`flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                current
                  ? "bg-teal text-white"
                  : done
                    ? "bg-olive text-white"
                    : "border-2 border-line bg-white text-ink/40"
              }`}
            >
              {done ? "✓" : number}
            </span>
            <span
              className={`text-[13px] whitespace-nowrap ${
                current ? "font-extrabold text-teal" : done ? "font-bold" : "text-ink/50"
              }`}
            >
              {step.label}
            </span>
          </>
        );

        const className = `flex items-center gap-2.5 rounded-full px-3 py-2.5 ${
          current ? "bg-teal/12" : ""
        }`;

        return reachable ? (
          <Link key={step.slug} href={`/partenaire/dossier/${step.slug}`} className={className}>
            {inner}
          </Link>
        ) : (
          <div key={step.slug} className={className}>
            {inner}
          </div>
        );
      })}
    </nav>
  );
}

export function WizardProgress({ reached }: { reached: number }) {
  const viewed = viewedIndex(usePathname());
  // Le titre dit où l'on est ; la jauge dit ce qui est fait. Ce sont deux
  // questions différentes, et les confondre ferait reculer la jauge quand on
  // revient corriger une étape déjà passée.
  const done = Math.round(((Math.min(reached, 8) - 1) / 8) * 100);

  return (
    <div className="mb-5 flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-display text-[15px] font-semibold">
          Étape {viewed} sur 8 · {STEPS[viewed - 1].label}
        </span>
        <span className="text-[12px] font-bold text-ink/45">{done} % complété</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-line-soft">
        <div
          className="h-full rounded-full bg-teal transition-[width] duration-700"
          style={{ width: `${done}%` }}
        />
      </div>
    </div>
  );
}
