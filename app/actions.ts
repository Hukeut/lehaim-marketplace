"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { ok: boolean; message: string | null };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length ? trimmed : null;
}

function refreshShabbat(id: string) {
  revalidatePath("/accueil");
  revalidatePath("/shabbats");
  revalidatePath(`/shabbat/${id}`);
}

/** Code court (4 chiffres) donné aux traiteurs à la place du nom du client. */
function generatePickupCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Insère le Shabbat avec un pickup_code fraîchement tiré ; recommence avec
 * un nouveau code si l'unicité en base est violée (23505), jusqu'à 6 essais.
 */
async function insertShabbatWithCode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  payload: Record<string, unknown>,
) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await supabase
      .from("shabbats")
      .insert({ ...payload, pickup_code: generatePickupCode() })
      .select("id")
      .single();
    if (!error) return { data, error: null as null };
    if (error.code !== "23505") return { data: null, error };
  }
  return {
    data: null,
    error: { message: "Impossible de générer un code de retrait unique, réessayez." },
  };
}

/* ------------------------------------------------------------------ */
/* Création                                                             */
/* ------------------------------------------------------------------ */

export async function createShabbat(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous pour créer un Shabbat." };

  const date = text(formData, "date");
  const time = text(formData, "time") ?? "19:30";
  if (!date) return { ok: false, message: "Choisissez une date." };

  const budget = text(formData, "budget");
  const guests = Number(formData.get("guest_target") ?? 8);

  const { data, error } = await insertShabbatWithCode(supabase, {
    host_id: user.id,
    title: text(formData, "title") ?? "Shabbat chez vous",
    starts_at: new Date(`${date}T${time}`).toISOString(),
    address: text(formData, "address"),
    neighbourhood: text(formData, "neighbourhood"),
    guest_target: Number.isFinite(guests) ? Math.min(60, Math.max(1, guests)) : 8,
    budget_planned: budget ? Number(budget.replace(/[^\d.,]/g, "").replace(",", ".")) : null,
    visibility: formData.get("visibility") === "link" ? "link" : "invite",
  });

  if (error || !data) return { ok: false, message: error?.message ?? "Une erreur est survenue." };

  revalidatePath("/shabbats");
  redirect(`/creer/${data.id}/modele`);
}

/**
 * Supprime définitivement un Shabbat (RLS : seul l'hôte peut le faire).
 * Invitations, menu, courses, dépenses et messages liés partent en cascade.
 * Les commandes marketplace déjà passées sont conservées, juste déliées.
 */
export async function deleteShabbat(shabbatId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  // Le traiteur ne doit pas continuer à préparer un Shabbat qui n'existe
  // plus : on annule proprement ses commandes encore actives avant de
  // supprimer le Shabbat (sinon elles seraient juste déliées en silence).
  await supabase
    .from("marketplace_orders")
    .update({ status: "annulee", cancelled_by: "client" })
    .eq("shabbat_id", shabbatId)
    .neq("status", "annulee");

  await supabase.from("shabbats").delete().eq("id", shabbatId);
  revalidatePath("/shabbats");
  revalidatePath("/accueil");
  revalidatePath("/traiteur/commandes");
  revalidatePath("/traiteur/service");
  revalidatePath("/commandes");
  redirect("/shabbats");
}

export async function publishShabbat(shabbatId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("shabbats").update({ status: "published" }).eq("id", shabbatId);
  refreshShabbat(shabbatId);
  redirect(`/creer/${shabbatId}/publie`);
}

/* ------------------------------------------------------------------ */
/* Menu                                                                 */
/* ------------------------------------------------------------------ */

export async function addDish(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const shabbatId = String(formData.get("shabbat_id") ?? "");
  const name = text(formData, "name");
  if (!shabbatId || !name) return { ok: false, message: "Donnez un nom au plat." };

  const course = String(formData.get("course") ?? "plat");
  const { error } = await supabase.from("dishes").insert({
    shabbat_id: shabbatId,
    name,
    course: ["entree", "plat", "dessert"].includes(course) ? course : "plat",
  });

  if (error) return { ok: false, message: error.message };
  refreshShabbat(shabbatId);
  revalidatePath(`/creer/${shabbatId}/menu`);
  return { ok: true, message: null };
}

export async function removeDish(shabbatId: string, dishId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("dishes").delete().eq("id", dishId);
  refreshShabbat(shabbatId);
  revalidatePath(`/creer/${shabbatId}/menu`);
}

export async function cycleDishStatus(
  shabbatId: string,
  dishId: string,
  current: "todo" | "cooking" | "done",
) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  const next = current === "todo" ? "cooking" : current === "cooking" ? "done" : "todo";
  await supabase.from("dishes").update({ status: next }).eq("id", dishId);
  refreshShabbat(shabbatId);
}

