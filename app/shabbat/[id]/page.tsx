import { getTranslations } from "next-intl/server";
import { requireManager } from "@/lib/access";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { DeleteShabbat } from "@/components/DeleteShabbat";
import { LehaimIcon, type LehaimIconName } from "@/components/LehaimIcon";
import { AlertNote, Countdown } from "@/components/missions";
import { ButtonLink, Card, ProgressBar, StickyFooter } from "@/components/ui";
import { formatDate, formatTime, getShabbat, readinessLabel } from "@/lib/data";
import { getOps, untilReady } from "@/lib/missions";
import { BrandMark } from "@/components/BrandMark";

const SHORTCUTS = [
  { href: "besoins", icon: "board", labelKey: "besoins" },
  { href: "missions", icon: "contributions", labelKey: "missions" },
  { href: "couchage", icon: "bed", labelKey: "couchage" },
  { href: "materiel", icon: "chair", labelKey: "materiel" },
  { href: "invites", icon: "guests", labelKey: "invites" },
  { href: "depenses", icon: "receipt", labelKey: "depenses" },
  { href: "messages", icon: "whatsapp", labelKey: "messages" },
  { href: "co-organisation", icon: "handshake", labelKey: "coorganisation" },
] satisfies { href: string; icon: LehaimIconName; labelKey: string }[];

/** S10 · Dashboard hôte — le centre de contrôle du Shabbat. */
export default async function DashboardShabbat({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireManager(id);
  const t = await getTranslations("shabbat.dashboard");
  const tf = await getTranslations("expenses.fundingMode");
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  const remaining = untilReady(ops.readyBy);
  // Une mission dont une place sur deux est prise a déjà un volontaire :
  // l'alerte ne compte que celles où personne ne s'est manifesté.
  const orphan = ops.missions.filter((m) => m.claimers.length === 0).length;
  const freeSlots = ops.counts.slotsTotal - ops.counts.slotsTaken;

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="flex-1 overflow-y-auto px-5 pt-[54px] pb-4">
        <div className="mb-3 flex items-center gap-3">
          <BackButton fallback="/shabbats" />
          <BrandMark />
        </div>

        <header className="mb-3.5">
          <div className="min-w-0">
            <h1 className="truncate font-display text-[21px] font-semibold">{shabbat.title}</h1>
            <p className="text-[13px] text-ink/65">
              {formatDate(shabbat.startsAt)} · {formatTime(shabbat.startsAt)}
            </p>
            <Link
              href={`/shabbat/${id}/modifier`}
              className="mt-1 inline-block text-[13px] font-bold text-teal"
            >
              {t("editDetails")}
            </Link>
          </div>
        </header>

        {/* Compte à rebours et progression */}
        <section className="mb-3.5 rounded-panel bg-ink p-4 text-white">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 text-[12px] font-extrabold tracking-[0.04em] text-gold uppercase">
                {ops.readyBy ? t("readyByLabel") : t("nextAppointment")}
              </div>
              <div className="font-display text-[15px] font-semibold">
                {ops.readyBy
                  ? `${formatDate(ops.readyBy)} ${formatTime(ops.readyBy)}`
                  : formatDate(shabbat.startsAt)}
              </div>
            </div>
            {remaining && !remaining.past && <Countdown parts={remaining} />}
          </div>
          <ProgressBar value={ops.readiness} track="bg-white/15" height={10} />
          <div className="mt-1.5 text-[12.5px] text-white/70">
            {t("readinessSummary", {
              pct: ops.readiness,
              label: readinessLabel(ops.readiness),
              covered: ops.counts.missionsCovered,
              total: ops.counts.missionsTotal,
            })}
          </div>
        </section>

        <div className="mb-3.5 grid grid-cols-2 gap-2.5">
          <Tile
            label={t("guestsTile")}
            value={`${shabbat.counts.confirmed}/${shabbat.invitations.length || shabbat.guestTarget}`}
          />
          <Tile
            label={t("missionsTile")}
            value={`${ops.counts.missionsCovered}/${ops.counts.missionsTotal}`}
          />
        </div>

        {ops.fundingMode !== "free" && (
          <Card className="mb-2.5">
            <Link href={`/shabbat/${id}/depenses`} className="flex items-center gap-3 p-3.5">
              <span className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-gold/28 text-[19px]">
                🧾
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold">
                  {tf(`${ops.fundingMode}.label`)}
                </div>
                <div className="text-[12px] text-ink/65">
                  {t("spentSoFar", { amount: shabbat.counts.spent.toFixed(0) })}
                </div>
              </div>
              <span className="text-ink/30">›</span>
            </Link>
          </Card>
        )}

        {orphan > 0 && (
          <div className="mb-3.5">
            <AlertNote
              title={t("orphanMissions", { count: orphan })}
              text={t("freeSlotsToFill", { count: freeSlots })}
            />
          </div>
        )}

        {ops.swaps.length > 0 && (
          <Card className="mb-3.5 p-3.5">
            <div className="text-[13.5px] font-bold">
              {t("pendingSwaps", { count: ops.swaps.length })}
            </div>
            <div className="mt-0.5 text-[12px] text-ink/55">
              {ops.swaps.map((s) => `${s.fromName} → ${s.toName ?? t("theGroup")}`).join(" · ")}
            </div>
          </Card>
        )}

        <h2 className="mb-2 font-display text-[15px] font-semibold">{t("shortcutsTitle")}</h2>
        <div className="grid grid-cols-3 gap-2">
          {SHORTCUTS.filter(
            (shortcut) =>
              (shortcut.href !== "materiel" || ops.equipment.length > 0) &&
              (shortcut.href !== "couchage" ||
                ops.moments.some((moment) => moment.kind === "sleepover")),
          ).map((shortcut) => (
            <Card key={shortcut.href} className="rounded-card">
              <Link
                href={`/shabbat/${id}/${shortcut.href}`}
                className="flex flex-col items-center gap-0.5 px-1.5 pt-2.5 pb-3 text-center active:bg-line-soft/50"
              >
                <LehaimIcon name={shortcut.icon} size={54} />
                <span className="text-[12.5px] font-bold">{t(`shortcuts.${shortcut.labelKey}`)}</span>
              </Link>
            </Card>
          ))}
        </div>
        {shabbat.isHost && <DeleteShabbat shabbatId={id} title={shabbat.title} />}
      </div>

      <StickyFooter>
        <ButtonLink href={`/shabbat/${id}/ready`}>
          {ops.lockedAt ? t("viewLockedPlan") : t("goShabbatReady")}
        </ButtonLink>
      </StickyFooter>
    </main>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3.5">
      <div className="mb-1.5 text-[12px] font-extrabold text-ink/65 uppercase">{label}</div>
      <div className="font-display text-[21px] font-semibold">{value}</div>
    </Card>
  );
}
