import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/supabase/user";
import { run } from "@/lib/db";
import type { ApplicationStatus, DocumentKind, DocumentStatus } from "@/lib/market";

// Les libellés vivent à part : le rail les lit côté client.
export { STEPS, stepNumber, type StepSlug } from "@/lib/steps";
import type { StepSlug } from "@/lib/steps";

/**
 * Le tunnel marchand, côté commerçant.
 *
 * Le dossier se remplit en huit temps et se reprend là où on l'a laissé : un
 * commerçant remplit ça entre deux services, il ferme l'onglet et revient le
 * lendemain. L'étape atteinte vit donc en base, pas dans l'URL ni dans un
 * état de session.
 */

export type PartnerShop = {
  id: string;
  slug: string;
  name: string;
  category: string;
  status: string;
  legalName: string | null;
  siret: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  description: string | null;
  commissionRate: number;
  prepMinutes: number;
  preorderDeadline: string | null;
  slotCapacity: number;
  deliveryModes: string[];
  iban: string | null;
  payoutFrequency: string;
  contractSignature: string | null;
  contractSignedAt: string | null;
};

export type PartnerDossier = {
  shop: PartnerShop;
  application: {
    id: string;
    reference: string;
    status: ApplicationStatus;
    step: number;
    submittedAt: string | null;
    decisionReason: string | null;
  };
  documents: Record<DocumentKind, DocumentState>;
  certificate: {
    authority: string;
    detail: string | null;
    validFrom: string;
    validTo: string;
    mentions: string[];
  } | null;
  productCount: number;
  zoneCount: number;
  /** La grille d'ouverture, relue telle quelle : l'étape logistique la
   *  réécrit en bloc, donc elle doit pouvoir la réafficher en entier. */
  hours: { weekday: number; opensAt: string; closesAt: string }[];
};

type DocumentState = { status: DocumentStatus; filePath: string | null; rejectedReason: string | null };

/** Les cinq pièces attendues, toutes manquantes au départ. */
function emptyDocuments(): Record<DocumentKind, DocumentState> {
  const blank: DocumentState = { status: "pending", filePath: null, rejectedReason: null };
  return {
    id_front: { ...blank },
    id_back: { ...blank },
    kbis: { ...blank },
    license: { ...blank },
    kashrut: { ...blank },
  };
}

const SHOP_COLUMNS =
  "id, slug, name, category, status, legal_name, siret, address, city, phone, description, commission_rate, prep_minutes, preorder_deadline, slot_capacity, delivery_modes, iban, payout_frequency, contract_signature, contract_signed_at";

/**
 * Le dossier de la personne connectée, ou null si elle n'en a pas encore.
 *
 * Une personne = une boutique, pour l'instant. Un groupe qui gère plusieurs
 * commerces demandera un sélecteur, ce n'est pas le sujet du premier dossier.
 */
