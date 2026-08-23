"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/supabase/user";
import { run, userMessage } from "@/lib/db";
import { getMyDossier, missingPieces, stepNumber, type StepSlug } from "@/lib/partner";
import type { DocumentKind } from "@/lib/market";
import type { ActionState } from "@/app/actions";

/**
 * Le tunnel marchand, côté écriture.
 *
 * Chaque étape enregistre au passage : le commerçant remplit ça entre deux
 * services, et perdre son travail parce qu'il a fermé l'onglet le ferait
 * renoncer. L'étape atteinte avance en base à chaque validation, ce qui permet
 * de le ramener au bon endroit depuis l'e-mail de relance.
 */

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length ? trimmed : null;
}

/** Identifiant d'URL lisible, dérivé du nom commercial. */
function slugify(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "boutique"
  );
}

async function context() {
  const [supabase, user] = await Promise.all([createClient(), currentUser()]);
  if (!user) redirect("/connexion?suite=/partenaire/dossier");
  return { supabase, user };
}

/** Fait avancer le curseur, sans jamais reculer. */
async function advance(slug: StepSlug) {
  const dossier = await getMyDossier();
  if (!dossier) return;
  const next = Math.max(dossier.application.step, stepNumber(slug) + 1);
  if (next === dossier.application.step) return;

  const { supabase } = await context();
  await run(
    "advance/shop_applications",
    supabase.from("shop_applications").update({ step: Math.min(next, 8) }).eq("id", dossier.application.id),
  );
}

function refresh() {
  revalidatePath("/partenaire/dossier", "layout");
}

/* ------------------------------------------------------------------ */
/* Étape 2 · Informations entreprise — et création du dossier           */
/* ------------------------------------------------------------------ */

export async function saveCompany(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await context();

  const name = text(formData, "name");
  if (!name) return { ok: false, message: "Indiquez le nom de votre commerce." };

  const payload = {
    name,
    legal_name: text(formData, "legal_name"),
    category: String(formData.get("category") ?? "caterer"),
    siret: text(formData, "siret"),
    address: text(formData, "address"),
    city: text(formData, "city"),
    phone: text(formData, "phone"),
    description: text(formData, "description"),
  };

  const existing = await getMyDossier();

  if (existing) {
    const { error } = await supabase.from("shops").update(payload).eq("id", existing.shop.id);
    if (error) return { ok: false, message: await userMessage("saveCompany", error) };
  } else {
    // Premier passage : la boutique et son dossier naissent ensemble. Un
    // dossier sans boutique n'a rien à décrire, et l'inverse non plus.
    const { data, error } = await supabase
      .from("shops")
      .insert({ ...payload, slug: `${slugify(name)}-${crypto.randomUUID().slice(0, 6)}`, owner_id: user.id, status: "draft" })
      .select("id")
      .single();

    if (error) return { ok: false, message: await userMessage("saveCompany/create", error) };

    await run(
      "saveCompany/shop_applications",
      supabase.from("shop_applications").insert({ shop_id: data.id, status: "draft", step: 3 }),
    );
  }

  await advance("entreprise");
  refresh();
  redirect("/partenaire/dossier/documents");
}

/* ------------------------------------------------------------------ */
/* Étape 3 · Pièces — enregistrées après téléversement                  */
/* ------------------------------------------------------------------ */

/**
 * Le fichier est envoyé au seau depuis le navigateur ; cette action ne fait
 * qu'enregistrer son chemin. Faire transiter dix mégaoctets par une Server
 * Action pour les renvoyer au même endroit n'aurait servi personne.
 */
export async function recordDocument(kind: DocumentKind, filePath: string) {
  const { supabase } = await context();
  const dossier = await getMyDossier();
  if (!dossier) return;

  await run(
    "recordDocument/shop_documents",
    supabase.from("shop_documents").upsert(
      {
        shop_id: dossier.shop.id,
        kind,
        status: "uploaded",
        file_path: filePath,
        rejected_reason: null,
        uploaded_at: new Date().toISOString(),
      },
      { onConflict: "shop_id,kind" },
    ),
  );

  refresh();
}

