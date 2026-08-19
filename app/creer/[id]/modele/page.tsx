import { notFound } from "next/navigation";
import { applyTemplate } from "@/app/mission-actions";
import { BackButton } from "@/components/BackButton";
import { StepDots } from "@/components/StepDots";
import { Button, Card } from "@/components/ui";
import { getShabbat } from "@/lib/data";
import { TEMPLATES, templateStats } from "@/lib/templates";
import { BrandMark } from "@/components/BrandMark";

/** S03 · Choisir un modèle — étape 2/5 */
export default async function ChoisirModele({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shabbat = await getShabbat(id);
  if (!shabbat) notFound();

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <div className="mb-3 flex items-center gap-3">
          <BackButton fallback="/creer" />
          <BrandMark />
        </div>
        <StepDots current={2} />
        <h1 className="mb-0.5 font-display text-xl font-semibold">Choisissez votre modèle</h1>
        <p className="mb-3.5 text-[12.5px] text-ink/55">
          Vous pourrez tout personnaliser à l&apos;étape suivante.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 pb-5">
        {TEMPLATES.map((template) => {
          const stats = templateStats(template);
          return (
            <Card
              key={template.key}
              className={`overflow-hidden rounded-panel shadow-[var(--shadow-card-lg)] ${
                template.recommended ? "border-2 border-teal" : ""
              }`}
            >
              <div className="relative h-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={template.illustration}
                  alt=""
                  className="size-full object-cover object-[center_30%]"
                />
                {template.recommended && (
                  <span className="absolute top-2.5 right-2.5 rounded-full bg-white/94 px-2.5 py-1.5 text-[9.5px] font-extrabold text-teal-deep">
                    Recommandé
                  </span>
                )}
              </div>
              <div className="p-3.5">
                <h2 className="mb-2 font-display text-[15px] font-semibold">{template.name}</h2>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Tag tone="teal">{stats.missions} missions</Tag>
                  <Tag tone="coral">{stats.moments} moments</Tag>
                  <Tag tone={template.recommended ? "olive" : "gold"}>{template.difficulty}</Tag>
                </div>
                <form action={applyTemplate.bind(null, id, template.key)}>
                  <Button
                    type="submit"
                    size="sm"
                    variant={template.recommended ? "primary" : "secondary"}
                  >
                    Créer ce Chabbat
                  </Button>
                </form>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}

function Tag({
  tone,
  children,
}: {
  tone: "teal" | "coral" | "olive" | "gold";
  children: React.ReactNode;
}) {
  const tones = {
    teal: "bg-teal/12 text-teal-deep",
    coral: "bg-coral/12 text-coral-deep",
    olive: "bg-olive/14 text-olive-deep",
    gold: "bg-gold/28 text-gold-ink",
  };
  return (
    <span className={`rounded-full px-2.5 py-1.5 text-[10.5px] font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}
