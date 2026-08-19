import Link from "next/link";
import { notFound } from "next/navigation";
import { claimMission, setMissionStatus } from "@/app/mission-actions";
import { BackButton } from "@/components/BackButton";
import { Chat } from "@/components/icons";
import { ClaimerStack, EmojiTile, InfoNote } from "@/components/missions";
import { Avatar, Button, ButtonLink, Card, Overline, StickyFooter } from "@/components/ui";
import { getShabbat } from "@/lib/data";
import { getOps, getSuggestions } from "@/lib/missions";
import { roleFor } from "@/lib/templates";
import { SuggestionList } from "./SuggestionList";

/** S08 · Détail d'une mission (+ S09 suggestions) */
export default async function DetailMission({
  params,
}: {
  params: Promise<{ id: string; mid: string }>;
}) {
  const { id, mid } = await params;
  const [shabbat, ops, suggestions] = await Promise.all([
    getShabbat(id),
    getOps(id),
    getSuggestions(mid),
  ]);
  if (!shabbat || !ops) notFound();

  const mission = ops.missions.find((m) => m.id === mid);
  if (!mission) notFound();

  const role = roleFor(mission.title);
  const lead = mission.claimers[0] ?? null;

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="flex items-center gap-2.5 px-5 pt-[54px] pb-1">
        <BackButton fallback={`/shabbat/${id}/missions`} />
        <h1 className="flex-1 truncate font-display text-[17px] font-semibold">
          {mission.emoji} {mission.title}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-4">
        {lead ? (
          <Card className="mb-3.5 flex items-center gap-3 p-3">
            <Avatar initial={lead.initial} tone={lead.tone} size={38} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-bold">{lead.name}</div>
              <div className="text-[10.5px] text-ink/50">
                Responsable · {role.name.toLowerCase()}
              </div>
            </div>
            <Link href={`/discussion/${id}`} aria-label="Écrire au groupe" className="text-ink">
              <Chat size={16} />
            </Link>
          </Card>
        ) : (
          <Card className="mb-3.5 flex items-center gap-3 p-3.5">
            <EmojiTile emoji={mission.emoji} category={mission.category} size={38} />
            <div className="flex-1">
              <div className="text-[12.5px] font-bold">Personne assignée</div>
              <div className="text-[10.5px] text-ink/50">
                {mission.free} place{mission.free > 1 ? "s" : ""} libre
                {mission.free > 1 ? "s" : ""}
              </div>
            </div>
          </Card>
        )}

        {mission.claimers.length > 1 && (
          <>
            <Overline>Participants</Overline>
            <div className="mb-4 flex items-center">
              <ClaimerStack people={mission.claimers.slice(1)} />
              <span className="ml-2.5 text-xs text-ink/55">
                {mission.claimers
                  .slice(1)
                  .map((c) => c.name)
                  .join(" et ")}{" "}
                participe{mission.claimers.length > 2 ? "nt" : ""}
              </span>
            </div>
          </>
        )}

        {mission.quantity && (
          <div className="mb-4">
            <InfoNote>Quantité attendue : {mission.quantity}.</InfoNote>
          </div>
        )}

        <Overline>Suggestions</Overline>
        <div className="mb-4">
          <SuggestionList
            shabbatId={id}
            missionId={mid}
            suggestions={suggestions}
            canChoose={mission.mine || shabbat.isHost}
          />
        </div>

        {mission.notes && (
          <>
            <Overline>Notes</Overline>
            <Card className="mb-4 px-3.5 py-3">
              <p className="text-[12.5px] leading-relaxed">« {mission.notes} »</p>
              <p className="mt-1.5 text-[10px] text-ink/40">— {shabbat.host.name}</p>
            </Card>
          </>
        )}

        {mission.mine && (
          <>
            <Overline>Avancement</Overline>
            <div className="flex gap-2">
              {(["todo", "in_progress", "done"] as const).map((status) => (
                <form key={status} action={setMissionStatus.bind(null, id, mid, status)} className="flex-1">
                  <button
                    type="submit"
                    className={`w-full rounded-full py-2.5 text-[11.5px] font-bold transition-colors ${
                      mission.status === status
                        ? "bg-ink text-white"
                        : "border-[1.5px] border-line-soft bg-white text-ink"
                    }`}
                  >
                    {{ todo: "À faire", in_progress: "En cours", done: "Prêt" }[status]}
                  </button>
                </form>
              ))}
            </div>
          </>
        )}
      </div>

      <StickyFooter className="px-5">
        {mission.mine ? (
          <ButtonLink
            href={`/shabbat/${id}/mission/${mid}/liberer`}
            variant="secondary"
            size="sm"
          >
            Changer de mission
          </ButtonLink>
        ) : mission.free > 0 ? (
          <form action={claimMission.bind(null, id, mid)}>
            <Button type="submit">Je prends cette mission</Button>
          </form>
        ) : (
          <Button disabled>Toutes les places sont prises</Button>
        )}
      </StickyFooter>
    </main>
  );
}
