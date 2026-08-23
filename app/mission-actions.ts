"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManager } from "@/lib/access";
import { createClient } from "@/lib/supabase/server";
import type { Update } from "@/lib/supabase/rows";
import { messageKeyFor, run, userMessage } from "@/lib/db";
import { MISSION_PRESETS, MOMENTS, roleKeyFor } from "@/lib/templates";
import type { ActionState } from "@/app/actions";

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

function refresh(shabbatId: string) {
  revalidatePath("/accueil");
  revalidatePath(`/shabbat/${shabbatId}`);
  revalidatePath(`/shabbat/${shabbatId}/missions`);
  revalidatePath(`/shabbat/${shabbatId}/besoins`);
  revalidatePath(`/shabbat/${shabbatId}/materiel`);
  revalidatePath(`/shabbat/${shabbatId}/depenses`);
  revalidatePath(`/invitation/${shabbatId}`);
}

/* ------------------------------------------------------------------ */
/* S04a · Moments proposés                                              */
/* ------------------------------------------------------------------ */

export async function toggleMoment(shabbatId: string, kind: string, enabled: boolean) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);

  if (enabled) {
    await run("toggleMoment/moments", supabase.from("moments").delete().eq("shabbat_id", shabbatId).eq("kind", kind));
  } else {
    const meta = MOMENTS.find((m) => m.kind === kind);
    if (!meta) return;
    await run(
      "toggleMoment/moments",
      supabase.from("moments").upsert(
        {
          shabbat_id: shabbatId,
          kind,
          label: meta.label,
          detail: meta.detail,
          position: MOMENTS.findIndex((m) => m.kind === kind),
        },
        { onConflict: "shabbat_id,kind" },
      )
    );
  }
  refresh(shabbatId);
  revalidatePath(`/creer/${shabbatId}/moments`);
}

/* ------------------------------------------------------------------ */
/* S04 / S04b · Missions                                                */
/* ------------------------------------------------------------------ */

export async function saveMission(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const shabbatId = String(formData.get("shabbat_id") ?? "");
  const missionId = text(formData, "mission_id");
  const title = text(formData, "title");
  if (!title) return { ok: false, message: "Donnez un titre à la mission." };

  const payload = {
    shabbat_id: shabbatId,
    title,
    emoji: text(formData, "emoji") ?? "•",
    category: String(formData.get("category") ?? "food"),
    slots: Math.max(1, Math.min(20, Number(formData.get("slots") ?? 1))),
    quantity: text(formData, "quantity"),
    priority: formData.get("priority") === "essential" ? "essential" : "standard",
    notes: text(formData, "notes"),
  };

  const { error } = missionId
    ? await supabase.from("missions").update(payload).eq("id", missionId)
    : await supabase.from("missions").insert(payload);

  if (error) return { ok: false, message: await userMessage("saveMission", error) };

  refresh(shabbatId);
  revalidatePath(`/creer/${shabbatId}/missions`);

  // Sans redirection, le formulaire restait affiché après l'enregistrement :
  // rien ne signalait que l'apport avait bien été créé.
  redirect(String(formData.get("retour") ?? `/shabbat/${shabbatId}/missions`));
}

/**
 * Supprimer un apport.
 *
 * Les prises partent en cascade — c'est le schéma qui le dit, pas cette
 * fonction. L'écran doit donc prévenir avant d'appeler : quelqu'un peut
 * perdre son rôle ici.
 *
 * `retour` existe parce que la suppression se fait maintenant depuis trois
 * endroits. Renvoyer partout vers la liste des apports faisait sortir
 * l'organisateur de son tableau des besoins à chaque ligne retirée.
 */
export async function deleteMission(shabbatId: string, missionId: string, retour?: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);
  await run("deleteMission/missions", supabase.from("missions").delete().eq("id", missionId));
  refresh(shabbatId);
  redirect(retour ?? `/shabbat/${shabbatId}/missions`);
}

export async function setMissionStatus(
  shabbatId: string,
  missionId: string,
  status: "todo" | "in_progress" | "done",
) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await run("setMissionStatus/missions", supabase.from("missions").update({ status }).eq("id", missionId));
  refresh(shabbatId);
}