/** L'invité prend un plat en charge, ou le libère s'il l'avait déjà. */
export async function toggleDishAssignee(shabbatId: string, dishId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  const { data } = await supabase
    .from("dishes")
    .select("assignee_id")
    .eq("id", dishId)
    .maybeSingle();

  await supabase
    .from("dishes")
    .update({ assignee_id: data?.assignee_id === user.id ? null : user.id })
    .eq("id", dishId);

  refreshShabbat(shabbatId);
}

/* ------------------------------------------------------------------ */
/* Invités                                                              */
/* ------------------------------------------------------------------ */

export async function addGuest(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const shabbatId = String(formData.get("shabbat_id") ?? "");
  const name = text(formData, "guest_name");
  if (!shabbatId || !name) return { ok: false, message: "Indiquez au moins un prénom." };

  const { error } = await supabase.from("invitations").insert({
    shabbat_id: shabbatId,
    guest_name: name,
    guest_phone: text(formData, "guest_phone"),
  });

  if (error) return { ok: false, message: error.message };
  refreshShabbat(shabbatId);
  revalidatePath(`/shabbat/${shabbatId}/invites`);
  return { ok: true, message: `${name} a été ajouté·e.` };
}

export async function removeGuest(shabbatId: string, invitationId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("invitations").delete().eq("id", invitationId);
  refreshShabbat(shabbatId);
  revalidatePath(`/shabbat/${shabbatId}/invites`);
}

export async function setGuestStatus(
  shabbatId: string,
  invitationId: string,
  status: "pending" | "confirmed" | "declined",
) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("invitations").update({ status }).eq("id", invitationId);
  refreshShabbat(shabbatId);
  revalidatePath(`/shabbat/${shabbatId}/invites`);
  revalidatePath(`/invitation/${shabbatId}`);
}

export async function setGuestRole(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const shabbatId = String(formData.get("shabbat_id") ?? "");
  const invitationId = String(formData.get("invitation_id") ?? "");

  const { error } = await supabase
    .from("invitations")
    .update({
      role_name: text(formData, "role_name"),
      role_detail: text(formData, "role_detail"),
    })
    .eq("id", invitationId);

  if (error) return { ok: false, message: error.message };
  refreshShabbat(shabbatId);
  revalidatePath(`/shabbat/${shabbatId}/invites`);
  return { ok: true, message: "Rôle enregistré." };
}

/* ------------------------------------------------------------------ */
/* Courses et dépenses                                                  */
/* ------------------------------------------------------------------ */

export async function addShoppingItem(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const shabbatId = String(formData.get("shabbat_id") ?? "");
  const name = text(formData, "name");
  if (!shabbatId || !name) return { ok: false, message: "Indiquez un article." };

  const { error } = await supabase.from("shopping_items").insert({
    shabbat_id: shabbatId,
    name,
    quantity: text(formData, "quantity"),
  });

  if (error) return { ok: false, message: error.message };
  refreshShabbat(shabbatId);
  return { ok: true, message: null };
}

export async function toggleShoppingItem(
  shabbatId: string,
  itemId: string,
  done: boolean,
) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("shopping_items").update({ done: !done }).eq("id", itemId);
  refreshShabbat(shabbatId);
}

export async function removeShoppingItem(shabbatId: string, itemId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("shopping_items").delete().eq("id", itemId);
  refreshShabbat(shabbatId);
}

export async function addExpense(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const shabbatId = String(formData.get("shabbat_id") ?? "");
  const label = text(formData, "label");
  const amount = Number(String(formData.get("amount") ?? "").replace(",", "."));
  if (!shabbatId || !label) return { ok: false, message: "Indiquez un motif." };
  if (!Number.isFinite(amount) || amount < 0) return { ok: false, message: "Montant invalide." };

  const { error } = await supabase.from("expenses").insert({
    shabbat_id: shabbatId,
    label,
    amount,
    paid_by: user.id,
  });

  if (error) return { ok: false, message: error.message };
  refreshShabbat(shabbatId);
  return { ok: true, message: null };
}

/* ------------------------------------------------------------------ */
/* Messages                                                             */
/* ------------------------------------------------------------------ */

export async function sendMessage(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const shabbatId = String(formData.get("shabbat_id") ?? "");
  const body = text(formData, "body");
  if (!shabbatId || !body) return { ok: false, message: null };

  const { error } = await supabase
    .from("messages")
    .insert({ shabbat_id: shabbatId, sender_id: user.id, body });

  if (error) return { ok: false, message: error.message };
  revalidatePath(`/discussion/${shabbatId}`);
  revalidatePath("/messages");
  return { ok: true, message: null };
}

/* ------------------------------------------------------------------ */
/* RSVP invité                                                          */
/* ------------------------------------------------------------------ */

export async function respondToInvitation(
  shabbatId: string,
  status: "confirmed" | "declined",
) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase
    .from("invitations")
    .update({ status })
    .eq("shabbat_id", shabbatId)
    .eq("guest_id", user.id);

  revalidatePath(`/invitation/${shabbatId}`);
  refreshShabbat(shabbatId);
}
