"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Chat, Home, Plus, ProfileSquare } from "./icons";

const tabs = [
  { href: "/accueil", label: "Accueil", Icon: Home },
  { href: "/shabbats", label: "Shabbats", Icon: Calendar },
  { href: "/messages", label: "Messages", Icon: Chat, badge: true },
  { href: "/profil", label: "Profil", Icon: ProfileSquare },
] as const;

export default function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="flex items-end justify-around rounded-t-[2rem] border-t border-ink/5 bg-white/90 px-2 pt-2.5 pb-[22px] shadow-[var(--shadow-dock)] backdrop-blur-xl"
    >
      {tabs.slice(0, 2).map((tab) => (
        <Tab key={tab.href} {...tab} active={pathname.startsWith(tab.href)} />
      ))}

      <Link
        href="/creer"
        aria-label="Créer un Shabbat"
        className="-mt-5 flex size-11 items-center justify-center rounded-full bg-teal text-white shadow-[0_8px_16px_rgba(42,167,161,0.4)] transition-transform active:scale-95"
      >
        <Plus size={19} />
      </Link>

      {tabs.slice(2).map((tab) => (
        <Tab key={tab.href} {...tab} active={pathname.startsWith(tab.href)} />
      ))}
    </nav>
  );
}

function Tab({
  href,
  label,
  Icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  Icon: (props: { size?: number }) => React.ReactElement;
  active: boolean;
  badge?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex flex-col items-center gap-1 rounded-2xl px-3 py-1.5 transition-colors ${
        active ? "bg-line-soft text-teal" : "text-ink/35"
      }`}
    >
      <span className="relative">
        <Icon size={20} />
        {badge && (
          <span className="absolute -top-0.5 -right-0.5 size-[7px] rounded-full border-[1.5px] border-white bg-coral" />
        )}
      </span>
      <span className="text-[9.5px] font-bold">{label}</span>
    </Link>
  );
}
