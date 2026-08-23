"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Update } from "@/lib/supabase/rows";
import { run, userMessage } from "@/lib/db";

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

  const { data, error } = await supabase
    .from("shabbats")
    .insert({
      host_id: user.id,
      title: text(formData, "title") ?? "Shabbat chez vous",
      starts_at: new Date(`${date}T${time}`).toISOString(),
      address: text(formData, "address"),
      neighbourhood: text(formData, "neighbourhood"),
      guest_target: Number.isFinite(guests) ? Math.min(60, Math.max(1, guests)) : 8,
      budget_planned: budget ? Number(budget.replace(/[^\d.,]/g, "").replace(",", ".")) : null,
      visibility: formData.get("visibility") === "link" ? "link" : "invite",
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: await userMessage("createShabbat", error) };

  // Le jour choisi dit déjà quel moment existe : un vendredi, c'est le
  // dîner ; un samedi, le déjeuner. On propose l'autre dès la création
  // plutôt que de le faire cocher à l'étape suivante.
  const weekday = new Date(`${date}T${time}`).getDay();
  const alsoOther = formData.get("also_other_day") === "1";

  const friday = { kind: "friday_dinner", label: "Vendredi soir", detail: "Dîner", position: 0 };
  const saturday = { kind: "saturday_lunch", label: "Samedi midi", detail: "Déjeuner", position: 1 };
  // L'heure saisie à l'écran précédent est celle de ce repas-là : on la
  // reporte sur lui. L'étape suivante ne demandait sinon qu'une seconde fois
  // ce qu'on venait de renseigner — et l'invitation, qui affiche l'heure de
  // chaque repas, n'en montrait aucune pour le principal.
  const primary = weekday === 6 ? saturday : friday;
  const other = weekday === 6 ? friday : saturday;
  const moments = alsoOther
    ? [{ ...primary, meet_at: time }, { ...other, meet_at: null }]
    : [{ ...primary, meet_at: time }];

  await run(
    "createShabbat/moments",
    supabase
      .from("moments")
      .insert(moments.map((moment) => ({ ...moment, shabbat_id: data.id })))
  );

  // Cinq apports qu'aucun Shabbat n'omet : on les pose d'emblée, le reste
  // se pioche au catalogue.
  await run(
    "createShabbat/missions",
    supabase.from("missions").insert(
      [
        { title: "Entrées", emoji: "🥗", category: "food" },
        { title: "Plat principal", emoji: "🍲", category: "food" },
        { title: "Hallot", emoji: "🥖", category: "food" },
        { title: "Vin", emoji: "🍷", category: "drinks" },
        { title: "Boissons softs", emoji: "🧃", category: "drinks" },
      ].map((mission, position) => ({
        ...mission,
        shabbat_id: data.id,
        slots: 1,
        priority: "standard",
        position,
      })),
    )
  );

  revalidatePath("/shabbats");
  redirect(`/creer/${data.id}/moments`);
}

export async function publishShabbat(shabbatId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await run("publishShabbat/shabbats", supabase.from("shabbats").update({ status: "published" }).eq("id", shabbatId));
  refreshShabbat(shabbatId);
  redirect(`/creer/${shabbatId}/publie`);
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

  if (error) return { ok: false, message: await userMessage("addGuest", error) };
  refreshShabbat(shabbatId);
  revalidatePath(`/shabbat/${shabbatId}/invites`);
  return { ok: true, message: `${name} a été ajouté·e.` };
}

export async function removeGuest(shabbatId: string, invitationId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await run("removeGuest/invitations", supabase.from("invitations").delete().eq("id", invitationId));
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
  await run("setGuestStatus/invitations", supabase.from("invitations").update({ status }).eq("id", invitationId));
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

  if (error) return { ok: false, message: await userMessage("setGuestRole", error) };
  refreshShabbat(shabbatId);
  revalidatePath(`/shabbat/${shabbatId}/invites`);
  return { ok: true, message: "Rôle enregistré." };
}

/* ------------------------------------------------------------------ */
/* Courses et dépenses                                                  */
/* ------------------------------------------------------------------ */

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

  if (error) return { ok: false, message: await userMessage("addExpense", error) };
  refreshShabbat(shabbatId);
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

  await run(
    "respondToInvitation/invitations",
    supabase
      .from("invitations")
      .update({ status })
      .eq("shabbat_id", shabbatId)
      .eq("guest_id", user.id)
  );

  revalidatePath(`/invitation/${shabbatId}`);
  refreshShabbat(shabbatId);
}

/* ------------------------------------------------------------------ */
/* Langue et réglages du Shabbat                                        */
/* ------------------------------------------------------------------ */

/** Change la langue de l'interface, depuis le profil. */
export async function switchLanguage(locale: string) {
  const { isLocale, LOCALE_COOKIE } = await import("@/lib/i18n/locale");
  if (!isLocale(locale)) return;

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  // Le profil garde la préférence : elle suit la personne d'un appareil à
  // l'autre, là où le cookie ne suit que le navigateur.
  const { supabase, user } = await requireUser();
  // C'est cette écriture qui échouait en silence tant que la colonne `locale`
  // n'existait pas (0018) : la langue ne survivait que par le cookie, donc
  // jamais d'un appareil à l'autre. Elle est désormais surveillée.
  if (user) {
    await run(
      "switchLanguage/profiles",
      supabase.from("profiles").update({ locale }).eq("id", user.id),
    );
  }

  revalidatePath("/", "layout");
}

/**
 * Adresse, date et titre restent modifiables après la création : on crée
 * souvent un Shabbat avant de savoir où il aura lieu.
 */
export async function updateShabbat(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const shabbatId = String(formData.get("shabbat_id") ?? "");
  const date = text(formData, "date");
  const time = text(formData, "time") ?? "19:30";

  const patch: Update<"shabbats"> = {
    title: text(formData, "title") ?? "Shabbat",
    address: text(formData, "address"),
    neighbourhood: text(formData, "neighbourhood"),
  };
  if (date) patch.starts_at = new Date(`${date}T${time}`).toISOString();

  const { error } = await supabase.from("shabbats").update(patch).eq("id", shabbatId);
  if (error) return { ok: false, message: await userMessage("updateShabbat", error) };

  refreshShabbat(shabbatId);
  redirect(`/shabbat/${shabbatId}`);
}