/* ------------------------------------------------------------------ */
/* S07 · Prendre / libérer une mission                                  */
/* ------------------------------------------------------------------ */

export async function claimMission(shabbatId: string, missionId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  // Le rôle est ATTRIBUÉ ici, une fois, et gardé. Le déduire à chaque
  // affichage le faisait changer quand l'hôte renommait la mission :
  // quelqu'un pouvait s'endormir « gardien de la flamme » et se réveiller
  // « renfort ». Ce n'est qu'une clé, les libellés sont traduits.
  const { data: mission } = await run(
    "claimMission/title",
    supabase.from("missions").select("title").eq("id", missionId).maybeSingle(),
  );
  const roleKey = roleKeyFor((mission as unknown as { title: string } | null)?.title ?? "");

  const claim = await run(
    "claimMission/upsert",
    supabase.from("mission_claims").upsert(
      { mission_id: missionId, profile_id: user.id, role_key: roleKey },
      { onConflict: "mission_id,profile_id" },
    ),
  );

  // Depuis 0020, la base refuse la place de trop. On ramène alors la personne
  // à la liste avec un mot, plutôt que sur la page d'un apport qu'elle n'a pas
  // obtenu — ce qui était le comportement quand l'erreur passait inaperçue.
  if (claim.failed) {
    refresh(shabbatId);
    redirect(`/shabbat/${shabbatId}/missions?refus=${messageKeyFor(claim.code)}`);
  }

  await run(
    "claimMission/status",
    supabase.from("missions").update({ status: "in_progress" }).eq("id", missionId),
  );

  refresh(shabbatId);
  // On annonce le rôle avant de rendre la main : c'est ce moment-là qui donne
  // envie d'en prendre un second, et il passait jusqu'ici inaperçu.
  redirect(`/shabbat/${shabbatId}/mission/${missionId}/role`);
}

export async function releaseMission(shabbatId: string, missionId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  await run(
    "releaseMission/mission_claims",
    supabase
      .from("mission_claims")
      .delete()
      .eq("mission_id", missionId)
      .eq("profile_id", user.id)
  );

  const { count } = await supabase
    .from("mission_claims")
    .select("*", { count: "exact", head: true })
    .eq("mission_id", missionId);

  if (!count) {
    await run(
      "releaseMission/missions",
      supabase.from("missions").update({ status: "todo" }).eq("id", missionId),
    );
  }

  refresh(shabbatId);
  redirect(`/shabbat/${shabbatId}/missions`);
}

/** « Dis-moi quoi apporter » : la mission ouverte la plus prioritaire. */
export async function suggestMission(shabbatId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  const { data } = await run(
    "suggestMission/missions",
    supabase
      .from("missions")
      .select("id, slots, priority, mission_claims(profile_id)")
      .eq("shabbat_id", shabbatId)
  );

  const open = (data ?? [])
    .map((m) => ({
      id: m.id as string,
      priority: m.priority as string,
      free: (m.slots as number) - ((m.mission_claims ?? []) as unknown[]).length,
    }))
    .filter((m) => m.free > 0)
    .sort((a, b) =>
      a.priority === b.priority ? b.free - a.free : a.priority === "essential" ? -1 : 1,
    );

  if (!open.length) redirect(`/shabbat/${shabbatId}/missions?vide=1`);
  redirect(`/shabbat/${shabbatId}/mission/${open[0].id}?propose=1`);
}

/* ------------------------------------------------------------------ */
/* S09 · Suggestions                                                    */
/* ------------------------------------------------------------------ */

export async function addSuggestion(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const missionId = String(formData.get("mission_id") ?? "");
  const shabbatId = String(formData.get("shabbat_id") ?? "");
  const body = text(formData, "body");
  if (!body) return { ok: false, message: null };

  const { error } = await supabase
    .from("suggestions")
    .insert({ mission_id: missionId, author_id: user.id, body });

  if (error) return { ok: false, message: await userMessage("addSuggestion", error) };
  revalidatePath(`/shabbat/${shabbatId}/mission/${missionId}`);
  return { ok: true, message: null };
}

