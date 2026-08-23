import { cache } from "react";
import "server-only";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { run } from "@/lib/db";
import { currentUser } from "@/lib/supabase/user";
import { toneFor } from "@/lib/profile";
import { formatDate, formatTime, countdown, readinessLabel } from "@/lib/format";

export { formatDate, formatTime, countdown, readinessLabel };
import type { AvatarTone } from "@/components/ui";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export type Person = {
  id: string | null;
  name: string;
  initial: string;
  tone: AvatarTone;
};

export type Invitation = Person & {
  invitationId: string;
  status: "pending" | "confirmed" | "declined";
  role: string | null;
  roleDetail: string | null;
  phone: string | null;
};



export type Expense = {
  id: string;
  label: string;
  amount: number;
  paidBy: Person | null;
};

export type ShabbatSummary = {
  id: string;
  title: string;
  startsAt: string;
  address: string | null;
  neighbourhood: string | null;
  guestTarget: number;
  budgetPlanned: number | null;
  visibility: "invite" | "link";
  status: "planning" | "published" | "done";
  shareToken: string;
  /** Jeton distinct : promeut au rang de co-organisateur. */
  cohostToken: string;
  /** Code court, à dicter ou recopier quand le lien n'est pas cliquable. */
  joinCode: string;
  hostId: string;
  isHost: boolean;
  /** Modèle de départ, utile pour proposer une duplication (G04). */
  template: string | null;
  /** Calculé côté serveur pour éviter une lecture d'horloge au rendu. */
  isPast: boolean;
};

export type ShabbatDetail = ShabbatSummary & {
  host: Person;
  invitations: Invitation[];
  expenses: Expense[];
  counts: {
    confirmed: number;
    invited: number;
    /** Places d'apports pourvues, et total — le modèle de la refonte. */
    contributionsTaken: number;
    contributionsTotal: number;
    spent: number;
  };
  readiness: number;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone?: string | null;
} | null;

