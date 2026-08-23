import { getTranslations } from "next-intl/server";
import { JoinForm } from "./JoinForm";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";
import { LehaimIcon } from "@/components/LehaimIcon";
import { SignedOut } from "@/components/States";
import { Card } from "@/components/ui";
import { getCurrentProfile } from "@/lib/profile";

/**
 * Rejoindre un Shabbat organisé par quelqu'un d'autre. Accessible en
 * permanence : organiser son propre Shabbat n'empêche pas d'être invité
 * chez les autres.
 */
export default async function Rejoindre() {
  const t = await getTranslations("shabbat.join");
  const profile = await getCurrentProfile();

  return (
    <main className="flex min-h-dvh flex-1 flex-col px-5 pt-[54px] pb-8 sm:min-h-0">
      <div className="mb-4 flex items-center gap-3">
        <BackButton fallback="/accueil" />
        <BrandMark />
      </div>

      <LehaimIcon name="join-code" size={72} className="mb-3" />
      <h1 className="mb-1 font-display text-[22px] font-semibold">{t("title")}</h1>
      <p className="mb-5 text-[14px] leading-relaxed text-ink/60">{t("subtitle")}</p>

      {profile ? (
        <>
          <JoinForm />
          <Card className="mt-3 p-4">
            <div className="mb-1 text-[14.5px] font-bold">{t("whereTitle")}</div>
            <p className="text-[14px] leading-relaxed text-ink/55">{t("whereText")}</p>
          </Card>
        </>
      ) : (
        <SignedOut suite="/rejoindre" what={t("signedOut")} />
      )}
    </main>
  );
}
