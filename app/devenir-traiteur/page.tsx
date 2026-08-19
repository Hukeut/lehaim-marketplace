import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyTraiteur } from "@/lib/marketplace";
import { TraiteurOnboardingForm } from "@/components/marketplace/TraiteurOnboardingForm";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";
import { ButtonLink, Card, StatusPill } from "@/components/ui";
import { Basket, Calendar, Check, Clock, Dish, Share, Sliders, XCircle } from "@/components/icons";

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function formatDate(value: string) {
  const d = new Date(value);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export default async function DevenirTraiteur() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion?suite=/devenir-traiteur");

  const traiteur = await getMyTraiteur();

  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-teal-wash sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-4 flex items-center gap-2.5">
          <BackButton fallback="/accueil" />
          <h1 className="flex-1 font-display text-[18px] font-semibold">
            Espace fournisseur
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {!traiteur && (
          <>
            <p className="mb-4 text-[13px] leading-relaxed text-ink/60">
              Vous êtes traiteur, restaurateur ou fournisseur ? Créez votre profil pour proposer
              vos plats sur la marketplace lehaim. Une fois soumis, votre dossier est vérifié par
              notre équipe avant de devenir visible.
            </p>
            <TraiteurOnboardingForm />
          </>
        )}

        {traiteur && traiteur.status === "pending" && (
          <Card className="mb-3.5 p-4">
            <h2 className="mb-0.5 font-display text-[15px] font-semibold">{traiteur.name}</h2>
            <p className="mb-4 text-[10.5px] text-ink/45">Suivi du dossier</p>
            <div className="flex flex-col">
              <TimelineStep
                icon={<Check size={12} strokeWidth={3} />}
                tone="done"
                title="Dossier soumis"
                subtitle={formatDate(traiteur.createdAt)}
              />
              <TimelineStep
                icon={<Clock size={12} />}
                tone="current"
                title="Vérification en cours"
                subtitle="Sous 48h"
              />
              <TimelineStep title="Boutique en ligne" tone="upcoming" last />
            </div>
          </Card>
        )}

        {traiteur && traiteur.status === "approved" && (
          <Card className="mb-3.5 p-4">
            <h2 className="mb-1 font-display text-[15px] font-semibold">{traiteur.name}</h2>
            <StatusPill tone="success">Approuvé</StatusPill>
          </Card>
        )}

        {traiteur && traiteur.status === "rejected" && (
          <Card className="mb-3.5 overflow-hidden p-0">
            <div className="bg-coral-deep p-4 text-white">
              <XCircle size={20} className="mb-2" />
              <div className="font-display text-[16px] font-semibold">Dossier refusé</div>
              <div className="text-[11px] text-white/70">{traiteur.name}</div>
            </div>
            <div className="p-4">
              <p className="mb-3.5 text-[12.5px] leading-relaxed text-ink/60">
                {traiteur.rejectionReason ??
                  "Votre dossier n'a pas été validé. Contactez l'équipe lehaim pour en savoir plus."}
              </p>
              <ButtonLink href="/devenir-traiteur/profil" size="sm">
                Corriger mes informations
              </ButtonLink>
            </div>
          </Card>
        )}

        {traiteur && traiteur.status !== "rejected" && (
          <div className="grid grid-cols-2 gap-2.5">
            <GridTile href="/devenir-traiteur/menu" icon={<Dish size={18} />} label="Mon menu" tone="coral" />
            {traiteur.status === "approved" && (
              <GridTile href="/devenir-traiteur/commandes" icon={<Basket size={18} />} label="Commandes" tone="teal" />
            )}
            <GridTile href="/devenir-traiteur/creneaux" icon={<Calendar size={18} />} label="Mes créneaux" tone="violet" />
            <GridTile href="/devenir-traiteur/profil" icon={<Sliders size={18} />} label="Informations" tone="gold" />
            {traiteur.status === "approved" && (
              <GridTile
                href={`/marketplace/${traiteur.id}`}
                icon={<Share size={18} />}
                label="Fiche publique"
                tone="olive"
              />
            )}
          </div>
        )}

        <p className="mt-4 text-center text-[11px] text-ink/40">
          Vous êtes déjà client ?{" "}
          <Link href="/marketplace" className="font-bold text-teal underline underline-offset-2">
            Voir la marketplace
          </Link>
        </p>
      </div>
    </main>
  );
}

const TILE_TONE = {
  coral: "bg-coral/14 text-coral-deep",
  teal: "bg-teal/14 text-teal-deep",
  gold: "bg-gold/22 text-gold-ink",
  olive: "bg-olive/16 text-olive-deep",
  violet: "bg-violet/14 text-violet-deep",
} as const;

function GridTile({
  href,
  icon,
  label,
  tone,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  tone: keyof typeof TILE_TONE;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-card bg-white p-4 shadow-[var(--shadow-card)]"
    >
      <span className={`flex size-9 items-center justify-center rounded-xl ${TILE_TONE[tone]}`}>
        {icon}
      </span>
      <span className="text-[11.5px] font-bold text-ink">{label}</span>
    </Link>
  );
}

const TIMELINE_TONE = {
  done: { dot: "bg-olive text-white", line: "bg-olive", title: "text-ink", subtitle: "text-ink/45" },
  current: { dot: "bg-gold text-gold-ink", line: "bg-line", title: "text-gold-ink", subtitle: "text-ink/45" },
  upcoming: { dot: "bg-line-soft text-ink/30", line: "bg-line", title: "text-ink/35", subtitle: "text-ink/35" },
} as const;

function TimelineStep({
  icon,
  title,
  subtitle,
  tone,
  last = false,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  tone: keyof typeof TIMELINE_TONE;
  last?: boolean;
}) {
  const t = TIMELINE_TONE[tone];
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${t.dot}`}>
          {icon}
        </span>
        {!last && <span className={`mt-0.5 w-[2px] flex-1 ${t.line}`} />}
      </div>
      <div className={last ? "" : "pb-4"}>
        <div className={`text-[12.5px] font-bold ${t.title}`}>{title}</div>
        {subtitle && <div className={`text-[10.5px] ${t.subtitle}`}>{subtitle}</div>}
      </div>
    </div>
  );
}
