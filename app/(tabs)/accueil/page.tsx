import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Basket, Bell, Dish, Medal, StarSolid, Users, Wallet } from "@/components/icons";
import { EmptyState, SignedOut } from "@/components/States";
import {
  Avatar,
  AvatarStack,
  ButtonLink,
  Card,
  IconTile,
  ProgressBar,
  ProgressRing,
  ScreenBody,
  SectionTitle,
  StatTile,
  StatusPill,
} from "@/components/ui";
import {
  countdown,
  formatDate,
  getNextShabbat,
  getShabbat,
  listHostedShabbats,
  listJoinedShabbats,
  readinessLabel,
} from "@/lib/data";
import { getOps } from "@/lib/missions";
import { getCurrentProfile } from "@/lib/profile";
import { BrandMark } from "@/components/BrandMark";
import { GuestShabbatCard } from "@/components/GuestShabbatCard";
import { JoinByCode } from "@/components/JoinByCode";
import { SurveyBanner } from "@/components/SurveyBanner";
import { InstallBanner } from "@/components/InstallBanner";

/** 04 · Accueil / Dashboard */
export default async function Accueil() {
  const t = await getTranslations("shabbat.home");
  const tc = await getTranslations("common");
  const tGuest = await getTranslations("shabbat.guestHome");
  // Le profil, les Chabbats organisés et ceux rejoints partent ensemble. Le
  // profil ne conditionne que la sortie anticipée ci-dessous, pas les deux
  // listes : les attendre l'un après l'autre coûtait un aller-retour complet
  // sur l'écran le plus visité de l'app.
  const [profile, hosted, joined] = await Promise.all([
    getCurrentProfile(),
    listHostedShabbats(),
    listJoinedShabbats(),
  ]);

  if (!profile) {
    return (
      <ScreenBody>
        <BrandMark className="mb-3" />
        <h1 className="mb-4 font-display text-[21px] font-semibold">{t("greetingGeneric")}</h1>
        <SignedOut suite="/accueil" what={t("signedOutNext")} />
      </ScreenBody>
    );
  }

  // Les deux rôles ne s'empilent pas : le Shabbat le plus proche occupe la
  // carte principale.
  //
  // Le sélecteur hôte/invité a été retiré au commit dd09a2d, mais la logique
  // qu'il pilotait — un paramètre `?vue=` — est restée. Plus rien ne posait ce
  // paramètre : la branche « rejoindre sans Shabbat rejoint » était devenue
  // inatteignable, et avec elle le panneau de saisie du code. Une des deux
  // portes d'entrée du produit avait donc disparu de l'app sans que personne
  // ne s'en aperçoive. Elle vit maintenant sur son propre écran, /rejoindre,
  // atteignable en permanence depuis ici et depuis « Mes Shabbats ».
  const nextHosted = hosted.filter((item) => !item.isPast)[0] ?? null;
  const nextJoined = joined.filter((item) => !item.isPast)[0] ?? null;

  const preferJoined =
    (!nextHosted && nextJoined) ||
    (nextHosted && nextJoined && nextJoined.startsAt < nextHosted.startsAt);

  const role: "organise" | "rejoins" = preferJoined ? "rejoins" : "organise";
  const next = role === "rejoins" ? nextJoined : (nextHosted ?? nextJoined);

  if (!next) {
    return (
      <ScreenBody>
        <Header firstName={profile.firstName} dateLabel={formatDate(new Date().toISOString())} />
        <SurveyBanner />
        <EmptyState
          illustration="/illustrations/etat-vide-table.webp"
          title={tc("emptyState.noShabbat.title")}
          text={tc("emptyState.noShabbat.text")}
          cta={tc("createShabbat")}
          href="/creer"
        />
        <JoinByCode label={tc("joinShabbat")} className="mt-3" />
      </ScreenBody>
    );
  }

  const [shabbat, ops] = await Promise.all([getShabbat(next.id), getOps(next.id)]);
  if (!shabbat) {
    return (
      <ScreenBody>
        <Header firstName={profile.firstName} dateLabel={formatDate(next.startsAt)} />
        <SignedOut suite="/accueil" what={t("signedOutThis")} />
      </ScreenBody>
    );
  }

  const pending = shabbat.invitations.filter((i) => i.status === "pending");
  const withoutRole = shabbat.invitations.filter((i) => !i.role);
  const mineCount = ops?.missions.filter((m) => m.mine).length ?? 0;
  const openContributions = ops?.missions.filter((m) => m.claimers.length === 0).length ?? 0;
  const hasSleepover = Boolean(ops?.moments.some((m) => m.kind === "sleepover"));

  return (
    <ScreenBody>
      <Header firstName={profile.firstName} dateLabel={formatDate(shabbat.startsAt)} />
      <InstallBanner />
      <SurveyBanner />

      {role === "rejoins" ? (
        <GuestShabbatCard shabbat={shabbat} missions={ops?.missions ?? []} />
      ) : (
        <>
          {/* Carte du prochain Shabbat */}
          <section className="relative mb-3.5 overflow-hidden rounded-hero bg-ink p-[18px] text-white">
            <StarSolid
              size={120}
              className="pointer-events-none absolute -top-7 -end-7 text-gold opacity-[0.07]"
            />

            <div className="mb-3.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.04em] text-teal-soft uppercase">
                  {countdown(shabbat.startsAt)}
                </div>
                <h2 className="truncate font-display text-[19px] font-semibold">{shabbat.title}</h2>
                <div className="mt-0.5 text-[12.5px] text-white/55">
                  {readinessLabel(shabbat.readiness)}
                </div>
              </div>
              <ProgressRing value={shabbat.readiness} />
            </div>

            {shabbat.invitations.length > 0 && (
              <div className="mb-3.5 flex items-center">
                <AvatarStack
                  people={shabbat.invitations.slice(0, 2).map((i) => ({
                    initial: i.initial,
                    tone: i.tone,
                  }))}
                  extra={Math.max(0, shabbat.invitations.length - 2)}
                  extraTone="violet"
                  ring="ring-ink"
                />
                <span className="ms-2.5 text-xs text-white/70">
                  {t("confirmedCount", {
                    confirmed: shabbat.counts.confirmed,
                    invited: shabbat.counts.invited,
                  })}
                </span>
              </div>
            )}

            <div className="mb-4 flex flex-col gap-2.5">
              {/* Une seule ligne, là où « Menu » et « Courses » en occupaient
                  deux : elles lisaient les tables du modèle v1, restées vides,
                  et affichaient donc 0/0 depuis toujours. */}
              <HeroLine
                icon={<Dish size={13} strokeWidth={2.2} />}
                iconClass="text-coral"
                label={t("contributions")}
                value={`${shabbat.counts.contributionsTaken}/${shabbat.counts.contributionsTotal}`}
                pct={pct(shabbat.counts.contributionsTaken, shabbat.counts.contributionsTotal)}
                tone="coral"
              />
              <HeroLine
                icon={<Wallet size={13} strokeWidth={2.2} />}
                iconClass="text-olive"
                label={t("budget")}
                value={
                  shabbat.budgetPlanned
                    ? `${shabbat.counts.spent.toFixed(0)}€/${shabbat.budgetPlanned.toFixed(0)}€`
                    : `${shabbat.counts.spent.toFixed(0)}€`
                }
                pct={pct(shabbat.counts.spent, shabbat.budgetPlanned ?? 0)}
                tone="olive"
              />
            </div>

            <div className="flex gap-2">
              <ButtonLink href={`/shabbat/${shabbat.id}`} size="sm">
                {t("manage")}
              </ButtonLink>
              <ButtonLink
                href={`/shabbat/${shabbat.id}/invites`}
                size="sm"
                className="bg-white/12 text-white shadow-none active:bg-white/20"
              >
                {t("invite")}
              </ButtonLink>
            </div>
          </section>
        </>
      )}

      {/* À faire — uniquement ce qui manque réellement */}
      {role === "organise" && (withoutRole.length > 0 || pending.length > 0) && (
        <>
          <SectionTitle className="mt-4">{t("todoTitle")}</SectionTitle>
          <ul className="mb-4.5 flex flex-col gap-2">
            {withoutRole.length > 0 && (
              <Todo
                href={`/shabbat/${shabbat.id}/invites`}
                tone="coral"
                icon={<Medal size={16} />}
                title={t("assignRoles", { count: withoutRole.length })}
                subtitle={withoutRole.map((g) => g.name).slice(0, 3).join(" · ")}
                pill={withoutRole.length > 2 ? tc("status.urgent") : undefined}
              />
            )}
            {pending.length > 0 && (
              <Todo
                href={`/shabbat/${shabbat.id}/invites`}
                tone="violet"
                icon={<Bell size={16} />}
                title={t("pendingResponses", { count: pending.length })}
                subtitle={pending.map((g) => g.name).slice(0, 3).join(" · ")}
              />
            )}
          </ul>
        </>
      )}

      {role === "rejoins" && (
        <>
          <SectionTitle>{t("todoTitle")}</SectionTitle>
          <ul className="mb-4.5 flex flex-col gap-2">
            {openContributions > 0 && (
              <Todo
                href={`/shabbat/${shabbat.id}/missions`}
                tone="coral"
                icon={<Medal size={16} />}
                title={tGuest("completeTable")}
                subtitle={tGuest("stillOpen", { count: openContributions })}
              />
            )}
            {hasSleepover && (
              <Todo
                href={`/shabbat/${shabbat.id}/couchage`}
                tone="violet"
                icon={<Users size={16} />}
                title={tGuest("pickRoom")}
                subtitle={tGuest("pickRoomHint")}
              />
            )}
          </ul>
        </>
      )}

      <SectionTitle>{t("quickOverview")}</SectionTitle>
      <div className="mb-4.5 grid grid-cols-2 gap-2.5">
        {role === "rejoins" ? (
          <>
            <StatTile center={false} label={tGuest("myContributions")} value={mineCount} />
            <StatTile center={false} label={tGuest("stillToFill")} value={openContributions} />
          </>
        ) : (
          <>
            <StatTile
              center={false}
              label={t("guests")}
              value={shabbat.counts.confirmed}
              suffix={`/${shabbat.counts.invited || shabbat.guestTarget}`}
            />
            <StatTile
              center={false}
              label={t("contributions")}
              value={shabbat.counts.contributionsTaken}
              suffix={`/${shabbat.counts.contributionsTotal}`}
            />
          </>
        )}
      </div>

    </ScreenBody>
  );
}

