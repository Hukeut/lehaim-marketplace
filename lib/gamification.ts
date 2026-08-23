import "server-only";
import { cache } from "react";
import { run } from "@/lib/db";
import { marketplaceClient } from "@/lib/shops";

/**
 * Gamification, version lehaim.
 *
 * lehaim-marketplace porte un moteur complet (gamification_events,
 * gamification_xp_ledger, gamification_rules, gamification_levels,
 * gamification_subject_state — cinq tables, cinq fonctions SECURITY
 * DEFINER, fenêtres temporelles adaptatives, lissage bayésien) documenté
 * dans docs/gamification-architecture-proposal.md. Deux choses en limitent
 * le portage tel quel ici : la métrique "communication" dépend d'un fil de
 * messages par commande qui n'existe pas dans ce backend, et
 * `gamification_rules`/`gamification_levels` n'ont eux-mêmes aucune valeur
 * de départ dans le code — ils s'éditent à la main via l'éditeur de tables
 * Supabase, ce que ce dépôt n'a pas vocation à répliquer pour l'instant.
 *
 * Ce qui EST repris, quasiment tel quel : le badge de réactivité
 * (bronze/argent/or, depuis le temps de réponse et la série de commandes
 * honorées) et les badges d'ancienneté/volume — dans lehaim-marketplace
 * aussi, ces deux-là sont calculés à la volée, pas stockés dans le moteur
 * de gamification. Le niveau/XP, lui, est une version simplifiée : un
 * total à poids fixes plutôt qu'un moteur de règles versionnées.
 */

export type ReactivityTier = "or" | "argent" | "bronze";

export const REACTIVITY_TIER_LABEL: Record<ReactivityTier, string> = {
  or: "Or",
  argent: "Argent",
  bronze: "Bronze",
};

export type TraiteurScore = {
  /** Null tant que le traiteur n'a pas assez d'historique pour être noté. */
  tier: ReactivityTier | null;
  avgResponseMinutes: number | null;
  /** Commandes honorées d'affilée (les plus récentes), sans annulation par le traiteur. */
  streak: number;
};

/**
 * Le temps de réponse vient du journal (marketplace_order_events, voir
 * migration 0043) plutôt que d'une colonne `responded_at` dédiée : la
 * première ligne du journal qui n'est pas "nouvelle" EST la réponse du
 * traiteur (acceptation ou refus), qu'il y ait un trigger dessus ou pas.
 */
export const traiteurScore = cache(async function traiteurScore(traiteurId: string): Promise<TraiteurScore> {
  const supabase = await marketplaceClient();

  const { data: orderRows } = await run(
    "traiteurScore/orders",
    supabase
      .from("marketplace_orders")
      .select("id, status, cancelled_by, created_at")
      .eq("traiteur_id", traiteurId)
      .order("created_at", { ascending: false })
      .limit(60),
  );
  const orders = (orderRows ?? []) as unknown as {
    id: string;
    status: string;
    cancelled_by: string | null;
    created_at: string;
  }[];

  const orderIds = orders.map((o) => o.id);
  const { data: eventRows } = orderIds.length
    ? await run(
        "traiteurScore/events",
        supabase
          .from("marketplace_order_events")
          .select("order_id, status, created_at")
          .in("order_id", orderIds)
          .order("created_at"),
      )
    : { data: [] as { order_id: string; status: string; created_at: string }[] };
  const events = (eventRows ?? []) as unknown as { order_id: string; status: string; created_at: string }[];

  const firstResponseAt = new Map<string, string>();
  for (const e of events) {
    if (e.status === "nouvelle" || firstResponseAt.has(e.order_id)) continue;
    firstResponseAt.set(e.order_id, e.created_at);
  }

  const responseMinutes = orders
    .map((o) => {
      const at = firstResponseAt.get(o.id);
      return at ? (new Date(at).getTime() - new Date(o.created_at).getTime()) / 60000 : null;
    })
    .filter((v): v is number => v !== null)
    .slice(0, 30);

  const avgResponseMinutes = responseMinutes.length
    ? responseMinutes.reduce((sum, m) => sum + m, 0) / responseMinutes.length
    : null;

  let tier: ReactivityTier | null = null;
  if (responseMinutes.length >= 3 && avgResponseMinutes !== null) {
    if (avgResponseMinutes <= 15) tier = "or";
    else if (avgResponseMinutes <= 45) tier = "argent";
    else tier = "bronze";
  }

  // Série la plus récente d'affilée : on s'arrête à la première commande
  // annulée par le traiteur. Une commande "nouvelle" pas encore traitée ne
  // casse pas la série, elle est simplement ignorée dans le comptage.
  let streak = 0;
  for (const o of orders) {
    if (o.status === "nouvelle") continue;
    if (o.cancelled_by === "traiteur") break;
    streak += 1;
  }

  return { tier, avgResponseMinutes, streak };
});

