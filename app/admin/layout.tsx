import Link from "next/link";
import { redirect } from "next/navigation";
import { backOfficeRole } from "@/lib/admin";
import { pendingTraiteurCount } from "@/lib/shops";
import { currentUser } from "@/lib/supabase/user";

/**
 * Coquille du back-office admin — plateforme uniquement.
 *
 * Séparée du back-office traiteur (/traiteur/**) : les deux métiers
 * partageaient auparavant /admin/**, avec une nav qui se limitait aux
 * entrées du rôle connecté. Un commerçant pouvait quand même naviguer
 * manuellement vers les écrans admin (validation) puisque la garde
 * de page se contentait de vérifier qu'un rôle back-office existait, sans
 * exiger précisément "admin". Ici, la garde est stricte : seuls les comptes
 * de la liste blanche marketplace_admins entrent.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await currentUser())) redirect("/connexion?suite=/admin");

  const role = await backOfficeRole();
  if (role !== "admin") redirect(role === "merchant" ? "/traiteur" : "/accueil");

  const pending = await pendingTraiteurCount();

  const items = [
    { href: "/admin", label: "Vue d'ensemble" },
    { href: "/admin/validation", label: "Validation", badge: pending > 0 ? pending : undefined },
  ];

  return (
    <div data-fullwidth className="flex min-h-dvh flex-col bg-cream text-ink lg:flex-row">
      <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto bg-ink px-5 py-4 lg:w-[252px] lg:flex-col lg:px-5 lg:py-8">
        <div className="mb-0 hidden px-2.5 font-display text-[19px] font-semibold text-white lg:mb-7 lg:block">
          Lehaim<span className="text-teal">admin</span>
        </div>

        <div className="contents lg:block">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-[11px] px-3.5 py-3 text-[13px] font-bold whitespace-nowrap text-white/55 hover:bg-white/10 hover:text-white"
            >
              {item.label}
              {item.badge !== undefined && (
                <span className="ms-auto flex min-w-[22px] items-center justify-center rounded-full bg-coral px-1.5 py-0.5 text-[11px] font-extrabold text-white">
                  {item.badge}
                </span>
              )}
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
