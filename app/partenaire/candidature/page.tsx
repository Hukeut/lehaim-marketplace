import { redirect } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { ButtonLink, Card, StatusPill } from "@/components/ui";
import { currentUser } from "@/lib/supabase/user";
import { myTraiteur } from "@/lib/shops";
import { TraiteurOnboardingForm } from "@/components/marketplace/TraiteurOnboardingForm";

/**
 * L'espace traiteur — porté depuis lehaim-marketplace (devenir-traiteur),
 * en un seul écran plutôt que le tunnel à 8 étapes de /partenaire/dossier
 * (pensé pour shop_applications, que ce backend n'a pas).
 *
 * Trois états, un seul écran : pas encore de dossier → formulaire ; en
 * attente ou refusé → suivi ; approuvé → renvoi vers le back-office déjà
 * porté (/admin/boutique et consorts, voir les phases précédentes).
 */
export default async function Candidature() {
  if (!(await currentUser())) redirect("/connexion?suite=/partenaire/candidature");

  const traiteur = await myTraiteur();

  if (traiteur?.status === "approved") redirect("/admin/boutique");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-1 flex-col px-5 pt-[54px] pb-10 sm:min-h-0">
      <div className="mb-4 flex items-center gap-2.5">
        <BackButton fallback="/partenaire" />
        <h1 className="flex-1 font-display text-[19px] font-semibold">Espace traiteur</h1>
      </div>

      {!traiteur && (
        <>
          <p className="mb-4 text-[13px] leading-relaxed text-ink/60">
            Nom, coordonnées, et un premier produit : votre dossier part en vérification dès
            l&apos;envoi. Comptez deux jours ouvrés avant la mise en ligne.
          </p>
          <TraiteurOnboardingForm />
        </>
      )}

      {traiteur?.status === "pending" && (
        <Card className="p-5">
          <h2 className="mb-1 font-display text-[16px] font-semibold">{traiteur.name}</h2>
          <StatusPill tone="warning">En attente de validation</StatusPill>
          <p className="mt-3 text-[13px] leading-relaxed text-ink/60">
            Votre dossier a été envoyé le{" "}
            {new Date(traiteur.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}.
            L&apos;équipe lehaim le vérifie sous deux jours ouvrés.
          </p>
        </Card>
      )}

      {traiteur?.status === "rejected" && (
        <Card className="overflow-hidden p-0">
          <div className="bg-coral-deep p-5 text-white">
            <div className="font-display text-[17px] font-semibold">Dossier refusé</div>
            <div className="text-[12px] text-white/70">{traiteur.name}</div>
          </div>
          <div className="p-5">
            <p className="mb-4 text-[13px] leading-relaxed text-ink/60">
              {traiteur.rejectionReason ??
                "Votre dossier n'a pas été validé. Contactez l'équipe lehaim pour en savoir plus."}
            </p>
            <p className="text-[12.5px] text-ink/50">
              Pour le reprendre, contactez l&apos;équipe lehaim — la correction en ligne n&apos;est
              pas encore disponible.
            </p>
          </div>
        </Card>
      )}

      <p className="mt-6 text-center text-[11px] text-ink/40">
        Vous êtes déjà client ?{" "}
        <Link href="/marketplace" className="font-bold text-teal underline underline-offset-2">
          Voir la marketplace
        </Link>
      </p>

      {traiteur && (
        <ButtonLink href="/marketplace" variant="secondary" size="sm" full={false} className="mx-auto mt-3">
          Retour
        </ButtonLink>
      )}
    </main>
  );
}
