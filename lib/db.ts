import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Lecture systématique des erreurs Supabase.
 *
 * Le problème que ce module résout : `app/mission-actions.ts` compte 62 appels
 * `await supabase` pour 14 mentions du mot `error`. La plupart des actions
 * écrivaient, puis appelaient `revalidatePath` et `redirect` comme si tout
 * s'était bien passé. Un refus de la politique RLS produisait donc exactement
 * la même expérience qu'un succès : la page se rafraîchit, sans le changement,
 * sans un mot.
 *
 * Deux bugs de cette session en sont la démonstration directe — la colonne
 * `profiles.locale` absente, et la moitié de la migration 0010 jamais
 * appliquée. Les deux écrivaient dans le vide depuis des mois.
 *
 * `run()` ne rend pas l'erreur silencieuse moins probable : il la rend
 * impossible à ignorer. La journalisation part sur la sortie d'erreur, que
 * Vercel range dans ses Runtime Logs — aucun compte à créer, et un point de
 * branchement tout trouvé le jour où on ajoute un vrai collecteur.
 */
export type DbResult<T> = {
  data: T | null;
  /** Vrai si l'écriture ou la lecture a échoué. */
  failed: boolean;
  /** Code SQLSTATE, quand Postgres en fournit un. */
  code: string | null;
};

// `data: T` et non `T | null` : la réponse de Supabase est une union
// (`{data, error: null} | {data: null, error}`), et déclarer le nullable ici
// empêchait l'inférence de s'y accrocher — `T` retombait sur `never` et toute
// lecture enveloppée perdait son type.
type Awaitable<T> = PromiseLike<{ data: T; error: PostgrestError | null }>;

/**
 * @param where  Ce qu'on était en train de faire, en clair. C'est la seule
 *               chose qui rendra le journal lisible dans six mois : préférer
 *               « claimMission/insert » à « update ».
 */
export async function run<T>(where: string, query: Awaitable<T>): Promise<DbResult<T>> {
  const { data, error } = await query;

  if (error) {
    console.error(
      `[lehaim] ${where} — ${error.code ?? "sans code"} ${error.message}`,
      // Le détail va sur une seconde ligne : le message reste greppable.
      { details: error.details, hint: error.hint },
    );
    return { data: null, failed: true, code: error.code ?? null };
  }

  return { data, failed: false, code: null };
}

/**
 * Traduit un code SQLSTATE en clé de message.
 *
 * On ne renvoie jamais `error.message` à l'utilisateur : c'est du texte
 * Postgres, en anglais, qui parle de contraintes et de politiques. Les trois
 * codes retenus sont ceux que l'application peut réellement provoquer.
 */
/**
 * Journalise l'erreur et rend la phrase à montrer à la personne.
 *
 * Les actions de formulaire renvoyaient jusqu'ici `error.message` tel quel :
 * du texte Postgres, en anglais, qui parle de contraintes et de politiques —
 * dans une application traduite en cinq langues. La trace technique reste
 * entière côté serveur ; l'utilisateur reçoit une phrase qui lui parle.
 */
export type DbMessageKey = "full" | "denied" | "duplicate" | "generic";

// lehaim-marketplace n'a pas de couche i18n (next-intl) : contrairement à
// lehaim, ce dépôt est français uniquement — le message est donc figé ici
// plutôt que passé par un traducteur qui n'existe pas dans ce projet.
const DB_MESSAGES: Record<DbMessageKey, string> = {
  full: "C'est déjà complet — quelqu'un vient de prendre la dernière place.",
  denied: "Vous n'avez pas les droits pour faire ça.",
  duplicate: "C'était déjà enregistré.",
  generic: "L'enregistrement n'a pas abouti. Réessayez dans un instant.",
};

export async function userMessage(where: string, error: PostgrestError): Promise<string> {
  console.error(`[lehaim] ${where} — ${error.code ?? "sans code"} ${error.message}`, {
    details: error.details,
    hint: error.hint,
  });

  return DB_MESSAGES[messageKeyFor(error.code ?? null)];
}

/**
 * Valide la clé lue dans l'URL avant de la passer au traducteur, qui lèverait
 * sur une clé inconnue. Un paramètre d'adresse se bricole à la main.
 */
export function asMessageKey(value: unknown): DbMessageKey | null {
  return value === "full" || value === "denied" || value === "duplicate" || value === "generic"
    ? value
    : null;
}

/**
 * Choisit LA ligne `traiteurs` d'un compte, de façon déterministe, quand il
 * peut en exister plusieurs (une candidature relancée après une première
 * abandonnée, par exemple).
 *
 * Bug corrigé : `myShop()` (lib/merchant.ts) et `myTraiteur()` (lib/shops.ts)
 * lisaient chacune `.order("created_at", { ascending: true }).limit(1)` —
 * suffisant tant qu'une seule ligne existe, mais Postgres ne garantit aucun
 * ordre stable entre deux lignes dont `created_at` est identique (deux
 * requêtes séparées pouvaient alors renvoyer une ligne différente). Deux
 * pages qui redirigent l'une vers l'autre selon le statut du traiteur — la
 * candidature vers /traiteur si approuvé, /traiteur vers la candidature si
 * aucun traiteur trouvé — tombaient alors en boucle de redirection : l'une
 * voyait la ligne "approved", l'autre la ligne "pending" du même compte.
 *
 * La priorité va à la ligne approuvée si une existe (c'est celle qui compte
 * pour l'accès au back-office), puis à la plus ancienne, `id` en dernier
 * recours pour départager un ex æquo — un ordre total, donc toujours le même
 * résultat pour les deux appelantes.
 */
export function pickPrimaryTraiteurRow<
  T extends { status: string; created_at: string; id: string },
>(rows: T[]): T | null {
  if (rows.length === 0) return null;
  return [...rows].sort((a, b) => {
    if (a.status === "approved" && b.status !== "approved") return -1;
    if (b.status === "approved" && a.status !== "approved") return 1;
    const byDate = a.created_at.localeCompare(b.created_at);
    if (byDate !== 0) return byDate;
    return a.id.localeCompare(b.id);
  })[0];
}

export function messageKeyFor(code: string | null): DbMessageKey {
  switch (code) {
    // check_violation : capacité d'un apport ou d'une chambre dépassée (0020).
    case "23514":
      return "full";
    // insufficient_privilege : refus d'une politique RLS ou d'une garde (0014).
    case "42501":
      return "denied";
    case "23505":
      return "duplicate";
    default:
      return "generic";
  }
}
