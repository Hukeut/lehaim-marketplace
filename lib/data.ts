import "server-only";
import { createClient } from "@/lib/supabase/server";
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

export type Dish = {
  id: string;
  name: string;
  course: "entree" | "plat" | "dessert";
  status: "todo" | "cooking" | "done";
  assignee: Person | null;
};

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: string | null;
  done: boolean;
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
  hostId: string;
  isHost: boolean;
  /** Calculé côté serveur pour éviter une lecture d'horloge au rendu. */
  isPast: boolean;
};

export type ShabbatDetail = ShabbatSummary & {
  host: Person;
  invitations: Invitation[];
  dishes: Dish[];
  shopping: ShoppingItem[];
  expenses: Expense[];
  counts: {
    confirmed: number;
    invited: number;
    dishesDone: number;
    dishesTotal: number;
    shoppingDone: number;
    shoppingTotal: number;
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

function personFrom(row: ProfileRow, fallbackName?: string | null): Person {
  const name =
    [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim() ||
    (fallbackName ?? "").trim() ||
    "Invité";
  return {
    id: row?.id ?? null,
    name,
    initial: name.charAt(0).toUpperCase(),
    tone: toneFor(row?.id ?? name),
  };
}


/**
 * Niveau de préparation : moyenne pondérée des réponses, du menu et des
 * courses. `readinessLabel` en dérive un état lisible.
 */
function computeReadiness(c: ShabbatDetail["counts"], guestTarget: number) {
  const parts: number[] = [];
  if (guestTarget > 0) parts.push(Math.min(1, c.confirmed / guestTarget));
  if (c.dishesTotal > 0) parts.push(c.dishesDone / c.dishesTotal);
  if (c.shoppingTotal > 0) parts.push(c.shoppingDone / c.shoppingTotal);
  if (!parts.length) return 0;
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
}

/* ------------------------------------------------------------------ */
/* Requêtes                                                             */
/* ------------------------------------------------------------------ */

/** Shabbats organisés par la personne connectée, du plus proche au plus loin. */
export async function listHostedShabbats(): Promise<ShabbatSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("shabbats")
    .select("*")
    .eq("host_id", user.id)
    .order("starts_at", { ascending: false });

  return (data ?? []).map((row) => toSummary(row, user.id));
}

/** Shabbats auxquels la personne connectée est invitée. */
export async function listJoinedShabbats(): Promise<
  (ShabbatSummary & { myStatus: Invitation["status"]; myRole: string | null })[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("invitations")
    .select("status, role_name, shabbats(*)")
    .eq("guest_id", user.id);

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
}

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
    hostId: row.host_id as string,
    isHost: row.host_id === userId,
    isPast: new Date(row.starts_at as string).getTime() < Date.now(),
  };
}

/** Le prochain Shabbat concernant la personne : organisé ou rejoint. */
export async function getNextShabbat(): Promise<ShabbatSummary | null> {
  const [hosted, joined] = await Promise.all([listHostedShabbats(), listJoinedShabbats()]);
  const now = Date.now();
  const upcoming = [...hosted, ...joined]
    .filter((s) => new Date(s.startsAt).getTime() >= now - 86_400_000)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return upcoming[0] ?? hosted[0] ?? joined[0] ?? null;
}

