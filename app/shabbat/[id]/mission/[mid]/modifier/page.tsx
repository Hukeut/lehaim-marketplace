import { notFound } from "next/navigation";
import { TopBar } from "@/components/ui";
import { getShabbat } from "@/lib/data";
import { getMission, type Category } from "@/lib/missions";
import { MissionForm } from "./MissionForm";

/** S04b · Modifier une mission (ou en créer une avec l'id « nouvelle ») */
export default async function ModifierMission({
  params,
}: {
  params: Promise<{ id: string; mid: string }>;
}) {
  const { id, mid } = await params;
  const shabbat = await getShabbat(id);
  if (!shabbat) notFound();

  const existing = mid === "nouvelle" ? null : await getMission(mid);
  if (mid !== "nouvelle" && !existing) notFound();

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <TopBar
        title={existing ? "Modifier la mission" : "Nouvelle mission"}
        back={`/shabbat/${id}/missions`}
      />
      <MissionForm
        shabbatId={id}
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
