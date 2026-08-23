/** Helpers de présentation, sans dépendance serveur : utilisables des deux côtés. */

const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
}

/** « Dans 3 jours », « Aujourd'hui », « Il y a 2 jours ». */
export function countdown(iso: string) {
  const days = Math.round(
    (new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000,
  );
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  if (days > 1) return `Dans ${days} jours`;
  if (days === -1) return "Hier";
  return `Il y a ${Math.abs(days)} jours`;
}

/** Le document produit préfère des états lisibles à un score sur 100. */
export function readinessLabel(value: number) {
  if (value >= 95) return "Shabbat ready";
  if (value >= 66) return "Presque prêt";
  if (value >= 33) return "Ça prend forme";
  return "On démarre";
}
