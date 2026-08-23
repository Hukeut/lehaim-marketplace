import { getTranslations } from "next-intl/server";
import { requireManager } from "@/lib/access";
import Link from "next/link";
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
  await requireManager(id);
  const t = await getTranslations("shabbat.ready");
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
        src="/illustrations/celebration-confirmation.webp"
        alt=""
        className="absolute inset-0 size-full object-cover object-top opacity-30 sm:rounded-[36px]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/85 to-ink sm:rounded-[36px]" />

      <div className="relative flex flex-1 flex-col items-center gap-3 overflow-y-auto px-7 pt-[84px] pb-5 text-center text-white">
        {remaining && !remaining.past && (
          <>
            <div className="text-[12.5px] font-extrabold tracking-[0.08em] text-gold uppercase">
              {t("countdownLabel")}
            </div>
            <Countdown parts={remaining} />
          </>
        )}

        <div className="relative mt-0.5 size-20">
          <div
            className="absolute rounded-full"
            style={{
              inset: -18,
              background: "radial-gradient(circle, rgba(255,209,102,0.35), rgba(255,209,102,0))",
            }}
          />
          <StarSolid size={12} className="absolute -top-1 start-0 text-gold" />
          <div className="relative flex size-20 items-center justify-center rounded-full bg-white/10 font-display text-[20px] font-semibold">
            {ops.readiness}%
          </div>
        </div>

        <h1 className="font-display text-[21px] font-semibold">
          {ops.readiness >= 100 ? t("allReady") : t("almostThere")}
        </h1>
        <p className="max-w-[268px] text-[14px] leading-relaxed text-white/70">
          {t("missionsAccomplished", { count: done })}, {t("guestsConfirmed", { count: guests })}.{" "}
          {ops.readiness >= 100
            ? t("allCandlesLeft")
            : t("slotsRemaining", { count: ops.counts.slotsTotal - ops.counts.slotsTaken })}
        </p>

        <div className="mt-1 flex items-center">
          {shabbat.invitations.slice(0, 3).map((guest, i) => (
            <span
              key={guest.invitationId}
              className={`flex size-[30px] items-center justify-center rounded-full text-[12.5px] font-extrabold text-white ring-2 ring-ink ${
                { coral: "bg-coral", teal: "bg-teal", violet: "bg-violet", gold: "bg-gold text-gold-ink", olive: "bg-olive", ink: "bg-ink" }[guest.tone]
              } ${i > 0 ? "-ms-2.5" : ""}`}
            >
              {guest.initial}
            </span>
          ))}
          {others > 0 && (
            <span className="-ms-2.5 flex size-[30px] items-center justify-center rounded-full bg-white/15 text-[11.5px] font-extrabold text-white ring-2 ring-ink">
              +{others}
            </span>
          )}
        </div>

        <p className="text-[13px] text-white/50">
          {formatDate(shabbat.startsAt)} · {formatTime(shabbat.startsAt)}
        </p>
      </div>

      <div className="relative flex shrink-0 flex-col gap-2 px-7 pt-2 pb-[30px]">
        {locked ? (
          <>
            <ButtonLink href={`/shabbat/${id}/messages`} size="lg">
              {t("sendFinalRecap")}
            </ButtonLink>
            <Link
              href="/accueil"
              className="py-2 text-center text-[14px] font-bold text-white/80"
            >
              {t("backHome")}
            </Link>
            <form action={unlockShabbat.bind(null, id)}>
              <Button type="submit" variant="ghost" size="sm" className="text-white/50">
                {t("unlockPlan")}
              </Button>
            </form>
          </>
        ) : (
          <form action={lockShabbat.bind(null, id)}>
            <Button type="submit" size="lg" className="shadow-[0_10px_24px_rgba(232,138,46,0.4)]">
              {t("lockButton")} ✨
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
