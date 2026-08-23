import { getTranslations } from "next-intl/server";
import { requireManager } from "@/lib/access";
import { notFound } from "next/navigation";
import { CopyLink, WhatsAppShare } from "@/components/CopyLink";
import { StickyFooter, TopBar } from "@/components/ui";
import { formatDate, formatTime, getShabbat } from "@/lib/data";
import { GuestManager } from "./GuestManager";

/** 26 · Gérer les invités */
export default async function GererInvites({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireManager(id);
  const t = await getTranslations("invitation.guests");
  const shabbat = await getShabbat(id);
  if (!shabbat) notFound();

  const message = t("whatsappInviteMessage", {
    title: shabbat.title,
    date: formatDate(shabbat.startsAt),
    time: formatTime(shabbat.startsAt),
  });

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <TopBar
        title={t("guestsTitle", {
          confirmed: shabbat.counts.confirmed,
          total: shabbat.counts.invited || shabbat.guestTarget,
        })}
        back={`/shabbat/${id}`}
      />

      <div className="flex-1 overflow-y-auto px-[18px] pt-2 pb-4">
        <div className="mb-4">
          <CopyLink token={shabbat.shareToken} />
          <div className="mt-2 flex items-center justify-between rounded-field bg-white px-4 py-3 shadow-[var(--shadow-card)]">
            <span className="text-[13.5px] text-ink/55">{t("codeLabel")}</span>
            <span className="font-display text-[19px] font-semibold tracking-[0.14em]">
              {shabbat.joinCode}
            </span>
          </div>
        </div>
        <GuestManager shabbatId={id} invitations={shabbat.invitations} />
      </div>

      <StickyFooter>
        <WhatsAppShare token={shabbat.shareToken} message={message} />
      </StickyFooter>
    </main>
  );
}
