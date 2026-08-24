import { ButtonLink, Screen, ScreenBody, TopBar } from "@/components/ui";

/**
 * O01bis · Organisateur — choix compte.
 *
 * Étape intercalée entre la page d'accueil et le tunnel d'inscription : on
 * y sépare inscription et connexion plutôt que de partir directement en mode
 * inscription, symétrique au choix déjà fait côté /partenaire pour le
 * fournisseur.
 */
export default function OrganisateurEntree() {
  return (
    <Screen>
      <TopBar title="Organisateur" back="/onboarding" />
      <ScreenBody top={false} className="flex flex-1 flex-col justify-center gap-6 text-center">
        <div className="flex flex-col items-center gap-2.5">
          <div className="font-display text-[30px] leading-none font-semibold">lehaim</div>
          <p className="mx-auto max-w-[260px] text-[13.5px] leading-relaxed text-ink/60">
            Vous invitez et organisez le Chabbat : convives, menu et budget au même endroit.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <ButtonLink
            href="/connexion?mode=signup&suite=/onboarding/prenom"
            size="lg"
            className="shadow-[var(--shadow-coral-lg)]"
          >
            S&apos;inscrire
          </ButtonLink>
          <ButtonLink href="/connexion?suite=/accueil" variant="secondary" size="lg">
            Se connecter
          </ButtonLink>
        </div>
      </ScreenBody>
    </Screen>
  );
}