export async function finishDocuments() {
  await advance("documents");
  refresh();
  redirect("/partenaire/dossier/cacherout");
}

/* ------------------------------------------------------------------ */
/* Étape 4 · Certificat de cacherout                                    */
/* ------------------------------------------------------------------ */

export async function saveKashrut(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await context();
  const dossier = await getMyDossier();
  if (!dossier) return { ok: false, message: "Commencez par décrire votre commerce." };

  const authority = text(formData, "authority");
  const validFrom = text(formData, "valid_from");
  const validTo = text(formData, "valid_to");

  if (!authority) return { ok: false, message: "Indiquez l'organisme certificateur." };
  if (!validFrom || !validTo) return { ok: false, message: "Indiquez les dates de validité." };
  if (new Date(validTo) <= new Date(validFrom)) {
    return { ok: false, message: "La date de fin doit suivre la date de début." };
  }

  const mentions = formData.getAll("mentions").map(String);

  // Un renouvellement s'ajoute, il n'écrase pas : l'historique des certificats
  // est ce qui permet de dire depuis quand un commerce est certifié. Mais
  // revenir corriger une faute de frappe n'est pas un renouvellement — on ne
  // remplace que si les dates n'ont pas bougé.
  const previous = dossier.certificate;
  const correction =
    previous && previous.validFrom === validFrom && previous.validTo === validTo;

  const values = {
    authority,
    detail: text(formData, "detail"),
    valid_from: validFrom,
    valid_to: validTo,
    mentions,
  };

  const { error } = correction
    ? await supabase
        .from("kashrut_certificates")
        .update(values)
        .eq("shop_id", dossier.shop.id)
        .eq("valid_to", validTo)
    : await supabase
        .from("kashrut_certificates")
        .insert({ shop_id: dossier.shop.id, ...values });

  if (error) return { ok: false, message: await userMessage("saveKashrut", error) };

  await advance("cacherout");
  refresh();
  redirect("/partenaire/dossier/catalogue");
}

/* ------------------------------------------------------------------ */
/* Étape 5 · Premier produit                                            */
/* ------------------------------------------------------------------ */

export async function saveFirstProduct(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await context();
  const dossier = await getMyDossier();
  if (!dossier) return { ok: false, message: "Commencez par décrire votre commerce." };

  const name = text(formData, "name");
  if (!name) return { ok: false, message: "Donnez un nom à votre produit." };

  const price = Number(String(formData.get("price") ?? "0").replace(",", "."));
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, message: "Indiquez un prix." };
  }

  const { error } = await supabase.from("shop_products").insert({
    shop_id: dossier.shop.id,
    name,
    category: String(formData.get("category") ?? "other"),
    description: text(formData, "description"),
    price,
    // Trois niveaux distincts, jamais fusionnés : « contient » engage la
    // responsabilité du commerçant, « traces » l'atténue, « sans » la renverse.
    allergens_contains: formData.getAll("contains").map(String),
    allergens_traces: formData.getAll("traces").map(String),
    allergens_free: formData.getAll("free").map(String),
    workshop_note: text(formData, "workshop_note"),
  });

  if (error) return { ok: false, message: await userMessage("saveFirstProduct", error) };

  await advance("catalogue");
  refresh();
  redirect("/partenaire/dossier/logistique");
}

/* ------------------------------------------------------------------ */
/* Étape 6 · Horaires, créneaux et zones                                */
/* ------------------------------------------------------------------ */

