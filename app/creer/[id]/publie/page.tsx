import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Check, StarSolid } from "@/components/icons";
import { CopyLink } from "@/components/CopyLink";
import { ButtonLink, GlowCircle } from "@/components/ui";
import { formatDate, getShabbat } from "@/lib/data";
import { BrandMark } from "@/components/BrandMark";

/** 23 · Shabbat publié */
export default async function ShabbatPublie({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("shabbat.create.publie");
  const shabbat = await getShabbat(id);
  if (!shabbat) notFound();

  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center px-6.5 text-center sm:min-h-0">
      <div className="w-full pt-[54px] text-start">
        <BrandMark />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3.5">
        <div className="relative animate-pop">
          <StarSolid size={11} className="absolute -top-1 start-0 text-gold" />
          <StarSolid size={8} className="absolute end-[-6px] bottom-1 text-gold" />
          <GlowCircle size={88} glow="rgba(255,209,102,0.35)">
            <span className="flex size-[88px] items-center justify-center rounded-full bg-olive/16 text-olive">
              <Check size={38} strokeWidth={2.4} />
            </span>
          </GlowCircle>
        </div>

        <h1 className="font-display text-[22px] font-semibold">{t("title")}</h1>
        <p className="max-w-[260px] text-[14.5px] leading-relaxed text-ink/60">
          {t("subtitle", { date: formatDate(shabbat.startsAt) })}
        </p>

        <CopyLink token={shabbat.shareToken} />
      </div>

      <div className="flex w-full flex-col gap-2.5 pb-[34px]">
        <ButtonLink href={`/shabbat/${id}/invites`}>{t("inviteFirstGuests")}</ButtonLink>
        <ButtonLink href={`/shabbat/${id}`} variant="secondary" size="sm">
          {t("viewMyShabbat")}
        </ButtonLink>
        <ButtonLink href="/accueil" variant="ghost" size="sm">
          {t("backToHome")}
        </ButtonLink>
      </div>
    </main>
  );
}
