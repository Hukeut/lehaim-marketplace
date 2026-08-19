import type { AvatarTone } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string | null;
  initial: string;
  tone: AvatarTone;
  avatarUrl: string | null;
  phone: string | null;
  about: string | null;
  email: string;
  memberSince: string;
  /** Vrai si la colonne `about` (ajoutée par la migration v2) est disponible. */
  hasAbout: boolean;
};

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const TONES: AvatarTone[] = ["coral", "teal", "violet", "gold", "olive", "ink"];

/**
 * Teinte d'avatar dérivée de l'identifiant : stable, et ça évite d'ajouter une
 * colonne à la table `profiles` héritée de la version précédente.
 */
export function toneFor(id: string): AvatarTone {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return TONES[hash % TONES.length];
}

/**
 * Profil de la personne connectée, lu dans la table `profiles` existante
 * (colonnes first_name / last_name / phone / avatar_url).
 * Retourne null si personne n'est connecté.
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // `about` n'existe qu'après la migration v2 : on tente avec, puis sans.
  let row: Record<string, unknown> | null = null;
  let hasAbout = true;

  const withAbout = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, avatar_url, email, created_at, about")
    .eq("id", user.id)
    .maybeSingle();

  if (withAbout.error) {
    hasAbout = false;
    const fallback = await supabase
      .from("profiles")
      .select("first_name, last_name, phone, avatar_url, email, created_at")
      .eq("id", user.id)
      .maybeSingle();
    row = fallback.data ?? null;
  } else {
    row = withAbout.data ?? null;
  }

  const first = ((row?.first_name as string) ?? "").trim();
  const last = ((row?.last_name as string) ?? "").trim();

  const metadataName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Vous";

  const fullName = [first, last].filter(Boolean).join(" ") || metadataName;
  const created = new Date((row?.created_at as string) ?? user.created_at);

  return {
    id: user.id,
    fullName,
    firstName: first || fullName.split(" ")[0],
    lastName: last || null,
    initial: fullName.charAt(0).toUpperCase(),
    tone: toneFor(user.id),
    avatarUrl: (row?.avatar_url as string) ?? null,
    phone: (row?.phone as string) ?? null,
    about: hasAbout ? ((row?.about as string) ?? null) : null,
    email: ((row?.email as string) ?? user.email) || "",
    memberSince: `Membre depuis ${MONTHS[created.getMonth()]} ${created.getFullYear()}`,
    hasAbout,
  };
}
