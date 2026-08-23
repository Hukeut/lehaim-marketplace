import Link from "next/link";
import { redirect } from "next/navigation";
import { WizardProgress, WizardRail } from "@/components/WizardRail";
import { currentUser } from "@/lib/supabase/user";
import { getMyDossier, type StepSlug } from "@/lib/partner";

/**
 * Coquille du tunnel marchand : barre, progression, rail des huit étapes.
 *
 * Le rail reste visible en permanence, et c'est délibéré. Un dossier
 * administratif se remplit avec de l'appréhension ; voir en continu ce qui est
 * fait, ce qui reste et où l'on en est enlève l'essentiel de cette
 * appréhension. Les étapes déjà franchies sont cliquables — on revient
 * corriger une adresse sans tout recommencer.
 *
 * Le rail et la jauge vivent à part, côté client : ils ont besoin du chemin
 * pour savoir quelle étape est regardée.
 */
export default async function DossierLayout({ children }: { children: React.ReactNode }) {
  // `/partenaire` est public pour que l'accroche se lise sans compte ; le
  // proxy ouvre donc aussi ce qui est en dessous. Le tunnel se garde ici,
  // plutôt que de laisser afficher un formulaire qui ne s'enregistrera pas.
  if (!(await currentUser())) redirect("/connexion?suite=/partenaire/dossier");

  const dossier = await getMyDossier();
  const reached = dossier?.application.step ?? 2;

  return (
    <div data-fullwidth className="flex min-h-dvh flex-col bg-sand text-ink">
      <header className="flex items-center gap-4 border-b border-line bg-white px-6 py-4 lg:px-9">
        <span className="font-display text-[18px] font-semibold">
          Lehaim<span className="text-teal">partner</span>
        </span>
        {dossier && (
          <span className="hidden text-[12.5px] font-bold text-ink/55 sm:inline">
            {dossier.shop.name} · dossier {dossier.application.reference}
          </span>
        )}
        <Link href="/accueil" className="ms-auto text-[12.5px] font-bold text-ink/45">
          Reprendre plus tard
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-6 px-6 py-7 lg:flex-row lg:px-9">
        <WizardRail reached={reached} />

        <main className="min-w-0 flex-1">
          <WizardProgress reached={reached} />
          {children}
        </main>
      </div>
    </div>
  );
}

export type { StepSlug };
