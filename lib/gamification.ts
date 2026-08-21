import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  GamificationSubjectType,
  GamificationEventType,
  GamificationLevel,
  GamificationMetrics,
  GamificationSubjectState,
  GamificationLedgerEntry,
} from "@/lib/gamification-types";

export * from "@/lib/gamification-types";

/* ------------------------------------------------------------------ */
/* Primitives bas niveau — appellent les fonctions security definer   */
/* de la migration 0019. Aucune écriture directe sur les tables       */
/* gamification_* : c'est la garantie que la légitimité (voir         */
/* can_touch_gamification_subject) est toujours vérifiée.             */
/* ------------------------------------------------------------------ */

async function recordEvent(input: {
  subjectType: GamificationSubjectType;
  subjectId: string;
  eventType: GamificationEventType;
  orderId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_gamification_event", {
    p_subject_type: input.subjectType,
    p_subject_id: input.subjectId,
    p_event_type: input.eventType,
    p_order_id: input.orderId ?? null,
    p_payload: input.payload ?? {},
  });
  if (error) return null;
  return (data as string | null) ?? null;
}

/** Lit la règle active (non expirée) pour une clé donnée. Null si absente. */
async function getActiveRule(
  ruleKey: string,
  subjectType: GamificationSubjectType,
): Promise<{ id: string; value: number } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gamification_rules")
    .select("id, value")
    .eq("rule_key", ruleKey)
    .eq("subject_type", subjectType)
    .is("valid_to", null)
    .order("valid_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const value = Number(data.value as unknown);
  if (!Number.isFinite(value)) return null;
  return { id: data.id as string, value };
}

/**
 * Octroie de l'XP selon une règle nommée. `dedupeKey` doit identifier de
 * façon stable la cause (ex. `order_completed:${orderId}`) : un second
 * appel avec la même clé est silencieusement ignoré (protection contre un
 * recalcul rejoué deux fois). Si la règle n'existe pas, n'octroie rien
 * plutôt que d'inventer une valeur.
 */
async function grantXpByRule(input: {
  subjectType: GamificationSubjectType;
  subjectId: string;
  eventId: string | null;
  ruleKey: string;
  reason: string;
  dedupeKey: string;
}): Promise<void> {
  const rule = await getActiveRule(input.ruleKey, input.subjectType);
  if (!rule || rule.value === 0) return;
  const supabase = await createClient();
  await supabase.rpc("grant_gamification_xp", {
    p_subject_type: input.subjectType,
    p_subject_id: input.subjectId,
    p_event_id: input.eventId,
    p_delta_xp: Math.round(rule.value),
    p_reason: input.reason,
    p_rule_version_id: rule.id,
    p_dedupe_key: input.dedupeKey,
  });
}

/* ------------------------------------------------------------------ */
/* Lecture des événements sur une fenêtre adaptative                   */
/* ------------------------------------------------------------------ */

const ADAPTIVE_WINDOWS_DAYS = [90, 180, 365, null] as const;
const MIN_SAMPLE = 5;

async function fetchEventsInWindow(
  subjectType: GamificationSubjectType,
  subjectId: string,
  eventTypes: GamificationEventType[],
  days: number | null,
) {
  const supabase = await createClient();
  let query = supabase
    .from("gamification_events")
    .select("event_type, payload, created_at")
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId)
    .eq("is_void", false)
    .in("event_type", eventTypes)
    .order("created_at", { ascending: true });
  if (days !== null) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", cutoff);
  }
  const { data } = await query;
  return data ?? [];
}

/**
 * Fenêtre temporelle adaptative (§10 du cahier des charges) : on part
 * d'une fenêtre récente et on l'élargit tant que l'échantillon reste sous
 * le seuil minimal, jusqu'à tout l'historique. Favorise la performance
 * récente quand il y a assez de volume, sans laisser un traiteur peu
 * actif sans aucune donnée.
 */
