import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { toggleCohostScope } from "@/app/mission-actions";
import { BackButton } from "@/components/BackButton";
import { CohostLink } from "@/components/CohostLink";
import { Basket, Chat, Medal, User } from "@/components/icons";
import { InfoNote } from "@/components/missions";
import { Avatar, Card, Overline } from "@/components/ui";
import { COHOST_SCOPES, getMyCohostRole, listCohosts, type CohostScope } from "@/lib/cohost";
import { requireManager } from "@/lib/access";
import { getShabbat } from "@/lib/data";

const SCOPE_ICON: Record<CohostScope, { Icon: typeof Medal; tone: string }> = {
  missions: { Icon: Medal, tone: "text-coral-deep" },
  guests: { Icon: User, tone: "text-violet" },
  messages: { Icon: Chat, tone: "text-ink" },
  expenses: { Icon: Basket, tone: "text-gold-deep" },
};

/** G03 · Co-organisation — ce que l'hôte délègue, et à qui. */
export default async function CoOrganisation({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireManager(id);
  const t = await getTranslations("shabbat.cohost");
  const [shabbat, mine, cohosts] = await Promise.all([
    getShabbat(id),
    getMyCohostRole(id),
    listCohosts(id),
  ]);
  if (!shabbat) notFound();

  const isHost = shabbat.isHost;
  // Le co-organisateur voit ses propres délégations ; l'hôte voit celles
  // qu'il a accordées et peut les modifier.
  const rows = isHost ? cohosts : mine ? [mine] : [];

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="flex items-center gap-2.5 px-5 pt-[54px] pb-1">
        <BackButton fallback={`/shabbat/${id}`} />
      </div>

      <div className="px-5">
        <h1 className="mb-0.5 font-display text-[21px] font-semibold">
          {isHost ? t("hostTitle") : t("cohostTitle")}
        </h1>
        <p className="mb-3.5 text-xs text-ink/55">
          {isHost ? t("hostSubtitle") : t("cohostSubtitle", { host: shabbat.host.name })}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <Card className="mb-4 flex items-center gap-3 p-3.5">
          <Avatar initial={shabbat.host.initial} tone={shabbat.host.tone} size={38} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-bold">{shabbat.host.name}</div>
            <div className="text-[12px] text-ink/65">{t("mainHost")}</div>
          </div>
          {!isHost && mine && (
            <span className="shrink-0 rounded-full bg-gold/28 px-2.5 py-1.5 text-[11px] font-extrabold text-gold-ink">
              {t("youBadge")}
            </span>
          )}
        </Card>

        {isHost && (
          <div className="mb-4">
            <CohostLink token={shabbat.cohostToken} title={shabbat.title} />
          </div>
        )}

        {rows.length === 0 ? (
          <p className="rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-4 text-center text-[14px] text-ink/45">
            {isHost ? t("noCohostYet") : t("notACohost")}
          </p>
        ) : (
          rows.map((person) => (
            <section key={person.invitationId} className="mb-4">
              <Overline>
                {isHost ? t("delegatedTo", { name: person.name }) : t("youCanManage")}
              </Overline>
              <ul className="flex flex-col gap-2">
                {COHOST_SCOPES.map(({ key }) => {
                  const { Icon, tone } = SCOPE_ICON[key];
                  const on = person.scopes[key];
                  return (
                    <Card as="li" key={key} className="rounded-field">
                      <form
                        action={toggleCohostScope.bind(
                          null,
                          id,
                          person.invitationId,
                          key,
                          on,
                        )}
                      >
                        <button
                          type="submit"
                          role="switch"
                          aria-checked={on}
                          disabled={!isHost}
                          className="flex w-full items-center gap-3 px-3.5 py-3 text-start disabled:cursor-default"
                        >
                          <Icon size={16} className={`shrink-0 ${tone}`} />
                          <span className="flex-1 text-[14px] font-bold">
                            {t(`scopes.${key}`)}
                          </span>
                          <span
                            className={`relative h-[22px] w-9 shrink-0 rounded-full transition-colors ${on ? "bg-teal" : "bg-line"}`}
                          >
                            <span
                              className={`absolute top-[3px] size-4 rounded-full bg-white transition-all ${on ? "start-[19px]" : "start-[3px]"}`}
                            />
                          </span>
                        </button>
                      </form>
                    </Card>
                  );
                })}
              </ul>
            </section>
          ))
        )}

        <InfoNote>{t("hostOnlyNote", { host: shabbat.host.name })}</InfoNote>
      </div>
    </main>
  );
}
