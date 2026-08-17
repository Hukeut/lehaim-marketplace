import { notFound } from "next/navigation";
import { claimEquipment } from "@/app/mission-actions";
import { BackButton } from "@/components/BackButton";
import { Check } from "@/components/icons";
import { Avatar, Card, StatusPill } from "@/components/ui";
import { EquipmentForm } from "./EquipmentForm";
import { getShabbat } from "@/lib/data";
import { getOps } from "@/lib/missions";

/** S13 · Matériel — ce que l'hôte possède, ce qui manque, qui s'en charge. */
export default async function Materiel({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="flex items-center gap-2.5 px-5 pt-[54px] pb-1">
        <BackButton fallback={`/shabbat/${id}`} />
        <h1 className="flex-1 font-display text-[18px] font-semibold">Matériel</h1>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 pt-2.5 pb-4">
        {ops.equipment.map((item) => {
          const covered = item.missing === 0;
          const claimed = Boolean(item.claimedBy);
          return (
            <Card key={item.id} className={`rounded-field ${covered ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-3 px-3.5 py-3">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-base ${
                    covered ? "bg-olive/14" : claimed ? "bg-gold/28" : "bg-violet/14"
                  }`}
                >
                  {covered ? <Check size={16} strokeWidth={2.2} className="text-olive-deep" /> : item.emoji}
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
                      <div className="truncate text-[13px] font-bold">{item.name}</div>
                      <div className="truncate text-[10.5px] text-ink/50">
                        {claimed
                          ? `Pris en charge par ${item.claimedBy!.name}`
                          : covered
                            ? `${item.owned} possédé${item.owned > 1 ? "s" : ""}`
                            : `${item.owned} possédé${item.owned > 1 ? "s" : ""} · ${item.missing} manquant${item.missing > 1 ? "s" : ""}`}
                      </div>
                    </div>
                  </div>
                </div>

                {covered ? (
                  <StatusPill tone="success">Possédé</StatusPill>
                ) : (
                  <form action={claimEquipment.bind(null, id, item.id, claimed)}>
                    <button type="submit">
                      <StatusPill tone={claimed ? "warning" : "urgent"}>
                        {claimed ? "Pris en charge" : "Manquant"}
                      </StatusPill>
                    </button>
                  </form>
                )}
              </div>
            </Card>
          );
        })}

        {!ops.equipment.length && (
          <p className="rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-4 text-center text-[12.5px] text-ink/45">
            Aucun matériel listé. Ajoutez ce qui pourrait manquer.
          </p>
        )}

        {shabbat.isHost && <EquipmentForm shabbatId={id} />}
      </div>
    </main>
  );
}
