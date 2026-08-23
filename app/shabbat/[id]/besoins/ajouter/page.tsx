import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { Plus } from "@/components/icons";
import { MissionPresetList } from "@/components/MissionPresetList";
import { EmojiTile } from "@/components/missions";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { Card, Overline } from "@/components/ui";
import { requireManager } from "@/lib/access";
import { getShabbat } from "@/lib/data";
import { recommendQuantities } from "@/lib/recommendations";
import { getOps, type Category } from "@/lib/missions";

const ORDER: Category[] = ["food", "drinks", "equipment", "hosting", "other"];

/**
 * S12b · Ajouter des besoins à un Shabbat déjà créé.
 *
 * Le catalogue n'existait qu'à l'étape 3 du tunnel : une fois le Shabbat
 * publié, on ne pouvait plus qu'écrire un apport à la main — et seulement
 * depuis l'écran de choix, qui disparaît dès que tout est pris. Or c'est
 * précisément là qu'on ajoute des besoins : quand le groupe grossit, quand
 * quelqu'un annonce qu'il vient avec ses enfants, la veille au soir.
 */
export default async function AjouterBesoins({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { id } = await params;
  const { cat } = await searchParams;
  await requireManager(id);

  const active = ORDER.includes(cat as Category) ? (cat as Category) : null;
  const t = await getTranslations("missions.board");
  const tCategory = await getTranslations("missions.category");
  const tc = await getTranslations("common");
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  const board = `/shabbat/${id}/besoins`;

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <div className="mb-2">
          <BackButton fallback={board} />
        </div>
        <h1 className="mb-0.5 font-display text-[21px] font-semibold">{t("addTitle")}</h1>
        <p className="mb-3.5 text-[14px] text-ink/55">{t("addIntro")}</p>
        <div className="-mx-5 mb-1 flex gap-1.5 overflow-x-auto px-5 pb-1">
          <FilterChip href={`${board}/ajouter`} active={!active}>
            {tc("all")}
          </FilterChip>
          {ORDER.map((category) => (
            <FilterChip
              key={category}
              href={`${board}/ajouter?cat=${category}`}
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

        <MissionPresetList
          shabbatId={id}
          existingTitles={ops.missions.map((m) => m.title)}
          onlyCategory={active}
        />

        <Link
          href={`/shabbat/${id}/mission/nouvelle/modifier?retour=besoins`}
          className="mb-5 flex items-center gap-2.5 rounded-field border-[1.5px] border-dashed border-ink/20 px-3.5 py-3"
        >
          <Plus size={16} strokeWidth={2.2} className="text-ink/40" />
          <span className="text-[14px] font-bold text-ink/65">{t("addCustom")}</span>
        </Link>

        {/* Ce qui est déjà demandé, pour ne pas ajouter deux fois la même chose.
            Le catalogue grise ses propres doublons, mais pas les apports
            écrits à la main. */}
        {ops.missions.length > 0 && (
          <section>
            <Overline>{t("alreadyAsked", { count: ops.missions.length })}</Overline>
            <ul className="flex flex-col gap-1.5">
              {ops.missions.map((mission) => (
                <Card
                  as="li"
                  key={mission.id}
                  className="flex items-center gap-2.5 rounded-field px-3 py-2"
                >
                  <EmojiTile
                    emoji={mission.emoji}
                    category={mission.category}
                    title={mission.title}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold">{mission.title}</span>
                    <span className="block truncate text-[12px] text-ink/60">
                      {mission.quantity ?? tCategory(mission.category)}
                    </span>
                  </span>
                </Card>
              ))}
            </ul>
          </section>
        )}
      </div>
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