export async function saveLogistics(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await context();
  const dossier = await getMyDossier();
  if (!dossier) return { ok: false, message: "Commencez par décrire votre commerce." };

  const modes = formData.getAll("modes").map(String);
  if (!modes.length) return { ok: false, message: "Choisissez au moins un mode de remise." };

  const { error } = await supabase
    .from("shops")
    .update({
      prep_minutes: Math.max(5, Number(formData.get("prep_minutes") ?? 20)),
      preorder_deadline: text(formData, "preorder_deadline"),
      slot_capacity: Math.max(1, Number(formData.get("slot_capacity") ?? 8)),
      delivery_modes: modes,
    })
    .eq("id", dossier.shop.id);

  if (error) return { ok: false, message: await userMessage("saveLogistics", error) };

  // Les horaires sont réécrits en bloc : c'est une grille, pas un journal.
  await run(
    "saveLogistics/clear-hours",
    supabase.from("shop_hours").delete().eq("shop_id", dossier.shop.id),
  );

  // Un jour sans horaire est un jour de fermeture : on ne l'enregistre pas.
  // Le prédicat est typé, sans quoi TypeScript garde `string | null` et la
  // colonne, elle, n'accepte pas le nul.
  type Hour = { shop_id: string; weekday: number; opens_at: string; closes_at: string };
  const hours = [0, 1, 2, 3, 4, 5, 6]
    .map((day) => ({
      shop_id: dossier.shop.id,
      weekday: day,
      opens_at: text(formData, `open_${day}`),
      closes_at: text(formData, `close_${day}`),
    }))
    .filter((h): h is Hour => Boolean(h.opens_at && h.closes_at && h.closes_at > h.opens_at));

  if (hours.length) {
    await run("saveLogistics/shop_hours", supabase.from("shop_hours").insert(hours));
  }

  await advance("logistique");
  refresh();
  redirect("/partenaire/dossier/contrat");
}

/* ------------------------------------------------------------------ */
/* Étape 7 · Paiement et contrat                                        */
/* ------------------------------------------------------------------ */

export async function saveContract(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await context();
  const dossier = await getMyDossier();
  if (!dossier) return { ok: false, message: "Commencez par décrire votre commerce." };

  const iban = text(formData, "iban");
  const signature = text(formData, "signature");

  if (!iban) return { ok: false, message: "Indiquez l'IBAN qui recevra vos reversements." };
  if (!signature) return { ok: false, message: "Signez le contrat pour continuer." };
  if (formData.get("accept") !== "on") {
    return { ok: false, message: "Vous devez accepter les conditions et le taux de commission." };
  }

  const { error } = await supabase
    .from("shops")
    .update({
      iban: iban.replace(/\s+/g, ""),
      payout_frequency: String(formData.get("payout_frequency") ?? "weekly"),
      contract_signature: signature,
      contract_signed_at: new Date().toISOString(),
    })
    .eq("id", dossier.shop.id);

  if (error) return { ok: false, message: await userMessage("saveContract", error) };

  await advance("contrat");
  refresh();
  redirect("/partenaire/dossier/statut");
}

/* ------------------------------------------------------------------ */
/* Étape 8 · Envoi du dossier                                           */
/* ------------------------------------------------------------------ */

export async function submitDossier(): Promise<void> {
  const { supabase } = await context();
  const dossier = await getMyDossier();
  if (!dossier) return;

  // Rien ne part tant qu'il manque une pièce : un dossier incomplet fait
  // perdre du temps à tout le monde, à commencer par celui qui l'a envoyé.
  if (missingPieces(dossier).length > 0) {
    refresh();
    return;
  }

  await run(
    "submitDossier/shop_applications",
    supabase
      .from("shop_applications")
      .update({
        status: "submitted",
        step: 8,
        submitted_at: new Date().toISOString(),
        // Le motif appartient à la décision passée : le garder ferait croire
        // au commerçant que sa correction n'a pas été prise en compte.
        decision_reason: null,
      })
      .eq("id", dossier.application.id),
  );

  await run(
    "submitDossier/shops",
    supabase.from("shops").update({ status: "review" }).eq("id", dossier.shop.id),
  );

  refresh();
  revalidatePath("/admin/validation");
}
