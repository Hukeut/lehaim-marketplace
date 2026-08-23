import { LehaimIcon } from "./LehaimIcon";

/**
 * « Où est-ce ? »
 *
 * Une adresse écrite ne répond pas à la question : il faut la recopier dans
 * une autre application. Ces deux boutons y mènent directement.
 *
 * Waze et Google Maps plutôt qu'un plan intégré : le jour du Shabbat, on
 * cherche un itinéraire, pas une carte à regarder. Et l'application de
 * navigation est déjà celle que la personne connaît.
 *
 * Les couleurs sont celles des deux marques, pas celles de la charte : un
 * bouton Waze qui ne serait pas bleu ciel ne se reconnaîtrait pas.
 */
export function MapLinks({ address, className = "" }: { address: string; className?: string }) {
  const query = encodeURIComponent(address);

  return (
    <div className={`flex gap-2 ${className}`}>
      <MapLink
        href={`https://waze.com/ul?q=${query}&navigate=yes`}
        icon="waze"
        label="Waze"
        className="bg-[#33CCFF] text-ink"
      />
      <MapLink
        href={`https://www.google.com/maps/search/?api=1&query=${query}`}
        icon="maps"
        label="Maps"
        className="bg-[#4285F4] text-white"
      />
    </div>
  );
}

function MapLink({
  href,
  icon,
  label,
  className,
}: {
  href: string;
  icon: "waze" | "maps";
  label: string;
  className: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1.5 ${className}`}
    >
      <LehaimIcon name={icon} size={18} />
      <span className="text-[12.5px] font-bold">{label}</span>
    </a>
  );
}
