import { getTranslations } from "next-intl/server";
import { canManage } from "@/lib/access";
import { notFound } from "next/navigation";
import { RoomList } from "./RoomList";
import { BackButton } from "@/components/BackButton";
import { LehaimIcon } from "@/components/LehaimIcon";
import { RefusBanner } from "@/components/RefusBanner";
import { getShabbat } from "@/lib/data";
import { listRooms } from "@/lib/rooms";

/** Le couchage, chambre par chambre : l'hôte les décrit, chacun choisit la sienne. */
export default async function Couchage({
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
  const back = (await canManage(id)) ? `/shabbat/${id}` : `/invitation/${id}`;
  const t = await getTranslations("shabbat.rooms");
  const tm = await getTranslations("missions");
  const shabbat = await getShabbat(id);
  if (!shabbat) notFound();

  const rooms = await listRooms(id, tm("guestFallback"));

  return (
    <main className="flex min-h-dvh flex-1 flex-col px-5 pt-[54px] pb-8 sm:min-h-0">
      <div className="mb-3">
        <BackButton fallback={back} />
      </div>
      <LehaimIcon name="bed" size={72} className="mb-2" />
      <h1 className="mb-1 font-display text-[22px] font-semibold">{t("title")}</h1>
      <p className="mb-4 text-[15px] leading-relaxed text-ink/60">
        {shabbat.isHost ? t("subtitleHost") : t("subtitleGuest")}
      </p>

      <RefusBanner refus={refus} />

      <RoomList shabbatId={id} rooms={rooms} isHost={shabbat.isHost} />
    </main>
  );
}
