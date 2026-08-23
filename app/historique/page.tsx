import { getTranslations } from "next-intl/server";
import { BackButton } from "@/components/BackButton";
import { EmptyState, SignedOut } from "@/components/States";
import { ButtonLink, Card, StatusPill } from "@/components/ui";
import { formatDate, listHostedShabbats } from "@/lib/data";
import { getCurrentProfile } from "@/lib/profile";
import { templateByKey } from "@/lib/templates";

/** G04 · Historique — les Shabbats passés, prêts à être rejoués. */
export default async function Historique() {
  const t = await getTranslations("history");
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <main className="flex min-h-dvh flex-1 flex-col px-5 pt-[54px] sm:min-h-0">
        <div className="mb-3">
          <BackButton fallback="/profil" />
        </div>
        <h1 className="mb-4 font-display text-[20px] font-semibold">{t("title")}</h1>
        <SignedOut suite="/historique" what={t("whatSignedOut")} />
      </main>
    );
  }

  const past = (await listHostedShabbats()).filter((s) => s.isPast);

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="flex items-center gap-2.5 px-5 pt-[54px] pb-1">
        <BackButton fallback="/profil" />
        <h1 className="flex-1 font-display text-[20px] font-semibold">{t("title")}</h1>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-5 pt-3 pb-5">
        {past.length ? (
          past.map((shabbat) => {
            const template = shabbat.template ? templateByKey(shabbat.template) : null;
            return (
              <Card key={shabbat.id} className="rounded-[18px] p-4">
                <div className="mb-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-display text-[16px] font-semibold">
                      {shabbat.title}
                    </div>
                    <div className="text-[12.5px] text-ink/65">
                      {formatDate(shabbat.startsAt)}
                      {template ? ` · ${template.name}` : ""}
                    </div>
                  </div>
                  <StatusPill>{t("finished")}</StatusPill>
                </div>
                <div className="flex gap-2">
                  <ButtonLink href={`/historique/${shabbat.id}/recreer`} size="sm">
                    {t("recreateCta")}
                  </ButtonLink>
                  <ButtonLink
                    href={`/shabbat/${shabbat.id}/recap`}
                    variant="secondary"
                    size="sm"
                  >
                    {t("viewRecap")}
                  </ButtonLink>
                </div>
              </Card>
            );
          })
        ) : (
          <EmptyState
            illustration="/illustrations/etat-vide-table.webp"
            title={t("emptyTitle")}
            text={t("emptyText")}
            cta={t("emptyCta")}
            href="/creer"
          />
        )}
      </div>
    </main>
  );
}