export async function toggleVote(
  shabbatId: string,
  missionId: string,
  suggestionId: string,
  voted: boolean,
) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  if (voted) {
    await run(
      "toggleVote/suggestion_votes",
      supabase
        .from("suggestion_votes")
        .delete()
        .eq("suggestion_id", suggestionId)
        .eq("profile_id", user.id)
    );
  } else {
    await run(
      "toggleVote/suggestion_votes",
      supabase
        .from("suggestion_votes")
        .upsert({ suggestion_id: suggestionId, profile_id: user.id })
    );
  }
  revalidatePath(`/shabbat/${shabbatId}/mission/${missionId}`);
}

export async function chooseSuggestion(
  shabbatId: string,
  missionId: string,
  suggestionId: string,
) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await run("chooseSuggestion/suggestions", supabase.from("suggestions").update({ chosen: false }).eq("mission_id", missionId));
  await run("chooseSuggestion/suggestions", supabase.from("suggestions").update({ chosen: true }).eq("id", suggestionId));
  revalidatePath(`/shabbat/${shabbatId}/mission/${missionId}`);
}

/* ------------------------------------------------------------------ */
/* S13 · Matériel                                                       */
/* ------------------------------------------------------------------ */

export async function saveEquipment(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const shabbatId = String(formData.get("shabbat_id") ?? "");
  const name = text(formData, "name");
  if (!name) return { ok: false, message: "Indiquez un objet." };

  const { error } = await supabase.from("equipment").insert({
    shabbat_id: shabbatId,
    name,
    emoji: text(formData, "emoji") ?? "📦",
    owned: Math.max(0, Number(formData.get("owned") ?? 0)),
    needed: Math.max(0, Number(formData.get("needed") ?? 0)),
  });

  if (error) return { ok: false, message: await userMessage("saveEquipment", error) };
  refresh(shabbatId);
  return { ok: true, message: null };
}

export async function claimEquipment(shabbatId: string, itemId: string, claimed: boolean) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await run(
    "claimEquipment/equipment",
    supabase
      .from("equipment")
      .update({ claimed_by: claimed ? null : user.id })
      .eq("id", itemId)
  );
  refresh(shabbatId);
}

export async function removeEquipment(shabbatId: string, itemId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);
  await run("removeEquipment/equipment", supabase.from("equipment").delete().eq("id", itemId));
  refresh(shabbatId);
}

/* ------------------------------------------------------------------ */
/* S14 · Échanges                                                       */
/* ------------------------------------------------------------------ */

export async function requestSwap(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const shabbatId = String(formData.get("shabbat_id") ?? "");
  const missionId = String(formData.get("mission_id") ?? "");
  const toId = text(formData, "to_id");

  const { error } = await supabase
    .from("swaps")
    .insert({ mission_id: missionId, from_id: user.id, to_id: toId });

  if (error) return { ok: false, message: await userMessage("requestSwap", error) };
  refresh(shabbatId);
  return { ok: true, message: "Demande envoyée." };
}

export async function resolveSwap(
  shabbatId: string,
  swapId: string,
  outcome: "accepted" | "declined" | "cancelled",
) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  const { data: swap } = await run(
    "resolveSwap/swaps",
    supabase
      .from("swaps")
      .select("mission_id, from_id, to_id")
      .eq("id", swapId)
      .maybeSingle()
  );

  await run(
    "resolveSwap/swaps",
    supabase
      .from("swaps")
      .update({ status: outcome, resolved_at: new Date().toISOString() })
      .eq("id", swapId)
  );

  if (outcome === "accepted" && swap) {
    await run(
      "resolveSwap/mission_claims",
      supabase
        .from("mission_claims")
        .delete()
        .eq("mission_id", swap.mission_id)
        .eq("profile_id", swap.from_id)
    );
    if (swap.to_id) {
      await run(
        "resolveSwap/mission_claims",
        supabase
          .from("mission_claims")
          .upsert(
            { mission_id: swap.mission_id, profile_id: swap.to_id },
            { onConflict: "mission_id,profile_id" },
          )
      );
    }
  }

  refresh(shabbatId);
}

