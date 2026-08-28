import "server-only";

/**
 * Le paiement en ligne — via Grow (ex-Meshulam), le prestataire israélien
 * dont les comptes marchands sont ouverts aux sociétés enregistrées en
 * Israël (contrairement à Stripe et Revolut Business, tous deux fermés aux
 * sociétés israéliennes — voir la conversation avant ce fichier).
 *
 * Toutes les identités (userId, pageCode) sont propres à chaque compte Grow
 * et doivent être obtenues auprès du support Grow avant de pouvoir tester
 * quoi que ce soit, même en sandbox — voir .env.example.
 *
 * Contrairement à Stripe, Grow encaisse directement en shekels (pas de
 * conversion en centimes/agorot) : un montant de 42.50 se transmet tel
 * quel dans le paramètre `sum`.
 *
 * Toutes les requêtes sont envoyées exclusivement depuis le serveur — Grow
 * bloque les appels faits depuis un navigateur.
 */

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} manquant — voir .env.example`);
  return value;
}

function baseUrl(): string {
  const env = process.env.GROW_ENV === "production" ? "production" : "sandbox";
  return env === "production"
    ? "https://secure.meshulam.co.il/api/light/server/1.0"
    : "https://sandbox.meshulam.co.il/api/light/server/1.0";
}

function growUserId(): string {
  return requiredEnv("GROW_USER_ID");
}

/**
 * Les pageCode identifient chacun un mode de paiement (ou un groupe) sur le
 * tableau de bord Grow. La page "générique" carte+Bit est le socle ; Google
 * Pay et Apple Pay ont chacun leur propre pageCode côté Grow (pages
 * séparées, pas de sélecteur unifié comme chez Stripe) — optionnels tant
 * qu'ils ne sont pas configurés.
 */
export function pageCodeCardBit(): string {
  return requiredEnv("GROW_PAGE_CODE_CARD_BIT");
}
export function pageCodeGooglePay(): string | null {
  return process.env.GROW_PAGE_CODE_GOOGLE_PAY ?? null;
}
export function pageCodeApplePay(): string | null {
  return process.env.GROW_PAGE_CODE_APPLE_PAY ?? null;
}

/** Le mode de paiement choisi côté client — voir ReserverForm. */
export type GrowMethod = "card_bit" | "google_pay" | "apple_pay";

export function pageCodeFor(method: GrowMethod): string {
  switch (method) {
    case "google_pay":
      return pageCodeGooglePay() ?? pageCodeCardBit();
    case "apple_pay":
      return pageCodeApplePay() ?? pageCodeCardBit();
    default:
      return pageCodeCardBit();
  }
}

/** transactionTypeId renvoyé par Grow — utile pour afficher le moyen utilisé. */
export const GROW_TRANSACTION_LABEL: Record<number, string> = {
  1: "Carte bancaire",
  6: "Bit",
  13: "Apple Pay",
  14: "Google Pay",
};

type GrowSuccess<T> = { status: 1; err: ""; data: T };
type GrowFailure = { status: 0; err: { id: number; message: string }; data: "" };
type GrowResponse<T> = GrowSuccess<T> | GrowFailure;

/**
 * Toutes les requêtes Grow attendent un corps FormData (pas du JSON), y
 * compris pour les champs imbriqués comme pageField[fullName] — la clé
 * porte les crochets littéralement.
 */
async function post<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const body = new FormData();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    body.set(key, String(value));
  }

  const res = await fetch(`${baseUrl()}/${path}`, { method: "POST", body });
  const json = (await res.json()) as GrowResponse<T>;

  if (json.status !== 1) {
    const message = json.status === 0 ? json.err.message : "Erreur Grow inconnue";
    throw new Error(`Grow ${path} a échoué — ${message}`);
  }
  return json.data;
}

/* ------------------------------------------------------------------ */
/* Ouverture d'un paiement (page hébergée Grow)                        */
/* ------------------------------------------------------------------ */

export interface CreatePaymentProcessArgs {
  pageCode: string;
  sum: number;
  successUrl: string;
  cancelUrl: string;
  description: string;
  fullName: string;
  phone: string;
  email?: string;
  notifyUrl: string;
  /** 1 = charge classique. 3 = enregistrement de jeton seul (sum doit alors valoir 1). */
  chargeType?: 1 | 3;
  /** Le client a coché "mémoriser cette carte" — le jeton nous reviendra par notifyUrl. */
  saveCardToken?: boolean;
  /** Champs libres échoués tels quels dans le callback — on y met nos propres identifiants internes. */
  cField1?: string;
  cField2?: string;
}

export interface CreatePaymentProcessResult {
  processId: string;
  processToken: string;
  /** L'URL de la page de paiement hébergée par Grow — à ouvrir en redirection ou en iframe. */
  url: string;
}

export async function createPaymentProcess(
  args: CreatePaymentProcessArgs,
): Promise<CreatePaymentProcessResult> {
  return post<CreatePaymentProcessResult>("createPaymentProcess", {
    pageCode: args.pageCode,
    userId: growUserId(),
    chargeType: args.chargeType ?? 1,
    sum: args.sum,
    successUrl: args.successUrl,
    cancelUrl: args.cancelUrl,
    description: args.description,
    "pageField[fullName]": args.fullName,
    "pageField[phone]": args.phone,
    "pageField[email]": args.email,
    saveCardToken: args.saveCardToken ? 1 : 0,
    notifyUrl: args.notifyUrl,
    cField1: args.cField1,
    cField2: args.cField2,
  });
}

/* ------------------------------------------------------------------ */
/* Confirmation après le callback serveur-à-serveur                    */
/* ------------------------------------------------------------------ */

/**
 * Champs à réexpédier tels quels à approveTransaction, tels que reçus dans
 * le callback notifyUrl. À ne PAS appeler pour les transactions par jeton
 * (createTransactionWithToken) ni pour un enregistrement de jeton seul.
 */
const APPROVE_TRANSACTION_FIELDS = [
  "transactionId",
  "transactionToken",
  "transactionTypeId",
  "paymentType",
  "sum",
  "firstPaymentSum",
  "periodicalPaymentSum",
  "paymentsNum",
  "allPaymentsNum",
  "paymentDate",
  "asmachta",
  "description",
  "fullName",
  "payerPhone",
  "payerEmail",
  "cardSuffix",
  "cardType",
  "cardTypeCode",
  "cardBrand",
  "cardBrandCode",
  "cardExp",
  "processId",
  "processToken",
] as const;

export async function approveTransaction(
  pageCode: string,
  callback: Record<string, string | undefined>,
): Promise<void> {
  const params: Record<string, string> = { pageCode };
  for (const field of APPROVE_TRANSACTION_FIELDS) {
    const value = callback[field];
    if (value !== undefined) params[field] = value;
  }
  await post("approveTransaction", params);
}

/* ------------------------------------------------------------------ */
/* Charge directe via un jeton mémorisé (paiement en un clic)          */
/* ------------------------------------------------------------------ */

export interface ChargeTokenArgs {
  cardToken: string;
  sum: number;
  description: string;
  fullName: string;
  phone: string;
  /** Identifiant entier unique pour cette requête — sert de garde-fou anti-double-charge côté Grow. */
  transactionUniqueIdentifier: number;
}

export interface ChargeTokenResult {
  transactionId: string;
  transactionToken: string;
  asmachta?: string;
}

/**
 * Charge synchrone d'une carte déjà mémorisée — pas de redirection, pas de
 * callback à attendre, pas d'approveTransaction à appeler (interdit pour ce
 * flux d'après la doc Grow).
 */
export async function createTransactionWithToken(args: ChargeTokenArgs): Promise<ChargeTokenResult> {
  return post<ChargeTokenResult>("createTransactionWithToken", {
    cardToken: args.cardToken,
    userId: growUserId(),
    sum: args.sum,
    description: args.description,
    paymentType: 2, // régulier (par opposition à prélèvement ou paiements échelonnés)
    "pageField[fullName]": args.fullName,
    "pageField[phone]": args.phone,
    transactionUniqueIdentifier: args.transactionUniqueIdentifier,
  });
}

/* ------------------------------------------------------------------ */
/* Remboursement                                                       */
/* ------------------------------------------------------------------ */

export interface RefundArgs {
  transactionId: string;
  transactionToken: string;
  refundSum: number;
}

/**
 * Rembourse une transaction déjà chargée. Grow traite automatiquement un
 * remboursement le jour même comme une annulation totale — pas d'action
 * différente à faire de notre côté. Limite Grow : 2 remboursements par API
 * par transaction, au-delà il faut passer par leur support.
 */
export async function refundTransaction(args: RefundArgs): Promise<void> {
  await post("refundTransaction", {
    transactionId: args.transactionId,
    transactionToken: args.transactionToken,
    refundSum: args.refundSum,
    userId: growUserId(),
  });
}

/** Un identifiant entier "unique" raisonnable pour transactionUniqueIdentifier. */
export function uniqueTransactionIdentifier(): number {
  return Date.now();
}

/* ------------------------------------------------------------------ */
/* Callback serveur-à-serveur (notifyUrl) — parsing partagé            */
/* ------------------------------------------------------------------ */

/** Le corps du callback Grow est du FormData, jamais du JSON. */
export async function parseGrowCallback(req: Request): Promise<Record<string, string>> {
  const form = await req.formData();
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

/**
 * cField1/cField2 arrivent parfois à plat, parfois regroupés dans un champ
 * `customFields` au format JSON (les deux formes sont documentées par
 * Grow) — on essaie les deux.
 */
export function growCField(fields: Record<string, string>, n: 1 | 2): string | undefined {
  const direct = fields[`cField${n}`];
  if (direct) return direct;
  if (fields.customFields) {
    try {
      const parsed = JSON.parse(fields.customFields) as Record<string, string>;
      return parsed[`cField${n}`];
    } catch {
      return undefined;
    }
  }
  return undefined;
}
