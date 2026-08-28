import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ACCOUNTS_COOKIE,
  ACCOUNTS_COOKIE_OPTIONS,
  parseAccounts,
  serializeAccounts,
  type SavedAccount,
} from "@/lib/accounts";

/**
 * Écrans accessibles sans être connecté.
 *
 * `/marketplace` et `/partenaire` s'y ajoutent avec la fusion marketplace :
 * la vitrine (fiches traiteur, carte) se regarde sans compte — c'est ce que
 * la RLS autorise déjà pour un traiteur approuvé — et la candidature
 * commerçant doit être lisible avant de se connecter. Le panier et les
 * commandes, eux, restent derrière la connexion.
 */
const PUBLIC_PATHS = [
  "/",
  "/onboarding",
  "/connexion",
  "/auth",
  "/legacy",
  "/ecrans",
  "/marketplace",
  "/partenaire",
];

/**
 * Tant que cet interrupteur est éteint, l'app reste entièrement navigable sans
 * compte : c'est ce qui permet de faire relire les maquettes. La session est
 * quand même rafraîchie, donc se connecter fonctionne déjà.
 * On l'allume avec `vercel env add LEHAIM_REQUIRE_AUTH` = `1`.
 */
const REQUIRE_AUTH = process.env.LEHAIM_REQUIRE_AUTH === "1";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Rafraîchit le jeton expiré ; ne rien mettre entre createServerClient et cet appel.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sélecteur multi-comptes (voir lib/accounts.ts) : dès qu'une session est
  // active, on la mémorise dans une liste à part pour pouvoir y rebasculer
  // plus tard sans se reconnecter — y compris après une rotation du jeton
  // de rafraîchissement, d'où la resynchronisation à chaque requête.
  if (user) {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (session) {
      const existing = parseAccounts(request.cookies.get(ACCOUNTS_COOKIE)?.value);
      const idx = existing.findIndex((a) => a.userId === user.id);
      let firstName = idx >= 0 ? existing[idx].firstName : null;

      if (!firstName) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", user.id)
          .maybeSingle();
        firstName = (profile as { first_name: string | null } | null)?.first_name ?? null;
      }

      const entry: SavedAccount = {
        userId: user.id,
        email: user.email ?? "",
        firstName,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        updatedAt: new Date().toISOString(),
      };

      const next =
        idx >= 0
          ? existing.map((a, i) => (i === idx ? entry : a))
          : [entry, ...existing];
      response.cookies.set(ACCOUNTS_COOKIE, serializeAccounts(next), ACCOUNTS_COOKIE_OPTIONS);
    }
  }

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (REQUIRE_AUTH && !user && !isPublic) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/connexion";
    redirect.searchParams.set("suite", pathname);
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|illustrations|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
