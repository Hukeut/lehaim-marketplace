import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { run } from "@/lib/db";

/**
 * Côté offre de la place de marché : les dossiers de candidature des commerces,
 * leurs pièces et leur cacherout.
 *
 * Ce que ce module refuse de faire : décorer. La checklist de validation n'est
 * pas une liste de cases à cocher à la main, elle se déduit de ce qui a été
 * réellement déposé. Un administrateur qui coche « certificat valide » alors
 * qu'il a expiré la veille est un administrateur qu'on a mal outillé.
 */

export type ApplicationStatus = "draft" | "submitted" | "complement" | "approved" | "rejected";
export type DocumentKind = "id_front" | "id_back" | "kbis" | "license" | "kashrut";
export type DocumentStatus = "pending" | "uploaded" | "rejected";

export type Certificate = {
  authority: string;
  detail: string | null;
  validFrom: string;
  validTo: string;
  mentions: string[];
  /** Négatif si le certificat a déjà expiré. */
  daysLeft: number;
};

export type ApplicationRow = {
  id: string;
  reference: string;
  status: ApplicationStatus;
  step: number;
  submittedAt: string | null;
  /** Jours écoulés depuis le dépôt. C'est ce qui trie la file. */
  ageDays: number | null;
  shopId: string;
  shopName: string;
  category: string;
  city: string | null;
  certificate: Certificate | null;
};

export type ChecklistItem = { label: string; ok: boolean };

export type ApplicationDetail = ApplicationRow & {
  decisionReason: string | null;
  legalName: string | null;
  siret: string | null;
  address: string | null;
  phone: string | null;
  description: string | null;
  commissionRate: number;
  documents: {
    kind: DocumentKind;
    status: DocumentStatus;
    rejectedReason: string | null;
    uploadedAt: string | null;
  }[];
  checklist: ChecklistItem[];
};

/** Organismes dont on sait vérifier le certificat. */
const KNOWN_AUTHORITIES = ["badatz", "rabbinat", "rabbanout", "kehilat", "beth din"];

const DAY = 86_400_000;

function daysBetween(from: string | null, to: Date): number | null {
  if (!from) return null;
  return Math.floor((to.getTime() - new Date(from).getTime()) / DAY);
}

type CertRow = {
  authority: string;
  detail: string | null;
  valid_from: string;
  valid_to: string;
  mentions: string[];
};

function certificateFrom(rows: CertRow[] | null, now: Date): Certificate | null {
  // Un commerce peut avoir renouvelé : c'est le certificat qui court le plus
  // loin qui fait foi, pas le dernier déposé.
  const latest = (rows ?? []).slice().sort((a, b) => b.valid_to.localeCompare(a.valid_to))[0];
  if (!latest) return null;
  return {
    authority: latest.authority,
    detail: latest.detail,
    validFrom: latest.valid_from,
    validTo: latest.valid_to,
    mentions: latest.mentions ?? [],
    daysLeft: Math.floor((new Date(latest.valid_to).getTime() - now.getTime()) / DAY),
  };
}

const SELECT_ROW =
  "id, reference, status, step, submitted_at, shop_id, shops(id, name, category, city)";

/** Nombre de dossiers qui attendent une décision — le badge de la navigation. */
export const pendingApplicationCount = cache(async function pendingApplicationCount() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("shop_applications")
    .select("*", { count: "exact", head: true })
    .in("status", ["submitted", "complement"]);
  return count ?? 0;
});

/**
 * La file de validation, du plus ancien au plus récent : un dossier qui attend
 * depuis cinq jours passe avant celui d'hier.
 */
export const listApplications = cache(async function listApplications(): Promise<ApplicationRow[]> {
  const supabase = await createClient();
  const now = new Date();

  const { data } = await run(
    "listApplications/shop_applications",
    supabase
      .from("shop_applications")
      .select(SELECT_ROW)
      .order("submitted_at", { ascending: true, nullsFirst: false }),
  );

  const rows = (data ?? []) as unknown as {
    id: string;
    reference: string;
    status: ApplicationStatus;
    step: number;
    submitted_at: string | null;
    shop_id: string;
    shops: { id: string; name: string; category: string; city: string | null } | null;
  }[];

  if (!rows.length) return [];

  const { data: certs } = await run(
    "listApplications/kashrut_certificates",
    supabase
      .from("kashrut_certificates")
      .select("shop_id, authority, detail, valid_from, valid_to, mentions")
      .in("shop_id", rows.map((r) => r.shop_id)),
  );

  const byShop = new Map<string, CertRow[]>();
  for (const c of (certs ?? []) as unknown as (CertRow & { shop_id: string })[]) {
    byShop.set(c.shop_id, [...(byShop.get(c.shop_id) ?? []), c]);
  }

  return rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    status: row.status,
    step: row.step,
    submittedAt: row.submitted_at,
    ageDays: daysBetween(row.submitted_at, now),
    shopId: row.shop_id,
    shopName: row.shops?.name ?? "—",
    category: row.shops?.category ?? "—",
    city: row.shops?.city ?? null,
    certificate: certificateFrom(byShop.get(row.shop_id) ?? null, now),
  }));
});

