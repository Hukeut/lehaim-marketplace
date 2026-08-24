import Link from "next/link";

/**
 * L'accroche marchand — la seule page du domaine partenaire visible sans
 * compte. Elle répond aux trois questions qu'un commerçant pose avant de
 * remplir quoi que ce soit : combien ça coûte, combien de temps ça prend, et
 * ce qu'il faut avoir sous la main.
 */

const STEPS = [
  {
    title: "Vous décrivez votre commerce",
    body: "Nom, adresse, catégorie. Cinq minutes, et votre fiche publique est déjà écrite.",
  },
  {
    title: "Vous déposez vos pièces",
    body: "Identité, justificatif d'entreprise et certificat de cacherout. Ils ne sortent jamais de notre équipe de validation.",
  },
  {
    title: "Nous validons sous deux jours",
    body: "Votre fiche passe en ligne et vous recevez vos premières commandes.",
  },
];

const NEEDED = [
  "Le nom et l'adresse de votre commerce",
  "Votre numéro de patente ou licence commerciale",
  "Le nom de votre certificat de cacherout, si vous en avez un",
  "Un premier produit à mettre en vente",
];

export default function Partenaire() {
  return (
    <div data-fullwidth className="min-h-dvh bg-sand text-ink">
      <header className="flex items-center gap-4 border-b border-line bg-white px-6 py-4 lg:px-9">
        <span className="font-display text-[18px] font-semibold">
          Lehaim<span className="text-teal">partner</span>
        </span>
        <Link href="/" className="ms-auto text-[12.5px] font-bold text-ink/45">
          Retour au site
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[1000px] flex-col gap-9 px-6 py-12 lg:px-9 lg:py-16">
        <section className="flex flex-col gap-4">
          <h1 className="max-w-[18ch] font-display text-[34px] leading-[1.12] font-semibold lg:text-[44px]">
            Vendez votre cuisine cacher à ceux qui la cherchent.
          </h1>
          <p className="max-w-[58ch] text-[15.5px] leading-relaxed text-ink/65">
            Lehaim rassemble traiteurs, boucheries, boulangeries et caves cacher au même endroit.
            Pas d&apos;abonnement, pas de frais d&apos;entrée : une commission sur ce que vous
            vendez, et rien du tout si vous ne vendez rien.
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Link
              href="/connexion?suite=/partenaire/candidature&mode=signup"
              className="rounded-full bg-coral-deep px-7 py-3.5 font-display text-[15px] font-semibold text-white"
            >
              S&apos;inscrire
            </Link>
            <Link
              href="/connexion?suite=/partenaire/candidature"
              className="rounded-full border-[1.5px] border-line bg-white px-7 py-3.5 font-display text-[15px] font-semibold text-ink"
            >
              Se connecter
            </Link>
          </div>
          <span className="text-[13px] text-ink/50">
            Environ vingt minutes, reprise possible à tout moment.
          </span>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="flex flex-col gap-2 rounded-[18px] bg-white p-5 shadow-[var(--shadow-card)]"
            >
              <span className="flex size-[26px] items-center justify-center rounded-full bg-teal text-[12px] font-extrabold text-white">
                {index + 1}
              </span>
              <span className="font-display text-[15.5px] font-semibold">{step.title}</span>
              <p className="text-[13px] leading-relaxed text-ink/60">{step.body}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3.5 rounded-[20px] bg-white p-7 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-[19px] font-semibold">À avoir sous la main</h2>
          <ul className="flex flex-col gap-2.5">
            {NEEDED.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[14px]">
                <span
                  className="mt-0.5 flex size-[20px] shrink-0 items-center justify-center rounded-[6px] bg-olive text-[12px] font-bold text-white"
                  aria-hidden="true"
                >
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-1 border-t border-line-soft pt-3.5 text-[13px] leading-relaxed text-ink/55">
            Il vous manque une pièce ? Commencez quand même : le dossier s&apos;enregistre à
            chaque étape et vous le reprendrez là où vous l&apos;aurez laissé.
          </p>
        </section>
      </main>
    </div>
  );
}
