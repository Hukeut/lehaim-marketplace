import Link from "next/link";

/**
 * Bascule entre les deux rôles sur l'accueil.
 *
 * Quand on organise un Shabbat et qu'on est invité chez quelqu'un la même
 * semaine, les deux ne s'empilent pas : le sélecteur choisit lequel occupe
 * la carte principale. Sans Shabbat dans un des deux rôles, l'option devient
 * le point d'entrée pour en créer un ou en rejoindre un.
 */
export function RoleToggle({
  active,
  hasHosted,
  hasJoined,
  organiseLabel,
  joinLabel,
}: {
  active: "organise" | "rejoins";
  hasHosted: boolean;
  hasJoined: boolean;
  organiseLabel: string;
  joinLabel: string;
}) {
  const options = [
    {
      key: "organise" as const,
      label: organiseLabel,
      href: hasHosted ? "/accueil?vue=organise" : "/creer",
      // Un point signale l'autre rôle qui attend, sans imposer sa carte.
      dot: hasHosted && active !== "organise",
    },
    {
      key: "rejoins" as const,
      label: joinLabel,
      href: "/accueil?vue=rejoins",
      dot: hasJoined && active !== "rejoins",
    },
  ];

  return (
    <div className="mb-3.5 flex gap-1.5 rounded-full bg-white p-1.5 shadow-[var(--shadow-card)]">
      {options.map((option) => (
        <Link
          key={option.key}
          href={option.href}
          aria-current={active === option.key ? "true" : undefined}
          className={`relative flex-1 rounded-full py-3 text-center text-[14px] font-bold ${
            active === option.key
              ? "bg-ink text-white shadow-[var(--shadow-inset-pill)]"
              : "text-ink/55"
          }`}
        >
          {option.label}
          {option.dot && (
            <span className="absolute top-2 end-3 size-1.5 rounded-full bg-coral" />
          )}
        </Link>
      ))}
    </div>
  );
}
