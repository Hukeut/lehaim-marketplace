import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { LehaimIcon, type LehaimIconName } from "@/components/LehaimIcon";
import { EmptyState, SignedOut } from "@/components/States";
import { Card, ScreenBody, SectionTitle, StatusPill } from "@/components/ui";
import { countdown, formatDate, getShabbat, listHostedShabbats, listJoinedShabbats } from "@/lib/data";
import { getOps } from "@/lib/missions";
import { getCurrentProfile } from "@/lib/profile";

type Task = {
  key: string;
  href: string;
  icon: LehaimIconName;
  title: string;
  detail: string;
  urgent?: boolean;
};

/**
 * « À faire » — tout ce qui attend la personne, tous Shabbats confondus.
 * L'écran ne liste que ce sur quoi elle peut agir : rien d'informatif.
 */
export default async function AFaire() {
  const t = await getTranslations("todo");
  // Le profil, les Chabbats organisés et ceux rejoints partent ensemble. Le
  // profil ne conditionne que la sortie anticipée ci-dessous, pas les deux
  // listes : les attendre l'un après l'autre coûtait un aller-retour complet
  // sur l'écran le plus visité de l'app.
  const [profile, hosted, joined] = await Promise.all([
    getCurrentProfile(),
    listHostedShabbats(),
    listJoinedShabbats(),
  ]);

  if (!profile) {
    return (
      <ScreenBody>
        <BrandMark className="mb-3" />
        <h1 className="mb-4 font-display text-[21px] font-semibold">{t("title")}</h1>
        <SignedOut suite="/a-faire" what={t("whatSignedOut")} />
      </ScreenBody>
    );
  }

  const upcoming = [...hosted, ...joined].filter((s) => !s.isPast);

  const groups: { shabbat: (typeof upcoming)[number]; tasks: Task[] }[] = [];

  // Tous les Shabbats sont chargés de front : en série, chaque Shabbat de
  // plus ajoutait un aller-retour complet à l'affichage de l'écran.
  const loaded = await Promise.all(
    upcoming.map(async (summary) => {
      const [shabbat, ops] = await Promise.all([getShabbat(summary.id), getOps(summary.id)]);
      return { summary, shabbat, ops };
    }),
  );

  for (const { summary, shabbat, ops } of loaded) {
    if (!shabbat || !ops) continue;

    const tasks: Task[] = [];

    if (summary.isHost) {
      const orphan = ops.missions.filter((m) => m.claimers.length === 0).length;
      if (orphan > 0) {
        tasks.push({
          key: "orphan",
          href: `/shabbat/${summary.id}/missions`,
          icon: "chair",
          title: t("orphanMissions", { count: orphan }),
          detail: t("orphanMissionsDetail"),
          urgent: true,
        });
      }
      const pending = shabbat.invitations.filter((i) => i.status === "pending").length;
      if (pending > 0) {
        tasks.push({
          key: "pending",
          href: `/shabbat/${summary.id}/invites`,
          icon: "envelope",
          title: t("pendingAnswers", { count: pending }),
          detail: t("pendingAnswersDetail"),
        });
      }
      const missing = ops.equipment.filter((e) => e.missing > 0 && !e.claimedBy).length;
      if (missing > 0) {
        tasks.push({
          key: "equipment",
          href: `/shabbat/${summary.id}/materiel`,
          icon: "chair",
          title: t("missingEquipment", { count: missing }),
          detail: t("missingEquipmentDetail"),
        });
      }
    } else {
      const mine = ops.missions.filter((m) => m.mine);
      if (!mine.length) {
        tasks.push({
          key: "pick",
          href: `/shabbat/${summary.id}/missions`,
          icon: "challah",
          title: t("pickMission"),
          detail: t("pickMissionDetail"),
          urgent: true,
        });
      }
      for (const mission of mine.filter((m) => m.status !== "done")) {
        tasks.push({
          key: `mission-${mission.id}`,
          href: `/shabbat/${summary.id}/mission/${mission.id}`,
          icon: "kiddush",
          title: `${mission.emoji} ${mission.title}`,
          detail: t("missionInProgress"),
        });
      }
    }


    if (tasks.length) groups.push({ shabbat: summary, tasks });
  }

  return (
    <ScreenBody>
      <BrandMark className="mb-3" />
      <h1 className="mb-0.5 font-display text-[21px] font-semibold">{t("title")}</h1>
      <p className="mb-4 text-xs text-ink/55">{t("subtitle")}</p>

      {groups.length ? (
        groups.map(({ shabbat, tasks }) => (
          <section key={shabbat.id} className="mb-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <SectionTitle className="mb-0">{shabbat.title}</SectionTitle>
              <span className="shrink-0 text-[12px] text-ink/45">
                {countdown(shabbat.startsAt)} · {formatDate(shabbat.startsAt)}
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {tasks.map((task) => (
                <Card as="li" key={task.key}>
                  <Link href={task.href} className="flex items-center gap-3 p-3">
                    <LehaimIcon name={task.icon} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-bold">{task.title}</div>
                      <div className="truncate text-[12.5px] text-ink/65">{task.detail}</div>
                    </div>
                    {task.urgent ? (
                      <StatusPill tone="urgent">{t("urgent")}</StatusPill>
                    ) : (
                      <span className="text-ink/30">›</span>
                    )}
                  </Link>
                </Card>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <EmptyState
          illustration="/illustrations/celebration-confirmation.webp"
          title={t("emptyTitle")}
          text={t("emptyText")}
        />
      )}
    </ScreenBody>
  );
}
