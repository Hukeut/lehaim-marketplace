import type { ReactNode } from "react";
import { Card } from "./ui";
import { LehaimIcon } from "./LehaimIcon";
import { iconForMission } from "@/lib/mission-icons";
import type { Category, Claimer } from "@/lib/missions";

/** Couleurs de catégorie, conformes au fichier Missions & Ops. */
export const CATEGORY_STYLE: Record<
  Category,
  { chip: string; tile: string; label: string }
> = {
  food: { chip: "bg-coral/12 text-coral-deep", tile: "bg-coral/14 text-coral-deep", label: "Food" },
  drinks: { chip: "bg-teal/12 text-teal-deep", tile: "bg-teal/14 text-teal-deep", label: "Drinks" },
  equipment: {
    chip: "bg-violet/12 text-violet-deep",
    tile: "bg-violet/14 text-violet-deep",
    label: "Equipment",
  },
  hosting: { chip: "bg-gold/28 text-gold-ink", tile: "bg-gold/28 text-gold-ink", label: "Hosting" },
  other: { chip: "bg-ink/6 text-ink/60", tile: "bg-ink/6 text-ink/65", label: "Autre" },
};

export function CategoryChip({ category }: { category: Category }) {
  const style = CATEGORY_STYLE[category];
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-extrabold whitespace-nowrap ${style.chip}`}
    >
      {style.label}
    </span>
  );
}

export function EmojiTile({
  emoji,
  category,
  size = 36,
  radius = 11,
  title,
}: {
  emoji: string;
  category: Category;
  size?: number;
  radius?: number;
  /** Titre de l'apport : c'est lui qui désigne l'illustration. */
  title?: string;
}) {
  const icon = title ? iconForMission(title) : null;

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden ${CATEGORY_STYLE[category].tile}`}
      style={{ width: size, height: size, borderRadius: radius, fontSize: size * 0.46 }}
    >
      {icon && icon !== "other" ? (
        <LehaimIcon name={icon} size={Math.round(size * 0.92)} />
      ) : (
        emoji
      )}
    </span>
  );
}

export function ClaimerStack({ people }: { people: Claimer[] }) {
  if (!people.length) return null;
  return (
    <div className="flex items-center">
      {people.slice(0, 3).map((person, i) => (
        <span
          key={person.id || i}
          className={`flex size-6 items-center justify-center rounded-full text-[11.5px] font-extrabold text-white ring-2 ring-white ${
            { coral: "bg-coral", teal: "bg-teal", violet: "bg-violet", gold: "bg-gold text-gold-ink", olive: "bg-olive", ink: "bg-ink" }[
              person.tone
            ]
          } ${i > 0 ? "-ms-2" : ""}`}
        >
          {person.initial}
        </span>
      ))}
      {people.length > 3 && (
        <span className="-ms-2 flex size-6 items-center justify-center rounded-full bg-ink/10 text-[9px] font-extrabold text-ink ring-2 ring-white">
          +{people.length - 3}
        </span>
      )}
    </div>
  );
}

/** Bandeau d'information teal, repris du design (fond #EAF6F5). */
export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-card bg-[#EAF6F5] p-3.5">
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="mt-px shrink-0 text-teal-deep"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8v5M12 16.5v.1" />
      </svg>
      <div className="text-[13px] leading-relaxed text-teal-deep">{children}</div>
    </div>
  );
}

export function AlertNote({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-card bg-coral-wash px-3.5 py-3">
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="shrink-0 text-coral-deep"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8v5M12 16.5v.1" />
      </svg>
      <div className="flex-1">
        <div className="text-xs font-bold text-coral-deep">{title}</div>
        <div className="text-[12px] text-coral-deep/75">{text}</div>
      </div>
    </div>
  );
}

/** Blocs du compte à rebours (jours / heures / minutes). */
export function Countdown({
  parts,
  dark = true,
}: {
  parts: { days: number; hours: number; minutes?: number };
  dark?: boolean;
}) {
  const cells: [string, string][] = [
    [String(parts.days), parts.days > 1 ? "JOURS" : "JOUR"],
    [String(parts.hours).padStart(2, "0"), "H"],
  ];
  if (parts.minutes !== undefined) {
    cells.push([String(parts.minutes).padStart(2, "0"), "MIN"]);
  }
  return (
    <div className="flex gap-1.5">
      {cells.map(([value, label]) => (
        <div
          key={label}
          className={`rounded-[10px] px-2.5 py-1.5 text-center ${dark ? "bg-white/10" : "bg-ink/6"}`}
        >
          <div className="font-display text-[15px] font-semibold">{value}</div>
          <div className={`text-[8px] ${dark ? "text-white/60" : "text-ink/65"}`}>{label}</div>
        </div>
      ))}
    </div>
  );
}

export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2.5 text-[12px] font-extrabold tracking-[0.04em] text-ink/45 uppercase">
        {title}
      </div>
      {children}
    </Card>
  );
}