function pct(done: number, total: number) {
  return total > 0 ? Math.min(100, (done / total) * 100) : 0;
}

async function Header({ firstName, dateLabel }: { firstName: string; dateLabel: string }) {
  const t = await getTranslations("shabbat.home");
  const tc = await getTranslations("common");
  const tGuest = await getTranslations("shabbat.guestHome");
  return (
    <>
      <BrandMark className="mb-4 w-full justify-center" size="text-[34px]" />
      <header className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[12.5px] font-bold text-ink/65">{dateLabel}</div>
          <h1 className="font-display text-[21px] font-semibold">
            {t("greeting", { firstName })}
          </h1>
        </div>
        <Link
          href="/reglages"
          aria-label={tc("settings")}
          className="relative flex size-10 items-center justify-center rounded-full bg-white text-ink shadow-[var(--shadow-float)]"
        >
          <Bell size={18} />
        </Link>
      </header>
    </>
  );
}

function Todo({
  href,
  tone,
  icon,
  title,
  subtitle,
  pill,
}: {
  href: string;
  tone: "coral" | "violet" | "gold";
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  pill?: string;
}) {
  return (
    <Card as="li">
      <Link href={href} className="flex items-center gap-3 p-3">
        <IconTile tone={tone}>{icon}</IconTile>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold">{title}</div>
          {subtitle && <div className="truncate text-[12.5px] text-ink/65">{subtitle}</div>}
        </div>
        {pill ? (
          <StatusPill tone="urgent">{pill}</StatusPill>
        ) : (
          <span className="text-base text-ink/30">›</span>
        )}
      </Link>
    </Card>
  );
}

function HeroLine({
  icon,
  iconClass,
  label,
  value,
  pct,
  tone,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
  pct: number;
  tone: "coral" | "gold" | "olive";
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <span className={iconClass}>{icon}</span>
        <div className="flex flex-1 justify-between text-[12.5px] font-bold">
          <span>{label}</span>
          <span className="text-white/55">{value}</span>
        </div>
      </div>
      <div className="ms-[21px]">
        <ProgressBar value={pct} tone={tone} track="bg-white/18" height={4} />
      </div>
    </div>
  );
}
