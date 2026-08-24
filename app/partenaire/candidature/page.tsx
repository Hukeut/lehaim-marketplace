import { redirect } from "next/navigation";
import Link from "next/link";
import { ButtonLink, Card, StatusPill } from "@/components/ui";
import { LogoTile } from "@/components/Wordmark";
import { currentUser } from "@/lib/supabase/user";
import { myTraiteur, marketplaceClient, type MyTraiteur } from "@/lib/shops";
import { TraiteurOnboardingForm } from "@/components/marketplace/TraiteurOnboardingForm";

/**
 * L'espace traiteur — porté depuis lehaim-marketplace (devenir-traiteur),
 * en un seul écran plutôt que le tunnel à 8 étapes de /partenaire/dossier
 * (pensé pour shop_applications, que ce backend n'a pas).
 *
 * Un dossier minimal, en attente, existe TOUJOURS dès qu'on atteint cet
 * écran connecté — créé ici même s'il manque encore, plutôt que compté sur
 * app/connexion/page.tsx pour le faire. Cette page est le seul endroit qui
 * fait vraiment foi : /connexion ne voit pas toujours passer une inscription
 * (compte déjà existant → Supabase répond sans session, voir le correctif
 * dans /connexion pour ce cas), alors qu'ici la personne est forcément
 * connectée. Trois états, un seul écran : en attente ou refusé → suivi ;
 * approuvé mais fiche vide → formulaire pour l'enregistrer ; approuvé et
 * complet → renvoi vers le back-office (/traiteur/boutique et consorts).
 *
 * Même habillage bureau/tablette que /partenaire et le tunnel /connexion
 * (data-fullwidth) : c'est le même parcours fournisseur du début à la fin.
 */
export default async function Candidature() {
  const user = await currentUser();
  if (!user) redirect("/connexion?suite=/partenaire/candidature");

  let traiteur = await myTraiteur();

  if (!traiteur) {
    traiteur = await createPendingTraiteur(user.id, user.email ?? null);
  }

  if (traiteur.status === "approved" && traiteur.address) redirect("/traiteur/boutique");

  const needsSetup = traiteur.status === "approved" && !traiteur.address;

  return (
    <div data-fullwidth className="min-h-dvh bg-sand text-ink">
      <header className="flex items-center gap-4 border-b border-line bg-white px-6 py-4 lg:px-9">
        <span className="font-display text-[18px] font-semibold">
          Lehaim<span className="text-teal">partner</span>
        </span>
        <Link href="/partenaire" className="ms-auto text-[12.5px] font-bold text-ink/45">
          Retour au site
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[560px] flex-col px-6 py-12 lg:py-16">
        <LogoTile size={56} radius={18} />
        <h1 className="mt-5 mb-2 font-display text-[23px] font-semibold">Espace fournisseur</h1>

        {needsSetup && (
          <>
            <p className="mb-5 text-[13.5px] leading-relaxed text-ink/60">
              Votre compte est validé : nom, coordonnées, et un premier produit pour mettre votre
              fiche en ligne.
            </p>
            <div className="rounded-[20px] bg-white p-7 shadow-[var(--shadow-card)]">
              <TraiteurOnboardingForm mode="setup" />
            </div>
          </>
        )}

        {traiteur.status === "pending" && (
          <>
            <p className="mb-5 text-[13.5px] leading-relaxed text-ink/60">
              Votre compte est en cours de vérification par l&apos;équipe lehaim.
            </p>
            <Card className="p-6">
              <h2 className="mb-1 font-display text-[16px] font-semibold">{traiteur.name}</h2>
              <StatusPill tone="warning">En attente de validation</StatusPill>
              <p className="mt-3 text-[13px] leading-relaxed text-ink/60">
                Votre compte a été créé le{" "}
                {new Date(traiteur.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                })}
                . L&apos;équipe lehaim le vérifie sous deux jours ouvrés — vous recevrez alors le
                formulaire pour mettre votre fiche en ligne.
              </p>
            </Card>
          </>
        )}

        {traiteur.status === "rejected" && (
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

        {!needsSetup && (
          <ButtonLink
            href="/marketplace"
            variant="secondary"
            size="sm"
            full={false}
            className="mx-auto mt-3"
          >
            Retour
          </ButtonLink>
        )}
      </main>
    </div>
  );
}

/**
 * Ligne minimale, en attente, pour un compte qui atteint cet écran sans
 * dossier — création tout juste inscrit, ou compte "profil" préexistant qui
 * se connecte pour la première fois côté fournisseur (voir le commentaire de
 * la fonction plus haut).
 */
async function createPendingTraiteur(ownerId: string, email: string | null): Promise<MyTraiteur> {
  const supabase = await marketplaceClient();
  const { data, error } = await supabase
    .from("traiteurs")
    .insert({ owner_id: ownerId, name: email ?? "Nouveau traiteur", status: "pending" })
    .select("id, name, status, rejection_reason, created_at, address")
    .single();

  // Course entre deux requêtes simultanées (deux onglets, double clic) : la
  // policy d'unicité n'existe pas sur owner_id, mais si l'insertion échoue
  // pour une autre raison, la ligne créée par l'autre requête est relue.
  if (error || !data) {
    const { data: existing } = await supabase
      .from("traiteurs")
      .select("id, name, status, rejection_reason, created_at, address")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (existing) {
      const row = existing as unknown as Record<string, unknown>;
      return {
        id: row.id as string,
        name: row.name as string,
        status: row.status as MyTraiteur["status"],
        rejectionReason: (row.rejection_reason as string) ?? null,
        createdAt: row.created_at as string,
        address: (row.address as string) ?? null,
      };
    }
    // Dernier recours : un dossier en mémoire, non persisté, plutôt qu'un
    // écran cassé — la prochaine visite retentera l'insertion.
    return {
      id: ownerId,
      name: email ?? "Nouveau traiteur",
      status: "pending",
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      address: null,
    };
  }

  const row = data as unknown as Record<string, unknown>;
  return {
    id: row.id as string,
    name: row.name as string,
    status: row.status as MyTraiteur["status"],
    rejectionReason: (row.rejection_reason as string) ?? null,
    createdAt: row.created_at as string,
    address: (row.address as string) ?? null,
  };
}