export type MilestoneBadge = { id: string; emoji: string; label: string; achieved: boolean };

const VOLUME_MILESTONES = [
  { count: 10, id: "volume-10", emoji: "🎖️", label: "10 commandes servies" },
  { count: 50, id: "volume-50", emoji: "🥈", label: "50 commandes servies" },
  { count: 100, id: "volume-100", emoji: "🏅", label: "100 commandes servies" },
  { count: 250, id: "volume-250", emoji: "👑", label: "250 commandes servies" },
] as const;

const TENURE_MILESTONES = [
  { months: 1, id: "tenure-1", emoji: "🌱", label: "1 mois sur lehaim" },
  { months: 3, id: "tenure-3", emoji: "🌿", label: "3 mois sur lehaim" },
  { months: 6, id: "tenure-6", emoji: "🌳", label: "6 mois sur lehaim" },
  { months: 12, id: "tenure-12", emoji: "🏆", label: "1 an sur lehaim" },
] as const;

/**
 * Badges d'ancienneté et de volume, indépendants du badge de réactivité.
 * On renvoie aussi les badges non débloqués (achieved: false) : les voir
 * grisés donne un objectif à atteindre, plutôt que de les cacher.
 */
export const traiteurMilestones = cache(async function traiteurMilestones(
  traiteurId: string,
): Promise<MilestoneBadge[]> {
  const supabase = await marketplaceClient();

  const [{ count: ordersServed }, { data: traiteurRow }] = await Promise.all([
    supabase
      .from("marketplace_orders")
      .select("id", { count: "exact", head: true })
      .eq("traiteur_id", traiteurId)
      .eq("status", "recuperee"),
    supabase.from("traiteurs").select("created_at").eq("id", traiteurId).maybeSingle(),
  ]);

  const createdAt = (traiteurRow as unknown as { created_at: string } | null)?.created_at;
  const monthsSince = createdAt
    ? (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
    : 0;

  const volumeBadges: MilestoneBadge[] = VOLUME_MILESTONES.map((m) => ({
    id: m.id,
    emoji: m.emoji,
    label: m.label,
    achieved: (ordersServed ?? 0) >= m.count,
  }));

  const tenureBadges: MilestoneBadge[] = TENURE_MILESTONES.map((m) => ({
    id: m.id,
    emoji: m.emoji,
    label: m.label,
    achieved: monthsSince >= m.months,
  }));

  return [...tenureBadges, ...volumeBadges];
});

export type LevelKey = "debutant" | "confirme" | "expert" | "elite";

export type Level = { key: LevelKey; name: string; minXp: number };

const LEVELS: Level[] = [
  { key: "debutant", name: "Débutant", minXp: 0 },
  { key: "confirme", name: "Confirmé", minXp: 100 },
  { key: "expert", name: "Expert", minXp: 400 },
  { key: "elite", name: "Élite", minXp: 1000 },
];

export type TraiteurProgress = {
  xp: number;
  level: Level;
  nextLevel: Level | null;
};

/**
 * Niveau et points, recalculés à chaque visite depuis les commandes et les
 * avis — jamais stockés. Poids fixes, assumés plutôt que configurables :
 * +10 par commande servie, +5/-5 par avis positif (≥4)/négatif (≤2),
 * -15 par commande annulée par le traiteur.
 */
export const traiteurProgress = cache(async function traiteurProgress(
  traiteurId: string,
): Promise<TraiteurProgress> {
  const supabase = await marketplaceClient();

  const [{ data: orderRows }, { data: reviewRows }] = await Promise.all([
    run(
      "traiteurProgress/orders",
      supabase.from("marketplace_orders").select("status, cancelled_by").eq("traiteur_id", traiteurId),
    ),
    run(
      "traiteurProgress/reviews",
      supabase.from("marketplace_reviews").select("rating").eq("traiteur_id", traiteurId),
    ),
  ]);

  const orders = (orderRows ?? []) as unknown as { status: string; cancelled_by: string | null }[];
  const reviews = (reviewRows ?? []) as unknown as { rating: number }[];

  const completed = orders.filter((o) => o.status === "recuperee").length;
  const cancelledByTraiteur = orders.filter(
    (o) => o.status === "annulee" && o.cancelled_by === "traiteur",
  ).length;
  const positiveReviews = reviews.filter((r) => Number(r.rating) >= 4).length;
  const negativeReviews = reviews.filter((r) => Number(r.rating) <= 2).length;

  const xp = Math.max(
    0,
    completed * 10 + positiveReviews * 5 - negativeReviews * 5 - cancelledByTraiteur * 15,
  );

  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXp) level = l;
  }
  const nextLevel = LEVELS.find((l) => l.minXp > level.minXp) ?? null;

  return { xp, level, nextLevel };
});