/* ------------------------------------------------------------------ */
/* S06 · RSVP par moment                                                */
/* ------------------------------------------------------------------ */

export async function setMomentRsvp(
  shabbatId: string,
  invitationId: string,
  momentId: string,
  attending: boolean,
) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  if (attending) {
    await run(
      "setMomentRsvp/rsvps",
      supabase
        .from("rsvps")
        .delete()
        .eq("moment_id", momentId)
        .eq("invitation_id", invitationId)
    );
  } else {
    await run(
      "setMomentRsvp/rsvps",
      supabase
        .from("rsvps")
        .upsert(
          { moment_id: momentId, invitation_id: invitationId, attending: true },
          { onConflict: "moment_id,invitation_id" },
        )
    );
  }

  await run("setMomentRsvp/invitations", supabase.from("invitations").update({ status: "confirmed" }).eq("id", invitationId));
  refresh(shabbatId);
}

/* ------------------------------------------------------------------ */
/* S05bis / S05ter / S17 · Financement, deadline, verrouillage          */
/* ------------------------------------------------------------------ */

export async function setFundingMode(shabbatId: string, mode: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);
  await run("setFundingMode/shabbats", supabase.from("shabbats").update({ funding_mode: mode }).eq("id", shabbatId));
  refresh(shabbatId);
}

export async function setReadyBy(shabbatId: string, iso: string | null) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);
  await run("setReadyBy/shabbats", supabase.from("shabbats").update({ ready_by: iso }).eq("id", shabbatId));
  refresh(shabbatId);
}

export async function lockShabbat(shabbatId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);
  await run(
    "lockShabbat/shabbats",
    supabase
      .from("shabbats")
      .update({ locked_at: new Date().toISOString(), status: "published" })
      .eq("id", shabbatId)
  );
  refresh(shabbatId);
  redirect(`/shabbat/${shabbatId}/ready`);
}

export async function unlockShabbat(shabbatId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);
  await run("unlockShabbat/shabbats", supabase.from("shabbats").update({ locked_at: null }).eq("id", shabbatId));
  refresh(shabbatId);
}

/* ------------------------------------------------------------------ */
/* Cagnotte                                                             */
/* ------------------------------------------------------------------ */

export async function contribute(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: "Connectez-vous d'abord." };

  const shabbatId = String(formData.get("shabbat_id") ?? "");
  const amount = Number(String(formData.get("amount") ?? "").replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: "Montant invalide." };

  const { error } = await supabase
    .from("contributions")
    .insert({ shabbat_id: shabbatId, profile_id: user.id, amount });

  if (error) return { ok: false, message: await userMessage("contribute", error) };
  refresh(shabbatId);
  return { ok: true, message: null };
}

export async function toggleSettled(shabbatId: string, expenseId: string, settled: boolean) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);
  await run("toggleSettled/expenses", supabase.from("expenses").update({ settled: !settled }).eq("id", expenseId));
  refresh(shabbatId);
}

/* ------------------------------------------------------------------ */
/* G03 · Co-organisateurs                                               */
/* ------------------------------------------------------------------ */

const COHOST_COLUMNS = {
  missions: "can_manage_missions",
  guests: "can_manage_guests",
  messages: "can_manage_messages",
  expenses: "can_manage_expenses",
} as const;

export async function setCohost(shabbatId: string, invitationId: string, on: boolean) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);
  await run("setCohost/invitations", supabase.from("invitations").update({ is_cohost: on }).eq("id", invitationId));
  refresh(shabbatId);
  revalidatePath(`/shabbat/${shabbatId}/co-organisation`);
}

export async function toggleCohostScope(
  shabbatId: string,
  invitationId: string,
  scope: keyof typeof COHOST_COLUMNS,
  current: boolean,
) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);
  await run(
    "toggleCohostScope/invitations",
    supabase
      .from("invitations")
      .update({ [COHOST_COLUMNS[scope]]: !current } as Update<"invitations">)
      .eq("id", invitationId)
  );
  refresh(shabbatId);
  revalidatePath(`/shabbat/${shabbatId}/co-organisation`);
}

