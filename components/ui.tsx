import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ChevronRight } from "./icons";
import { BackButton } from "./BackButton";

/* ------------------------------------------------------------------ */
/* Structure d'écran                                                    */
/* ------------------------------------------------------------------ */

export function Screen({ children }: { children: ReactNode }) {
  return <div className="flex min-h-dvh flex-1 flex-col sm:min-h-0">{children}</div>;
}

/** Zone scrollable d'un écran. `pad` reprend le rythme du design (18 ou 20px). */
export function ScreenBody({
  children,
  className = "",
  top = true,
}: {
  children: ReactNode;
  className?: string;
  top?: boolean;
}) {
  return (
    <div
      className={`flex-1 overflow-y-auto px-[18px] pb-5 ${top ? "pt-[54px]" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/** Barre d'action collée en bas, sur fond blanc surélevé. */
export function StickyFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`shadow-[var(--shadow-dock)] bg-white px-[18px] pt-3 pb-[22px] ${className}`}
    >
      {children}
    </div>
  );
}

export function TopBar({
  title,
  back = "/accueil",
  action,
}: {
  title: string;
  back?: string | false;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 px-[18px] pt-[54px] pb-1.5">
      {back !== false && <BackButton fallback={back} />}
      <div className="flex-1 font-display text-[17px] font-semibold">{title}</div>
      {action}
    </div>
  );
}

export function SectionTitle({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <h2 id={id} className={`mb-2.5 font-display text-sm font-semibold ${className}`}>
      {children}
    </h2>
  );
}

export function Overline({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-extrabold tracking-[0.04em] text-ink/45 uppercase">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Boutons                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "dark" | "ghost" | "outlineTeal";
type ButtonSize = "lg" | "md" | "sm";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-coral text-white shadow-[var(--shadow-coral)] active:bg-[#f26a49]",
  secondary: "bg-white text-ink border-2 border-line active:bg-line-soft",
  dark: "bg-ink text-white active:bg-[#0a2233]",
  ghost: "bg-transparent text-ink/50 active:text-ink",
  outlineTeal: "bg-transparent text-teal border-2 border-teal active:bg-teal/10",
};

const buttonSizes: Record<ButtonSize, string> = {
  lg: "py-4 text-[15px]",
  md: "py-3.5 text-[14.5px]",
  sm: "py-3 text-[13px]",
};

function buttonClass(variant: ButtonVariant, size: ButtonSize, full: boolean) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold",
    "transition-transform duration-100 active:scale-[0.985] disabled:opacity-45 disabled:active:scale-100",
    buttonVariants[variant],
    buttonSizes[size],
    full ? "w-full" : "px-6",
  ].join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  full = true,
  className = "",
  ...rest
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
}) {
  return <button className={`${buttonClass(variant, size, full)} ${className}`} {...rest} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  full = true,
  className = "",
  ...rest
}: ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
}) {
  return <Link className={`${buttonClass(variant, size, full)} ${className}`} {...rest} />;
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                             */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  className = "",
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  return (
    <As className={`rounded-card bg-white shadow-[var(--shadow-card)] ${className}`}>
      {children}
    </As>
  );
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 text-[11px] font-bold text-ink/55">{label}</div>
      {children}
    </div>
  );
}

/** Boîte de saisie au style du design (blanche, r14, ombre douce). */
export function FieldBox({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-field bg-white px-4 py-3.5 shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

export function TextInput({ className = "", ...rest }: ComponentProps<"input">) {
  return (
    <input
      className={`w-full rounded-field bg-white px-4 py-3.5 text-[13px] font-bold shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-teal/40 ${className}`}
      {...rest}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Pastilles et badges                                                  */
/* ------------------------------------------------------------------ */

export type PillTone = "success" | "warning" | "urgent" | "info" | "neutral";

const pillTones: Record<PillTone, string> = {
  success: "bg-olive-wash text-olive-deep",
  warning: "bg-gold-wash text-gold-ink",
  urgent: "bg-coral/15 text-coral-deep",
  info: "bg-teal/15 text-teal-deep",
  neutral: "bg-line text-mist",
};

export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: PillTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`shrink-0 rounded-full px-[11px] py-1.5 text-[9.5px] font-extrabold tracking-[0.01em] whitespace-nowrap ${pillTones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Chip({
  active = false,
  children,
}: {
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={
        active
          ? "shrink-0 rounded-full bg-ink px-3.5 py-2 text-xs font-bold whitespace-nowrap text-white shadow-[var(--shadow-inset-pill)]"
          : "shrink-0 rounded-full border-[1.5px] border-line-soft bg-white px-3.5 py-2 text-xs font-bold whitespace-nowrap text-ink shadow-[var(--shadow-pill)]"
      }
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Avatars                                                              */
/* ------------------------------------------------------------------ */

export type AvatarTone = "coral" | "teal" | "violet" | "gold" | "olive" | "ink";

const avatarTones: Record<AvatarTone, string> = {
  coral: "bg-coral text-white",
  teal: "bg-teal text-white",
  violet: "bg-violet text-white",
  gold: "bg-gold text-gold-ink",
  olive: "bg-olive text-white",
  ink: "bg-ink text-white",
};

export function Avatar({
  initial,
  tone = "teal",
  size = 36,
  className = "",
}: {
  initial: string;
  tone?: AvatarTone;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-semibold ${avatarTones[tone]} ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.35) }}
    >
      {initial}
    </span>
  );
}

export function AvatarStack({
  people,
  extra,
  extraTone,
  ring = "ring-white",
  size = 26,
}: {
  people: { initial: string; tone: AvatarTone }[];
  extra?: number;
  /** Teinte du « +N ». Sans valeur, il reste discret (fond encre translucide). */
  extraTone?: AvatarTone;
  /** Couleur de l'anneau : blanc sur fond clair, encre sur la carte sombre. */
  ring?: string;
  size?: number;
}) {
  return (
    <div className="flex items-center">
      {people.map((p, i) => (
        <span
          key={`${p.initial}-${i}`}
          className={`flex items-center justify-center rounded-full font-extrabold ring-2 ${ring} ${avatarTones[p.tone]} ${i > 0 ? "-ml-2" : ""}`}
          style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
        >
          {p.initial}
        </span>
      ))}
      {extra !== undefined && extra > 0 && (
        <span
          className={`-ml-2 flex items-center justify-center rounded-full font-extrabold ring-2 ${ring} ${extraTone ? avatarTones[extraTone] : "bg-ink/10 text-ink"}`}
          style={{ width: size, height: size, fontSize: Math.round(size * 0.35) }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Données                                                              */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  value,
  tone = "teal",
  track = "bg-line",
  height = 5,
}: {
  /** 0 → 100 */
  value: number;
  tone?: "teal" | "coral" | "gold" | "olive";
  track?: string;
  height?: number;
}) {
  const fills = {
    teal: "bg-teal",
    coral: "bg-coral",
    gold: "bg-gold",
    olive: "bg-olive",
  } as const;
  return (
    <div
      className={`w-full overflow-hidden rounded-full ${track}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full ${fills[tone]}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/** Anneau de progression de la carte d'accueil. */
export function ProgressRing({
  value,
  size = 46,
}: {
  value: number;
  size?: number;
}) {
  const circumference = 2 * Math.PI * 15.5;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" width={size} height={size} aria-hidden="true">
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="3"
        />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke="#2AA7A1"
          strokeWidth="3"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-display text-xs font-semibold">
        {Math.round(value)}%
      </div>
    </div>
  );
}

export function StatTile({
  value,
  label,
  suffix,
  center = true,
}: {
  value: ReactNode;
  label: string;
  suffix?: string;
  center?: boolean;
}) {
  return (
    <Card className={`rounded-field p-3 ${center ? "text-center" : ""}`}>
      <div className="font-display text-[15px] font-semibold">
        {value}
        {suffix && <span className="text-xs text-ink/40">{suffix}</span>}
      </div>
      <div className="text-[9.5px] font-bold text-ink/50">{label}</div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Listes                                                               */
/* ------------------------------------------------------------------ */

export function ListRow({
  icon,
  title,
  subtitle,
  trailing,
  href,
  last = false,
}: {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  last?: boolean;
}) {
  const inner = (
    <>
      {icon}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-bold">{title}</div>
        {subtitle && <div className="truncate text-[11px] text-ink/50">{subtitle}</div>}
      </div>
      {trailing ?? <ChevronRight size={15} className="shrink-0 text-ink/30" />}
    </>
  );
  const className = `flex items-center gap-3 px-3.5 py-3.5 ${last ? "" : "border-b border-line-soft"}`;
  return href ? (
    <Link href={href} className={`${className} active:bg-line-soft/60`}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

/** Pastille carrée colorée qui porte une icône, très présente dans le design. */
export function IconTile({
  children,
  tone,
  size = 34,
  radius = 10,
}: {
  children: ReactNode;
  tone: "coral" | "teal" | "gold" | "violet" | "olive" | "muted";
  size?: number;
  radius?: number;
}) {
  const tones = {
    coral: "bg-coral/12 text-coral-deep",
    teal: "bg-teal/12 text-teal-deep",
    gold: "bg-gold/28 text-gold-deep",
    violet: "bg-violet/12 text-violet",
    olive: "bg-olive/14 text-olive-deep",
    muted: "bg-line/50 text-ink/40",
  } as const;
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${tones[tone]}`}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* États                                                                */
/* ------------------------------------------------------------------ */

export function Skeleton({ className = "h-11" }: { className?: string }) {
  return (
    <div
      className={`animate-[var(--animate-shimmer)] rounded-xl ${className}`}
      style={{
        background:
          "linear-gradient(90deg,#F0EDE4 25%,#E6E1DA 37%,#F0EDE4 63%)",
        backgroundSize: "400px 100%",
      }}
    />
  );
}

export function GlowCircle({
  children,
  size,
  glow,
  className = "",
}: {
  children: ReactNode;
  size: number;
  /** Couleur du halo, en rgba. */
  glow: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <div
        className="absolute rounded-full"
        style={{
          inset: -Math.round(size * 0.2),
          background: `radial-gradient(circle, ${glow}, rgba(0,0,0,0))`,
        }}
      />
      <div className="relative flex size-full items-center justify-center">{children}</div>
    </div>
  );
}
