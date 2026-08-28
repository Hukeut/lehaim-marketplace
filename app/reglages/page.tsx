import Link from "next/link";
import { Toggle } from "@/components/interactive";
import { SignOutButton } from "@/components/SignOutButton";
import { Card, Overline, TopBar } from "@/components/ui";
import { isMarketplaceAdmin } from "@/lib/marketplace";

/** 20 · Réglages */
export default async function Reglages() {
  const isAdmin = await isMarketplaceAdmin();

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <TopBar title="Réglages" back="/profil" />

      <div className="flex-1 overflow-y-auto px-[18px] pt-3 pb-4">
        <Overline>Compte</Overline>
        <Card className="mb-4.5">
          <Row href="/profil/modifier" label="Modifier le profil" />
          <Row href="/profil/modifier" label="Numéro & e-mail" />
          <Row href="/profil/paiement" label="Moyens de paiement" last />
        </Card>

        <Overline>Notifications</Overline>
        <Card className="mb-4.5">
          <div className="border-b border-line-soft">
            <Toggle label="Nouvelles réponses" defaultOn />
          </div>
          <div className="border-b border-line-soft">
            <Toggle label="Messages" defaultOn />
          </div>
          <Toggle label="Rappels de préparation" />
        </Card>

        <Overline>Assistance</Overline>
        <Card className="mb-4.5">
          <Row href="/etats" label="Centre d'aide" />
          <Row href="/etats" label="Confidentialité" last />
        </Card>

        <Overline>Design</Overline>
        <Card className="mb-4.5">
          <Row href="/ecrans" label="Toutes les maquettes" />
          <Row href="/etats" label="États d'interface" />
          <Row href="/legacy" label="Ancienne version (stand-by)" last />
        </Card>

        {isAdmin && (
          <>
            <Overline>Équipe lehaim</Overline>
            <Card className="mb-4.5">
              <Row href="/admin/traiteurs" label="Validation traiteurs" last />
            </Card>
          </>
        )}

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
      <span className="text-[12.5px] font-bold">{label}</span>
      <span className="text-ink/30">›</span>
    </Link>
  );
}
