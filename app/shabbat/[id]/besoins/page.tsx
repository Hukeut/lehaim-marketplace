import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { Check } from "@/components/icons";
import { CategoryChip, ClaimerStack } from "@/components/missions";
import { Card } from "@/components/ui";
import { getShabbat } from "@/lib/data";
import { getOps, type Mission } from "@/lib/missions";

const COLUMNS = [
  { key: "todo", label: "À faire", dot: "bg-coral-deep", border: "border-l-coral-deep" },
  { key: "in_progress", label: "En cours", dot: "bg-gold-deep", border: "border-l-gold-deep" },
  { key: "done", label: "Terminé", dot: "bg-olive-deep", border: "border-l-olive-deep" },
] as const;

/** S12 · Tableau des besoins */
export default async function Besoins({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  const buckets = COLUMNS.map((column) => ({
    ...column,
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
        <h1 className="mb-2.5 font-display text-[19px] font-semibold">Tableau des besoins</h1>
        <div className="mb-3.5 flex gap-1.5 rounded-full bg-white p-1 shadow-[var(--shadow-pill)]">
          {buckets.map((bucket, index) => (
            <span
              key={bucket.key}
              className={`flex-1 rounded-full py-2 text-center text-[11.5px] font-bold ${
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
              <span className="text-[11px] font-extrabold tracking-[0.03em] text-ink/55 uppercase">
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
                    done={bucket.key === "done"}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-[11.5px] text-ink/40">Rien ici.</p>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}

function Row({
  shabbatId,
  mission,
  border,
  done,
}: {
  shabbatId: string;
  mission: Mission;
  border: string;
  done: boolean;
}) {
  return (
    <Card as="li" className={`rounded-field border-l-4 ${border} ${done ? "opacity-65" : ""}`}>
      <Link
        href={`/shabbat/${shabbatId}/mission/${mission.id}`}
        className="flex items-center gap-3 px-3.5 py-3"
      >
        <span className="shrink-0 text-xl">{mission.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold">{mission.title}</div>
          {!mission.claimers.length && (
            <div className="text-[10.5px] text-ink/50">Personne assignée</div>
          )}
        </div>
        <ClaimerStack people={mission.claimers} />
        {done ? (
          <Check size={16} strokeWidth={2.6} className="shrink-0 text-olive-deep" />
        ) : (
          <CategoryChip category={mission.category} />
        )}
      </Link>
    </Card>
  );
}
