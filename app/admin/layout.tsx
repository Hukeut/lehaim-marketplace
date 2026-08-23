import Link from "next/link";
import { requireBackOffice } from "@/lib/admin";
import { pendingTraiteurCount } from "@/lib/shops";
import { myShop } from "@/lib/merchant";

/**
 * Coquille du back-office marchand.
 *
 * Portée depuis lehaim (app/admin/layout.tsx), réduite à la place de marché :
 * ce dépôt n'a pas de volet Shabbat/Finance/Marketing/Plateforme côté admin
 * (voir app/admin/finances, marketing, chabbats, statistiques, utilisateurs,
 * mises-a-jour côté lehaim — hors périmètre de cette fusion), donc la
 * navigation ne garde que les deux familles qui ont un écran ici.
 */
type Who = "admin" | "merchant";
type Item = { href: string; label: string; for: Who[]; badge?: "applications" };
type Family = { title: string; for: Who[]; items: Item[] };

const FAMILIES: Family[] = [
  {
    title: "Ma boutique",
    for: ["merchant"],
    items: [
      { href: "/admin/service", label: "Service du jour", for: ["merchant"] },
      { href: "/admin/commandes", label: "Historique", for: ["merchant"] },
      { href: "/admin/carte", label: "Ma carte", for: ["merchant"] },
      { href: "/admin/creneaux", label: "Créneaux", for: ["merchant"] },
      { href: "/admin/boutique", label: "Ma boutique", for: ["merchant"] },
      { href: "/admin/score", label: "Mon score", for: ["merchant"] },
      { href: "/admin/reversements", label: "Reversements", for: ["merchant"] },
    ],
  },
  {
    title: "Market",
    for: ["admin"],
    items: [
      { href: "/admin", label: "Vue d'ensemble", for: ["admin"] },
      { href: "/admin/validation", label: "Validation", for: ["admin"], badge: "applications" },
      { href: "/admin/pilotage", label: "Pilotage live", for: ["admin"] },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await requireBackOffice();
  const [pending, shop] = await Promise.all([
    role === "admin" ? pendingTraiteurCount() : 0,
    myShop(),
  ]);

  const wears: Who[] = shop ? [...new Set<Who>([role, "merchant"])] : [role];
  const shows = (who: Who[]) => who.some((w) => wears.includes(w));

  const families = FAMILIES.filter((family) => shows(family.for))
    .map((family) => ({ ...family, items: family.items.filter((item) => shows(item.for)) }))
    .filter((family) => family.items.length > 0);

  return (
    <div data-fullwidth className="flex min-h-dvh flex-col bg-cream text-ink lg:flex-row">
      <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto bg-ink px-5 py-4 lg:w-[252px] lg:flex-col lg:px-5 lg:py-8">
        <div className="mb-0 hidden px-2.5 font-display text-[19px] font-semibold text-white lg:mb-7 lg:block">
          Lehaim<span className="text-teal">admin</span>
        </div>

        {families.map((family, index) => (
          <div key={family.title} className="contents lg:block">
            <div
              className={`hidden px-3.5 pb-1.5 text-[10.5px] font-extrabold tracking-[0.08em] text-white/30 uppercase lg:block ${
                index > 0 ? "pt-5" : ""
              }`}
            >
              {family.title}
            </div>
            {family.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-[11px] px-3.5 py-3 text-[13px] font-bold whitespace-nowrap text-white/55 hover:bg-white/10 hover:text-white"
              >
                {item.label}
                {item.badge === "applications" && pending > 0 && (
                  <span className="ms-auto flex min-w-[22px] items-center justify-center rounded-full bg-coral px-1.5 py-0.5 text-[11px] font-extrabold text-white">
                    {pending}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}

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
