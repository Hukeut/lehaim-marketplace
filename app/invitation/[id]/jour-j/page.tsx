import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { FloatingBackButton } from "@/components/BackButton";
import { Card, StickyFooter } from "@/components/ui";
import { WhatsAppShare } from "@/components/CopyLink";
import { formatTime, getMyInvitation, getShabbat } from "@/lib/data";

/** 10 · Jour J — ce qui compte au moment d'y aller. */
export default async function JourJ({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("invitation.dayOf");
  const [shabbat, mine] = await Promise.all([getShabbat(id), getMyInvitation(id)]);
  if (!shabbat) notFound();

  const maps = shabbat.address
    ? `https://maps.apple.com/?q=${encodeURIComponent(shabbat.address)}`
    : null;

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <FloatingBackButton fallback={`/invitation/${id}`} />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/accueil-invites-porte.webp"
        alt=""
        className="h-[300px] w-full shrink-0 object-cover object-[center_24%] sm:rounded-t-[36px]"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[100px] bg-gradient-to-b from-black/30 to-transparent sm:rounded-t-[36px]" />

      <div className="relative z-10 -mt-6 flex flex-1 flex-col items-center gap-3 overflow-y-auto rounded-t-3xl bg-cream px-6.5 pt-4.5 pb-4 text-center shadow-[0_-12px_24px_rgba(15,39,77,0.05)]">
        <h1 className="font-display text-xl font-semibold">{t("title")}</h1>
        <p className="text-[14px] leading-relaxed text-ink/60">
          {t("subtitle", { time: formatTime(shabbat.startsAt), host: shabbat.host.name })}
        </p>

        {shabbat.address && (
          <Card className="flex w-full items-center justify-between px-3.5 py-3">
            <div className="min-w-0 text-start">
              <div className="text-[11.5px] font-bold text-ink/65">{t("addressLabel")}</div>
              <div className="truncate text-[14px] font-bold">{shabbat.address}</div>
            </div>
            {maps && (
              <a href={maps} className="shrink-0 text-[13px] font-bold text-teal">
                {t("directions")}
              </a>
            )}
          </Card>
        )}

        {mine?.role && (
          <Card className="w-full px-3.5 py-3 text-start">
            <div className="text-[11.5px] font-bold text-ink/65">{t("bringing")}</div>
            <div className="text-[14px] font-bold">
              {mine.role}
              {mine.roleDetail ? ` · ${mine.roleDetail}` : ""}
            </div>
          </Card>
        )}
      </div>

      <StickyFooter className="px-6.5">
        <WhatsAppShare
          token={shabbat.shareToken}
          message={t("onMyWayMessage")}
          label={t("notifyArrival")}
        />
      </StickyFooter>
    </main>
  );
}