/** Détail complet d'un Shabbat. Null si inexistant ou non autorisé (RLS). */
export async function getShabbat(id: string): Promise<ShabbatDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: shabbat } = await supabase
    .from("shabbats")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!shabbat) return null;

  const [hostRes, invitesRes, dishesRes, shoppingRes, expensesRes] = await Promise.all([
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
    supabase
      .from("dishes")
      .select("id, name, course, status, profiles:assignee_id(id, first_name, last_name)")
      .eq("shabbat_id", id)
      .order("position"),
    supabase.from("shopping_items").select("id, name, quantity, done").eq("shabbat_id", id),
    supabase
      .from("expenses")
      .select("id, label, amount, profiles:paid_by(id, first_name, last_name)")
      .eq("shabbat_id", id),
  ]);

  const invitations: Invitation[] = (invitesRes.data ?? []).map((row) => {
    const profile = row.profiles as unknown as ProfileRow;
    const person = personFrom(profile, row.guest_name as string | null);
    return {
      ...person,
      invitationId: row.id as string,
      status: row.status as Invitation["status"],
      role: (row.role_name as string) ?? null,
      roleDetail: (row.role_detail as string) ?? null,
      phone: (profile?.phone as string) ?? (row.guest_phone as string) ?? null,
    };
  });

  const dishes: Dish[] = (dishesRes.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    course: row.course as Dish["course"],
    status: row.status as Dish["status"],
    assignee: row.profiles ? personFrom(row.profiles as unknown as ProfileRow) : null,
  }));

  const shopping: ShoppingItem[] = (shoppingRes.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    quantity: (row.quantity as string) ?? null,
    done: Boolean(row.done),
  }));

  const expenses: Expense[] = (expensesRes.data ?? []).map((row) => ({
    id: row.id as string,
    label: row.label as string,
    amount: Number(row.amount),
    paidBy: row.profiles ? personFrom(row.profiles as unknown as ProfileRow) : null,
  }));

  const counts = {
    confirmed: invitations.filter((i) => i.status === "confirmed").length,
    invited: invitations.length,
    dishesDone: dishes.filter((d) => d.status === "done").length,
    dishesTotal: dishes.length,
    shoppingDone: shopping.filter((s) => s.done).length,
    shoppingTotal: shopping.length,
    spent: expenses.reduce((total, e) => total + e.amount, 0),
  };

  const summary = toSummary(shabbat, user.id);

  return {
    ...summary,
    host: personFrom(hostRes.data as ProfileRow),
    invitations,
    dishes,
    shopping,
    expenses,
    counts,
    readiness: computeReadiness(counts, summary.guestTarget),
  };
}

/** Fils de discussion : un par Shabbat, avec le dernier message. */
export async function listThreads() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [hosted, joined] = await Promise.all([listHostedShabbats(), listJoinedShabbats()]);
  const shabbats = [...hosted, ...joined];
  if (!shabbats.length) return [];

  const { data } = await supabase
    .from("messages")
    .select("shabbat_id, body, created_at, sender_id, profiles:sender_id(id, first_name, last_name)")
    .in("shabbat_id", shabbats.map((s) => s.id))
    .order("created_at", { ascending: false });

  return shabbats
    .map((shabbat) => {
      const last = (data ?? []).find((m) => m.shabbat_id === shabbat.id);
      return {
        shabbat,
        lastMessage: last
          ? {
              body: last.body as string,
              at: last.created_at as string,
              author: personFrom(last.profiles as unknown as ProfileRow),
              mine: last.sender_id === user.id,
            }
          : null,
      };
    })
    .sort((a, b) => (b.lastMessage?.at ?? "").localeCompare(a.lastMessage?.at ?? ""));
}

export async function getThread(shabbatId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: shabbat } = await supabase
    .from("shabbats")
    .select("id, title, starts_at, host_id")
    .eq("id", shabbatId)
    .maybeSingle();
  if (!shabbat) return null;

  const { data } = await supabase
    .from("messages")
    .select("id, body, created_at, sender_id, profiles:sender_id(id, first_name, last_name)")
    .eq("shabbat_id", shabbatId)
    .order("created_at");

  return {
    shabbat,
    messages: (data ?? []).map((row) => ({
      id: row.id as string,
      body: row.body as string,
      at: row.created_at as string,
      mine: row.sender_id === user.id,
      author: personFrom(row.profiles as unknown as ProfileRow),
    })),
  };
}

/** Vue « invité » d'un Shabbat : ce qui concerne la personne connectée. */
export async function getMyInvitation(shabbatId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("invitations")
    .select("id, status, role_name, role_detail")
    .eq("shabbat_id", shabbatId)
    .eq("guest_id", user.id)
    .maybeSingle();

  return data
    ? {
        id: data.id as string,
        status: data.status as Invitation["status"],
        role: (data.role_name as string) ?? null,
        roleDetail: (data.role_detail as string) ?? null,
      }
    : null;
}
