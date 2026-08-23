import Link from "next/link";
import { LehaimIcon } from "./LehaimIcon";

/**
 * La seconde porte d'entrée du produit.
 *
 * On entre dans un Shabbat par un lien WhatsApp, ou par un code qu'on se
 * dicte. La saisie du code vivait dans un panneau de l'accueil qu'un sélecteur
 * de rôle faisait apparaître ; le sélecteur retiré, le panneau est devenu
 * inatteignable et cette porte s'est refermée sans bruit.
 *
 * Elle est désormais un simple lien vers `/rejoindre`, écran qui existait déjà
 * mais que rien ne liait. Discret plutôt que proéminent : la plupart des gens
 * arrivent par le lien, le code est le recours quand on ne peut pas cliquer.
 */
export function JoinByCode({ label, className = "" }: { label: string; className?: string }) {
  return (
    <Link
      href="/rejoindre"
      className={`flex items-center justify-center gap-2 rounded-card border-[1.5px] border-line bg-white px-4 py-3 text-[14px] font-bold text-ink shadow-[var(--shadow-card)] ${className}`}
    >
      <LehaimIcon name="join-code" size={22} />
      {label}
    </Link>
  );
}
