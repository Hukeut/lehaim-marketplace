import Link from "next/link";
import { notFound } from "next/navigation";
import { FloatingBackButton } from "@/components/BackButton";
import { Calendar, Chat, Dish, MapPin, Medal, StarSolid, User } from "@/components/icons";
import { Avatar, AvatarStack, Card, GlowCircle, StatusPill } from "@/components/ui";
import { formatDate, formatTime, getMyInvitation, getShabbat } from "@/lib/data";
import { RsvpButtons } from "./RsvpButtons";

/** 09b · Vue invité d'un Shabbat */
export default async function VueInvite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [shabbat, mine] = await Promise.all([getShabbat(id), getMyInvitation(id)]);
  if (!shabbat) notFound();

  const openDishes = shabbat.dishes.filter((d) => !d.assignee);

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col overflow-y-auto sm:min-h-0">
      <FloatingBackButton fallback="/shabbats" />

      <div className="relative h-[280px] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/famille-table-shabbat.jpg"
          alt=""
          className="size-full object-cover object-[center_22%] sm:rounded-t-[36px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/10 to-ink/55 sm:rounded-t-[36px]" />
        <div className="absolute inset-x-6 bottom-5.5">
          <div className="mb-1.5 text-[11px] font-extrabold tracking-[0.05em] text-gold uppercase">
            {formatDate(shabbat.startsAt)}
          </div>
          <h1 className="font-display text-[25px] leading-tight font-semibold text-white">
            {shabbat.title}
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5.5 pt-5 pb-6">
        {mine && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-sm font-semibold">Votre réponse</span>
              <StatusPill
                tone={
                  mine.status === "confirmed"
                    ? "success"
                    : mine.status === "declined"
                      ? "neutral"
                      : "warning"
                }
              >
                {mine.status === "confirmed"
                  ? "Confirmé"
                  : mine.status === "declined"
                    ? "Décliné"
                    : "À répondre"}
              </StatusPill>
            </div>
            <RsvpButtons shabbatId={id} status={mine.status} />
          </div>
        )}

        {mine?.role && (
          <Card className="flex items-center gap-3 rounded-panel p-4">
            <GlowCircle size={44} glow="rgba(255,122,89,0.25)">
              <span className="flex size-11 items-center justify-center rounded-xl bg-ink text-gold">
                <Medal size={20} />
              </span>
            </GlowCircle>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[15px] font-semibold">
                Vous êtes {mine.role}
              </div>
              <div className="truncate text-[11.5px] text-ink/55">
                {mine.roleDetail ?? "À confirmer avant jeudi"}
              </div>
            </div>
          </Card>
        )}

        <Card className="flex items-center gap-3.5 rounded-panel p-4">
          <Avatar initial={shabbat.host.initial} tone={shabbat.host.tone} size={48} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-display text-[15px] font-semibold">
                {shabbat.host.name}
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold/22 px-2 py-0.5">
                <StarSolid size={9} className="text-gold-deep" />
                <span className="text-[9px] font-extrabold text-gold-ink">Hôte</span>
              </span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-ink/55">vous accueille chez lui</p>
          </div>
        </Card>

        <Card className="flex flex-col gap-2.5 rounded-panel px-4 py-3.5">
          <Line icon={<Calendar size={15} className="text-teal" />}>
            {formatDate(shabbat.startsAt)} · {formatTime(shabbat.startsAt)}
          </Line>
          {shabbat.address && (
            <>
              <span className="h-px bg-line-soft" />
              <Line icon={<MapPin size={15} className="text-coral" />}>{shabbat.address}</Line>
            </>
          )}
          <span className="h-px bg-line-soft" />
          <Line icon={<User size={15} className="text-violet" />}>
            {shabbat.counts.confirmed} convives confirmés
          </Line>
        </Card>

        {shabbat.invitations.length > 0 && (
          <Card className="rounded-panel p-4">
            <div className="mb-2 flex items-center">
              <AvatarStack
                size={30}
                people={shabbat.invitations.slice(0, 3).map((i) => ({
                  initial: i.initial,
                  tone: i.tone,
                }))}
                extra={Math.max(0, shabbat.invitations.length - 3)}
              />
              <span className="ml-2.5 text-xs text-ink/60">vous accompagnent</span>
            </div>
          </Card>
        )}

        {openDishes.length > 0 && (
          <Card className="overflow-hidden rounded-panel">
            <div className="border-b border-line-soft px-4 py-3">
              <div className="font-display text-sm font-semibold">Il manque encore</div>
              <p className="mt-0.5 text-[11.5px] text-ink/55">
                {openDishes.length} plat{openDishes.length > 1 ? "s" : ""} sans personne
              </p>
            </div>
            {openDishes.slice(0, 4).map((dish) => (
              <div
                key={dish.id}
                className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-0"
              >
                <Dish size={15} className="shrink-0 text-coral" />
                <span className="flex-1 truncate text-[12.5px] font-bold">{dish.name}</span>
              </div>
            ))}
            <Link
              href={`/shabbat/${id}`}
              className="block px-4 py-3 text-center text-[12.5px] font-bold text-teal"
            >
              Choisir ce que j&apos;apporte
            </Link>
          </Card>
        )}

        <Link
          href={`/discussion/${id}`}
          className="flex items-center gap-3 rounded-panel bg-white px-4 py-3.5 shadow-[var(--shadow-card)]"
        >
          <Chat size={16} className="text-teal" />
          <span className="flex-1 text-[12.5px] font-bold">Écrire au groupe</span>
          <span className="text-ink/30">›</span>
        </Link>
      </div>
    </main>
  );
}

function Line({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <span className="text-[12.5px] font-bold">{children}</span>
    </div>
  );
}
