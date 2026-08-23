import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { Check } from "@/components/icons";
import { CategoryChip, ClaimerStack } from "@/components/missions";
import { RemoveRow } from "@/components/RemoveButton";
import { deleteMission } from "@/app/mission-actions";
import { ButtonLink, Card, StickyFooter } from "@/components/ui";
import { requireManager } from "@/lib/access";
import { getShabbat } from "@/lib/data";
import { dishImage } from "@/lib/dishes";
import { getOps, type Mission } from "@/lib/missions";

const COLUMNS = [
  {
    key: "todo",
    labelKey: "todo",
    dot: "bg-coral-deep",
    border: "border-s-coral-deep",
  },
  {
    key: "in_progress",
    labelKey: "inProgress",
    dot: "bg-gold-deep",
    border: "border-s-gold-deep",
  },
  {
    key: "done",
    labelKey: "done",
    dot: "bg-olive-deep",
    border: "border-s-olive-deep",
  },
] as const;

/** S12 · Tableau des besoins */
export default async function Besoins({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireManager(id);
  const t = await getTranslations("missions");
  const tStatus = await getTranslations("missions.status");
  const tRemove = await getTranslations("common.remove");
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  const buckets = COLUMNS.map((column) => ({
    ...column,
    label: tStatus(column.labelKey),
    missions: ops.missions.filter((m) =>
      column.key === "todo"
        ? m.claimers.length === 0
        : column.key === "in_progress"
          ? m.claimers.length > 0 && m.status !== "done"
          : m.status === "done",
    ),
  }));

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <div className="mb-2">
          <BackButton fallback={`/shabbat/${id}`} />
        </div>
        <h1 className="mb-2.5 font-display text-[21px] font-semibold">
          {t("board.title")}
        </h1>
        <div className="mb-3.5 flex gap-1.5 rounded-full bg-white p-1 shadow-[var(--shadow-pill)]">
          {buckets.map((bucket, index) => (
            <span
              key={bucket.key}
              className={`flex-1 rounded-full py-2 text-center text-[13px] font-bold ${
                index === 0
                  ? "bg-ink text-white shadow-[var(--shadow-inset-pill)]"
                  : "text-ink/55"
              }`}
            >
              {bucket.label} · {bucket.missions.length}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {buckets.map((bucket) => (
          <section key={bucket.key} className="mb-5">
            <div className="mb-2.5 flex items-center gap-2">
              <span className={`size-2 rounded-full ${bucket.dot}`} />
              <span className="text-[12.5px] font-extrabold tracking-[0.03em] text-ink/55 uppercase">
                {bucket.label}
              </span>
            </div>
            {bucket.missions.length ? (
              <ul className="flex flex-col gap-2">
                {bucket.missions.map((mission) => (
                  <Row
                    key={mission.id}
                    shabbatId={id}
                    mission={mission}
                    border={bucket.border}
                    brings={(name, dish) => t("dishes.brings", { name, dish })}
                    done={bucket.key === "done"}
                    noOneAssigned={t("noOneAssigned")}
                    claimedWarning={
                      mission.claimers.length
                        ? tRemove("claimed", {
                            count: mission.claimers.length,
                            names: mission.claimers
                              .map((c) => c.name)
                              .join(", "),
                          })
                        : undefined
                    }
                  />
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-ink/40">
                {t("board.emptyColumn")}
              </p>
            )}
          </section>
        ))}
      </div>

      <StickyFooter className="px-5 py-2.5">
        <ButtonLink href={`/shabbat/${id}/besoins/ajouter`} size="sm">
          {t("board.add")}
        </ButtonLink>
      </StickyFooter>
    </main>
  );
}

function Row({
  shabbatId,
  mission,
  border,
  done,
  noOneAssigned,
  brings,
  claimedWarning,
}: {
  shabbatId: string;
  mission: Mission;
  border: string;
  done: boolean;
  noOneAssigned: string;
  brings: (name: string, dish: string) => string;
  /** Ce que la suppression emporterait : qui avait pris cet apport. */
  claimedWarning?: string;
}) {
  const withDish = mission.claimers.find((c) => c.dishLabel);
  return (
    <Card
      as="li"
      className={`overflow-hidden rounded-field border-s-4 ${border} ${done ? "opacity-65" : ""}`}
    >
      <RemoveRow
        action={deleteMission.bind(
          null,
          shabbatId,
          mission.id,
          `/shabbat/${shabbatId}/besoins`,
        )}
        label={mission.title}
        warning={claimedWarning}
      >
        <Link
          href={`/shabbat/${shabbatId}/mission/${mission.id}`}
          className="flex min-w-0 flex-1 items-center gap-3 py-3 ps-3.5"
        >
          {withDish?.dishKeys.length ? (
            <Image
              src={dishImage(withDish.dishKeys[0])}
              alt=""
              width={44}
              height={44}
              className="size-11 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <span className="shrink-0 text-xl">{mission.emoji}</span>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14.5px] font-bold">
              {mission.title}
            </div>
            {withDish ? (
              <div className="truncate text-[12.5px] text-ink/65">
                {brings(withDish.name, withDish.dishLabel ?? "")}
              </div>
            ) : (
              !mission.claimers.length && (
                <div className="text-[12px] text-ink/65">{noOneAssigned}</div>
              )
            )}
          </div>
          <ClaimerStack people={mission.claimers} />
          {done ? (
            <Check
              size={16}
              strokeWidth={2.6}
              className="shrink-0 text-olive-deep"
            />
          ) : (
            <CategoryChip category={mission.category} />
          )}
        </Link>
      </RemoveRow>
    </Card>
  );
}
