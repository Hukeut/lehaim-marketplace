import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { claimEquipment, removeEquipment } from "@/app/mission-actions";
import { RemoveRow } from "@/components/RemoveButton";
import { BackButton } from "@/components/BackButton";
import { Check } from "@/components/icons";
import { Avatar, Card, StatusPill } from "@/components/ui";
import { EquipmentForm } from "./EquipmentForm";
import { requireManager } from "@/lib/access";
import { getShabbat } from "@/lib/data";
import { getOps } from "@/lib/missions";

/** S13 · Matériel — ce que l'hôte possède, ce qui manque, qui s'en charge. */
export default async function Materiel({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireManager(id);
  const t = await getTranslations("missions.equipment");
  const tRemove = await getTranslations("common.remove");
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="flex items-center gap-2.5 px-5 pt-[54px] pb-1">
        <BackButton fallback={`/shabbat/${id}`} />
        <h1 className="flex-1 font-display text-[20px] font-semibold">
          {t("title")}
        </h1>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 pt-2.5 pb-4">
        {ops.equipment.map((item) => {
          const covered = item.missing === 0;
          const claimed = Boolean(item.claimedBy);
          return (
            <Card
              key={item.id}
              className={`overflow-hidden rounded-field ${covered ? "opacity-60" : ""}`}
            >
              {/* `removeEquipment` existait depuis le début et n'était appelé
                  par aucun écran : un objet ajouté par erreur restait là pour
                  toujours. Réservé à l'organisateur, comme l'ajout. */}
              <RemoveRow
                action={removeEquipment.bind(null, id, item.id)}
                label={item.name}
                warning={
                  item.claimedBy
                    ? tRemove("claimed", {
                        count: 1,
                        names: item.claimedBy.name,
                      })
                    : undefined
                }
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 py-3 ps-3.5">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-base ${
                      covered
                        ? "bg-olive/14"
                        : claimed
                          ? "bg-gold/28"
                          : "bg-violet/14"
                    }`}
                  >
                    {covered ? (
                      <Check
                        size={16}
                        strokeWidth={2.2}
                        className="text-olive-deep"
                      />
                    ) : (
                      item.emoji
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {item.claimedBy && (
                        <Avatar
                          initial={item.claimedBy.initial}
                          tone={item.claimedBy.tone}
                          size={22}
                        />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-[14.5px] font-bold">
                          {item.name}
                        </div>
                        <div className="truncate text-[12px] text-ink/65">
                          {claimed
                            ? t("claimedBy", { name: item.claimedBy!.name })
                            : covered
                              ? t("ownedCount", { count: item.owned })
                              : `${t("ownedCount", { count: item.owned })} · ${t("missingCount", { count: item.missing })}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {covered ? (
                    <StatusPill tone="success">{t("ownedPill")}</StatusPill>
                  ) : (
                    <form
                      action={claimEquipment.bind(null, id, item.id, claimed)}
                    >
                      <button type="submit">
                        <StatusPill tone={claimed ? "warning" : "urgent"}>
                          {claimed ? t("claimedPill") : t("missingPill")}
                        </StatusPill>
                      </button>
                    </form>
                  )}
                </div>
              </RemoveRow>
            </Card>
          );
        })}

        {!ops.equipment.length && (
          <p className="rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-4 text-center text-[14px] text-ink/45">
            {t("emptyList")}
          </p>
        )}

        {shabbat.isHost && <EquipmentForm shabbatId={id} />}
      </div>
    </main>
  );
}
