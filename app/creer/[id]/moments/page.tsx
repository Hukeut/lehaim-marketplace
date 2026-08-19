import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { MomentToggle } from "@/components/MomentToggle";
import { StepDots } from "@/components/StepDots";
import { ButtonLink, StickyFooter } from "@/components/ui";
import { getShabbat } from "@/lib/data";
import { getOps } from "@/lib/missions";
import { MOMENTS } from "@/lib/templates";
import { BrandMark } from "@/components/BrandMark";

/** S04a · Que proposez-vous ? — les moments du Chabbat */
export default async function ChoisirMoments({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  const active = new Set(ops.moments.map((m) => m.kind));

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5.5 pt-[54px]">
        <div className="mb-3 flex items-center gap-3">
          <BackButton fallback={`/creer/${id}/modele`} />
          <BrandMark />
        </div>
        <StepDots current={2} />
        <h1 className="mb-0.5 font-display text-xl font-semibold">Que proposez-vous ?</h1>
        <p className="mb-4 text-[12.5px] text-ink/55">Activez ce qui concerne ce Chabbat.</p>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-5.5 pb-4">
        {MOMENTS.map((moment) => (
          <MomentToggle
            key={moment.kind}
            shabbatId={id}
            kind={moment.kind}
            label={moment.label}
            detail={moment.detail}
            emoji={moment.emoji}
            tone={moment.tone}
            enabled={active.has(moment.kind)}
          />
        ))}
      </div>

      <StickyFooter className="px-5.5">
        <ButtonLink href={`/creer/${id}/missions`}>Continuer</ButtonLink>
      </StickyFooter>
    </main>
  );
}
