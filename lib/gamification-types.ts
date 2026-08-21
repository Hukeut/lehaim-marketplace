/**
 * Types partagés entre composants serveur ET client pour le moteur de
 * gamification. Même règle que marketplace-types.ts : rien ici ne doit
 * importer "server-only" ni dépendre de "next/headers".
 */

export type GamificationSubjectType = "traiteur" | "organizer";

export type GamificationEventType =
  | "ORDER_COMPLETED"
  | "ORDER_COMPLETED_AS_CLIENT"
  | "ORDER_CANCELLED_BY_TRAITEUR"
  | "ORDER_CANCELLED_BY_CLIENT"
  | "REVIEW_RECEIVED"
  | "REVIEW_LEFT"
  | "MESSAGE_RESPONDED";

/** Palier de progression. Les noms sont des points de départ (voir docs/gamification-architecture-proposal.md). */
export type GamificationLevel = {
  id: string;
  levelKey: string;
  name: string;
  minXp: number;
  sortOrder: number;
};

/**
 * Métriques 0–100, indépendantes les unes des autres (jamais un seul
 * score global — voir §5 du cahier des charges). Les clés dépendent du
 * subject_type : reliability/responsiveness/quality/activity/regularity
 * pour un traiteur, reliability/communication/loyalty/activity pour un
 * organisateur.
 */
export type GamificationMetrics = Record<string, number>;

export type GamificationSubjectState = {
  subjectType: GamificationSubjectType;
  subjectId: string;
  level: GamificationLevel | null;
  /** Prochain palier à atteindre, pour afficher une progression concrète. */
  nextLevel: GamificationLevel | null;
  currentXp: number;
  metrics: GamificationMetrics;
  lastRecalculatedAt: string | null;
};

/** Une ligne du grand livre XP, pour l'écran "pourquoi mon score a changé". */
export type GamificationLedgerEntry = {
  id: string;
  deltaXp: number;
  reason: string;
  createdAt: string;
  voided: boolean;
};
