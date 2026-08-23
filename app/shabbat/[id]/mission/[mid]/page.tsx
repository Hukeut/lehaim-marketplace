import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { claimMission, setMissionStatus } from "@/app/mission-actions";
import { BackButton } from "@/components/BackButton";
import { DishPicker } from "@/components/DishPicker";
import { Chat } from "@/components/icons";
import { ClaimerStack, EmojiTile, InfoNote } from "@/components/missions";
import { Avatar, Button, ButtonLink, Card, Overline, StickyFooter } from "@/components/ui";
import { getShabbat } from "@/lib/data";
import { suggestionsFor } from "@/lib/dishes";
import { getOps, getSuggestions } from "@/lib/missions";
import { asRoleKey, roleKeyFor } from "@/lib/templates";
import { SuggestionList } from "./SuggestionList";

/** S08 · Détail d'une mission (+ S09 suggestions) */
export default async function DetailMission({
  params,
}: {
  params: Promise<{ id: string; mid: string }>;
}) {
  const { id, mid } = await params;
  const t = await getTranslations("missions.detail");
  const tm = await getTranslations("missions");
  const tStatus = await getTranslations("missions.status");
  const tChoose = await getTranslations("missions.choose");
  const tc = await getTranslations("common");
  const tRoles = await getTranslations("missions.roles");
  const [shabbat, ops, suggestions] = await Promise.all([
    getShabbat(id),
    getOps(id),
    getSuggestions(mid),
  ]);
  if (!shabbat || !ops) notFound();

  const mission = ops.missions.find((m) => m.id === mid);
  if (!mission) notFound();

  const lead = mission.claimers[0] ?? null;
  // Les vignettes n'ont de sens qu'une fois la mission prise : elles aident
  // à décider quoi apporter, pas à choisir la mission.
  const mine = mission.claimers.find((c) => c.id === ops.meId) ?? null;
  // Le rôle reçu s'il a été attribué, sinon celui que vaudrait le titre.
  const roleKey = mine?.roleKey ? asRoleKey(mine.roleKey) : roleKeyFor(mission.title);
  const dishes = mission.mine ? suggestionsFor(mission.title) : [];

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="flex items-center gap-2.5 px-5 pt-[54px] pb-1">
        <BackButton fallback={`/shabbat/${id}/missions`} />
        <h1 className="flex-1 truncate font-display text-[19px] font-semibold">
          {mission.emoji} {mission.title}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-4">
        {lead ? (
          <Card className="mb-3.5 flex items-center gap-3 p-3">
            <Avatar initial={lead.initial} tone={lead.tone} size={38} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-bold">{lead.name}</div>
              <div className="text-[12px] text-ink/65">
                {t("leadRole", { role: tRoles(`${roleKey}.name`) })}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="mb-3.5 flex items-center gap-3 p-3.5">
            <EmojiTile emoji={mission.emoji} category={mission.category} title={mission.title} size={38} />
            <div className="flex-1">
              <div className="text-[14px] font-bold">{tm("noOneAssigned")}</div>
              <div className="text-[12px] text-ink/65">
                {t("freeSlots", { count: mission.free })}
              </div>
            </div>
          </Card>
        )}

        {mission.claimers.length > 1 && (
          <>
            <Overline>{t("participants")}</Overline>
            <div className="mb-4 flex items-center">
              <ClaimerStack people={mission.claimers.slice(1)} />
              <span className="ms-2.5 text-xs text-ink/55">
                {t("participantsVerb", {
                  names: mission.claimers
                    .slice(1)
                    .map((c) => c.name)
                    .join(t("and")),
                  count: mission.claimers.length - 1,
                })}
              </span>
            </div>
          </>
        )}

        {mission.mine && dishes.length > 0 && (
          <DishPicker
            shabbatId={id}
            missionId={mid}
            dishes={dishes}
            selectedKeys={mine?.dishKeys ?? []}
            customLabel={mine?.dishKeys.length ? null : (mine?.dishLabel ?? null)}
          />
        )}

        {mission.quantity && (
          <div className="mb-4">
            <InfoNote>{t("expectedQuantity", { quantity: mission.quantity })}</InfoNote>
          </div>
        )}

        <Overline>{t("suggestions")}</Overline>
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
            <Overline>{t("notesTitle")}</Overline>
            <Card className="mb-4 px-3.5 py-3">
              <p className="text-[14px] leading-relaxed">{t("notesQuote", { notes: mission.notes })}</p>
              <p className="mt-1.5 text-[11.5px] text-ink/40">{shabbat.host.name}</p>
            </Card>
          </>
        )}

        {mission.mine && (
          <>
            <Overline>{t("progressTitle")}</Overline>
            <div className="flex gap-2">
              {(["todo", "in_progress", "done"] as const).map((status) => (
                <form key={status} action={setMissionStatus.bind(null, id, mid, status)} className="flex-1">
                  <button
                    type="submit"
                    className={`w-full rounded-full py-2.5 text-[13px] font-bold transition-colors ${
                      mission.status === status
                        ? "bg-ink text-white"
                        : "border-[1.5px] border-line-soft bg-white text-ink"
                    }`}
                  >
                    {
                      {
                        todo: tStatus("todo"),
                        in_progress: tStatus("inProgress"),
                        done: t("readyStatus"),
                      }[status]
                    }
                  </button>
                </form>
              ))}
            </div>
          </>
        )}
      </div>

      <StickyFooter className="px-5">
        {/* Une fois l'apport pris, il n'y a plus rien à faire ici — et le pied
            ne proposait pourtant que « changer de mission », c'est-à-dire
            revenir en arrière. On sortait de l'écran par la flèche du haut ou
            pas du tout. La sortie devient l'action principale ; changer
            d'apport reste possible, en second. */}
        {mission.mine ? (
          <div className="flex flex-col gap-2">
            <ButtonLink href="/accueil">{tc("backHome")}</ButtonLink>
            <ButtonLink
              href={`/shabbat/${id}/mission/${mid}/liberer`}
              variant="secondary"
              size="sm"
            >
              {t("changeMission")}
            </ButtonLink>
          </div>
        ) : mission.free > 0 ? (
          <form action={claimMission.bind(null, id, mid)}>
            <Button type="submit">{tChoose("takeMission")}</Button>
          </form>
        ) : (
          <Button disabled>{t("allSlotsTaken")}</Button>
        )}
      </StickyFooter>
    </main>
  );
}
