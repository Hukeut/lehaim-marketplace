import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { publishShabbat } from "@/app/actions";
import { setReadyBy } from "@/app/mission-actions";
import { BackButton } from "@/components/BackButton";
import { Check } from "@/components/icons";
import { InfoNote } from "@/components/missions";
import { ReadyByPicker } from "@/components/ReadyByPicker";
import { StepDots } from "@/components/StepDots";
import { Button, Card, StickyFooter } from "@/components/ui";
import { formatDate, getShabbat } from "@/lib/data";
import { getOps } from "@/lib/missions";
import { BrandMark } from "@/components/BrandMark";

/** Propositions de deadline, calées sur la date du Shabbat. */
function deadlineOptions(startsAt: string, t: Awaited<ReturnType<typeof getTranslations>>) {
  const start = new Date(startsAt);
  const at = (daysBefore: number, hour: number) => {
    const d = new Date(start);
    d.setDate(d.getDate() - daysBefore);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  return [
    { label: t("options.eveningBefore"), date: at(1, 18) },
    { label: t("options.sameDayNoon"), date: at(0, 12) },
    { label: t("options.sameDayAfternoon"), date: at(0, 16) },
  ];
}

/** S05ter · Compte à rebours — étape 5/5 */
export default async function Rebours({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("shabbat.create.rebours");
  const tc = await getTranslations("common");
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  const options = deadlineOptions(shabbat.startsAt, t);
  const current = ops.readyBy ? new Date(ops.readyBy).getTime() : null;

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <div className="mb-3 flex items-center gap-3">
          <BackButton fallback={`/creer/${id}/financement`} />
          <BrandMark />
        </div>
        <StepDots current={5} total={5} />
        <h1 className="mb-0.5 font-display text-[18px] leading-tight font-semibold">{t("title")}</h1>
        <p className="mb-4 text-xs text-ink/55">{t("subtitle")}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <Card className="mb-4 flex items-center gap-3 rounded-[18px] px-4 py-3.5">
          <div className="flex-1">
            <div className="text-[15px] font-bold">{t("enableCountdown")}</div>
            <div className="text-[12.5px] text-ink/65">{tc("status.recommended")}</div>
          </div>
          <form action={setReadyBy.bind(null, id, ops.readyBy ? null : options[0].date.toISOString())}>
            <button
              type="submit"
              role="switch"
              aria-checked={Boolean(ops.readyBy)}
              className={`relative block h-[26px] w-11 rounded-full transition-colors ${ops.readyBy ? "bg-teal" : "bg-line"}`}
            >
              <span
                className={`absolute top-[3px] size-5 rounded-full bg-white shadow-sm transition-all ${ops.readyBy ? "start-[21px]" : "start-[3px]"}`}
              />
            </button>
          </form>
        </Card>

        <div className="mb-2 text-[12.5px] font-bold text-ink/55">{t("readyByLabel")}</div>
        <div className="mb-4 flex flex-col gap-2">
          {options.map((option) => {
            const selected = current === option.date.getTime();
            return (
              <form key={option.label} action={setReadyBy.bind(null, id, option.date.toISOString())}>
                <button type="submit" className="w-full text-start">
                  <Card
                    className={`flex items-center justify-between rounded-field px-3.5 py-3 ${selected ? "border-2 border-teal" : ""}`}
                  >
                    <span className="text-[14.5px] font-bold">
                      {option.label}
                      <span className="ms-1.5 font-normal text-ink/45">
                        {formatDate(option.date.toISOString())}
                      </span>
                    </span>
                    {selected && <Check size={15} strokeWidth={2.8} className="text-teal" />}
                  </Card>
                </button>
              </form>
            );
          })}
        </div>

        <ReadyByPicker shabbatId={id} readyBy={ops.readyBy} />

        <InfoNote>{t("infoNote")}</InfoNote>
      </div>

      <StickyFooter className="px-5">
        <form action={publishShabbat.bind(null, id)}>
          <Button type="submit" size="lg" className="shadow-[var(--shadow-coral-lg)]">
            {tc("createThisShabbat")}
          </Button>
        </form>
      </StickyFooter>
    </main>
  );
}