/* ------------------------------------------------------------------ */
/* G04b · Recréer un Shabbat à partir d'un précédent                    */
/* ------------------------------------------------------------------ */

export async function duplicateShabbat(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: null };

  const sourceId = String(formData.get("source_id") ?? "");
  const keepGuests = formData.get("keep_guests") === "on";
  const keepMissions = formData.get("keep_missions") === "on";
  const keepFunding = formData.get("keep_funding") === "on";
  const keepMoments = formData.get("keep_moments") === "on";

  const { data: source } = await run(
    "keepMoments/shabbats",
    supabase
      .from("shabbats")
      .select("*")
      .eq("id", sourceId)
      .maybeSingle()
  );
  if (!source) return { ok: false, message: null };

  // Même jour de la semaine, la semaine suivant aujourd'hui.
  const previous = new Date(source.starts_at as string);
  const next = new Date();
  next.setDate(next.getDate() + ((previous.getDay() - next.getDay() + 7) % 7 || 7));
  next.setHours(previous.getHours(), previous.getMinutes(), 0, 0);

  const { data: created, error } = await supabase
    .from("shabbats")
    .insert({
      host_id: user.id,
      title: source.title,
      starts_at: next.toISOString(),
      address: source.address,
      neighbourhood: source.neighbourhood,
      guest_target: source.guest_target,
      budget_planned: source.budget_planned,
      visibility: source.visibility,
      template: source.template,
      funding_mode: keepFunding ? source.funding_mode : "byo",
    })
    .select("id")
    .single();

  if (error || !created) return { ok: false, message: error?.message ?? null };
  const newId = created.id as string;

  if (keepMoments) {
    const { data: moments } = await run(
      "newId/moments",
      supabase
        .from("moments")
        .select("kind, label, detail, position")
        .eq("shabbat_id", sourceId)
    );
    if (moments?.length) {
      await run(
        "duplicateShabbat/moments",
        supabase
          .from("moments")
          .insert(moments.map((m) => ({ ...m, shabbat_id: newId })))
      );
    }
  }

  if (keepMissions) {
    const { data: missions } = await run(
      "newId/missions",
      supabase
        .from("missions")
        .select("category, title, emoji, slots, quantity, priority, notes, position")
        .eq("shabbat_id", sourceId)
    );
    if (missions?.length) {
      await run(
        "duplicateShabbat/missions",
        supabase
          .from("missions")
          .insert(missions.map((m) => ({ ...m, shabbat_id: newId })))
      );
    }
    const { data: equipment } = await run(
      "newId/equipment",
      supabase
        .from("equipment")
        .select("name, emoji, owned, needed, position")
        .eq("shabbat_id", sourceId)
    );
    if (equipment?.length) {
      await run(
        "duplicateShabbat/equipment",
        supabase
          .from("equipment")
          .insert(equipment.map((e) => ({ ...e, shabbat_id: newId })))
      );
    }
  }

  if (keepGuests) {
    const { data: guests } = await run(
      "newId/invitations",
      supabase
        .from("invitations")
        .select("guest_id, guest_name, guest_phone")
        .eq("shabbat_id", sourceId)
    );
    // Les réponses ne se recopient pas : chacun reconfirme.
    if (guests?.length) {
      await run(
        "duplicateShabbat/invitations",
        supabase
          .from("invitations")
          .insert(guests.map((g) => ({ ...g, shabbat_id: newId, status: "pending" })))
      );
    }
  }

  revalidatePath("/shabbats");
  revalidatePath("/historique");
  redirect(`/shabbat/${newId}`);
}

/* ------------------------------------------------------------------ */
/* Détail d'un moment : heure, couchages                                */
/* ------------------------------------------------------------------ */

