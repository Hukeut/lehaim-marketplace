import Link from "next/link";
import { notFound } from "next/navigation";
import { claimMission, suggestMission } from "@/app/mission-actions";
import { BackButton } from "@/components/BackButton";
import { Check, Plus } from "@/components/icons";
import { ClaimerStack, EmojiTile } from "@/components/missions";
import { Button, ButtonLink, Card, StickyFooter } from "@/components/ui";
import { getShabbat } from "@/lib/data";
import { getOps } from "@/lib/missions";
import { roleFor } from "@/lib/templates";

/** S07 · Choisir une mission — et S07b quand tout est pris. */
export default async function ChoisirMission({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  const open = ops.missions.filter((m) => m.free > 0 && !m.mine);
  const mine = ops.missions.filter((m) => m.mine);

  if (!open.length && !mine.length) {
    return (
      <main className="flex min-h-dvh flex-1 flex-col items-center px-7.5 text-center sm:min-h-0">
        <div className="w-full pt-[54px] text-left">
          <BackButton fallback={`/shabbat/${id}`} />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3.5">
          <span className="flex size-[74px] items-center justify-center rounded-full bg-olive/14 text-olive">
            <Check size={32} strokeWidth={2.2} />
          </span>
          <h1 className="font-display text-[19px] font-semibold">Tout est déjà pris !</h1>
          <p className="max-w-[250px] text-[13px] leading-relaxed text-ink/60">
            Vos amis ont été rapides. Vous pouvez tout de même proposer un coup de main.
          </p>
        </div>
        <div className="w-full pb-[34px]">
          <ButtonLink href={`/discussion/${id}`}>Proposer un coup de main</ButtonLink>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <div className="mb-2">
          <BackButton fallback={`/shabbat/${id}`} />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="mb-0.5 font-display text-xl font-semibold">Choisissez une mission</h1>
            <p className="mb-3.5 text-[12.5px] text-ink/55">
              {open.length} mission{open.length > 1 ? "s" : ""} reste
              {open.length > 1 ? "nt" : ""} à pourvoir
            </p>
          </div>
          {shabbat.isHost && (
            <Link
              href={`/shabbat/${id}/mission/nouvelle/modifier`}
              aria-label="Ajouter une mission"
              className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-[var(--shadow-float)]"
            >
              <Plus size={15} />
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-4">
        {mine.map((mission) => (
          <Card key={mission.id} className="rounded-panel border-2 border-teal p-4">
            <div className="mb-2.5 flex items-center gap-3">
              <EmojiTile emoji={mission.emoji} category={mission.category} size={48} radius={14} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-[15px] font-semibold">
                  {mission.title}
                </div>
                <span className="mt-0.5 inline-block rounded-full bg-teal/14 px-2.5 py-1 text-[10px] font-extrabold text-teal-deep">
                  Vous vous en occupez
                </span>
              </div>
            </div>
            <ButtonLink href={`/shabbat/${id}/mission/${mission.id}`} variant="secondary" size="sm">
              Voir ma mission
            </ButtonLink>
          </Card>
        ))}

        {open.map((mission) => {
          const role = roleFor(mission.title);
          return (
            <Card key={mission.id} className="rounded-panel p-4 shadow-[var(--shadow-card-lg)]">
              <div className="mb-2.5 flex items-center gap-3">
                <EmojiTile
                  emoji={mission.emoji}
                  category={mission.category}
                  size={48}
                  radius={14}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/shabbat/${id}/mission/${mission.id}`}
                    className="block truncate font-display text-[15px] font-semibold"
                  >
                    {mission.title}
                  </Link>
                  <span
                    className={`mt-0.5 inline-block rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                      mission.free === 1
                        ? "bg-coral/14 text-coral-deep"
                        : "bg-olive/14 text-olive-deep"
                    }`}
                  >
                    {mission.free} place{mission.free > 1 ? "s" : ""} restante
                    {mission.free > 1 ? "s" : ""}
                  </span>
                </div>
                <ClaimerStack people={mission.claimers} />
              </div>

              <p className="mb-3 text-xs leading-snug text-ink/60">✨ {role.tagline}</p>

              <form action={claimMission.bind(null, id, mission.id)}>
                <Button type="submit" size="sm">
                  Je prends cette mission
                </Button>
              </form>
            </Card>
          );
        })}
      </div>

      <StickyFooter className="px-5">
        <form action={suggestMission.bind(null, id)}>
          <Button type="submit" variant="outlineTeal" size="sm">
            🎲 Dis-moi quoi apporter
          </Button>
        </form>
      </StickyFooter>
    </main>
  );
}
