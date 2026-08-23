import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { setFundingMode } from "@/app/mission-actions";
import { BackButton } from "@/components/BackButton";
import { Check } from "@/components/icons";
import { StepDots } from "@/components/StepDots";
import { ButtonLink, Card, StickyFooter } from "@/components/ui";
import { getShabbat } from "@/lib/data";
import { getOps, type FundingMode } from "@/lib/missions";
import { BrandMark } from "@/components/BrandMark";

export const FUNDING_OPTIONS: {
  key: FundingMode;
  emoji: string;
  tile: string;
}[] = [
  { key: "pot", emoji: "💰", tile: "bg-gold/28" },
  { key: "split", emoji: "🧾", tile: "bg-coral/14" },
  { key: "host_pays", emoji: "🏠", tile: "bg-violet/14" },
  { key: "free", emoji: "✌️", tile: "bg-ink/6" },
];

/** S05bis · Mode de financement — étape 4/5 */
export default async function Financement({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("shabbat.create.financement");
  const tf = await getTranslations("expenses.fundingMode");
  const tc = await getTranslations("common");
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <div className="mb-3 flex items-center gap-3">
          <BackButton fallback={`/creer/${id}/missions`} />
          <BrandMark />
        </div>
        <StepDots current={4} total={5} />
        <h1 className="mb-0.5 font-display text-[18px] leading-tight font-semibold">{t("title")}</h1>
        <p className="mb-3 text-xs text-ink/55">{t("subtitle")}</p>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-5 pb-4">
        {FUNDING_OPTIONS.map((option) => {
          const selected = ops.fundingMode === option.key;
          return (
            <form key={option.key} action={setFundingMode.bind(null, id, option.key)}>
              <button type="submit" className="w-full text-start">
                <Card
                  className={`flex items-center gap-3.5 rounded-[18px] p-3.5 ${selected ? "border-2 border-teal bg-teal/[0.07] shadow-[0_0_0_4px_rgba(34,79,167,0.10)]" : "border-2 border-transparent"}`}
                >
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-[13px] text-xl ${option.tile}`}
                  >
                    {option.emoji}
                  </span>
                  <span className="flex-1">
                    <span className="block font-display text-sm font-semibold">
                      {tf(`${option.key}.label`)}
                    </span>
                    <span className="block text-[12.5px] leading-snug text-ink/55">
                      {tf(`${option.key}.description`)}
                    </span>
                  </span>
                  <span
                    className={`flex size-[22px] shrink-0 items-center justify-center rounded-full ${
                      selected ? "bg-teal text-white" : "border-2 border-line"
                    }`}
                  >
                    {selected && <Check size={12} strokeWidth={3} />}
                  </span>
                </Card>
              </button>
            </form>
          );
        })}
      </div>

      <StickyFooter className="px-5">
        <ButtonLink href={`/creer/${id}/rebours`}>{tc("continue")}</ButtonLink>
      </StickyFooter>
    </main>
  );
}