export async function setMomentDetail(
  shabbatId: string,
  momentId: string,
  detail: {
    meetAt: string | null;
    capacity: number | null;
    sleepingPolicy: string | null;
    /** Adresse de rendez-vous, pour les moments à la synagogue. */
    place?: string | null;
  },
) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);

  const capacity =
    detail.capacity === null ? null : Math.max(0, Math.min(60, Math.round(detail.capacity)));

  await run(
    "setMomentDetail/moments",
    supabase
      .from("moments")
      .update({
        meet_at: detail.meetAt,
        capacity,
        sleeping_policy: ["mixed", "girls", "boys"].includes(detail.sleepingPolicy ?? "")
          ? detail.sleepingPolicy
          : null,
        ...(detail.place !== undefined ? { detail: detail.place } : {}),
      })
      .eq("id", momentId)
  );

  refresh(shabbatId);
  revalidatePath(`/creer/${shabbatId}/moments`);
}

/* ------------------------------------------------------------------ */
/* Compte à rebours : date et heure libres                              */
/* ------------------------------------------------------------------ */

export async function setReadyByExact(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, message: null };

  const shabbatId = String(formData.get("shabbat_id") ?? "");
  const value = text(formData, "ready_by");

  // `datetime-local` renvoie « 2026-08-13T18:00 », interprété en heure locale.
  const iso = value ? new Date(value).toISOString() : null;

  const { error } = await supabase
    .from("shabbats")
    .update({ ready_by: iso })
    .eq("id", shabbatId);

  if (error) return { ok: false, message: await userMessage("setReadyByExact", error) };
  refresh(shabbatId);
  revalidatePath(`/creer/${shabbatId}/rebours`);
  return { ok: true, message: null };
}

/* ------------------------------------------------------------------ */
/* Supprimer un Shabbat                                                 */
/* ------------------------------------------------------------------ */

export async function deleteShabbat(shabbatId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);

  // La politique RLS limite déjà la suppression à l'hôte ; les tables liées
  // partent en cascade.
  await run("deleteShabbat/shabbats", supabase.from("shabbats").delete().eq("id", shabbatId));

  revalidatePath("/shabbats");
  revalidatePath("/accueil");
  revalidatePath("/historique");
  redirect("/shabbats");
}

/* ------------------------------------------------------------------ */
/* Missions : ajout depuis le catalogue                                 */
/* ------------------------------------------------------------------ */

export async function addPresetMission(shabbatId: string, presetKey: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);

  const preset = MISSION_PRESETS.find((m) => m.key === presetKey);
  if (!preset) return;

  const { count } = await supabase
    .from("missions")
    .select("*", { count: "exact", head: true })
    .eq("shabbat_id", shabbatId);

  await run(
    "addPresetMission/missions",
    supabase.from("missions").insert({
      shabbat_id: shabbatId,
      title: preset.title,
      emoji: preset.emoji,
      category: preset.category,
      slots: preset.slots ?? 1,
      quantity: null,
      priority: "standard",
      position: count ?? 0,
    })
  );

  refresh(shabbatId);
  revalidatePath(`/creer/${shabbatId}/missions`);
}

/* ------------------------------------------------------------------ */
/* Nombre de places, réglé depuis la liste                              */
/* ------------------------------------------------------------------ */

export async function setMissionSlots(shabbatId: string, missionId: string, slots: number) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);

  await run(
    "setMissionSlots/missions",
    supabase
      .from("missions")
      .update({ slots: Math.max(1, Math.min(20, Math.round(slots))) })
      .eq("id", missionId)
  );

  refresh(shabbatId);
  revalidatePath(`/creer/${shabbatId}/missions`);
  revalidatePath(`/shabbat/${shabbatId}/missions`);
}

/* ------------------------------------------------------------------ */
/* Le plat qu'on apporte                                                */
/* ------------------------------------------------------------------ */

/**
 * Enregistre le plat choisi sur SA propre prise de mission. La clause sur
 * `profile_id` fait le travail : personne ne décide de ce qu'apporte un autre.
 */
export async function setClaimDish(
  shabbatId: string,
  missionId: string,
  dishKeys: string[],
  dishCustom: string | null,
) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  await run(
    "setClaimDish/mission_claims",
    supabase
      .from("mission_claims")
      .update({ dish_keys: dishKeys.length ? dishKeys : null, dish_custom: dishCustom })
      .eq("mission_id", missionId)
      .eq("profile_id", user.id)
  );

  refresh(shabbatId);
  revalidatePath(`/shabbat/${shabbatId}/mission/${missionId}`);
  revalidatePath(`/shabbat/${shabbatId}/besoins`);

  // Une fois le plat confirmé, on n'a plus rien à faire sur cette fiche.
  redirect("/accueil");
}

