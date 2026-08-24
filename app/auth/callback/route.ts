import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Retour d'OAuth : on échange le code contre une session, puis on redirige. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedSuite = searchParams.get("suite");
  let suite = requestedSuite ?? "/accueil";

  if (!code) {
    return NextResponse.redirect(`${origin}/connexion?erreur=code_manquant`);
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/connexion?erreur=echange`);
  }

  // Pas de destination explicite : si ce compte a un dossier fournisseur, on
  // l'emmène directement sur son espace (statut, menu, commandes...) plutôt
  // que sur l'accueil participant.
  if (!requestedSuite && data.user) {
    const { data: traiteur } = await supabase
      .from("traiteurs")
      .select("id")
      .eq("owner_id", data.user.id)
      .maybeSingle();
    if (traiteur) suite = "/partenaire/candidature";
  }

  // Derrière un proxy (Vercel), on reconstruit l'URL publique.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const base =
    process.env.NODE_ENV === "development" || !forwardedHost
      ? origin
      : `https://${forwardedHost}`;

  return NextResponse.redirect(`${base}${suite}`);
}