function personFrom(row: ProfileRow, guestFallback: string, fallbackName?: string | null): Person {
  const name =
    [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim() ||
    (fallbackName ?? "").trim() ||
    guestFallback;
  return {
    id: row?.id ?? null,
    name,
    initial: name.charAt(0).toUpperCase(),
    tone: toneFor(row?.id ?? name),
  };
}


/**
 * Niveau de préparation : moyenne des réponses reçues et des apports pourvus.
 *
 * Il se calculait auparavant sur `dishes` et `shopping_items`, les tables du
 * modèle v1 — pendant que `getOps` en calculait un autre sur les places
 * d'apports. Le même Shabbat pouvait donc afficher deux pourcentages selon
 * l'écran. Les deux tables étaient vides : ces barres affichaient 0/0 depuis
 * toujours.
 */
function computeReadiness(c: ShabbatDetail["counts"], guestTarget: number) {
  const parts: number[] = [];
  if (guestTarget > 0) parts.push(Math.min(1, c.confirmed / guestTarget));
  if (c.contributionsTotal > 0) parts.push(c.contributionsTaken / c.contributionsTotal);
  if (!parts.length) return 0;
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
}

/* ------------------------------------------------------------------ */
/* Requêtes                                                             */
/* ------------------------------------------------------------------ */

/** Shabbats organisés par la personne connectée, du plus proche au plus loin. */
export const listHostedShabbats = cache(async function listHostedShabbats(): Promise<ShabbatSummary[]> {
  const supabase = await createClient();
  const user = await currentUser();
  if (!user) return [];

  const { data } = await run(
    "user/shabbats",
    supabase
      .from("shabbats")
      .select("*")
      .eq("host_id", user.id)
      .order("starts_at", { ascending: false })
  );

  return (data ?? []).map((row) => toSummary(row, user.id));
});

/** Shabbats auxquels la personne connectée est invitée. */
export const listJoinedShabbats = cache(async function listJoinedShabbats(): Promise<
  (ShabbatSummary & { myStatus: Invitation["status"]; myRole: string | null })[]
> {
  const supabase = await createClient();
  const user = await currentUser();
  if (!user) return [];

  // Une invitation déclinée n'est pas une participation : elle disparaît de
  // l'accueil, de « J'y participe » et de la liste des choses à faire. Elle
  // revient si la personne change d'avis, le statut étant simplement remis
  // à jour.
  const { data } = await run(
    "user/invitations",
    supabase
      .from("invitations")
      .select("status, role_name, shabbats(*)")
      .eq("guest_id", user.id)
      .neq("status", "declined")
  );

  return (data ?? [])
    .filter((row) => row.shabbats)
    .map((row) => {
      const shabbat = row.shabbats as unknown as Record<string, unknown>;
      return {
        ...toSummary(shabbat, user.id),
        myStatus: row.status as Invitation["status"],
        myRole: row.role_name as string | null,
      };
    })
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
});

function toSummary(row: Record<string, unknown>, userId: string): ShabbatSummary {
  return {
    id: row.id as string,
    title: row.title as string,
    startsAt: row.starts_at as string,
    address: (row.address as string) ?? null,
    neighbourhood: (row.neighbourhood as string) ?? null,
    guestTarget: (row.guest_target as number) ?? 0,
    budgetPlanned: row.budget_planned ? Number(row.budget_planned) : null,
    visibility: (row.visibility as ShabbatSummary["visibility"]) ?? "invite",
    status: (row.status as ShabbatSummary["status"]) ?? "planning",
    shareToken: row.share_token as string,
    cohostToken: (row.cohost_token as string) ?? "",
    joinCode: (row.join_code as string) ?? "",
    hostId: row.host_id as string,
    isHost: row.host_id === userId,
    template: (row.template as string) ?? null,
    isPast: new Date(row.starts_at as string).getTime() < Date.now(),
  };
}

/** Le prochain Shabbat concernant la personne : organisé ou rejoint. */
export const getNextShabbat = cache(async function getNextShabbat(): Promise<ShabbatSummary | null> {
  const [hosted, joined] = await Promise.all([listHostedShabbats(), listJoinedShabbats()]);
  const now = Date.now();
  const upcoming = [...hosted, ...joined]
    .filter((s) => new Date(s.startsAt).getTime() >= now - 86_400_000)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return upcoming[0] ?? hosted[0] ?? joined[0] ?? null;
});

/** Détail complet d'un Shabbat. Null si inexistant ou non autorisé (RLS). */
export const getShabbat = cache(async function getShabbat(
  id: string,
): Promise<ShabbatDetail | null> {
  const supabase = await createClient();
  const user = await currentUser();
  if (!user) return null;

  const { data: shabbat } = await run(
    "user/shabbats",
    supabase
      .from("shabbats")
      .select("*")
      .eq("id", id)
      .maybeSingle()
  );
  if (!shabbat) return null;

  const t = await getTranslations("common");
  const guestFallback = t("guestFallback");

  const [hostRes, invitesRes, missionsRes, expensesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("id", shabbat.host_id)
      .maybeSingle(),
    supabase
      .from("invitations")
      .select("id, status, role_name, role_detail, guest_name, guest_phone, guest_id, profiles(id, first_name, last_name, phone)")
      .eq("shabbat_id", id)
      .order("created_at"),
    // i18n-ignore : liste de colonnes passée à .select(), pas du texte affiché.
    supabase.from("missions").select("slots, mission_claims(profile_id)").eq("shabbat_id", id),
    supabase
      .from("expenses")
      .select("id, label, amount, profiles:paid_by(id, first_name, last_name)")
      .eq("shabbat_id", id),
  ]);

  const invitations: Invitation[] = (invitesRes.data ?? []).map((row) => {
    const profile = row.profiles as unknown as ProfileRow;
    const person = personFrom(profile, guestFallback, row.guest_name as string | null);
    return {
      ...person,
      invitationId: row.id as string,
      status: row.status as Invitation["status"],
      role: (row.role_name as string) ?? null,
      roleDetail: (row.role_detail as string) ?? null,
      phone: (profile?.phone as string) ?? (row.guest_phone as string) ?? null,
    };
  });

  const contributions = (missionsRes.data ?? []).reduce(
    (acc, row) => {
      acc.total += row.slots as number;
      acc.taken += ((row.mission_claims ?? []) as unknown[]).length;
      return acc;
    },
    { total: 0, taken: 0 },
  );

  const expenses: Expense[] = (expensesRes.data ?? []).map((row) => ({
    id: row.id as string,
    label: row.label as string,
    amount: Number(row.amount),
    paidBy: row.profiles ? personFrom(row.profiles as unknown as ProfileRow, guestFallback) : null,
  }));

  const counts = {
    confirmed: invitations.filter((i) => i.status === "confirmed").length,
    invited: invitations.length,
    contributionsTaken: contributions.taken,
    contributionsTotal: contributions.total,
    spent: expenses.reduce((total, e) => total + e.amount, 0),
  };

  const summary = toSummary(shabbat, user.id);

  return {
    ...summary,
    host: personFrom(hostRes.data as ProfileRow, guestFallback),
    invitations,
    expenses,
    counts,
    readiness: computeReadiness(counts, summary.guestTarget),
  };
});

/** Vue « invité » d'un Shabbat : ce qui concerne la personne connectée. */
export const getMyInvitation = cache(async function getMyInvitation(shabbatId: string) {
  const supabase = await createClient();
  const user = await currentUser();
  if (!user) return null;

  const { data } = await run(
    "user/invitations",
    supabase
      .from("invitations")
      .select("id, status, role_name, role_detail")
      .eq("shabbat_id", shabbatId)
      .eq("guest_id", user.id)
      .maybeSingle()
  );

  return data
    ? {
        id: data.id as string,
        status: data.status as Invitation["status"],
        role: (data.role_name as string) ?? null,
        roleDetail: (data.role_detail as string) ?? null,
      }
    : null;
});