async function fetchAdaptiveEvents(
  subjectType: GamificationSubjectType,
  subjectId: string,
  eventTypes: GamificationEventType[],
) {
  let rows: Awaited<ReturnType<typeof fetchEventsInWindow>> = [];
  for (const days of ADAPTIVE_WINDOWS_DAYS) {
    rows = await fetchEventsInWindow(subjectType, subjectId, eventTypes, days);
    if (rows.length >= MIN_SAMPLE || days === null) break;
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* Régularisation statistique (§9 du cahier des charges)                */
/*                                                                      */
/* Lissage bayésien façon "moyenne IMDB" : un sujet avec peu de données */
/* est ramené vers une moyenne de référence, pondérée par son volume    */
/* d'échantillon. `k` est la "constante de crédibilité" — le nombre     */
/* d'observations nécessaire pour peser autant que la référence. Ça     */
/* évite qu'un traiteur à 2 commandes obtienne un score extrême dans un */
/* sens ou l'autre, sans pour autant masquer sa progression derrière un */
/* seuil binaire.                                                       */
/* ------------------------------------------------------------------ */
function shrink(observed: number, n: number, prior: number, k: number): number {
  if (n <= 0) return prior;
  return (n / (n + k)) * observed + (k / (n + k)) * prior;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/* ------------------------------------------------------------------ */
/* Calcul des métriques (0–100, indépendantes — jamais un seul score   */
/* global, §5 du cahier des charges)                                    */
/* ------------------------------------------------------------------ */

async function computeTraiteurMetrics(traiteurId: string): Promise<GamificationMetrics> {
  const events = await fetchAdaptiveEvents(
    "traiteur",
    traiteurId,
    ["ORDER_COMPLETED", "ORDER_CANCELLED_BY_TRAITEUR", "REVIEW_RECEIVED"],
  );

  const completed = events.filter((e) => e.event_type === "ORDER_COMPLETED");
  const cancelled = events.filter((e) => e.event_type === "ORDER_CANCELLED_BY_TRAITEUR");
  const reviews = events.filter((e) => e.event_type === "REVIEW_RECEIVED");

  // Fiabilité : part des commandes non annulées par le traiteur lui-même,
  // parmi celles qu'il a menées à terme (complétées ou annulées par lui).
  const terminalCount = completed.length + cancelled.length;
  const reliabilityObserved = terminalCount ? completed.length / terminalCount : 1;
  const reliability = shrink(reliabilityObserved * 100, terminalCount, 90, 8);

  // Réactivité : généralise le badge livré plus tôt cette session, à
  // partir du temps de réponse enregistré sur les commandes terminées.
  const responseMinutes = [...completed, ...cancelled]
    .map((e) => (e.payload as { responseMinutes?: number } | null)?.responseMinutes)
    .filter((v): v is number => typeof v === "number");
  const avgResponse = mean(responseMinutes);
  const responsivenessObserved = avgResponse !== null ? clamp(100 - avgResponse * 2, 0, 100) : 50;
  const responsiveness = shrink(responsivenessObserved, responseMinutes.length, 50, 8);

  // Qualité : moyenne des notes reçues (1–5 → 20–100), lissée vers une
  // référence neutre tant qu'il y a peu d'avis.
  const ratings = reviews
    .map((e) => (e.payload as { rating?: number } | null)?.rating)
    .filter((v): v is number => typeof v === "number");
  const avgRating = mean(ratings) ?? 3;
  const quality = shrink(avgRating * 20, ratings.length, 70, 5);

  // Activité : volume de commandes complétées, en échelle logarithmique
  // pour ne jamais sur-récompenser le pur volume (exigence explicite du
  // cahier des charges — pas de course à la quantité).
  const activity = clamp(20 * Math.log(1 + completed.length), 0, 100);

  // Régularité : compare la fiabilité sur la première et la seconde
  // moitié de la fenêtre — un traiteur stable est récompensé, pas
  // seulement celui qui a eu un pic ponctuel.
  const terminal = [...completed, ...cancelled].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  const mid = Math.floor(terminal.length / 2);
  const firstHalf = terminal.slice(0, mid);
  const secondHalf = terminal.slice(mid);
  const halfReliability = (half: typeof terminal) => {
    if (!half.length) return null;
    const ok = half.filter((e) => e.event_type === "ORDER_COMPLETED").length;
    return ok / half.length;
  };
  const r1 = halfReliability(firstHalf);
  const r2 = halfReliability(secondHalf);
  const regularityObserved = r1 !== null && r2 !== null ? clamp(100 - Math.abs(r1 - r2) * 100, 0, 100) : 70;
  const regularity = shrink(regularityObserved, Math.min(firstHalf.length, secondHalf.length), 70, 5);

  return {
    reliability: Math.round(reliability),
    responsiveness: Math.round(responsiveness),
    quality: Math.round(quality),
    activity: Math.round(activity),
    regularity: Math.round(regularity),
  };
}

async function computeOrganizerMetrics(organizerId: string): Promise<GamificationMetrics> {
  const events = await fetchAdaptiveEvents(
    "organizer",
    organizerId,
    ["ORDER_COMPLETED_AS_CLIENT", "ORDER_CANCELLED_BY_CLIENT", "MESSAGE_RESPONDED"],
  );

  const completed = events.filter((e) => e.event_type === "ORDER_COMPLETED_AS_CLIENT");
  const cancelled = events.filter((e) => e.event_type === "ORDER_CANCELLED_BY_CLIENT");
  const messages = events.filter((e) => e.event_type === "MESSAGE_RESPONDED");

  const terminalCount = completed.length + cancelled.length;
  const reliabilityObserved = terminalCount ? completed.length / terminalCount : 1;
  const reliability = shrink(reliabilityObserved * 100, terminalCount, 90, 8);

  // Communication : volume de réponses dans les fils de discussion,
  // échelle logarithmique (même logique anti-sur-pondération du volume).
  const communication = clamp(20 * Math.log(1 + messages.length), 0, 100);

  // Fidélité : part des commandes qui reviennent chez un traiteur déjà
  // fréquenté, plutôt qu'un traiteur différent à chaque fois.
  const traiteurIds = completed
    .map((e) => (e.payload as { traiteurId?: string } | null)?.traiteurId)
    .filter((v): v is string => typeof v === "string");
  const distinctTraiteurs = new Set(traiteurIds).size;
  const loyaltyObserved = traiteurIds.length ? (1 - distinctTraiteurs / traiteurIds.length) * 100 : 0;
  const loyalty = shrink(loyaltyObserved, traiteurIds.length, 30, 5);

  const activity = clamp(20 * Math.log(1 + completed.length), 0, 100);

  return {
    reliability: Math.round(reliability),
    communication: Math.round(communication),
    loyalty: Math.round(loyalty),
    activity: Math.round(activity),
  };
}

/* ------------------------------------------------------------------ */
/* Paliers                                                              */
/* ------------------------------------------------------------------ */

function levelFrom(row: Record<string, unknown>): GamificationLevel {
  return {
    id: row.id as string,
    levelKey: row.level_key as string,
    name: row.name as string,
    minXp: Number(row.min_xp ?? 0),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

async function getLevels(
  subjectType: GamificationSubjectType,
): Promise<{ level: GamificationLevel; thresholds: Record<string, number> }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gamification_levels")
    .select("*")
    .eq("subject_type", subjectType)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((row) => ({
    level: levelFrom(row),
    thresholds: (row.min_metric_thresholds as Record<string, number>) ?? {},
  }));
}

/**
 * Le palier courant est réévalué en entier à chaque recalcul, jamais
 * acquis définitivement — un palier redescend naturellement si les
 * métriques baissent (§4 du cahier des charges), sans logique de
 * "rétrogradation" séparée : c'est la même fonction, réévaluée à froid.
 */
function determineLevel(
  levels: { level: GamificationLevel; thresholds: Record<string, number> }[],
  xp: number,
  metrics: GamificationMetrics,
): GamificationLevel | null {
  if (!levels.length) return null;
  const sorted = [...levels].sort((a, b) => b.level.sortOrder - a.level.sortOrder);
  for (const { level, thresholds } of sorted) {
    if (xp < level.minXp) continue;
    const meetsThresholds = Object.entries(thresholds).every(
      ([metric, min]) => (metrics[metric] ?? 0) >= min,
    );
    if (meetsThresholds) return level;
  }
  return sorted[sorted.length - 1]?.level ?? null;
}

/* ------------------------------------------------------------------ */
/* État courant d'un sujet                                              */
/* ------------------------------------------------------------------ */

async function getCurrentXp(subjectType: GamificationSubjectType, subjectId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gamification_xp_ledger")
    .select("delta_xp")
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId)
    .is("voided_at", null);
  return (data ?? []).reduce((sum, row) => sum + Number(row.delta_xp ?? 0), 0);
}

/**
 * Recalcule entièrement l'état d'un sujet à partir des événements et du
 * grand livre XP (jamais l'inverse) et matérialise le résultat. Peut être
 * rappelée à tout moment sans risque de dérive — c'est ce qui permet la
 * correction/recalcul exigés au §16 du cahier des charges.
 */
export async function recomputeSubjectState(
  subjectType: GamificationSubjectType,
  subjectId: string,
): Promise<GamificationSubjectState> {
  const [metrics, xp, levels] = await Promise.all([
    subjectType === "traiteur" ? computeTraiteurMetrics(subjectId) : computeOrganizerMetrics(subjectId),
    getCurrentXp(subjectType, subjectId),
    getLevels(subjectType),
  ]);

  const level = determineLevel(levels, xp, metrics);
  const sorted = [...levels].sort((a, b) => a.level.sortOrder - b.level.sortOrder);
  const currentIndex = level ? sorted.findIndex((l) => l.level.id === level.id) : -1;
  const nextLevel = currentIndex >= 0 ? (sorted[currentIndex + 1]?.level ?? null) : null;

  const supabase = await createClient();
  await supabase.rpc("upsert_gamification_subject_state", {
    p_subject_type: subjectType,
    p_subject_id: subjectId,
    p_level_id: level?.id ?? null,
    p_current_xp: xp,
    p_metrics: metrics,
  });

  return {
    subjectType,
    subjectId,
    level,
    nextLevel,
    currentXp: xp,
    metrics,
    lastRecalculatedAt: new Date().toISOString(),
  };
}

/** Lecture seule de l'état matérialisé — pas de recalcul. */
export async function getSubjectState(
  subjectType: GamificationSubjectType,
  subjectId: string,
): Promise<GamificationSubjectState> {
  const supabase = await createClient();
  const [{ data: stateRow }, levels] = await Promise.all([
    supabase
      .from("gamification_subject_state")
      .select("*")
      .eq("subject_type", subjectType)
      .eq("subject_id", subjectId)
      .maybeSingle(),
    getLevels(subjectType),
  ]);

  const sorted = [...levels].sort((a, b) => a.level.sortOrder - b.level.sortOrder);

  if (!stateRow) {
    // Jamais recalculé : palier de départ par défaut, aucune métrique.
    return {
      subjectType,
      subjectId,
      level: sorted[0]?.level ?? null,
      nextLevel: sorted[1]?.level ?? null,
      currentXp: 0,
      metrics: {},
      lastRecalculatedAt: null,
    };
  }

  const levelId = stateRow.current_level_id as string | null;
  const currentIndex = levelId ? sorted.findIndex((l) => l.level.id === levelId) : -1;

  return {
    subjectType,
    subjectId,
    level: currentIndex >= 0 ? sorted[currentIndex].level : null,
    nextLevel: currentIndex >= 0 ? (sorted[currentIndex + 1]?.level ?? null) : null,
    currentXp: Number(stateRow.current_xp ?? 0),
    metrics: (stateRow.metrics as GamificationMetrics) ?? {},
    lastRecalculatedAt: stateRow.last_recalculated_at as string,
  };
}

/** Historique du grand livre XP — pour un écran "pourquoi ce score ?". */
export async function getLedgerHistory(
  subjectType: GamificationSubjectType,
  subjectId: string,
  limit = 20,
): Promise<GamificationLedgerEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gamification_xp_ledger")
    .select("id, delta_xp, reason, created_at, voided_at")
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    deltaXp: Number(row.delta_xp ?? 0),
    reason: row.reason as string,
    createdAt: row.created_at as string,
    voided: row.voided_at !== null,
  }));
}

