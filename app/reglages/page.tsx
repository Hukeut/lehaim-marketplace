import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Toggle } from "@/components/interactive";
import { SignOutButton } from "@/components/SignOutButton";
import { Card, Overline, TopBar } from "@/components/ui";

/** 20 · Réglages */
export default async function Reglages() {
  const t = await getTranslations("settings");
  const tc = await getTranslations("common");
  const tp = await getTranslations("profile");
  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <TopBar title={tc("settings")} back="/profil" />

      <div className="flex-1 overflow-y-auto px-[18px] pt-3 pb-4">
        <Overline>{t("account")}</Overline>
        <Card className="mb-4.5">
          <Row href="/profil/modifier" label={tp("editProfile")} />
          <Row href="/profil/modifier" label={t("phoneAndEmail")} last />
        </Card>

        <Overline>{t("notifications")}</Overline>
        <Card className="mb-4.5">
          <div className="border-b border-line-soft">
            <Toggle label={t("newReplies")} defaultOn />
          </div>
          <Toggle label={t("prepReminders")} />
        </Card>

        {/* La section « Assistance » a disparu : « Centre d'aide » et
            « Confidentialité » pointaient tous deux vers /etats, la planche
            des états d'interface. Mieux vaut pas de lien qu'un lien qui ment ;
            les deux rangées reviendront quand les pages existeront. */}

        {/* Planches de relecture, gardées : elles servent à revoir les écrans
            sans parcourir l'app. /legacy, en revanche, est parti — c'était
            l'ancienne maquette v1, en anglais, avec ses onglets Explore et
            Community, soit exactement le positionnement public que la v2 a
            abandonné. Elle était publique par-dessus le marché. */}
        <Overline>{t("design")}</Overline>
        <Card className="mb-4.5">
          <Row href="/ecrans" label={t("allMockups")} />
          <Row href="/etats" label={t("uiStates")} last />
        </Card>

        <Card className="px-3.5 py-3.5">
          <SignOutButton />
        </Card>
      </div>
    </main>
  );
}

function Row({ href, label, last = false }: { href: string; label: string; last?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-3.5 py-3.5 ${last ? "" : "border-b border-line-soft"}`}
    >
      <span className="text-[14px] font-bold">{label}</span>
      <span className="text-ink/30">›</span>
    </Link>
  );
}
