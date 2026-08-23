import type { Database } from "./database.types";

/**
 * Raccourcis vers les types engendrés depuis le schéma réel.
 *
 * `Row` décrit ce qu'une requête rend, `Insert` ce qu'il faut fournir pour
 * créer une ligne, `Update` ce qu'on a le droit de modifier. Les trois sont
 * régénérés par `npm run types` : ils ne peuvent pas mentir sur les colonnes.
 *
 *   const patch: Update<"shabbats"> = { title, address };
 */
type Tables = Database["public"]["Tables"];

export type Row<T extends keyof Tables> = Tables[T]["Row"];
export type Insert<T extends keyof Tables> = Tables[T]["Insert"];
export type Update<T extends keyof Tables> = Tables[T]["Update"];
