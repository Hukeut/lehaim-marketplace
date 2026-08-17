import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { Chat } from "@/components/icons";
import { AlertNote, Countdown } from "@/components/missions";
import { ButtonLink, Card, ProgressBar, StickyFooter } from "@/components/ui";
import { formatDate, formatTime, getShabbat, readinessLabel } from "@/lib/data";
import { FUNDING_LABEL, getOps, untilReady } from "@/lib/missions";
import { BrandMark } from "@/components/BrandMark";

const SHORTCUTS = [
  { href: "besoins", emoji: "📋", label: "Besoins" },
  { href: "missions", emoji: "🎯", label: "Missions" },
  { href: "materiel", emoji: "🪑", label: "Matériel" },
  { href: "invites", emoji: "👥", label: "Invités" },
  { href: "depenses", emoji: "🧾", label: "Dépenses" },
  { href: "messages", emoji: "💬", label: "Messages" },
];

/** S10 · Dashboard hôte — le centre de contrôle du Chabbat. */
export default async function DashboardShabbat({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

        <header className="mb-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-display text-[19px] font-semibold">{shabbat.title}</h1>
            <p className="text-[11.5px] text-ink/50">
              {formatDate(shabbat.startsAt)} · {formatTime(shabbat.startsAt)}
            </p>
          </div>
          <Link
            href={`/discussion/${id}`}
            aria-label="Discussion"
            className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-[var(--shadow-float)]"
          >
            <Chat size={16} />
          </Link>
        </header>

        {/* Compte à rebours et progression */}
        <section className="mb-3.5 rounded-panel bg-ink p-4 text-white">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 text-[10.5px] font-extrabold tracking-[0.04em] text-gold uppercase">
                {ops.readyBy ? "Tout doit être prêt" : "Prochain rendez-vous"}
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
          <div className="mt-1.5 text-[11px] text-white/70">
            {ops.readiness}% prêt · {readinessLabel(ops.readiness)} ·{" "}
            {ops.counts.missionsCovered}/{ops.counts.missionsTotal} missions
          </div>
        </section>

        <div className="mb-3.5 grid grid-cols-2 gap-2.5">
          <Tile
            label="Convives"
            value={`${shabbat.counts.confirmed}/${shabbat.invitations.length || shabbat.guestTarget}`}
          />
          <Tile
            label="Missions"
            value={`${ops.counts.missionsCovered}/${ops.counts.missionsTotal}`}
          />
        </div>

        {ops.fundingMode !== "free" && (
          <Card className="mb-2.5">
            <Link href={`/shabbat/${id}/depenses`} className="flex items-center gap-3 p-3.5">
              <span className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-gold/28 text-[17px]">
                🧾
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-bold">
                  {FUNDING_LABEL[ops.fundingMode]}
                </div>
                <div className="text-[10.5px] text-ink/50">
                  {shabbat.counts.spent.toFixed(0)} € engagés
                </div>
              </div>
              <span className="text-ink/30">›</span>
            </Link>
          </Card>
        )}

        {orphan > 0 && (
          <div className="mb-3.5">
            <AlertNote
              title={`${orphan} mission${orphan > 1 ? "s" : ""} sans volontaire`}
              text={`${freeSlots} place${freeSlots > 1 ? "s" : ""} encore à pourvoir`}
            />
          </div>
        )}

        {ops.swaps.length > 0 && (
          <Card className="mb-3.5 p-3.5">
            <div className="text-[12px] font-bold">
              {ops.swaps.length} échange{ops.swaps.length > 1 ? "s" : ""} en attente
            </div>
            <div className="mt-0.5 text-[10.5px] text-ink/55">
              {ops.swaps.map((s) => `${s.fromName} → ${s.toName ?? "le groupe"}`).join(" · ")}
            </div>
          </Card>
        )}

        <h2 className="mb-2 font-display text-[13.5px] font-semibold">Raccourcis</h2>
        <div className="grid grid-cols-3 gap-2">
          {SHORTCUTS.map((shortcut) => (
            <Card key={shortcut.href} className="rounded-field">
              <Link
                href={`/shabbat/${id}/${shortcut.href}`}
                className="flex flex-col items-center gap-1 px-2 py-3 text-center"
              >
                <span className="text-base">{shortcut.emoji}</span>
                <span className="text-[11px] font-bold">{shortcut.label}</span>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      <StickyFooter>
        <ButtonLink href={`/shabbat/${id}/ready`}>
          {ops.lockedAt ? "Voir le plan verrouillé" : "Passer en Shabbat Ready"}
        </ButtonLink>
      </StickyFooter>
    </main>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3.5">
      <div className="mb-1.5 text-[10.5px] font-extrabold text-ink/50 uppercase">{label}</div>
      <div className="font-display text-[19px] font-semibold">{value}</div>
    </Card>
  );
}
