import { getTranslations } from "next-intl/server";
import { LehaimIcon, type LehaimIconName } from "@/components/LehaimIcon";
import { notFound, redirect } from "next/navigation";
import { setMomentRsvp } from "@/app/mission-actions";
import { BackButton } from "@/components/BackButton";
import { ButtonLink, Card, StickyFooter } from "@/components/ui";
import { getMyInvitation, getShabbat } from "@/lib/data";
import { getOps } from "@/lib/missions";
import { MOMENTS } from "@/lib/templates";
import { createClient } from "@/lib/supabase/server";

const TONE = { gold: "bg-gold/28", coral: "bg-coral/14", violet: "bg-violet/14" } as const;

/** S06 · RSVP par moment */
export default async function RsvpParMoment({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("invitation.rsvp");
  const [shabbat, ops, mine] = await Promise.all([
    getShabbat(id),
    getOps(id),
    getMyInvitation(id),
  ]);
  if (!shabbat || !ops) notFound();
  if (!mine) redirect(`/invitation/${id}`);

  const supabase = await createClient();
  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("moment_id")
    .eq("invitation_id", mine.id)
    .eq("attending", true);

  const attending = new Set((rsvps ?? []).map((r) => r.moment_id as string));

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5.5 pt-[54px]">
        <div className="mb-3">
          <BackButton fallback={`/invitation/${id}`} />
        </div>
        <h1 className="mb-0.5 font-display text-xl font-semibold">{t("title")}</h1>
        <p className="mb-4 text-[14px] text-ink/55">{t("subtitle")}</p>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-5.5 pb-4">
        {ops.moments.length ? (
          ops.moments.map((moment) => {
            const meta = MOMENTS.find((m) => m.kind === moment.kind);
            const on = attending.has(moment.id);
            return (
              <Card key={moment.id}>
                <form action={setMomentRsvp.bind(null, id, mine.id, moment.id, on)}>
                  <button
                    type="submit"
                    role="switch"
                    aria-checked={on}
                    className="flex w-full items-center gap-3 p-3.5 text-start"
                  >
                    <span
                      className={`flex size-[38px] shrink-0 items-center justify-center overflow-hidden rounded-xl ${TONE[meta?.tone ?? "gold"]}`}
                    >
                      <LehaimIcon name={(meta?.icon ?? "candles") as LehaimIconName} size={38} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-[15px] font-bold">{moment.label}</span>
                      <span className="block text-[12px] text-ink/65">
                        {moment.detail}
                        {moment.attending > 0
                          ? ` · ${t("registeredCount", { count: moment.attending })}`
                          : ""}
                      </span>
                    </span>
                    <span
                      className={`relative h-[26px] w-11 shrink-0 rounded-full transition-colors ${on ? "bg-teal" : "bg-line"}`}
                    >
                      <span
                        className={`absolute top-[3px] size-5 rounded-full bg-white shadow-sm transition-all ${on ? "start-[21px]" : "start-[3px]"}`}
                      />
                    </span>
                  </button>
                </form>
              </Card>
            );
          })
        ) : (
          <p className="rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-4 text-center text-[14px] text-ink/45">
            {t("noMomentsYet")}
          </p>
        )}
      </div>

      <StickyFooter className="px-5.5">
        <ButtonLink href={`/shabbat/${id}/missions`}>{t("confirmAndChooseMission")}</ButtonLink>
      </StickyFooter>
    </main>
  );
}
