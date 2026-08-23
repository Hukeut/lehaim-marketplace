import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  localeFromAcceptLanguage,
  type Locale,
} from "@/lib/i18n/locale";

/**
 * Écrans accessibles sans être connecté : la page d'accueil, l'entrée en
 * matière, et les liens qu'on reçoit par WhatsApp — un invité doit pouvoir
 * voir ce à quoi on le convie avant de créer un compte.
 *
 * S'y ajoutent deux ressources que le navigateur réclame de lui-même. Elles
 * sont produites par `app/manifest.ts` et `app/apple-icon.tsx`, donc servies
 * par des routes — le `matcher` plus bas n'écarte que les fichiers statiques,
 * elles passaient par ici et repartaient en 307 vers `/`.
 *
 * Conséquence : un visiteur non connecté n'obtenait jamais le manifeste. Or
 * la page d'accueil est le seul écran qu'il voit, donc PERSONNE ne pouvait
 * installer la PWA, que l'app propose pourtant explicitement. Et Safari,
 * privé de `/apple-icon`, se rabattait sur `/apple-touch-icon.png` — d'où un
 * 404 en console sur la production.
 */
const PUBLIC_PATHS = [
  "/",
  "/onboarding",
  "/partenaire",
  // La vitrine se regarde sans compte : c'est ce que la RLS autorise déjà
  // pour une boutique en ligne. Le panier et les commandes, eux, restent
  // derrière la connexion — c'est au moment de commander qu'on se connecte.
  "/marketplace",
  "/connexion",
  "/auth",
  "/s",
  "/co",
  "/manifest.webmanifest",
  "/apple-icon",
];



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

  // `getUser()` valide le jeton auprès de Supabase : c'est un aller-retour
  // réseau (~300 ms d'ici) payé sur CHAQUE navigation, préchargements compris.
  // On le réserve à ce pour quoi il est là, rafraîchir un jeton qui approche
  // de l'expiration ; le reste du temps la date d'expiration se lit dans le
  // jeton lui-même, sans réseau.
  //
  // Et seulement si une session existe : sans cookie d'authentification,
  // l'appel ne peut rendre que null. Il était payé par chaque première visite,
  // dont celles qui arrivent d'un lien WhatsApp.
  const needsRefresh = accessTokenExpiringSoon(request);
  const mayBeSignedIn = hasSessionCookie(request);
  const user =
    mayBeSignedIn && (needsRefresh || localeCookieMissing(request))
      ? (await supabase.auth.getUser()).data.user
      : null;

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // Sans cookie de session, personne n'est connecté : on n'interroge pas le
  // réseau pour s'en assurer, et toute adresse ramène à la page d'accueil.
  // C'est le seul écran qu'on voit avant de se connecter.
  if (!user && !mayBeSignedIn && !isPublic) {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return NextResponse.redirect(home);
  }

  // La langue n'est résolue qu'une fois : ensuite le cookie fait foi, ce qui
  // évite une lecture de `profiles` à chaque requête.
  if (!isLocale(request.cookies.get(LOCALE_COOKIE)?.value)) {
    let locale: Locale | null = null;

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("locale")
        .eq("id", user.id)
        .maybeSingle();
      if (isLocale(data?.locale)) locale = data.locale;
    }

    locale ??= localeFromAcceptLanguage(request.headers.get("accept-language"));
    locale ??= DEFAULT_LOCALE;

    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

/** Le cookie de session existe-t-il, quel que soit son état ? */
function hasSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some((c) => /^sb-.*-auth-token(\.\d+)?$/.test(c.name));
}

function localeCookieMissing(request: NextRequest) {
  return !isLocale(request.cookies.get(LOCALE_COOKIE)?.value);
}

/**
 * Lit `exp` dans le jeton d'accès, sans appel réseau. Renvoie vrai s'il
 * manque, s'il est illisible, ou s'il expire dans moins de cinq minutes.
 */
function accessTokenExpiringSoon(request: NextRequest) {
  const chunks = request.cookies
    .getAll()
    .filter((c) => /^sb-.*-auth-token(\.\d+)?$/.test(c.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => c.value)
    .join("");

  if (!chunks) return false; // pas de session : rien à rafraîchir

  try {
    const raw = chunks.startsWith("base64-")
      ? atob(chunks.slice("base64-".length))
      : decodeURIComponent(chunks);
    const session = JSON.parse(raw) as { access_token?: string };
    const token = session.access_token;
    if (!token) return true;

    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    if (!payload.exp) return true;
    return payload.exp - Math.floor(Date.now() / 1000) < 300;
  } catch {
    return true;
  }
}

export const config = {
  // `sw.js` et `hors-ligne.html` sont des fichiers statiques : sans cette
  // exclusion, ils passeraient par le proxy et repartiraient en 307 vers `/`
  // pour un visiteur non connecté — le service worker ne s'installerait
  // jamais. C'est exactement ce qui arrivait au manifeste.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|illustrations|sw\\.js|hors-ligne\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
