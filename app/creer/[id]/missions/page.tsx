import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { Plus } from "@/components/icons";
import { EmojiTile } from "@/components/missions";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { StepDots } from "@/components/StepDots";
import { ButtonLink, Card, Overline, StickyFooter } from "@/components/ui";
import { getShabbat } from "@/lib/data";
import { CATEGORY_LABEL, getOps, type Category } from "@/lib/missions";
import { recommendQuantities } from "@/lib/recommendations";
import { BrandMark } from "@/components/BrandMark";

const ORDER: Category[] = ["food", "drinks", "equipment", "hosting", "other"];

/** S04 · Personnaliser les missions — étape 3/5 */
export default async function PersonnaliserMissions({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-3 flex items-center gap-2.5">
          <BackButton fallback={`/creer/${id}/moments`} />
          <h1 className="flex-1 font-display text-[18px] font-semibold">
            Personnalisez les missions
          </h1>
          <Link href={`/shabbat/${id}`} className="text-xs font-bold text-teal">
            Aperçu
          </Link>
        </div>
        <StepDots current={3} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <RecommendationPanel
          guestTarget={shabbat.guestTarget}
          items={recommendQuantities(shabbat.guestTarget)}
        />

        {ORDER.map((category) => {
          const missions = ops.missions.filter((m) => m.category === category);
          if (!missions.length) return null;
          return (
            <section key={category} className="mb-4">
              <Overline>{CATEGORY_LABEL[category]}</Overline>
              <ul className="flex flex-col gap-2">
                {missions.map((mission) => (
                  <Card as="li" key={mission.id} className="rounded-field">
                    <Link
                      href={`/shabbat/${id}/mission/${mission.id}/modifier`}
                      className="flex items-center gap-3 px-3.5 py-3"
                    >
                      <EmojiTile emoji={mission.emoji} category={mission.category} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-bold">{mission.title}</div>
                        <div className="truncate text-[10.5px] text-ink/50">
                          {mission.slots} place{mission.slots > 1 ? "s" : ""}
                          {mission.quantity ? ` · ${mission.quantity}` : ""}
                        </div>
                      </div>
                      {mission.priority === "essential" ? (
                        <span className="shrink-0 rounded-full bg-coral/14 px-2.5 py-1.5 text-[9.5px] font-extrabold whitespace-nowrap text-coral-deep">
                          Prioritaire
                        </span>
                      ) : (
                        <span className="text-ink/30">›</span>
                      )}
                    </Link>
                  </Card>
                ))}
              </ul>
            </section>
          );
        })}

        {!ops.missions.length && (
          <p className="mb-4 rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-4 text-center text-[12.5px] text-ink/45">
            Aucune mission pour l&apos;instant.
          </p>
        )}

        <Link
          href={`/shabbat/${id}/mission/nouvelle/modifier`}
          className="flex items-center gap-2.5 rounded-field border-[1.5px] border-dashed border-ink/20 px-3.5 py-3"
        >
          <Plus size={16} strokeWidth={2.2} className="text-ink/40" />
          <span className="text-[12.5px] font-bold text-ink/50">Ajouter une mission</span>
        </Link>
      </div>

      <StickyFooter className="px-5">
        <ButtonLink href={`/creer/${id}/financement`}>Continuer</ButtonLink>
      </StickyFooter>
    </main>
  );
}
