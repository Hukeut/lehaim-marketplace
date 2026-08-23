import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AcceptCohost } from "./AcceptCohost";
import { BrandMark } from "@/components/BrandMark";
import { Avatar, Card, StickyFooter } from "@/components/ui";
import { formatDate, formatTime } from "@/lib/data";
import { toneFor } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

type Preview = { title: string; starts_at: string; host_name: string };

/**
 * Lien de co-organisation. Distinct du lien d'invitation : il confère les
 * droits de gestion, on l'envoie donc à une personne, pas au groupe.
 */
export default async function CohostLanding({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("shabbat.cohost");
  const supabase = await createClient();

  const { data } = await supabase.rpc("cohost_preview", { token });
  const preview = (Array.isArray(data) ? data[0] : data) as Preview | undefined;
  if (!preview) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="flex-1 overflow-y-auto px-5.5 pt-[54px]">
        <BrandMark className="mb-6" />

        <div className="mb-4 flex items-center gap-3">
          <Avatar
            initial={preview.host_name.charAt(0).toUpperCase()}
            tone={toneFor(preview.host_name)}
            size={44}
          />
          <div className="min-w-0">
            <h1 className="font-display text-[20px] leading-tight font-semibold">
              {t("invitedBy", { host: preview.host_name })}
            </h1>
            <p className="text-[13.5px] text-ink/55">{t("subtitle")}</p>
          </div>
        </div>

        <Card className="mb-4 rounded-field px-3.5 py-3">
          <div className="text-[14.5px] font-bold">{preview.title}</div>
          <div className="text-[13px] text-ink/55">
            {formatDate(preview.starts_at)} · {formatTime(preview.starts_at)}
          </div>
        </Card>

        <ul className="flex flex-col gap-2">
          {["missions", "guests", "messages"].map((key) => (
            <Card as="li" key={key} className="rounded-field">
              <div className="px-3.5 py-3 text-[14px] font-bold">{t(`can.${key}`)}</div>
            </Card>
          ))}
        </ul>
      </div>

      <StickyFooter className="px-5.5">
        {user ? (
          <AcceptCohost token={token} />
        ) : (
          <Link
            href={`/connexion?suite=${encodeURIComponent(`/co/${token}`)}`}
            className="flex w-full items-center justify-center rounded-full bg-coral py-4 font-display text-[15px] font-semibold text-white shadow-[var(--shadow-coral)]"
          >
            {t("signInFirst")}
          </Link>
        )}
      </StickyFooter>
    </main>
  );
}