/* ------------------------------------------------------------------ */
/* Orchestrateurs métier — appelés depuis app/marketplace/actions.ts   */
/* ------------------------------------------------------------------ */

/**
 * Commande passée à un état terminal (récupérée ou annulée). Émet les
 * événements et l'XP pour la partie concernée, puis recalcule les deux
 * états (traiteur ET organisateur, quel que soit qui est en cause : le
 * dénominateur "activité/fidélité" de l'autre partie bouge aussi).
 */
export async function handleOrderTerminal(order: {
  id: string;
  traiteurId: string;
  userId: string;
  status: "recuperee" | "annulee";
  cancelledBy: "client" | "traiteur" | null;
  createdAt: string;
  respondedAt: string | null;
  totalAmount: number;
}): Promise<void> {
  const responseMinutes = order.respondedAt
    ? (new Date(order.respondedAt).getTime() - new Date(order.createdAt).getTime()) / 60000
    : null;

  if (order.status === "recuperee") {
    const traiteurEventId = await recordEvent({
      subjectType: "traiteur",
      subjectId: order.traiteurId,
      eventType: "ORDER_COMPLETED",
      orderId: order.id,
      payload: { responseMinutes, amount: order.totalAmount },
    });
    const organizerEventId = await recordEvent({
      subjectType: "organizer",
      subjectId: order.userId,
      eventType: "ORDER_COMPLETED_AS_CLIENT",
      orderId: order.id,
      payload: { traiteurId: order.traiteurId, amount: order.totalAmount },
    });

    await grantXpByRule({
      subjectType: "traiteur",
      subjectId: order.traiteurId,
      eventId: traiteurEventId,
      ruleKey: "xp.order_completed",
      reason: "Commande complétée",
      dedupeKey: `order_completed:${order.id}`,
    });
    if (responseMinutes !== null && responseMinutes < 15) {
      await grantXpByRule({
        subjectType: "traiteur",
        subjectId: order.traiteurId,
        eventId: traiteurEventId,
        ruleKey: "xp.order_responded_fast",
        reason: "Réponse rapide (< 15 min)",
        dedupeKey: `order_responded_fast:${order.id}`,
      });
    }
    await grantXpByRule({
      subjectType: "organizer",
      subjectId: order.userId,
      eventId: organizerEventId,
      ruleKey: "xp.order_completed_as_client",
      reason: "Commande honorée",
      dedupeKey: `order_completed_as_client:${order.id}`,
    });
  } else if (order.status === "annulee" && order.cancelledBy === "traiteur") {
    const eventId = await recordEvent({
      subjectType: "traiteur",
      subjectId: order.traiteurId,
      eventType: "ORDER_CANCELLED_BY_TRAITEUR",
      orderId: order.id,
      payload: { responseMinutes },
    });
    await grantXpByRule({
      subjectType: "traiteur",
      subjectId: order.traiteurId,
      eventId,
      ruleKey: "xp.order_cancelled_by_traiteur",
      reason: "Commande annulée par le traiteur",
      dedupeKey: `order_cancelled_by_traiteur:${order.id}`,
    });
  } else if (order.status === "annulee" && order.cancelledBy === "client") {
    const eventId = await recordEvent({
      subjectType: "organizer",
      subjectId: order.userId,
      eventType: "ORDER_CANCELLED_BY_CLIENT",
      orderId: order.id,
      payload: {},
    });
    await grantXpByRule({
      subjectType: "organizer",
      subjectId: order.userId,
      eventId,
      ruleKey: "xp.order_cancelled_by_client",
      reason: "Commande annulée par l'organisateur",
      dedupeKey: `order_cancelled_by_client:${order.id}`,
    });
  }

  await Promise.all([
    recomputeSubjectState("traiteur", order.traiteurId),
    recomputeSubjectState("organizer", order.userId),
  ]);
}

