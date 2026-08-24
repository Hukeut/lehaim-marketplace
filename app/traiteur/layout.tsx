import Link from "next/link";
import { redirect } from "next/navigation";
import { myShop } from "@/lib/merchant";
import { currentUser } from "@/lib/supabase/user";

/**
 * Coquille du back-office traiteur — séparée de /admin (plateforme).
 *
 * Les deux métiers partageaient jusqu'ici /admin/**, avec une nav qui
 * n'affichait que les entrées propres au rôle connecté : un commerçant
 * pouvait naviguer manuellement vers les écrans admin (validation),
 * et le mélange des deux publics sous une même coquille prêtait à confusion.
 * Ici, la garde ne regarde que la boutique : posséder un traiteur, quel que
 * soit son statut de validation — pas d'accès plateforme mêlé dedans.
 */
export default async function TraiteurLayout({ children }: { children: React.ReactNode }) {
  if (!(await currentUser())) redirect("/connexion?suite=/traiteur");

  const shop = await myShop();
  if (!shop) redirect("/partenaire/candidature");

  const items = [
    { href: "/traiteur/service", label: "Service du jour" },
    { href: "/traiteur/commandes", label: "Historique" },
    { href: "/traiteur/carte", label: "Ma carte" },
    { href: "/traiteur/creneaux", label: "Créneaux" },
    { href: "/traiteur/boutique", label: "Ma boutique" },
    { href: "/traiteur/score", label: "Mon score" },
    { href: "/traiteur/reversements", label: "Reversements" },
  ];

  return (
    <div data-fullwidth className="flex min-h-dvh flex-col bg-cream text-ink lg:flex-row">
      <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto bg-ink px-5 py-4 lg:w-[252px] lg:flex-col lg:px-5 lg:py-8">
        <div className="mb-0 hidden px-2.5 font-display text-[19px] font-semibold text-white lg:mb-7 lg:block">
          Lehaim<span className="text-teal">traiteur</span>
        </div>

        <div className="contents lg:block">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-[11px] px-3.5 py-3 text-[13px] font-bold whitespace-nowrap text-white/55 hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <Link
          href="/accueil"
          className="mt-auto hidden rounded-[11px] px-3.5 py-3 text-[13px] font-bold text-white/35 hover:text-white lg:block"
        >
          Retour à l&apos;app
        </Link>
      </nav>

      <main className="min-w-0 flex-1 overflow-x-hidden px-5 py-7 lg:px-13 lg:py-11">
        {children}
      </main>
    </div>
  );
}
