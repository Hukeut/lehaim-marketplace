import type { ShabbatDetail } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";
import type { Ops } from "@/lib/missions";

/**
 * Lien wa.me vers un numéro précis (contrairement au partage générique
 * `wa.me/?text=`). On ne garde que les chiffres : si le traiteur a saisi
 * son numéro avec l'indicatif (ex. "+972 50 123 4567"), ça fonctionne ;
 * un numéro purement local sans indicatif peut ne pas router correctement,
 * ça reste hors de notre contrôle.
 */
export function waLink(phone: string, text?: string) {
  const digits = phone.replace(/[^\d]/g, "");
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}

export type MessageKind =
  | "invitation"
  | "rsvp"
  | "missions"
  | "recap"
  | "countdown"
  | "expenses"
  | "ready";

export const MESSAGE_TABS: { key: MessageKind; label: string }[] = [
  { key: "invitation", label: "🕯️ Invitation" },
  { key: "rsvp", label: "Relance RSVP" },
  { key: "missions", label: "Mission manquante" },
  { key: "recap", label: "Récap final" },
  { key: "countdown", label: "Compte à rebours" },
  { key: "expenses", label: "Dépenses" },
  { key: "ready", label: "🔒 Shabbat Ready" },
];

/**
 * Bibliothèque de messages WhatsApp. Le document produit impose une règle :
 * chaque message conduit à une action, jamais à une simple répétition.
 */
export function buildMessage(
  kind: MessageKind,
  shabbat: ShabbatDetail,
  ops: Ops,
): { body: string; audience: string } {
  const date = formatDate(shabbat.startsAt);
  const time = formatTime(shabbat.startsAt);
  const pending = shabbat.invitations.filter((i) => i.status === "pending");
  // « Sans volontaire » = personne dessus. Une mission partiellement pourvue
  // n'a pas besoin de relance, seulement de renfort.
  const openMissions = ops.missions.filter((m) => m.claimers.length === 0);
  const freeSlots = ops.counts.slotsTotal - ops.counts.slotsTaken;
  const missionNames = openMissions.map((m) => `${m.emoji} ${m.title}`).join(", ");

  switch (kind) {
    case "invitation":
      return {
        body: `Coucou ! 🕯️ On organise un Chabbat ${date} chez nous, dès ${time}. Ça nous ferait très plaisir de vous avoir à table — vous êtes libres ?`,
        audience: `Sera envoyé à ${shabbat.invitations.length} invité${shabbat.invitations.length > 1 ? "s" : ""}`,
      };
    case "rsvp":
      return {
        body: `Petit rappel pour le Chabbat du ${date} : il manque encore ${pending.length} réponse${pending.length > 1 ? "s" : ""}. Dis-nous si tu viens, ça nous aide à prévoir.`,
        audience: `${pending.length} personne${pending.length > 1 ? "s" : ""} n'a pas répondu`,
      };
    case "missions":
      return {
        body: openMissions.length
          ? `Il manque encore ${openMissions.length} mission${openMissions.length > 1 ? "s" : ""} pour vendredi : ${missionNames}. Choisis-en une ici :`
          : `Toutes les missions sont prises pour ${date}. Merci à tous 🙏`,
        audience: `${openMissions.length} sans volontaire · ${freeSlots} place${freeSlots > 1 ? "s" : ""} libre${freeSlots > 1 ? "s" : ""}`,
      };
    case "recap":
      return {
        body: `Récap du Chabbat de ${date} · ${time}\n📍 ${shabbat.address ?? shabbat.neighbourhood ?? "chez nous"}\n👥 ${shabbat.counts.confirmed} confirmés\n✅ ${ops.counts.slotsTaken}/${ops.counts.slotsTotal} places pourvues\nTout le détail ici :`,
        audience: "Sera envoyé au groupe",
      };
    case "countdown":
      return {
        body: ops.readyBy
          ? `On doit être prêts pour ${formatDate(ops.readyBy)} à ${formatTime(ops.readyBy)}. Il reste ${openMissions.length} mission${openMissions.length > 1 ? "s" : ""} à couvrir — un dernier coup de main ?`
          : `Le Chabbat approche : ${date}. Il reste ${openMissions.length} mission${openMissions.length > 1 ? "s" : ""} à couvrir.`,
        audience: "Sera envoyé au groupe",
      };
    case "expenses":
      return {
        body: `Petit point dépenses pour le Chabbat du ${date} : ${shabbat.counts.spent.toFixed(0)} € engagés. Le détail et ce que chacun doit, c'est ici :`,
        audience: "Sera envoyé au groupe",
      };
    case "ready":
      return {
        body: `Tout est prêt pour ${date} 🕯️\n${ops.counts.slotsTaken} missions accomplies, ${shabbat.counts.confirmed} convives confirmés. Rendez-vous à ${time}${shabbat.address ? `, ${shabbat.address}` : ""}. Chabbat Shalom !`,
        audience: "Sera envoyé au groupe",
      };
  }
}
