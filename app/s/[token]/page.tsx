import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RespondButtons } from "./RespondButtons";
import { BrandMark } from "@/components/BrandMark";
import { Candles, Dish, MapPin } from "@/components/icons";
import { Avatar, Card, StickyFooter } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTime } from "@/lib/data";
import { toneFor } from "@/lib/profile";
import { sharePreview } from "@/lib/share-preview";

/**
 * Ce que voit la messagerie avant que quiconque ait cliqué.
 *
 * Cette page n'avait aucune métadonnée propre : elle héritait de celle du
 * site, et chaque invitation partagée s'annonçait « Lehaim · Le Shabbat entre
 * amis, sans le stress ». Toutes identiques, aucune ne nommait le Shabbat ni
 * son hôte — un lien qui ressemble à une publicité pour l'app plutôt qu'à une
 * invitation.
 *
 * L'image, elle, est fabriquée par `opengraph-image.tsx`, que Next rattache
 * automatiquement à cette route.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const preview = await sharePreview(token);
  const t = await getTranslations("invitation.shareLanding");

  if (!preview) return { title: t("metaFallbackTitle") };

  const when = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(preview.starts_at));

  const title = preview.title;
  const description = preview.neighbourhood
    ? t("metaDescriptionPlace", { host: preview.host_name, when, place: preview.neighbourhood })
    : t("metaDescription", { host: preview.host_name, when });

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      // L'adresse canonique : sans elle, certaines messageries recomposent le
      // lien à partir de la page d'accueil.
      url: `/s/${token}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

type Preview = {
  id: string;
  title: string;
  starts_at: string;
  neighbourhood: string | null;
  host_name: string;
  guest_target: number;
  confirmed: number;
  moments: string[] | null;
  has_sleepover: boolean;
  funding_mode: string;
};

/** G02 · Invitation reçue par WhatsApp, avant toute réponse. */
export default async function ShareLanding({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("invitation.shareLanding");
  const supabase = await createClient();

  const { data } = await supabase.rpc("shabbat_preview", { token });
  const preview = (Array.isArray(data) ? data[0] : data) as Preview | undefined;
  if (!preview) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const confirmed = Number(preview.confirmed);
  const moments = preview.moments?.length ? preview.moments.join(" · ") : null;

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="flex-1 overflow-y-auto">
        <div className="relative h-[220px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/dresser-la-table.webp"
            alt=""
            className="size-full object-cover object-[center_30%] sm:rounded-t-[36px]"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[90px] bg-gradient-to-b from-black/35 to-transparent sm:rounded-t-[36px]" />
          <BrandMark light href={false} className="absolute top-[54px] start-5 z-10" />
          <span className="absolute top-[60px] end-5 rounded-full bg-white/94 px-3 py-1.5 text-[11.5px] font-extrabold text-teal-deep">
            {t("viaWhatsApp")}
          </span>
          <Avatar
            initial={preview.host_name.charAt(0).toUpperCase()}
            tone={toneFor(preview.host_name)}
            size={44}
            className="absolute -bottom-5 start-5 ring-3 ring-cream"
          />
        </div>

        <div className="px-5.5 pt-7 pb-2">
          <h1 className="mb-1 font-display text-[21px] font-semibold">
            {t("hostsInviteYou", { host: preview.host_name })}
          </h1>
          <p className="mb-4 text-[14px] text-ink/55">
            {formatDate(preview.starts_at)} · {formatTime(preview.starts_at)}
          </p>

          <ul className="mb-4 flex flex-col gap-2">
            <InfoRow icon={<MapPin size={16} className="text-ink/45" />}>
              {preview.neighbourhood
                ? t("addressAfterConfirm", { area: preview.neighbourhood })
                : t("addressHidden")}
            </InfoRow>
            {moments && (
              <InfoRow icon={<Candles size={16} className="text-gold-deep" />}>
                {moments}
              </InfoRow>
            )}
            {preview.has_sleepover && (
              <InfoRow icon={<Dish size={16} className="text-teal" />}>
                {t("sleepoverAvailable")}
              </InfoRow>
            )}
          </ul>

          {confirmed > 0 && (
            <p className="mb-2 text-[13px] text-ink/55">
              {t("alreadyConfirmed", { count: confirmed })}
            </p>
          )}
        </div>
      </div>

      <StickyFooter className="px-5.5">
        {user ? (
          <RespondButtons token={token} />
        ) : (
          <Link
            href={`/connexion?suite=${encodeURIComponent(`/s/${token}`)}`}
            className="flex w-full items-center justify-center rounded-full bg-coral py-4 font-display text-[15px] font-semibold text-white shadow-[var(--shadow-coral)]"
          >
            {t("respond")}
          </Link>
        )}
      </StickyFooter>
    </main>
  );
}

function InfoRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card as="li" className="rounded-field">
      <div className="flex items-center gap-3 px-3.5 py-3">
        <span className="shrink-0">{icon}</span>
        <span className="flex-1 text-[14px] font-bold">{children}</span>
      </div>
    </Card>
  );
}