export const getMyDossier = cache(async function getMyDossier(): Promise<PartnerDossier | null> {
  const supabase = await createClient();
  const user = await currentUser();
  if (!user) return null;

  const { data: shopRow } = await run(
    "getMyDossier/shops",
    supabase.from("shops").select(SHOP_COLUMNS).eq("owner_id", user.id).maybeSingle(),
  );
  if (!shopRow) return null;

  const shop = shopRow as unknown as Record<string, unknown>;
  const shopId = shop.id as string;

  const [appRes, docsRes, certRes, productsRes, zonesRes, hoursRes] = await Promise.all([
    run(
      "getMyDossier/shop_applications",
      supabase
        .from("shop_applications")
        .select("id, reference, status, step, submitted_at, decision_reason")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ),
    run(
      "getMyDossier/shop_documents",
      supabase.from("shop_documents").select("kind, status, file_path, rejected_reason").eq("shop_id", shopId),
    ),
    run(
      "getMyDossier/kashrut_certificates",
      supabase
        .from("kashrut_certificates")
        .select("authority, detail, valid_from, valid_to, mentions")
        .eq("shop_id", shopId)
        .order("valid_to", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ),
    supabase.from("shop_products").select("*", { count: "exact", head: true }).eq("shop_id", shopId),
    supabase.from("delivery_zones").select("*", { count: "exact", head: true }).eq("shop_id", shopId),
    run(
      "getMyDossier/shop_hours",
      supabase.from("shop_hours").select("weekday, opens_at, closes_at").eq("shop_id", shopId),
    ),
  ]);

  if (!appRes.data) return null;
  const app = appRes.data as unknown as {
    id: string;
    reference: string;
    status: ApplicationStatus;
    step: number;
    submitted_at: string | null;
    decision_reason: string | null;
  };

  const documents = emptyDocuments();
  for (const d of (docsRes.data ?? []) as unknown as {
    kind: DocumentKind;
    status: DocumentStatus;
    file_path: string | null;
    rejected_reason: string | null;
  }[]) {
    documents[d.kind] = {
      status: d.status,
      filePath: d.file_path,
      rejectedReason: d.rejected_reason,
    };
  }

  const cert = certRes.data as unknown as {
    authority: string;
    detail: string | null;
    valid_from: string;
    valid_to: string;
    mentions: string[];
  } | null;

  return {
    shop: {
      id: shopId,
      slug: shop.slug as string,
      name: shop.name as string,
      category: shop.category as string,
      status: shop.status as string,
      legalName: (shop.legal_name as string) ?? null,
      siret: (shop.siret as string) ?? null,
      address: (shop.address as string) ?? null,
      city: (shop.city as string) ?? null,
      phone: (shop.phone as string) ?? null,
      description: (shop.description as string) ?? null,
      commissionRate: Number(shop.commission_rate ?? 18),
      prepMinutes: Number(shop.prep_minutes ?? 20),
      preorderDeadline: (shop.preorder_deadline as string) ?? null,
      slotCapacity: Number(shop.slot_capacity ?? 8),
      deliveryModes: (shop.delivery_modes as string[]) ?? [],
      iban: (shop.iban as string) ?? null,
      payoutFrequency: (shop.payout_frequency as string) ?? "weekly",
      contractSignature: (shop.contract_signature as string) ?? null,
      contractSignedAt: (shop.contract_signed_at as string) ?? null,
    },
    application: {
      id: app.id,
      reference: app.reference,
      status: app.status,
      step: app.step,
      submittedAt: app.submitted_at,
      decisionReason: app.decision_reason,
    },
    documents,
    certificate: cert
      ? {
          authority: cert.authority,
          detail: cert.detail,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          mentions: cert.mentions ?? [],
        }
      : null,
    productCount: productsRes.count ?? 0,
    zoneCount: zonesRes.count ?? 0,
    hours: ((hoursRes.data ?? []) as unknown as {
      weekday: number;
      opens_at: string;
      closes_at: string;
    }[]).map((h) => ({
      weekday: h.weekday,
      // Postgres rend `18:30:00` ; un `<input type="time">` veut `18:30`.
      opensAt: h.opens_at.slice(0, 5),
      closesAt: h.closes_at.slice(0, 5),
    })),
  };
});

/**
 * Ce qui manque encore pour pouvoir envoyer le dossier.
 *
 * La liste est rendue au commerçant telle quelle, sur l'écran d'envoi : lui
 * dire « dossier incomplet » sans dire quoi ne l'aide pas à finir. Chaque
 * manque porte l'étape où il se répare, pour qu'il y aille d'un clic plutôt
 * que de deviner laquelle des huit rouvrir.
 */
export type Missing = { label: string; step: StepSlug };

export function missingPieces(dossier: PartnerDossier): Missing[] {
  const missing: Missing[] = [];
  const { shop, documents, certificate } = dossier;
  const add = (label: string, step: StepSlug) => missing.push({ label, step });

  if (!shop.legalName || !shop.siret) add("Les informations de votre entreprise", "entreprise");
  if (!shop.address) add("L'adresse du commerce", "entreprise");
  if (documents.id_front.status !== "uploaded" || documents.id_back.status !== "uploaded") {
    add("Votre pièce d'identité, recto et verso", "documents");
  }
  if (documents.kbis.status !== "uploaded") add("Votre justificatif d'entreprise", "documents");
  if (documents.kashrut.status !== "uploaded" || !certificate) {
    add("Votre certificat de cacherout", "cacherout");
  } else if (new Date(certificate.validTo) <= new Date()) {
    add("Un certificat de cacherout en cours de validité", "cacherout");
  }
  if (dossier.productCount === 0) add("Au moins un produit dans votre carte", "catalogue");
  if (dossier.hours.length === 0) add("Vos horaires d'ouverture", "logistique");
  if (!shop.iban) add("Votre IBAN", "contrat");
  if (!shop.contractSignedAt) add("Le contrat partenaire signé", "contrat");

  return missing;
}

