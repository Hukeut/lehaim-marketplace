import { notFound, redirect } from "next/navigation";
import { FloatingBackButton } from "@/components/BackButton";
import { Calendar, Check, MapPin, StarSolid, User } from "@/components/icons";
import { Avatar, ButtonLink, Card, GlowCircle, StickyFooter } from "@/components/ui";
import { formatDate, formatTime, getMyInvitation, getShabbat } from "@/lib/data";

/** 09 · Invitation confirmée — célébration après un RSVP positif. */
export default async function InvitationConfirmee({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [shabbat, mine] = await Promise.all([getShabbat(id), getMyInvitation(id)]);
  if (!shabbat) notFound();
  if (mine && mine.status !== "confirmed") redirect(`/invitation/${id}`);

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <FloatingBackButton fallback={`/invitation/${id}`} />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/celebration-confirmation.jpg"
        alt=""
        className="h-[340px] w-full shrink-0 object-cover object-[center_15%] sm:rounded-t-[36px]"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[110px] bg-gradient-to-b from-black/35 to-transparent sm:rounded-t-[36px]" />

      <div className="absolute top-[58px] right-5 z-10 flex items-center gap-1.5 rounded-full bg-white/92 py-1.5 pr-3.5 pl-2">
        <GlowCircle size={20} glow="rgba(127,163,90,0.35)">
          <span className="flex size-5 items-center justify-center rounded-full bg-olive text-white">
            <Check size={11} strokeWidth={3} />
          </span>
        </GlowCircle>
        <span className="text-[11px] font-extrabold text-olive-ink">Vous y êtes</span>
      </div>

      <div className="relative z-10 -mt-6.5 flex flex-1 flex-col gap-4 overflow-y-auto rounded-t-sheet bg-cream px-6 pt-5 pb-4 shadow-[0_-12px_24px_rgba(13,43,62,0.06)]">
        <div className="text-center">
          <h1 className="font-display text-[23px] leading-tight font-semibold">
            C&apos;est noté, on vous attend
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink/60">
            {shabbat.host.name} vous ouvre sa table. Venez comme vous êtes.
          </p>
        </div>

        <Card className="flex items-center gap-3 rounded-[18px] p-3.5">
          <Avatar initial={shabbat.host.initial} tone={shabbat.host.tone} size={48} />
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-display text-[14.5px] font-semibold">
                {shabbat.host.name}
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold/22 px-2 py-0.5">
                <StarSolid size={9} className="text-gold-deep" />
                <span className="text-[9px] font-extrabold text-gold-ink">Hôte</span>
              </span>
            </div>
            <div className="mt-0.5 text-[11.5px] text-ink/55">Votre hôte pour la soirée</div>
          </div>
        </Card>

        <Card className="flex flex-col gap-2.5 rounded-[18px] px-4 py-3.5">
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
            {shabbat.counts.confirmed} convives autour de la table
          </Line>
        </Card>
      </div>

      <StickyFooter className="flex flex-col gap-2.5 px-6">
        <ButtonLink href={`/discussion/${id}`}>Dire bonjour au groupe</ButtonLink>
        <div className="flex gap-2.5">
          <ButtonLink href={`/invitation/${id}`} variant="secondary" size="sm">
            Voir la soirée
          </ButtonLink>
          <ButtonLink href={`/invitation/${id}/jour-j`} variant="secondary" size="sm">
            Le jour J
          </ButtonLink>
        </div>
      </StickyFooter>
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
