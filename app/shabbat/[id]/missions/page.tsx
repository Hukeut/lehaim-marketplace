import { getTranslations } from "next-intl/server";
import { canManage } from "@/lib/access";
import { RemoveRow } from "@/components/RemoveButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  claimMission,
  deleteMission,
  suggestMission,
} from "@/app/mission-actions";
import { BackButton } from "@/components/BackButton";
import { Check, Plus } from "@/components/icons";
import { ClaimerStack, EmojiTile } from "@/components/missions";
import { RefusBanner } from "@/components/RefusBanner";
import { Button, ButtonLink, Card, StickyFooter } from "@/components/ui";
import { getShabbat } from "@/lib/data";
import { getOps } from "@/lib/missions";
import { roleKeyFor } from "@/lib/templates";

/** S07 · Choisir une mission — et S07b quand tout est pris. */
export default async function ChoisirMission({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ refus?: string }>;
}) {
  const { id } = await params;
  const { refus } = await searchParams;
  // Un invité n'a pas accès au tableau de bord : il repart vers sa
  // propre vue du Shabbat.
  const manage = await canManage(id);
  const back = manage ? `/shabbat/${id}` : `/invitation/${id}`;
  const t = await getTranslations("missions.choose");
  const tRoles = await getTranslations("missions.roles");
  const tRemove = await getTranslations("common.remove");
  const tBoard = await getTranslations("missions.board");
  const tc = await getTranslations("common");
  const [shabbat, ops] = await Promise.all([getShabbat(id), getOps(id)]);
  if (!shabbat || !ops) notFound();

  const open = ops.missions.filter((m) => m.free > 0 && !m.mine);
  const mine = ops.missions.filter((m) => m.mine);

  const nothingAsked = ops.missions.length === 0;

  if (!open.length && !mine.length) {
    return (
      <main className="flex min-h-dvh flex-1 flex-col items-center px-7.5 text-center sm:min-h-0">
        <div className="w-full pt-[54px] text-start">
          <BackButton fallback={back} />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3.5">
          <span className="flex size-[74px] items-center justify-center rounded-full bg-olive/14 text-olive">
            <Check size={32} strokeWidth={2.2} />
          </span>
          <h1 className="font-display text-[21px] font-semibold">
            {nothingAsked ? t("noneYet") : t("allTaken")}
          </h1>
          <p className="max-w-[250px] text-[14.5px] leading-relaxed text-ink/60">
            {nothingAsked
              ? manage
                ? t("noneYetManager")
                : t("noneYetGuest")
              : t("allTakenText")}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2.5 pb-[34px]">
          {/* Ce bouton menait tout le monde vers /messages, écran protégé par
              `requireManager` — donc l'invité, seul destinataire naturel d'un
              « tout est pris », était renvoyé d'où il venait. Il ne
              fonctionnait que pour ceux à qui il n'était pas destiné. */}
          <ButtonLink
            href={
              manage
                ? nothingAsked
                  ? `/shabbat/${id}/besoins/ajouter`
                  : `/shabbat/${id}/messages`
                : `/invitation/${id}`
            }
          >
            {manage ? (nothingAsked ? tBoard("add") : t("offerHelp")) : tc("backToShabbat")}
          </ButtonLink>
          {/* Sans ceci, un organisateur dont tout est pris n'avait plus aucun
              chemin pour demander autre chose : le « + » vit dans l'écran
              plein, celui-là même que cet état remplace. */}
          {manage && !nothingAsked && (
            <Link
              href={`/shabbat/${id}/besoins/ajouter`}
              className="text-[14px] font-bold text-teal underline underline-offset-2"
            >
              {tBoard("add")}
            </Link>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <div className="mb-2">
          <BackButton fallback={back} />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="mb-0.5 font-display text-xl font-semibold">
              {t("title")}
            </h1>
            <p className="mb-3.5 text-[14px] text-ink/55">
              {t("remainingCount", { count: open.length })}
            </p>
          </div>
          {manage && (
            <Link
              href={`/shabbat/${id}/besoins/ajouter`}
              aria-label={t("addMissionAria")}
              className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-[var(--shadow-float)]"
            >
              <Plus size={15} />
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-4">
        <RefusBanner refus={refus} />
        {mine.map((mission) => (
          <Card
            key={mission.id}
            className="overflow-hidden rounded-panel border-2 border-teal"
          >
            <MaybeRemovable
              manage={manage}
              action={deleteMission.bind(
                null,
                id,
                mission.id,
                `/shabbat/${id}/missions`,
              )}
              label={mission.title}
              warning={tRemove("claimed", {
                count: mission.claimers.length,
                names: mission.claimers.map((c) => c.name).join(", "),
              })}
            >
              <div className="min-w-0 flex-1 p-4">
                <div className="mb-2.5 flex items-center gap-3">
                  <EmojiTile
                    emoji={mission.emoji}
                    category={mission.category}
                    title={mission.title}
                    size={48}
                    radius={14}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[15px] font-semibold">
                      {mission.title}
                    </div>
                    <span className="mt-0.5 inline-block rounded-full bg-teal/14 px-2.5 py-1 text-[11.5px] font-extrabold text-teal-deep">
                      {t("youveGotThis")}
                    </span>
                  </div>
                </div>
                <ButtonLink
                  href={`/shabbat/${id}/mission/${mission.id}`}
                  variant="secondary"
                  size="sm"
                >
                  {t("viewMyMission")}
                </ButtonLink>
              </div>
            </MaybeRemovable>
          </Card>
        ))}

        {open.map((mission) => {
          const roleKey = roleKeyFor(mission.title);
          return (
            <Card
              key={mission.id}
              className="overflow-hidden rounded-panel shadow-[var(--shadow-card-lg)]"
            >
              {/* La croix n'apparaît que pour qui organise : un invité ne
                  retire pas un apport de la liste commune. */}
              <MaybeRemovable
                manage={manage}
                action={deleteMission.bind(
                  null,
                  id,
                  mission.id,
                  `/shabbat/${id}/missions`,
                )}
                label={mission.title}
                warning={undefined}
              >
                <div className="min-w-0 flex-1 p-4">
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
                        className={`mt-0.5 inline-block rounded-full px-2.5 py-1 text-[11.5px] font-extrabold ${
                          mission.free === 1
                            ? "bg-coral/14 text-coral-deep"
                            : "bg-olive/14 text-olive-deep"
                        }`}
                      >
                        {t("slotsLeft", { count: mission.free })}
                      </span>
                    </div>
                    <ClaimerStack people={mission.claimers} />
                  </div>

                  <p className="mb-3 text-xs leading-snug text-ink/60">
                    ✨ {tRoles(`${roleKey}.tagline`)}
                  </p>

                  <form action={claimMission.bind(null, id, mission.id)}>
                    <Button type="submit" size="sm">
                      {t("takeMission")}
                    </Button>
                  </form>
                </div>
              </MaybeRemovable>
            </Card>
          );
        })}
      </div>

      <StickyFooter className="px-5">
        <form action={suggestMission.bind(null, id)}>
          <Button type="submit" variant="outlineTeal" size="sm">
            🎲 {t("surpriseMe")}
          </Button>
        </form>
      </StickyFooter>
    </main>
  );
}

/**
 * Enveloppe la carte d'un apport d'une croix de suppression, ou pas.
 *
 * Cet écran est le seul des trois à être partagé avec les invités : la croix
 * y dépend donc de qui regarde, là où le tableau des besoins et le matériel
 * sont déjà réservés à l'organisation.
 */
function MaybeRemovable({
  manage,
  children,
  ...rest
}: {
  manage: boolean;
  action: () => Promise<void>;
  label: string;
  warning?: string;
  children: React.ReactNode;
}) {
  if (!manage) return <>{children}</>;
  return <RemoveRow {...rest}>{children}</RemoveRow>;
}
