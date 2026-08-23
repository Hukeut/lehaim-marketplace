import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { formatDate, getShabbat } from "@/lib/data";
import { getOps } from "@/lib/missions";
import { DuplicateForm } from "./DuplicateForm";

/** G04b · Recréer un Shabbat à partir d'un précédent. */
export default async function Recreer({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("history.recreate");
  const tf = await getTranslations("expenses.fundingMode");
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  const options = [
    {
      key: "keep_guests" as const,
      emoji: "👥",
      label: t("keepGuests", { count: shabbat.invitations.length }),
    },
    {
      key: "keep_missions" as const,
      emoji: "🎯",
      label: t("keepMissions", { count: ops.counts.missionsTotal }),
    },
    {
      key: "keep_funding" as const,
      emoji: "🧾",
      label: t("keepFunding", { mode: tf(`${ops.fundingMode}.label`) }),
    },
    {
      key: "keep_moments" as const,
      emoji: "🕯️",
      label: t("keepMoments", { count: ops.moments.length }),
    },
  ];

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <div className="mb-3">
          <BackButton fallback="/historique" />
        </div>
        <h1 className="mb-0.5 font-display text-[21px] font-semibold">{t("title")}</h1>
        <p className="mb-3.5 text-xs text-ink/55">
          {t("basedOn", { date: formatDate(shabbat.startsAt) })}
        </p>
      </div>

      <DuplicateForm sourceId={id} options={options} />
    </main>
  );
}
