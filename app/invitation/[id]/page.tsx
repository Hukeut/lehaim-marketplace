import { getTranslations } from "next-intl/server";
import { CancelParticipation } from "@/components/CancelParticipation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FloatingBackButton } from "@/components/BackButton";
import { Calendar, Chat, Clock, Dish, MapPin, Medal, StarSolid, User } from "@/components/icons";
import { MapLinks } from "@/components/MapLinks";
import { Avatar, AvatarStack, Card, GlowCircle, StatusPill } from "@/components/ui";
import { formatDate, formatTime, getMyInvitation, getShabbat } from "@/lib/data";
import { getOps } from "@/lib/missions";
import { RsvpButtons } from "./RsvpButtons";

/** 09b · Vue invité d'un Shabbat */
export default async function VueInvite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("invitation.detail");
  const tc = await getTranslations("common");
  const [shabbat, mine, ops] = await Promise.all([getShabbat(id), getMyInvitation(id), getOps(id)]);
  if (!shabbat) notFound();

  // Lu sur les apports, et non plus sur `dishes` : cette table appartenait au
  // modèle v1 et n'a jamais contenu une ligne. Le lien pointait déjà vers
  // l'écran des apports, l'encart annonçait juste autre chose.
  const openContributions = (ops?.missions ?? []).filter((m) => m.claimers.length === 0);
  const moments = ops?.moments ?? [];
  // Le couchage se compte sur le moment qui le porte : c'est ce qui décide si
  // on rentre à pied après le repas ou si on prévoit un sac.
  const beds = moments.reduce((total, m) => total + (m.capacity ?? 0), 0);

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col overflow-y-auto sm:min-h-0">
      <FloatingBackButton fallback="/shabbats" />

      <div className="relative h-[280px] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/famille-table-shabbat.webp"
          alt=""
          className="size-full object-cover object-[center_22%] sm:rounded-t-[36px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/10 to-ink/55 sm:rounded-t-[36px]" />
        <div className="absolute inset-x-6 bottom-5.5">
          <div className="mb-1.5 text-[12.5px] font-extrabold tracking-[0.05em] text-gold uppercase">
            {formatDate(shabbat.startsAt)}
          </div>
          <h1 className="font-display text-[25px] leading-tight font-semibold text-white">
            {shabbat.title}
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5.5 pt-5 pb-6">
        {mine && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-sm font-semibold">{t("yourResponse")}</span>
              <StatusPill
                tone={
                  mine.status === "confirmed"
                    ? "success"
                    : mine.status === "declined"
                      ? "neutral"
                      : "warning"
                }
              >
                {mine.status === "confirmed"
                  ? tc("status.confirmed")
                  : mine.status === "declined"
                    ? tc("status.declined")
                    : tc("status.pending")}
              </StatusPill>
            </div>
            <RsvpButtons shabbatId={id} status={mine.status} />
          </div>
        )}

        {mine?.role && (
          <Card className="flex items-center gap-3 rounded-panel p-4">
            <GlowCircle size={44} glow="rgba(232,138,46,0.25)">
              <span className="flex size-11 items-center justify-center rounded-xl bg-ink text-gold">
                <Medal size={20} />
              </span>
            </GlowCircle>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[15px] font-semibold">
                {t("youAre", { role: mine.role })}
              </div>
              <div className="truncate text-[13px] text-ink/55">
                {mine.roleDetail ?? t("toConfirmBeforeThursday")}
              </div>
            </div>
          </Card>
        )}

        <Card className="flex items-center gap-3.5 rounded-panel p-4">
          <Avatar initial={shabbat.host.initial} tone={shabbat.host.tone} size={48} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-display text-[15px] font-semibold">
                {shabbat.host.name}
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold/22 px-2 py-0.5">
                <StarSolid size={9} className="text-gold-deep" />
                <span className="text-[9px] font-extrabold text-gold-ink">{tc("host")}</span>
              </span>
            </div>
            <p className="mt-0.5 text-[13px] text-ink/55">{t("hostsAtHome")}</p>
          </div>
        </Card>

        <Card className="flex flex-col gap-2.5 rounded-panel px-4 py-3.5">
          <Line icon={<Calendar size={15} className="text-teal" />}>
            {formatDate(shabbat.startsAt)} · {formatTime(shabbat.startsAt)}
          </Line>

          {/* Quels repas — un invité ne sait pas s'il est convié au vendredi
              soir, au déjeuner du samedi, ou aux deux. L'information existait
              déjà dans le Shabbat, elle n'était affichée nulle part de ce
              côté-ci. */}
          {moments.length > 0 && (
            <>
              <span className="h-px bg-line-soft" />
              <Line icon={<Clock size={15} className="text-teal" />}>
                {moments
                  .map((m) => (m.meetAt ? `${m.label} · ${m.meetAt}` : m.label))
                  .join(" · ")}
              </Line>
            </>
          )}

          {shabbat.address && (
            <>
              <span className="h-px bg-line-soft" />
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 shrink-0 text-coral" />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] leading-snug font-bold">{shabbat.address}</div>
                  {shabbat.neighbourhood && (
                    <div className="mt-0.5 text-[12.5px] text-ink/55">{shabbat.neighbourhood}</div>
                  )}
                  {/* L'adresse écrite ne répond pas à « où est-ce ? » : il
                      fallait la recopier ailleurs. */}
                  <MapLinks address={shabbat.address} className="mt-2.5" />
                </div>
              </div>
            </>
          )}

          {beds > 0 && (
            <>
              <span className="h-px bg-line-soft" />
              <Line icon={<Medal size={15} className="text-olive" />}>
                {t("sleepingAvailable", { count: beds })}
              </Line>
            </>
          )}

          <span className="h-px bg-line-soft" />
          <Line icon={<User size={15} className="text-violet" />}>
            {t("confirmedGuestsCount", { count: shabbat.counts.confirmed })}
          </Line>
        </Card>

        {shabbat.invitations.length > 0 && (
          <Card className="rounded-panel p-4">
            <div className="mb-2 flex items-center">
              <AvatarStack
                size={30}
                people={shabbat.invitations.slice(0, 3).map((i) => ({
                  initial: i.initial,
                  tone: i.tone,
                }))}
                extra={Math.max(0, shabbat.invitations.length - 3)}
              />
              <span className="ms-2.5 text-xs text-ink/60">{t("accompanying")}</span>
            </div>
          </Card>
        )}

        {openContributions.length > 0 && (
          <Card className="overflow-hidden rounded-panel">
            <div className="border-b border-line-soft px-4 py-3">
              <div className="font-display text-sm font-semibold">{t("stillMissing")}</div>
              <p className="mt-0.5 text-[13px] text-ink/55">
                {t("contributionsWithoutPerson", { count: openContributions.length })}
              </p>
            </div>
            {openContributions.slice(0, 4).map((mission) => (
              <div
                key={mission.id}
                className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-0"
              >
                <Dish size={15} className="shrink-0 text-coral" />
                <span className="flex-1 truncate text-[14px] font-bold">{mission.title}</span>
              </div>
            ))}
            <Link
              href={`/shabbat/${id}/missions`}
              className="block px-4 py-3 text-center text-[14px] font-bold text-teal"
            >
              {t("chooseWhatIBring")}
            </Link>
          </Card>
        )}

        <CancelParticipation shabbatId={id} />
      </div>
    </main>
  );
}

function Line({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <span className="text-[14px] font-bold">{children}</span>
    </div>
  );
}
