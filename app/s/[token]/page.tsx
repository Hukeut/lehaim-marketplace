import Link from "next/link";
import { notFound } from "next/navigation";
import { JoinButton } from "./JoinButton";
import { BrandMark } from "@/components/BrandMark";
import { Calendar, MapPin, StarSolid, User } from "@/components/icons";
import { Card, GlowCircle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTime } from "@/lib/data";
import { Avatar } from "@/components/ui";
import { toneFor } from "@/lib/profile";

/** S01 · Accès par lien — la porte d'entrée depuis WhatsApp. */
export default async function ShareLanding({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("shabbat_preview", { token });
  const preview = Array.isArray(data) ? data[0] : data;
  if (!preview) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col sm:min-h-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/accueil-invites-porte.jpg"
        alt=""
        className="h-[300px] w-full shrink-0 object-cover object-[center_24%] sm:rounded-t-[36px]"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[110px] bg-gradient-to-b from-black/35 to-transparent sm:rounded-t-[36px]" />
      <BrandMark light href={false} className="absolute top-[54px] left-[18px] z-10" />

      <div className="relative z-10 -mt-6.5 flex flex-1 flex-col gap-4 overflow-y-auto rounded-t-sheet bg-cream px-6 pt-5 pb-6 shadow-[0_-12px_24px_rgba(13,43,62,0.06)]">
        <div className="text-center">
          <div className="mb-1.5 text-[11px] font-extrabold tracking-[0.05em] text-teal uppercase">
            Vous êtes invité·e
          </div>
          <h1 className="font-display text-[23px] leading-tight font-semibold">
            {preview.title}
          </h1>
        </div>

        <Card className="flex items-center gap-3 rounded-[18px] p-3.5">
          <GlowCircle size={48} glow="rgba(255,209,102,0.3)">
            <Avatar
              initial={String(preview.host_name).charAt(0).toUpperCase()}
              tone={toneFor(String(preview.host_name))}
              size={48}
              className="ring-3 ring-white"
            />
          </GlowCircle>
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-display text-[14.5px] font-semibold">
                {preview.host_name}
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold/22 px-2 py-0.5">
                <StarSolid size={9} className="text-gold-deep" />
                <span className="text-[9px] font-extrabold text-gold-ink">Hôte</span>
              </span>
            </div>
            <div className="mt-0.5 text-[11.5px] text-ink/55">vous ouvre sa table</div>
          </div>
        </Card>

        <Card className="flex flex-col gap-2.5 rounded-[18px] px-4 py-3.5">
          <Line icon={<Calendar size={15} className="text-teal" />}>
            {formatDate(preview.starts_at)} · {formatTime(preview.starts_at)}
          </Line>
          {preview.neighbourhood && (
            <>
              <span className="h-px bg-line-soft" />
              <Line icon={<MapPin size={15} className="text-coral" />}>
                {preview.neighbourhood}
              </Line>
            </>
          )}
          <span className="h-px bg-line-soft" />
          <Line icon={<User size={15} className="text-violet" />}>
            {Number(preview.confirmed)} confirmé
            {Number(preview.confirmed) > 1 ? "s" : ""} sur {preview.guest_target} places
          </Line>
        </Card>

        <p className="text-center text-[12.5px] leading-relaxed text-ink/55">
          Confirmez votre venue, puis choisissez ce que vous apportez. Ça prend trente
          secondes.
        </p>

        <div className="mt-auto">
          {user ? (
            <JoinButton token={token} />
          ) : (
            <Link
              href={`/connexion?suite=${encodeURIComponent(`/s/${token}`)}`}
              className="flex w-full items-center justify-center rounded-full bg-coral py-4 font-display text-[15px] font-semibold text-white shadow-[var(--shadow-coral)]"
            >
              Répondre à l&apos;invitation
            </Link>
          )}
        </div>
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
