import Link from "next/link";
import { Basket, Bell, Dish, Medal, StarSolid, Wallet } from "@/components/icons";
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
  listThreads,
  readinessLabel,
} from "@/lib/data";
import { getCurrentProfile } from "@/lib/profile";
import { BrandMark } from "@/components/BrandMark";
import { SurveyBanner } from "@/components/SurveyBanner";

/** 04 · Accueil / Dashboard */
export default async function Accueil() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <ScreenBody>
        <BrandMark className="mb-3" />
        <h1 className="mb-4 font-display text-[19px] font-semibold">Bonjour</h1>
        <SignedOut suite="/accueil" what="votre prochain Shabbat" />
      </ScreenBody>
    );
  }

  const next = await getNextShabbat();
  if (!next) {
    return (
      <ScreenBody>
        <Header firstName={profile.firstName} dateLabel={formatDate(new Date().toISOString())} />
        <SurveyBanner />
        <EmptyState
          illustration="/illustrations/etat-vide-table.jpg"
          title="Aucun Shabbat prévu"
          text="Ouvrez votre table à vos proches : choisissez une date, on s'occupe du reste."
          cta="Créer un Shabbat"
          href="/creer"
        />
      </ScreenBody>
    );
  }

  const [shabbat, threads] = await Promise.all([getShabbat(next.id), listThreads()]);
  if (!shabbat) {
    return (
      <ScreenBody>
        <Header firstName={profile.firstName} dateLabel={formatDate(next.startsAt)} />
        <SignedOut suite="/accueil" what="ce Shabbat" />
      </ScreenBody>
    );
  }

  const pending = shabbat.invitations.filter((i) => i.status === "pending");
  const withoutRole = shabbat.invitations.filter((i) => !i.role);
  const shoppingLeft = shabbat.counts.shoppingTotal - shabbat.counts.shoppingDone;
  const lastThread = threads.find((t) => t.lastMessage);

  return (
    <ScreenBody>
      <Header firstName={profile.firstName} dateLabel={formatDate(shabbat.startsAt)} />
      <SurveyBanner />

      {/* Carte du prochain Shabbat */}
      <section className="relative mb-3.5 overflow-hidden rounded-hero bg-ink p-[18px] text-white">
        <StarSolid
          size={120}
          className="pointer-events-none absolute -top-7 -right-7 text-gold opacity-[0.07]"
        />

        <div className="mb-3.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 text-[11px] font-extrabold tracking-[0.04em] text-teal-soft uppercase">
              {countdown(shabbat.startsAt)}
            </div>
            <h2 className="truncate font-display text-[17px] font-semibold">{shabbat.title}</h2>
            <div className="mt-0.5 text-[11px] text-white/55">
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
            <span className="ml-2.5 text-xs text-white/70">
              {shabbat.counts.confirmed}/{shabbat.counts.invited} invités confirmés
            </span>
          </div>
        )}

        <div className="mb-4 flex flex-col gap-2.5">
          <HeroLine
            icon={<Dish size={13} strokeWidth={2.2} />}
            iconClass="text-coral"
            label="Menu"
            value={`${shabbat.counts.dishesDone}/${shabbat.counts.dishesTotal}`}
            pct={pct(shabbat.counts.dishesDone, shabbat.counts.dishesTotal)}
            tone="coral"
          />
          <HeroLine
            icon={<Basket size={13} strokeWidth={2.2} />}
            iconClass="text-gold"
            label="Courses"
            value={`${shabbat.counts.shoppingDone}/${shabbat.counts.shoppingTotal}`}
            pct={pct(shabbat.counts.shoppingDone, shabbat.counts.shoppingTotal)}
            tone="gold"
          />
          <HeroLine
            icon={<Wallet size={13} strokeWidth={2.2} />}
            iconClass="text-olive"
            label="Budget"
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
            Gérer
          </ButtonLink>
          <ButtonLink
            href={`/shabbat/${shabbat.id}/invites`}
            size="sm"
            className="bg-white/12 text-white shadow-none active:bg-white/20"
          >
            Inviter
          </ButtonLink>
        </div>
      </section>

      {/* À faire — uniquement ce qui manque réellement */}
      {(withoutRole.length > 0 || pending.length > 0 || shoppingLeft > 0) && (
        <>
          <SectionTitle className="mt-4">À faire</SectionTitle>
          <ul className="mb-4.5 flex flex-col gap-2">
            {withoutRole.length > 0 && (
              <Todo
                href={`/shabbat/${shabbat.id}/invites`}
                tone="coral"
                icon={<Medal size={16} />}
                title={`Assigner ${withoutRole.length} rôle${withoutRole.length > 1 ? "s" : ""}`}
                subtitle={withoutRole.map((g) => g.name).slice(0, 3).join(" · ")}
                pill={withoutRole.length > 2 ? "Urgent" : undefined}
              />
            )}
            {pending.length > 0 && (
              <Todo
                href={`/shabbat/${shabbat.id}/invites`}
                tone="violet"
                icon={<Bell size={16} />}
                title={`${pending.length} réponse${pending.length > 1 ? "s" : ""} en attente`}
                subtitle={pending.map((g) => g.name).slice(0, 3).join(" · ")}
              />
            )}
            {shoppingLeft > 0 && (
              <Todo
                href={`/shabbat/${shabbat.id}`}
                tone="gold"
                icon={<Basket size={16} />}
                title={`${shoppingLeft} article${shoppingLeft > 1 ? "s" : ""} restant${shoppingLeft > 1 ? "s" : ""}`}
                subtitle={shabbat.shopping
                  .filter((i) => !i.done)
                  .map((i) => i.name)
                  .slice(0, 3)
                  .join(", ")}
              />
            )}
          </ul>
        </>
      )}

      <SectionTitle>Aperçu rapide</SectionTitle>
      <div className="mb-4.5 grid grid-cols-2 gap-2.5">
        <StatTile
          center={false}
          label="Invités"
          value={shabbat.counts.confirmed}
          suffix={`/${shabbat.counts.invited || shabbat.guestTarget}`}
        />
        <StatTile
          center={false}
          label="Plats"
          value={shabbat.counts.dishesDone}
          suffix={`/${shabbat.counts.dishesTotal}`}
        />
      </div>

      {lastThread?.lastMessage && (
        <>
          <SectionTitle>Messages</SectionTitle>
          <Card className="mb-4.5">
            <Link
              href={`/discussion/${lastThread.shabbat.id}`}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <Avatar
                initial={lastThread.lastMessage.author.initial}
                tone={lastThread.lastMessage.author.tone}
                size={34}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-bold">
                  {lastThread.lastMessage.author.name}
                </div>
                <div className="truncate text-[11px] text-ink/50">
                  {lastThread.lastMessage.body}
                </div>
              </div>
            </Link>
          </Card>
        </>
      )}
    </ScreenBody>
  );
}

function pct(done: number, total: number) {
  return total > 0 ? Math.min(100, (done / total) * 100) : 0;
}

function Header({ firstName, dateLabel }: { firstName: string; dateLabel: string }) {
  return (
    <>
      <BrandMark className="mb-3" />
      <header className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold text-ink/50">{dateLabel}</div>
          <h1 className="font-display text-[19px] font-semibold">Bonjour, {firstName}</h1>
        </div>
        <Link
          href="/reglages"
          aria-label="Réglages"
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
          <div className="text-[12.5px] font-bold">{title}</div>
          {subtitle && <div className="truncate text-[11px] text-ink/50">{subtitle}</div>}
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
        <div className="flex flex-1 justify-between text-[11px] font-bold">
          <span>{label}</span>
          <span className="text-white/55">{value}</span>
        </div>
      </div>
      <div className="ml-[21px]">
        <ProgressBar value={pct} tone={tone} track="bg-white/18" height={4} />
      </div>
    </div>
  );
}
