import { notFound } from "next/navigation";
import { resolveSwap } from "@/app/mission-actions";
import { Clock } from "@/components/icons";
import { EmojiTile } from "@/components/missions";
import { Button, Card, StickyFooter, TopBar } from "@/components/ui";
import { getShabbat } from "@/lib/data";
import { getOps } from "@/lib/missions";
import { SwapForm } from "./SwapForm";

/** S14 · Libérer ma mission — et S14b quand un échange est en attente. */
export default async function LibererMission({
  params,
}: {
  params: Promise<{ id: string; mid: string }>;
}) {
  const { id, mid } = await params;
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  const mission = ops.missions.find((m) => m.id === mid);
  if (!mission) notFound();

  const pending = ops.swaps.find((s) => s.missionId === mid && s.status === "pending");

  // S14b · échange déjà proposé
  if (pending) {
    return (
      <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
        <TopBar title="Votre échange" back={`/shabbat/${id}/mission/${mid}`} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-7.5 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-gold/28 text-gold-deep">
            <Clock size={28} strokeWidth={1.9} />
          </span>
          <h1 className="font-display text-[18px] font-semibold">
            En attente de {pending.toName ?? "réponse"}
          </h1>
          <p className="max-w-[250px] text-[13px] leading-relaxed text-ink/60">
            {pending.toName
              ? `${pending.toName} a reçu votre demande pour reprendre « ${mission.title} ».`
              : `Votre demande pour « ${mission.title} » est ouverte au groupe.`}{" "}
            Vous serez notifié dès sa réponse.
          </p>
        </div>
        <StickyFooter className="px-7.5">
          <form action={resolveSwap.bind(null, id, pending.id, "cancelled")}>
            <Button type="submit" variant="secondary" size="sm" className="text-coral-deep">
              Annuler la demande
            </Button>
          </form>
        </StickyFooter>
      </main>
    );
  }

  const candidates = ops.missions
    .flatMap((m) => m.claimers)
    .concat(
      shabbat.invitations
        .filter((i) => i.status === "confirmed" && i.id)
        .map((i) => ({ id: i.id as string, name: i.name, initial: i.initial, tone: i.tone })),
    )
    .filter((person, index, all) => {
      if (!person.id) return false;
      if (all.findIndex((p) => p.id === person.id) !== index) return false;
      return !mission.claimers.some((c) => c.id === person.id);
    })
    .map((person) => ({
      ...person,
      detail: ops.missions.some((m) => m.claimers.some((c) => c.id === person.id))
        ? "Déjà une mission"
        : "Déjà présent · aucune mission",
    }));

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <TopBar title="Un empêchement ?" back={`/shabbat/${id}/mission/${mid}`} />

      <div className="px-5.5 pt-2">
        <Card className="mb-4 flex items-center gap-3 p-3.5">
          <EmojiTile emoji={mission.emoji} category={mission.category} size={44} radius={13} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-[14.5px] font-semibold">
              {mission.title}
            </div>
            <div className="text-[11px] text-ink/50">Votre mission actuelle</div>
          </div>
        </Card>
      </div>

      <SwapForm shabbatId={id} missionId={mid} candidates={candidates} />
    </main>
  );
}
