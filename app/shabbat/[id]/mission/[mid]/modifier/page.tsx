import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/ui";
import { requireManager } from "@/lib/access";
import { getShabbat } from "@/lib/data";
import { getMission, type Category } from "@/lib/missions";
import { MissionForm } from "./MissionForm";

/** S04b · Modifier une mission (ou en créer une avec l'id « nouvelle ») */
export default async function ModifierMission({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; mid: string }>;
  searchParams: Promise<{ retour?: string }>;
}) {
  const { id, mid } = await params;
  await requireManager(id);
  const { retour } = await searchParams;
  // Depuis le tunnel de création, on revient au tunnel ; ailleurs, à la liste.
  const back =
    retour === "creation"
      ? `/creer/${id}/missions`
      : retour === "besoins"
        ? `/shabbat/${id}/besoins`
        : `/shabbat/${id}/missions`;
  const t = await getTranslations("missions.form");
  const shabbat = await getShabbat(id);
  if (!shabbat) notFound();

  const existing = mid === "nouvelle" ? null : await getMission(mid);
  if (mid !== "nouvelle" && !existing) notFound();

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <TopBar
        title={existing ? t("editMissionTitle") : t("newMissionTitle")}
        back={back}
      />
      <MissionForm
        shabbatId={id}
        retour={back}
        mission={{
          id: existing ? (existing.id as string) : null,
          title: (existing?.title as string) ?? "",
          emoji: (existing?.emoji as string) ?? "🍲",
          category: ((existing?.category as Category) ?? "food") as Category,
          slots: (existing?.slots as number) ?? 1,
          quantity: (existing?.quantity as string) ?? null,
          priority: ((existing?.priority as "essential" | "standard") ?? "standard"),
          notes: (existing?.notes as string) ?? null,
        }}
      />
    </main>
  );
}
