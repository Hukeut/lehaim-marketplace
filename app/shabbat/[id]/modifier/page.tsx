import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { EditShabbatForm } from "./EditShabbatForm";
import { requireManager } from "@/lib/access";
import { BackButton } from "@/components/BackButton";
import { getShabbat } from "@/lib/data";

/** Réglages d'un Shabbat déjà créé : titre, date, heure, adresse, ville. */
export default async function ModifierShabbat({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireManager(id);
  const t = await getTranslations("shabbat.edit");
  const shabbat = await getShabbat(id);
  if (!shabbat) notFound();

  const starts = new Date(shabbat.startsAt);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <div className="mb-3">
          <BackButton fallback={`/shabbat/${id}`} />
        </div>
        <h1 className="mb-1 font-display text-[22px] font-semibold">{t("title")}</h1>
        <p className="mb-4 text-[14px] leading-relaxed text-ink/60">{t("subtitle")}</p>
      </div>

      <EditShabbatForm
        shabbat={{
          id,
          title: shabbat.title,
          date: `${starts.getFullYear()}-${pad(starts.getMonth() + 1)}-${pad(starts.getDate())}`,
          time: `${pad(starts.getHours())}:${pad(starts.getMinutes())}`,
          address: shabbat.address ?? "",
          neighbourhood: shabbat.neighbourhood ?? "",
        }}
      />
    </main>
  );
}
