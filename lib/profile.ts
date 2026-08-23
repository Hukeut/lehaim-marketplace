import "server-only";
import { cache } from "react";
import { getTranslations } from "next-intl/server";
import type { AvatarTone } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/supabase/user";

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
export const getCurrentProfile = cache(async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const user = await currentUser();

  if (!user) return null;

  const t = await getTranslations("common");

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
    t("you");

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
    memberSince: t("memberSince", {
      month: t(`months.${created.getMonth()}`),
      year: created.getFullYear(),
    }),
    hasAbout,
  };
});

export type ProfileStats = {
  /** Shabbats dont on est l'hôte. */
  hosted: number;
  /** Shabbats rejoints, invitation confirmée. */
  joined: number;
  /** Personnes distinctes rencontrées autour d'une de ces tables. */
  contacts: number;
};

const NO_STATS: ProfileStats = { hosted: 0, joined: 0, contacts: 0 };

/**
 * Les trois chiffres de l'écran Profil.
 *
 * Ils affichaient jusqu'ici les constantes de `lib/demo.ts` — le profil fictif
 * « Noa Amsalem » — à tout utilisateur connecté. Une maquette restée branchée
 * en production, que personne n'avait vue parce que rien ne la contredisait.
 *
 * `contacts` se calcule côté client de la base plutôt qu'en SQL : la RLS donne
 * déjà accès aux invitations des Shabbats dont on est membre, donc la liste
 * est courte et il n'y a rien à contourner. Mémoïsé, comme le reste de la
 * couche d'accès.
 */
export const getProfileStats = cache(async function getProfileStats(): Promise<ProfileStats> {
  const supabase = await createClient();
  const user = await currentUser();
  if (!user) return NO_STATS;

  const [hostedRes, joinedRes] = await Promise.all([
    supabase.from("shabbats").select("id").eq("host_id", user.id),
    supabase
      .from("invitations")
      .select("shabbat_id")
      .eq("guest_id", user.id)
      .eq("status", "confirmed"),
  ]);

  const hostedIds = (hostedRes.data ?? []).map((row) => row.id as string);
  const joinedIds = (joinedRes.data ?? []).map((row) => row.shabbat_id as string);
  const allIds = [...new Set([...hostedIds, ...joinedIds])];

  if (!allIds.length) {
    return { hosted: hostedIds.length, joined: joinedIds.length, contacts: 0 };
  }

  const [guestsRes, hostsRes] = await Promise.all([
    supabase.from("invitations").select("guest_id").in("shabbat_id", allIds),
    supabase.from("shabbats").select("host_id").in("id", allIds),
  ]);

  const people = new Set<string>();
  for (const row of guestsRes.data ?? []) {
    const id = row.guest_id as string | null;
    if (id) people.add(id);
  }
  for (const row of hostsRes.data ?? []) {
    people.add(row.host_id as string);
  }
  // On ne se compte pas soi-même parmi ses contacts.
  people.delete(user.id);

  return { hosted: hostedIds.length, joined: joinedIds.length, contacts: people.size };
});
