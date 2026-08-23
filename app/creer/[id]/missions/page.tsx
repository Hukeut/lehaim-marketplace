import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { Plus } from "@/components/icons";
import { MissionPresetList } from "@/components/MissionPresetList";
import { MissionSlots } from "@/components/MissionSlots";
import { CategoryChip, EmojiTile } from "@/components/missions";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { StepDots } from "@/components/StepDots";
import { ButtonLink, Card, Overline, StickyFooter } from "@/components/ui";
import { getShabbat } from "@/lib/data";
import { recommendQuantities } from "@/lib/recommendations";
import { getOps, type Category } from "@/lib/missions";
import { BrandMark } from "@/components/BrandMark";

const ORDER: Category[] = ["food", "drinks", "equipment", "hosting", "other"];

/** S04 · Personnaliser les missions — étape 3/5 */
export default async function PersonnaliserMissions({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { id } = await params;
  const { cat } = await searchParams;
  const active = ORDER.includes(cat as Category) ? (cat as Category) : null;
  const t = await getTranslations("shabbat.create.missionsStep");
  const tCategory = await getTranslations("missions.category");
  const tc = await getTranslations("common");
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-3 flex items-center gap-2.5">
          <BackButton fallback={`/creer/${id}/moments`} />
          <h1 className="flex-1 font-display text-[18px] leading-tight font-semibold">{t("title")}</h1>
          <Link href={`/shabbat/${id}`} className="text-xs font-bold text-teal">
            {t("preview")}
          </Link>
        </div>
        <StepDots current={3} total={5} />
        <div className="-mx-5 mb-1 flex gap-1.5 overflow-x-auto px-5 pb-1">
          <FilterChip href={`/creer/${id}/missions`} active={!active}>
            {tc("all")}
          </FilterChip>
          {ORDER.map((category) => (
            <FilterChip
              key={category}
              href={`/creer/${id}/missions?cat=${category}`}
              active={active === category}
            >
              {tCategory(category)}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <RecommendationPanel
          guestTarget={shabbat.guestTarget}
          items={recommendQuantities(shabbat.guestTarget)}
        />

        {(active ? [active] : ORDER).map((category) => {
          const missions = ops.missions.filter((m) => m.category === category);
          if (!missions.length) return null;
          return (
            <section key={category} className="mb-4">
              <Overline>{tCategory(category)}</Overline>
              <ul className="flex flex-col gap-2">
                {missions.map((mission) => (
                  <Card as="li" key={mission.id} className="flex items-center gap-2 rounded-field px-3 py-2.5">
                    <Link
                      href={`/shabbat/${id}/mission/${mission.id}/modifier?retour=creation`}
                      className="flex min-w-0 flex-1 items-center gap-2.5"
                    >
                      <EmojiTile emoji={mission.emoji} category={mission.category} title={mission.title} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-bold">{mission.title}</span>
                        <span className="block truncate text-[12px] text-ink/65">
                          {mission.quantity ?? tCategory(mission.category)}
                        </span>
                      </span>
                    </Link>
                    <MissionSlots
                      shabbatId={id}
                      missionId={mission.id}
                      slots={mission.slots}
                      taken={mission.claimers.length}
                    />
                  </Card>
                ))}
              </ul>
            </section>
          );
        })}

        {!ops.missions.length && (
          <p className="mb-4 rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-4 text-center text-[14px] text-ink/45">
            {t("noMissionsYet")}
          </p>
        )}

        <MissionPresetList
          shabbatId={id}
          existingTitles={ops.missions.map((m) => m.title)}
          onlyCategory={active}
        />

        <Link
          href={`/shabbat/${id}/mission/nouvelle/modifier?retour=creation`}
          className="flex items-center gap-2.5 rounded-field border-[1.5px] border-dashed border-ink/20 px-3.5 py-3"
        >
          <Plus size={16} strokeWidth={2.2} className="text-ink/40" />
          <span className="text-[14px] font-bold text-ink/65">{t("addMission")}</span>
        </Link>
      </div>

      <StickyFooter className="px-5 py-2.5">
        <ButtonLink href={`/creer/${id}/financement`} size="sm">
          {tc("continue")}
        </ButtonLink>
      </StickyFooter>
    </main>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-3.5 py-2 text-[14px] font-bold whitespace-nowrap ${
        active ? "bg-ink text-white" : "border-[1.5px] border-line bg-white text-ink/60"
      }`}
    >
      {children}
    </Link>
  );
}
