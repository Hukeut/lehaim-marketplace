import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import type { LehaimIconName } from "@/components/LehaimIcon";
import { MomentRow } from "@/components/MomentRow";
import { StepDots } from "@/components/StepDots";
import { ButtonLink, StickyFooter } from "@/components/ui";
import { getShabbat } from "@/lib/data";
import { getOps } from "@/lib/missions";
import { MOMENTS } from "@/lib/templates";
import { BrandMark } from "@/components/BrandMark";

/** S04a · Que proposez-vous ? — les moments du Shabbat */
export default async function ChoisirMoments({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("shabbat.create.moments");
  const tc = await getTranslations("common");
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  const byKind = new Map(ops.moments.map((m) => [m.kind, m]));

  // Les repas viennent du jour choisi à la création ; le couchage et les
  // offices restent à décider ici.
  const MEALS = ["friday_dinner", "saturday_lunch"];
  // Le repas du jour choisi tient déjà son heure de l'écran précédent. Seul
  // l'autre jour — coché à la création — reste à renseigner ; s'il n'a pas
  // été coché, il n'y a plus rien à demander ici.
  const primaryKind =
    new Date(shabbat.startsAt).getDay() === 6 ? "saturday_lunch" : "friday_dinner";
  const meals = MOMENTS.filter(
    (m) => MEALS.includes(m.kind) && byKind.has(m.kind) && m.kind !== primaryKind,
  );
  const EXTRAS = MOMENTS.filter((m) => !MEALS.includes(m.kind));

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5.5 pt-[54px]">
        <div className="mb-3 flex items-center gap-3">
          <BackButton fallback="/creer" />
          <BrandMark />
        </div>
        <StepDots current={2} total={5} />
        <h1 className="mb-0.5 font-display text-[18px] leading-tight font-semibold">{t("title")}</h1>
        <p className="mb-4 text-[14px] text-ink/55">{t("subtitle")}</p>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 pb-4">
        {/* Le second repas a été décidé à l'étape précédente : on n'y revient
            pas, on complète seulement son heure. */}
        {meals.length > 0 && (
          <>
            <div className="text-[11px] font-extrabold tracking-[0.04em] text-ink/45 uppercase">
              {t("chosen")}
            </div>
            {meals.map((moment) => (
              <MomentRow
                key={moment.kind}
                shabbatId={id}
                kind={moment.kind}
                label={moment.label}
                detail={moment.detail}
                icon={moment.icon as LehaimIconName}
                tone={moment.tone}
                moment={byKind.get(moment.kind) ?? null}
                locked
              />
            ))}
          </>
        )}

        <div className="mt-1 text-[11px] font-extrabold tracking-[0.04em] text-ink/45 uppercase">
          {t("extras")}
        </div>
        {EXTRAS.map((moment) => (
          <MomentRow
            key={moment.kind}
            shabbatId={id}
            kind={moment.kind}
            label={moment.label}
            detail={moment.detail}
            icon={moment.icon as LehaimIconName}
            tone={moment.tone}
            moment={byKind.get(moment.kind) ?? null}
          />
        ))}
      </div>

      <StickyFooter className="px-5.5">
        <ButtonLink href={`/creer/${id}/missions`}>{tc("continue")}</ButtonLink>
      </StickyFooter>
    </main>
  );
}
