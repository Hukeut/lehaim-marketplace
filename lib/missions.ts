import "server-only";
import { cache } from "react";
import { getTranslations } from "next-intl/server";
import type { AvatarTone } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { run } from "@/lib/db";
import { currentUser } from "@/lib/supabase/user";
import { dishByKey } from "@/lib/dishes";
import { toneFor } from "@/lib/profile";
import type { MomentKind } from "@/lib/templates";

export type Category = "food" | "drinks" | "equipment" | "hosting" | "other";
export type FundingMode = "byo" | "split" | "pot" | "host_pays" | "free";

export type Claimer = {
  id: string;
  name: string;
  initial: string;
  tone: AvatarTone;
  /** Plats choisis au catalogue illustré, ou plat saisi à la main. */
  dishKeys: string[];
  dishLabel: string | null;
  /** Rôle attribué au moment de la prise. Null pour les prises d'avant 0033. */
  roleKey: string | null;
};

export type Mission = {
  id: string;
  category: Category;
  title: string;
  emoji: string;
  slots: number;
  quantity: string | null;
  priority: "essential" | "standard";
  notes: string | null;
  status: "todo" | "in_progress" | "done";
  claimers: Claimer[];
  free: number;
  mine: boolean;
};

export type Moment = {
  id: string;
  kind: MomentKind | "other";
  label: string;
  detail: string | null;
  attending: number;
  /** Heure de rendez-vous propre au moment, « HH:MM ». */
  meetAt: string | null;
  /** Nombre de couchages, pour le moment « sleepover ». */
  capacity: number | null;
  sleepingPolicy: "mixed" | "girls" | "boys" | null;
};

export type EquipmentItem = {
  id: string;
  name: string;
  emoji: string;
  owned: number;
  needed: number;
  missing: number;
  claimedBy: Claimer | null;
};

export type Suggestion = {
  id: string;
  body: string;
  author: string;
  votes: number;
  chosen: boolean;
  votedByMe: boolean;
};

export type Swap = {
  id: string;
  missionId: string;
  missionTitle: string;
  fromName: string;
  toName: string | null;
  toId: string | null;
  fromId: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
};

export type Ops = {
  /** Identifiant de la personne connectée, pour retrouver sa propre prise. */
  meId: string;
  moments: Moment[];
  missions: Mission[];
  equipment: EquipmentItem[];
  swaps: Swap[];
  fundingMode: FundingMode;
  readyBy: string | null;
  lockedAt: string | null;
  template: string | null;
  counts: {
    missionsTotal: number;
    missionsCovered: number;
    slotsTotal: number;
    slotsTaken: number;
    equipmentMissing: number;
  };
  readiness: number;
};

type ProfileRow = { id: string; first_name: string | null; last_name: string | null } | null;

