import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Retour d'OAuth : on échange le code contre une session, puis on redirige. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const suite = searchParams.get("suite") ?? "/accueil";

  if (!code) {
    return NextResponse.redirect(`${origin}/connexion?erreur=code_manquant`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/connexion?erreur=echange`);
  }

  // Derrière un proxy (Vercel), on reconstruit l'URL publique.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const base =
    process.env.NODE_ENV === "development" || !forwardedHost
      ? origin
      : `https://${forwardedHost}`;

  return NextResponse.redirect(`${base}${suite}`);
}
