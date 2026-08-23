import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { Avatar, Card, ScreenBody, SectionTitle, StatTile } from "@/components/ui";
import { me } from "@/lib/demo";
import { getCurrentProfile, getProfileStats } from "@/lib/profile";
import { BrandMark } from "@/components/BrandMark";
import { DeleteAccount } from "@/components/DeleteAccount";
import { LanguageSwitch } from "@/components/LanguageSwitch";

/** 12 · Profil — identité et compteurs lus dans la base. */
export default async function Profil() {
  const t = await getTranslations("profile");
  const tc = await getTranslations("common");
  const [account, stats] = await Promise.all([getCurrentProfile(), getProfileStats()]);

  // Sans compte, on affiche la maquette : c'est ce qui permet de faire relire
  // les écrans sans obliger à se connecter. Les compteurs, eux, restent à zéro
  // — un visiteur non connecté n'a pas d'historique à montrer.
  const profile = account ?? {
    fullName: me.fullName,
    initial: me.initial,
    tone: me.tone,
    avatarUrl: null,
    memberSince: me.memberSince,
  };

  return (
    <ScreenBody>
      <BrandMark className="mb-3" />
      <div className="mb-4 flex items-center gap-3">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt=""
            className="size-13 shrink-0 rounded-full object-cover"
          />
        ) : (
          <Avatar initial={profile.initial} tone={profile.tone} size={52} />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-base font-semibold">
            {profile.fullName}
          </div>
          <div className="truncate text-[13px] text-ink/65">{profile.memberSince}</div>
        </div>
      </div>

      {!account && (
        <Card className="mb-4 border-[1.5px] border-gold/40 bg-gold-wash p-3.5">
          <div className="text-[13.5px] font-bold text-gold-ink">{t("previewNoAccount.title")}</div>
          <p className="mt-1 text-[13px] leading-snug text-gold-ink/80">
            {t("previewNoAccount.text")}{" "}
            <Link href="/connexion?suite=/profil" className="underline">
              {tc("login")}
            </Link>{" "}
            {t("previewNoAccount.loginSuffix")}
          </p>
        </Card>
      )}

      <div className="mb-5 grid grid-cols-3 gap-2">
        <StatTile value={stats.hosted} label={t("stats.hosted")} />
        <StatTile value={stats.joined} label={t("stats.joined")} />
        <StatTile value={stats.contacts} label={t("stats.contacts")} />
      </div>

      <div className="flex flex-col">
        <Row href="/profil/modifier" label={t("editProfile")} />
        <LanguageSwitch />
        <Row href="/historique" label={t("history")} />
        {account ? (
          <div className="px-0.5 py-3.5">
            <SignOutButton />
          </div>
        ) : (
          <Link href="/connexion?suite=/profil" className="px-0.5 py-3.5">
            <span className="text-[14px] font-bold text-teal">{tc("login")}</span>
          </Link>
        )}
      </div>

      {account && <DeleteAccount />}
    </ScreenBody>
  );
}

function Row({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between border-b border-line px-0.5 py-3.5"
    >
      <span className="text-[14px] font-bold">{label}</span>
      <span className="text-ink/30">›</span>
    </Link>
  );
}