/* ------------------------------------------------------------------ */
/* Chambres : combien de places, et qui dort où                         */
/* ------------------------------------------------------------------ */

function refreshRooms(shabbatId: string) {
  refresh(shabbatId);
  revalidatePath(`/shabbat/${shabbatId}/couchage`);
  revalidatePath(`/creer/${shabbatId}/moments`);
}

export async function addRoom(shabbatId: string, label: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);

  const { count } = await supabase
    .from("sleeping_rooms")
    .select("*", { count: "exact", head: true })
    .eq("shabbat_id", shabbatId);

  await run(
    "addRoom/sleeping_rooms",
    supabase
      .from("sleeping_rooms")
      .insert({ shabbat_id: shabbatId, label, capacity: 2, position: count ?? 0 })
  );

  refreshRooms(shabbatId);
}

export async function updateRoom(
  shabbatId: string,
  roomId: string,
  patch: { label?: string; capacity?: number; policy?: string | null },
) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);

  await run(
    "updateRoom/sleeping_rooms",
    supabase
      .from("sleeping_rooms")
      .update({
        ...(patch.label !== undefined ? { label: patch.label } : {}),
        ...(patch.capacity !== undefined
          ? { capacity: Math.max(1, Math.min(20, Math.round(patch.capacity))) }
          : {}),
        ...(patch.policy !== undefined
          ? { policy: ["mixed", "girls", "boys"].includes(patch.policy ?? "") ? patch.policy : null }
          : {}),
      })
      .eq("id", roomId)
  );

  refreshRooms(shabbatId);
}

export async function removeRoom(shabbatId: string, roomId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await requireManager(shabbatId);
  await run("removeRoom/sleeping_rooms", supabase.from("sleeping_rooms").delete().eq("id", roomId));
  refreshRooms(shabbatId);
}

/**
 * Choisir sa place, ou la libérer. La clause sur `guest_id` fait le travail :
 * personne ne décide d'où dort quelqu'un d'autre.
 */
export async function chooseRoom(shabbatId: string, roomId: string | null) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  const choice = await run(
    "chooseRoom/update",
    supabase
      .from("invitations")
      .update({ sleeping_room_id: roomId })
      .eq("shabbat_id", shabbatId)
      .eq("guest_id", user.id),
  );

  refreshRooms(shabbatId);

  // La chambre a été remplie entre l'affichage et le clic (0020).
  if (choice.failed) {
    redirect(`/shabbat/${shabbatId}/couchage?refus=${messageKeyFor(choice.code)}`);
  }
}

/* ------------------------------------------------------------------ */
/* Annuler sa participation                                             */
/* ------------------------------------------------------------------ */

/**
 * L'invité se décommande. Ses apports repartent au pot commun et sa place de
 * couchage se libère, sans quoi le groupe s'organise autour de quelqu'un qui
 * ne viendra pas. L'hôte le voit à son statut, sur l'écran des invités.
 */
export async function cancelParticipation(shabbatId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  const { data: missions } = await run(
    "cancelParticipation/missions",
    supabase
      .from("missions")
      .select("id")
      .eq("shabbat_id", shabbatId)
  );

  const missionIds = (missions ?? []).map((m) => m.id as string);
  if (missionIds.length) {
    await run(
      "cancelParticipation/mission_claims",
      supabase
        .from("mission_claims")
        .delete()
        .eq("profile_id", user.id)
        .in("mission_id", missionIds)
    );
  }

  await run(
    "cancelParticipation/invitations",
    supabase
      .from("invitations")
      .update({ status: "declined", sleeping_room_id: null })
      .eq("shabbat_id", shabbatId)
      .eq("guest_id", user.id)
  );

  refresh(shabbatId);
  revalidatePath("/shabbats");
  revalidatePath(`/shabbat/${shabbatId}/invites`);
  redirect("/accueil");
}
