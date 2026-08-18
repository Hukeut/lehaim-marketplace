import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyTraiteur } from "@/lib/marketplace";
import { TraiteurOnboardingForm } from "@/components/marketplace/TraiteurOnboardingForm";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";
import { ButtonLink, Card, StatusPill } from "@/components/ui";
import { Check, Clock, XCircle } from "@/components/icons";

export default async function DevenirTraiteur() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion?suite=/devenir-traiteur");

  const traiteur = await getMyTraiteur();

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-4 flex items-center gap-2.5">
          <BackButton fallback="/accueil" />
          <h1 className="flex-1 font-display text-[18px] font-semibold">
            Espace fournisseur
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {!traiteur && (
          <>
            <p className="mb-4 text-[13px] leading-relaxed text-ink/60">
              Vous êtes traiteur, restaurateur ou fournisseur ? Créez votre profil pour proposer
              vos plats sur la marketplace lehaim. Une fois soumis, votre dossier est vérifié par
              notre équipe avant de devenir visible.
            </p>
            <TraiteurOnboardingForm />
          </>
        )}

        {traiteur && traiteur.status === "pending" && (
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Clock size={18} className="text-gold-deep" />
              <StatusPill tone="warning">En attente de validation</StatusPill>
            </div>
            <h2 className="mb-1.5 font-display text-[15px] font-semibold">{traiteur.name}</h2>
            <p className="text-[12.5px] leading-relaxed text-ink/60">
              Votre dossier a été soumis et est en cours de vérification par l&apos;équipe lehaim
              (patente, cacherout si renseignée). Vous recevrez une notification dès qu&apos;il
              sera validé — ou refusé avec le motif, pour pouvoir le corriger.
            </p>
          </Card>
        )}

        {traiteur && traiteur.status === "approved" && (
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Check size={18} className="text-olive-deep" />
              <StatusPill tone="success">Approuvé</StatusPill>
            </div>
            <h2 className="mb-1.5 font-display text-[15px] font-semibold">{traiteur.name}</h2>
            <p className="mb-4 text-[12.5px] leading-relaxed text-ink/60">
              Votre établissement est visible sur la marketplace. Les commandes reçues
              apparaîtront ici.
            </p>
            <div className="flex flex-col gap-2">
              <ButtonLink href="/devenir-traiteur/commandes" size="sm">
                Voir mes commandes
              </ButtonLink>
              <ButtonLink href={`/marketplace/${traiteur.id}`} variant="outlineTeal" size="sm">
                Voir ma fiche publique
              </ButtonLink>
            </div>
          </Card>
        )}

        {traiteur && traiteur.status === "rejected" && (
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <XCircle size={18} className="text-coral-deep" />
              <StatusPill tone="urgent">Refusé</StatusPill>
            </div>
            <h2 className="mb-1.5 font-display text-[15px] font-semibold">{traiteur.name}</h2>
            <p className="text-[12.5px] leading-relaxed text-ink/60">
              {traiteur.rejectionReason ??
                "Votre dossier n'a pas été validé. Contactez l'équipe lehaim pour en savoir plus."}
            </p>
          </Card>
        )}

        <p className="mt-4 text-center text-[11px] text-ink/40">
          Vous êtes déjà client ?{" "}
          <Link href="/marketplace" className="font-bold text-teal underline underline-offset-2">
            Voir la marketplace
          </Link>
        </p>
      </div>
    </main>
  );
}
