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
  const shabbat = await getShabbat(id);
  if (!shabbat) notFound();

  const message = `${shabbat.title} — ${formatDate(shabbat.startsAt)} à ${formatTime(
    shabbat.startsAt,
  )}. Confirme ta venue et choisis ce que tu apportes ici :`;

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <TopBar
        title={`Invités · ${shabbat.counts.confirmed}/${shabbat.counts.invited || shabbat.guestTarget}`}
        back={`/shabbat/${id}`}
      />

      <div className="flex-1 overflow-y-auto px-[18px] pt-2 pb-4">
        <div className="mb-4">
          <CopyLink token={shabbat.shareToken} />
        </div>
        <GuestManager shabbatId={id} invitations={shabbat.invitations} />
      </div>

      <StickyFooter>
        <WhatsAppShare token={shabbat.shareToken} message={message} />
      </StickyFooter>
    </main>
  );
}
