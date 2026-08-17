import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink, Card } from "./ui";

/** État vide illustré, réutilisé partout où une liste peut ne rien contenir. */
export function EmptyState({
  title,
  text,
  cta,
  href,
  illustration,
}: {
  title: string;
  text: string;
  cta?: string;
  href?: string;
  illustration?: string;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      {illustration && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={illustration}
          alt=""
          className="mb-4 h-40 w-full max-w-[240px] rounded-panel object-cover object-[center_25%]"
        />
      )}
      <h2 className="font-display text-base font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-[260px] text-[12.5px] leading-relaxed text-ink/55">{text}</p>
      {cta && href && (
        <ButtonLink href={href} full={false} size="sm" className="mt-5">
          {cta}
        </ButtonLink>
      )}
    </div>
  );
}

/** Affiché lorsqu'aucune session n'est active. */
export function SignedOut({ suite, what }: { suite: string; what: string }) {
  return (
    <Card className="p-4 text-center">
      <h2 className="font-display text-[15px] font-semibold">Connectez-vous</h2>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/55">
        Une fois votre compte ouvert, vous retrouverez ici {what}.
      </p>
      <ButtonLink
        href={`/connexion?suite=${encodeURIComponent(suite)}`}
        full={false}
        size="sm"
        className="mt-4"
      >
        Se connecter
      </ButtonLink>
    </Card>
  );
}

export function Banner({
  tone = "info",
  children,
}: {
  tone?: "info" | "warning";
  children: ReactNode;
}) {
  const tones = {
    info: "border-teal/30 bg-teal/8 text-teal-deep",
    warning: "border-gold/40 bg-gold-wash text-gold-ink",
  };
  return (
    <div className={`rounded-card border-[1.5px] p-3.5 text-[12px] leading-snug ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-bold underline underline-offset-2">
      {children}
    </Link>
  );
}