/** Un dossier, avec ses pièces et la checklist déduite de leur état. */
export const getApplication = cache(async function getApplication(
  reference: string,
): Promise<ApplicationDetail | null> {
  const supabase = await createClient();
  const now = new Date();

  const { data: app } = await run(
    "getApplication/shop_applications",
    supabase
      .from("shop_applications")
      .select(
        "id, reference, status, step, submitted_at, decision_reason, shop_id, shops(id, name, category, city, legal_name, siret, address, phone, description, commission_rate)",
      )
      .eq("reference", reference)
      .maybeSingle(),
  );

  if (!app) return null;

  const row = app as unknown as {
    id: string;
    reference: string;
    status: ApplicationStatus;
    step: number;
    submitted_at: string | null;
    decision_reason: string | null;
    shop_id: string;
    shops: {
      name: string;
      category: string;
      city: string | null;
      legal_name: string | null;
      siret: string | null;
      address: string | null;
      phone: string | null;
      description: string | null;
      commission_rate: number;
    } | null;
  };

  const [docsRes, certsRes] = await Promise.all([
    run(
      "getApplication/shop_documents",
      supabase
        .from("shop_documents")
        .select("kind, status, rejected_reason, uploaded_at")
        .eq("shop_id", row.shop_id),
    ),
    run(
      "getApplication/kashrut_certificates",
      supabase
        .from("kashrut_certificates")
        .select("authority, detail, valid_from, valid_to, mentions")
        .eq("shop_id", row.shop_id),
    ),
  ]);

  const documents = ((docsRes.data ?? []) as unknown as {
    kind: DocumentKind;
    status: DocumentStatus;
    rejected_reason: string | null;
    uploaded_at: string | null;
  }[]).map((d) => ({
    kind: d.kind,
    status: d.status,
    rejectedReason: d.rejected_reason,
    uploadedAt: d.uploaded_at,
  }));

  const certificate = certificateFrom(certsRes.data as CertRow[] | null, now);
  const has = (kind: DocumentKind) =>
    documents.some((d) => d.kind === kind && d.status === "uploaded");

  // Chaque ligne se déduit d'un fait vérifiable. Aucune n'est cochable à la
  // main : la checklist décrit le dossier, elle ne recueille pas un avis.
  const checklist: ChecklistItem[] = [
    { label: "Pièce d'identité recto et verso", ok: has("id_front") && has("id_back") },
    { label: "Numéro d'entreprise renseigné", ok: Boolean(row.shops?.siret) },
    { label: "Justificatif d'entreprise fourni", ok: has("kbis") },
    { label: "Adresse du commerce renseignée", ok: Boolean(row.shops?.address) },
    { label: "Certificat de cacherout déposé", ok: has("kashrut") },
    {
      label: "Certificat en cours de validité",
      ok: Boolean(certificate && certificate.daysLeft > 0),
    },
    {
      label: "Organisme certificateur reconnu",
      ok: Boolean(
        certificate &&
          KNOWN_AUTHORITIES.some((a) => certificate.authority.toLowerCase().includes(a)),
      ),
    },
    { label: "Licence d'exploitation fournie", ok: has("license") },
  ];

  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    step: row.step,
    submittedAt: row.submitted_at,
    ageDays: daysBetween(row.submitted_at, now),
    shopId: row.shop_id,
    shopName: row.shops?.name ?? "—",
    category: row.shops?.category ?? "—",
    city: row.shops?.city ?? null,
    certificate,
    decisionReason: row.decision_reason,
    legalName: row.shops?.legal_name ?? null,
    siret: row.shops?.siret ?? null,
    address: row.shops?.address ?? null,
    phone: row.shops?.phone ?? null,
    description: row.shops?.description ?? null,
    commissionRate: Number(row.shops?.commission_rate ?? 18),
    documents,
    checklist,
  };
});
