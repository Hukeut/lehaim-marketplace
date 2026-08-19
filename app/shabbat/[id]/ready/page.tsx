import { notFound } from "next/navigation";
import { lockShabbat, unlockShabbat } from "@/app/mission-actions";
import { FloatingBackButton } from "@/components/BackButton";
import { StarSolid } from "@/components/icons";
import { Countdown } from "@/components/missions";
import { Button, ButtonLink } from "@/components/ui";
import { formatDate, formatTime, getShabbat } from "@/lib/data";
import { getOps, untilReady } from "@/lib/missions";

/** S17 · Shabbat Ready — le verrouillage du plan. */
export default async function ShabbatReady({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  const remaining = untilReady(ops.readyBy ?? shabbat.startsAt);
  const locked = Boolean(ops.lockedAt);
  const done = ops.counts.slotsTaken;
  const guests = shabbat.counts.confirmed;
  const others = Math.max(0, shabbat.invitations.length - 3);

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col bg-ink sm:min-h-0 sm:rounded-[36px]">
      <FloatingBackButton fallback={`/shabbat/${id}`} />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/celebration-confirmation.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover opacity-50 sm:rounded-[36px]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/55 to-ink/92 sm:rounded-[36px]" />

      <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-7.5 text-center text-white">
        {remaining && !remaining.past && (
          <>
            <div className="text-[11px] font-extrabold tracking-[0.08em] text-gold uppercase">
              Compte à rebours
            </div>
            <Countdown parts={remaining} />
          </>
        )}

        <div className="relative mt-1 size-23">
          <div
            className="absolute rounded-full"
            style={{
              inset: -18,
              background: "radial-gradient(circle, rgba(255,209,102,0.35), rgba(255,209,102,0))",
            }}
          />
          <StarSolid size={12} className="absolute -top-1 left-0 text-gold" />
          <div className="relative flex size-23 items-center justify-center rounded-full bg-white/10 font-display text-[22px] font-semibold">
            {ops.readiness}%
          </div>
        </div>

        <h1 className="font-display text-2xl font-semibold">
          {ops.readiness >= 100 ? "Tout est prêt." : "On y est presque."}
        </h1>
        <p className="max-w-[260px] text-[13px] leading-relaxed text-white/70">
          {done} mission{done > 1 ? "s" : ""} accomplie{done > 1 ? "s" : ""}, {guests} convive
          {guests > 1 ? "s" : ""} confirmé{guests > 1 ? "s" : ""}.{" "}
          {ops.readiness >= 100
            ? "Il ne reste plus qu'à allumer les bougies."
            : `Il reste ${ops.counts.slotsTotal - ops.counts.slotsTaken} place${ops.counts.slotsTotal - ops.counts.slotsTaken > 1 ? "s" : ""} à pourvoir.`}
        </p>

        <div className="mt-1 flex items-center">
          {shabbat.invitations.slice(0, 3).map((guest, i) => (
            <span
              key={guest.invitationId}
              className={`flex size-[30px] items-center justify-center rounded-full text-[11px] font-extrabold text-white ring-2 ring-ink ${
                { coral: "bg-coral", teal: "bg-teal", violet: "bg-violet", gold: "bg-gold text-gold-ink", olive: "bg-olive", ink: "bg-ink" }[guest.tone]
              } ${i > 0 ? "-ml-2.5" : ""}`}
            >
              {guest.initial}
            </span>
          ))}
          {others > 0 && (
            <span className="-ml-2.5 flex size-[30px] items-center justify-center rounded-full bg-white/15 text-[10px] font-extrabold text-white ring-2 ring-ink">
              +{others}
            </span>
          )}
        </div>

        <p className="text-[11.5px] text-white/50">
          {formatDate(shabbat.startsAt)} · {formatTime(shabbat.startsAt)}
        </p>
      </div>

      <div className="relative flex flex-col gap-2.5 px-7.5 pb-[34px]">
        {locked ? (
          <>
            <ButtonLink href={`/shabbat/${id}/messages`} size="lg">
              Envoyer le récap final
            </ButtonLink>
            <form action={unlockShabbat.bind(null, id)}>
              <Button type="submit" variant="ghost" size="sm" className="text-white/60">
                Déverrouiller le plan
              </Button>
            </form>
          </>
        ) : (
          <form action={lockShabbat.bind(null, id)}>
            <Button type="submit" size="lg" className="shadow-[0_10px_24px_rgba(255,122,89,0.4)]">
              Shabbat Ready ✨
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