function claimerFrom(
  row: ProfileRow,
  guestFallback: string,
  dish?: { keys: string[] | null; custom: string | null },
): Claimer {
  const name =
    [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim() || guestFallback;
  return {
    id: row?.id ?? "",
    name,
    initial: name.charAt(0).toUpperCase(),
    tone: toneFor(row?.id ?? name),
    dishKeys: dish?.keys ?? [],
    roleKey: null,
    dishLabel:
      dish?.keys?.length
        ? dish.keys.map((key) => dishByKey(key)?.label).filter(Boolean).join(", ")
        : (dish?.custom ?? null),
  };
}

/** Toute la couche « missions & ops » d'un Shabbat, en une passe. */
export const getOps = cache(async function getOps(shabbatId: string): Promise<Ops | null> {
  const supabase = await createClient();
  const user = await currentUser();
  if (!user) return null;

  const { data: shabbat } = await run(
    "user/shabbats",
    supabase
      .from("shabbats")
      .select("funding_mode, ready_by, locked_at, template")
      .eq("id", shabbatId)
      .maybeSingle()
  );
  if (!shabbat) return null;

  const t = await getTranslations("common");
  const guestFallback = t("guestFallback");

  const [momentsRes, missionsRes, equipmentRes] = await Promise.all([
    // i18n-ignore : liste de colonnes passée à .select(), pas du texte affiché.
    supabase
      .from("moments")
      .select("id, kind, label, detail, meet_at, capacity, sleeping_policy")
      .eq("shabbat_id", shabbatId)
      .order("position"),
    supabase
      .from("missions")
      .select(
        "id, category, title, emoji, slots, quantity, priority, notes, status, mission_claims(profile_id, dish_keys, dish_custom, role_key, profiles(id, first_name, last_name))",
      )
      .eq("shabbat_id", shabbatId)
      .order("position"),
    supabase
      .from("equipment")
      .select("id, name, emoji, owned, needed, profiles:claimed_by(id, first_name, last_name)")
      .eq("shabbat_id", shabbatId)
      .order("position"),
  ]);

  const missionIds = (missionsRes.data ?? []).map((m) => m.id as string);

  const [attendanceRes, swapRes] = await Promise.all([
    // Compté en base (0019). La politique `rsvps_all` ne laisse voir à un
    // convive que ses propres réponses : compter ici lui rendait toujours 0
    // ou 1, alors que l'hôte lisait le vrai total. La fonction agrège
    // au-dessus de la RLS et ne rend que le nombre — personne n'apprend qui
    // a répondu quoi.
    supabase.rpc("moment_attendance", { shabbat: shabbatId }),
    missionIds.length
      ? supabase
          .from("swaps")
          .select("id, mission_id, status, from_id, to_id, missions(title), from_profile:from_id(id, first_name, last_name), to_profile:to_id(id, first_name, last_name)")
          .in("mission_id", missionIds)
          .eq("status", "pending")
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const attendance = new Map(
    ((attendanceRes.data ?? []) as { moment_id: string; attending: number }[]).map((row) => [
      row.moment_id,
      row.attending,
    ]),
  );

  const moments: Moment[] = (momentsRes.data ?? []).map((row) => ({
    id: row.id as string,
    kind: row.kind as Moment["kind"],
    label: row.label as string,
    detail: (row.detail as string) ?? null,
    attending: attendance.get(row.id as string) ?? 0,
    // Postgres renvoie « 13:00:00 » : on ne garde que heures et minutes.
    meetAt: row.meet_at ? String(row.meet_at).slice(0, 5) : null,
    capacity: (row.capacity as number) ?? null,
    sleepingPolicy: (row.sleeping_policy as Moment["sleepingPolicy"]) ?? null,
  }));

  const missions: Mission[] = (missionsRes.data ?? []).map((row) => {
    const claims = (row.mission_claims ?? []) as unknown as {
      profile_id: string;
      dish_keys: string[] | null;
      dish_custom: string | null;
      role_key: string | null;
      profiles: ProfileRow;
    }[];
    const claimers = claims.map((c) => ({
      ...claimerFrom(c.profiles, guestFallback, { keys: c.dish_keys, custom: c.dish_custom }),
      roleKey: c.role_key,
    }));
    const slots = row.slots as number;
    return {
      id: row.id as string,
      category: row.category as Category,
      title: row.title as string,
      emoji: (row.emoji as string) ?? "•",
      slots,
      quantity: (row.quantity as string) ?? null,
      priority: row.priority as Mission["priority"],
      notes: (row.notes as string) ?? null,
      status: row.status as Mission["status"],
      claimers,
      free: Math.max(0, slots - claimers.length),
      mine: claims.some((c) => c.profile_id === user.id),
    };
  });

  const equipment: EquipmentItem[] = (equipmentRes.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    emoji: (row.emoji as string) ?? "📦",
    owned: row.owned as number,
    needed: row.needed as number,
    missing: Math.max(0, (row.needed as number) - (row.owned as number)),
    claimedBy: row.profiles ? claimerFrom(row.profiles as unknown as ProfileRow, guestFallback) : null,
  }));

  const missionFallbackTitle = t("missionFallback");

  const swaps: Swap[] = ((swapRes.data ?? []) as unknown as Record<string, unknown>[]).map(
    (row) => ({
      id: row.id as string,
      missionId: row.mission_id as string,
      missionTitle:
        ((row.missions as { title?: string } | null)?.title as string) ?? missionFallbackTitle,
      fromId: row.from_id as string,
      toId: (row.to_id as string) ?? null,
      fromName: claimerFrom(row.from_profile as ProfileRow, guestFallback).name,
      toName: row.to_profile ? claimerFrom(row.to_profile as ProfileRow, guestFallback).name : null,
      status: row.status as Swap["status"],
    }),
  );

  const slotsTotal = missions.reduce((total, m) => total + m.slots, 0);
  const slotsTaken = missions.reduce((total, m) => total + m.claimers.length, 0);
  const missionsCovered = missions.filter((m) => m.free === 0).length;
  const equipmentMissing = equipment.filter((e) => e.missing > 0 && !e.claimedBy).length;

  return {
    meId: user.id,
    moments,
    missions,
    equipment,
    swaps,
    fundingMode: (shabbat.funding_mode as FundingMode) ?? "byo",
    readyBy: (shabbat.ready_by as string) ?? null,
    lockedAt: (shabbat.locked_at as string) ?? null,
    template: (shabbat.template as string) ?? null,
    counts: {
      missionsTotal: missions.length,
      missionsCovered,
      slotsTotal,
      slotsTaken,
      equipmentMissing,
    },
    readiness: slotsTotal ? Math.round((slotsTaken / slotsTotal) * 100) : 0,
  };
});

/** Suggestions d'une mission, avec le décompte des votes. */
export const getSuggestions = cache(async function getSuggestions(missionId: string): Promise<Suggestion[]> {
  const supabase = await createClient();
  const user = await currentUser();
  if (!user) return [];

  const { data } = await run(
    "user/suggestions",
    supabase
      .from("suggestions")
      .select("id, body, chosen, profiles:author_id(id, first_name, last_name), suggestion_votes(profile_id)")
      .eq("mission_id", missionId)
      .order("created_at")
  );

  const t = await getTranslations("common");
  const guestFallback = t("guestFallback");

  return (data ?? []).map((row) => {
    const votes = (row.suggestion_votes ?? []) as unknown as { profile_id: string }[];
    return {
      id: row.id as string,
      body: row.body as string,
      author: claimerFrom(row.profiles as unknown as ProfileRow, guestFallback).name,
      votes: votes.length,
      chosen: Boolean(row.chosen),
      votedByMe: votes.some((v) => v.profile_id === user.id),
    };
  });
});

export const getMission = cache(async function getMission(missionId: string) {
  const supabase = await createClient();
  const { data } = await run(
    "supabase/missions",
    supabase
      .from("missions")
      .select("id, shabbat_id, category, title, emoji, slots, quantity, priority, notes, status")
      .eq("id", missionId)
      .maybeSingle()
  );
  return data;
});

/** Compte à rebours jusqu'à la deadline « tout doit être prêt ». */
export function untilReady(readyBy: string | null) {
  if (!readyBy) return null;
  const diff = new Date(readyBy).getTime() - Date.now();
  if (diff <= 0) return { past: true, days: 0, hours: 0, minutes: 0 };
  return {
    past: false,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
  };
}
