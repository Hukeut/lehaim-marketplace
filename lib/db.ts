import "server-only";
import { getTranslations } from "next-intl/server";
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
export async function userMessage(where: string, error: PostgrestError): Promise<string> {
  console.error(`[lehaim] ${where} — ${error.code ?? "sans code"} ${error.message}`, {
    details: error.details,
    hint: error.hint,
  });

  const t = await getTranslations("errors.db");
  return t(messageKeyFor(error.code ?? null));
}

export type DbMessageKey = "full" | "denied" | "duplicate" | "generic";

/**
 * Valide la clé lue dans l'URL avant de la passer au traducteur, qui lèverait
 * sur une clé inconnue. Un paramètre d'adresse se bricole à la main.
 */
export function asMessageKey(value: unknown): DbMessageKey | null {
  return value === "full" || value === "denied" || value === "duplicate" || value === "generic"
    ? value
    : null;
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
