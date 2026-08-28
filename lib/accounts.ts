import "server-only";

/**
 * Le sélecteur multi-comptes.
 *
 * Un navigateur ne garde nativement qu'une session à la fois (le cookie
 * Supabase standard) : ouvrir un autre compte dans un nouvel onglet écrase
 * la session de tous les autres onglets. Pour permettre de basculer entre
 * plusieurs comptes sans se reconnecter à chaque fois, on garde une liste à
 * part — un cookie séparé, `lehaim-accounts` — avec les jetons de chaque
 * compte déjà vu sur ce navigateur.
 *
 * Cette liste est alimentée automatiquement par le middleware (proxy.ts) :
 * dès qu'une session est active, son compte y est ajouté ou mis à jour. Pour
 * en ajouter un autre, il suffit de se déconnecter (ce qui ne vide QUE la
 * session active, pas cette liste) puis de se reconnecter avec un autre
 * compte — voir components/AccountSwitcherLink.tsx.
 *
 * Sécurité : ce cookie est httpOnly + secure + sameSite=lax, mais il
 * contient des jetons valides pour chaque compte enregistré — sa
 * compromission équivaut à celle de tous les comptes qu'il liste. D'où la
 * limite MAX_ACCOUNTS, qui borne aussi la taille du cookie (limite
 * navigateur ~4 Ko par cookie).
 */

export const ACCOUNTS_COOKIE = "lehaim-accounts";
export const MAX_ACCOUNTS = 5;

export type SavedAccount = {
  userId: string;
  email: string;
  firstName: string | null;
  accessToken: string;
  refreshToken: string;
  updatedAt: string;
};

export function parseAccounts(raw: string | undefined | null): SavedAccount[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is SavedAccount =>
        a && typeof a.userId === "string" && typeof a.accessToken === "string" && typeof a.refreshToken === "string",
    );
  } catch {
    return [];
  }
}

export function serializeAccounts(accounts: SavedAccount[]): string {
  return JSON.stringify(accounts.slice(0, MAX_ACCOUNTS));
}

export const ACCOUNTS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 jours
};
