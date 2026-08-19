"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MOMENTS, templateByKey } from "@/lib/templates";
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
/* S03 · Appliquer un modèle                                            */
/* ------------------------------------------------------------------ */

export async function applyTemplate(shabbatId: string, key: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  const template = templateByKey(key);
  if (!template) return;

  await supabase.from("shabbats").update({ template: key }).eq("id", shabbatId);

  // Moments
  const moments = template.moments.map((kind, index) => {
    const meta = MOMENTS.find((m) => m.kind === kind)!;
    return {
      shabbat_id: shabbatId,
      kind,
      label: meta.label,
      detail: meta.detail,
      position: index,
    };
  });
  if (moments.length) {
    await supabase.from("moments").upsert(moments, { onConflict: "shabbat_id,kind" });
  }

  // Missions
  const missions = template.missions.map((mission, index) => ({
    shabbat_id: shabbatId,
    title: mission.title,
    emoji: mission.emoji,
    category: mission.category,
    slots: mission.slots ?? 1,
    quantity: mission.quantity ?? null,
    priority: mission.priority ?? "standard",
    position: index,
  }));
  if (missions.length) await supabase.from("missions").insert(missions);

  // Matériel
  const equipment = template.equipment.map((item, index) => ({
    shabbat_id: shabbatId,
    name: item.name,
    emoji: item.emoji,
    owned: item.owned,
    needed: item.needed,
    position: index,
  }));
  if (equipment.length) await supabase.from("equipment").insert(equipment);

  refresh(shabbatId);
  redirect(`/creer/${shabbatId}/moments`);
}

/* ------------------------------------------------------------------ */
/* S04a · Moments proposés                                              */
/* ------------------------------------------------------------------ */

export async function toggleMoment(shabbatId: string, kind: string, enabled: boolean) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  if (enabled) {
    await supabase.from("moments").delete().eq("shabbat_id", shabbatId).eq("kind", kind);
  } else {
    const meta = MOMENTS.find((m) => m.kind === kind);
    if (!meta) return;
    await supabase.from("moments").upsert(
      {
        shabbat_id: shabbatId,
        kind,
        label: meta.label,
        detail: meta.detail,
        position: MOMENTS.findIndex((m) => m.kind === kind),
      },
      { onConflict: "shabbat_id,kind" },
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

  if (error) return { ok: false, message: error.message };

  refresh(shabbatId);
  return { ok: true, message: "Mission enregistrée." };
}

export async function deleteMission(shabbatId: string, missionId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("missions").delete().eq("id", missionId);
  refresh(shabbatId);
  redirect(`/shabbat/${shabbatId}/missions`);
}

export async function setMissionStatus(
  shabbatId: string,
  missionId: string,
  status: "todo" | "in_progress" | "done",
) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("missions").update({ status }).eq("id", missionId);
  refresh(shabbatId);
}

/* ------------------------------------------------------------------ */
/* S07 · Prendre / libérer une mission                                  */
/* ------------------------------------------------------------------ */

export async function claimMission(shabbatId: string, missionId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase
    .from("mission_claims")
    .upsert({ mission_id: missionId, profile_id: user.id }, { onConflict: "mission_id,profile_id" });
  await supabase.from("missions").update({ status: "in_progress" }).eq("id", missionId);

  refresh(shabbatId);
  redirect(`/shabbat/${shabbatId}/mission/${missionId}`);
}

export async function releaseMission(shabbatId: string, missionId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase
    .from("mission_claims")
    .delete()
    .eq("mission_id", missionId)
    .eq("profile_id", user.id);

  const { count } = await supabase
    .from("mission_claims")
    .select("*", { count: "exact", head: true })
    .eq("mission_id", missionId);

  if (!count) await supabase.from("missions").update({ status: "todo" }).eq("id", missionId);

  refresh(shabbatId);
  redirect(`/shabbat/${shabbatId}/missions`);
}

/** « Dis-moi quoi apporter » : la mission ouverte la plus prioritaire. */
export async function suggestMission(shabbatId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  const { data } = await supabase
    .from("missions")
    .select("id, slots, priority, mission_claims(profile_id)")
    .eq("shabbat_id", shabbatId);

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

  if (error) return { ok: false, message: error.message };
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
    await supabase
      .from("suggestion_votes")
      .delete()
      .eq("suggestion_id", suggestionId)
      .eq("profile_id", user.id);
  } else {
    await supabase
      .from("suggestion_votes")
      .upsert({ suggestion_id: suggestionId, profile_id: user.id });
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
  await supabase.from("suggestions").update({ chosen: false }).eq("mission_id", missionId);
  await supabase.from("suggestions").update({ chosen: true }).eq("id", suggestionId);
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

  if (error) return { ok: false, message: error.message };
  refresh(shabbatId);
  return { ok: true, message: null };
}

export async function claimEquipment(shabbatId: string, itemId: string, claimed: boolean) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase
    .from("equipment")
    .update({ claimed_by: claimed ? null : user.id })
    .eq("id", itemId);
  refresh(shabbatId);
}

export async function removeEquipment(shabbatId: string, itemId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("equipment").delete().eq("id", itemId);
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

  if (error) return { ok: false, message: error.message };
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

  const { data: swap } = await supabase
    .from("swaps")
    .select("mission_id, from_id, to_id")
    .eq("id", swapId)
    .maybeSingle();

  await supabase
    .from("swaps")
    .update({ status: outcome, resolved_at: new Date().toISOString() })
    .eq("id", swapId);

  if (outcome === "accepted" && swap) {
    await supabase
      .from("mission_claims")
      .delete()
      .eq("mission_id", swap.mission_id)
      .eq("profile_id", swap.from_id);
    if (swap.to_id) {
      await supabase
        .from("mission_claims")
        .upsert(
          { mission_id: swap.mission_id, profile_id: swap.to_id },
          { onConflict: "mission_id,profile_id" },
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
    await supabase
      .from("rsvps")
      .delete()
      .eq("moment_id", momentId)
      .eq("invitation_id", invitationId);
  } else {
    await supabase
      .from("rsvps")
      .upsert(
        { moment_id: momentId, invitation_id: invitationId, attending: true },
        { onConflict: "moment_id,invitation_id" },
      );
  }

  await supabase.from("invitations").update({ status: "confirmed" }).eq("id", invitationId);
  refresh(shabbatId);
}

/* ------------------------------------------------------------------ */
/* S05bis / S05ter / S17 · Financement, deadline, verrouillage          */
/* ------------------------------------------------------------------ */

export async function setFundingMode(shabbatId: string, mode: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("shabbats").update({ funding_mode: mode }).eq("id", shabbatId);
  refresh(shabbatId);
}

export async function setReadyBy(shabbatId: string, iso: string | null) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("shabbats").update({ ready_by: iso }).eq("id", shabbatId);
  refresh(shabbatId);
}

export async function lockShabbat(shabbatId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase
    .from("shabbats")
    .update({ locked_at: new Date().toISOString(), status: "published" })
    .eq("id", shabbatId);
  refresh(shabbatId);
  redirect(`/shabbat/${shabbatId}/ready`);
}

export async function unlockShabbat(shabbatId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("shabbats").update({ locked_at: null }).eq("id", shabbatId);
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

  if (error) return { ok: false, message: error.message };
  refresh(shabbatId);
  return { ok: true, message: null };
}

export async function toggleSettled(shabbatId: string, expenseId: string, settled: boolean) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("expenses").update({ settled: !settled }).eq("id", expenseId);
  refresh(shabbatId);
}
