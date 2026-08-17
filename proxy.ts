import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Écrans accessibles sans être connecté. */
const PUBLIC_PATHS = ["/", "/onboarding", "/connexion", "/auth", "/legacy", "/ecrans"];

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