/** Avis déposé sur une commande récupérée. */
export async function handleReviewSubmitted(review: {
  orderId: string;
  traiteurId: string;
  organizerId: string;
  rating: number;
}): Promise<void> {
  const traiteurEventId = await recordEvent({
    subjectType: "traiteur",
    subjectId: review.traiteurId,
    eventType: "REVIEW_RECEIVED",
    orderId: review.orderId,
    payload: { rating: review.rating },
  });
  const organizerEventId = await recordEvent({
    subjectType: "organizer",
    subjectId: review.organizerId,
    eventType: "REVIEW_LEFT",
    orderId: review.orderId,
    payload: { rating: review.rating },
  });

  if (review.rating >= 4) {
    await grantXpByRule({
      subjectType: "traiteur",
      subjectId: review.traiteurId,
      eventId: traiteurEventId,
      ruleKey: "xp.review_received_positive",
      reason: "Excellente évaluation reçue",
      dedupeKey: `review_received:${review.orderId}`,
    });
  } else if (review.rating <= 2) {
    await grantXpByRule({
      subjectType: "traiteur",
      subjectId: review.traiteurId,
      eventId: traiteurEventId,
      ruleKey: "xp.review_received_negative",
      reason: "Évaluation en retrait reçue",
      dedupeKey: `review_received:${review.orderId}`,
    });
  }
  await grantXpByRule({
    subjectType: "organizer",
    subjectId: review.organizerId,
    eventId: organizerEventId,
    ruleKey: "xp.review_left",
    reason: "Avis laissé",
    dedupeKey: `review_left:${review.orderId}`,
  });

  await Promise.all([
    recomputeSubjectState("traiteur", review.traiteurId),
    recomputeSubjectState("organizer", review.organizerId),
  ]);
}

/**
 * Réponse dans le fil de discussion d'une commande. Pas d'XP (le chat est
 * un vecteur de farming trop facile), seulement un signal pour la
 * métrique "communication" — recalculée uniquement côté organisateur en
 * v1, seul type de sujet à l'utiliser aujourd'hui.
 */
export async function handleMessageResponded(input: {
  orderId: string;
  senderSubjectType: GamificationSubjectType;
  senderSubjectId: string;
}): Promise<void> {
  await recordEvent({
    subjectType: input.senderSubjectType,
    subjectId: input.senderSubjectId,
    eventType: "MESSAGE_RESPONDED",
    orderId: input.orderId,
    payload: {},
  });
  if (input.senderSubjectType === "organizer") {
    await recomputeSubjectState("organizer", input.senderSubjectId);
  }
}
