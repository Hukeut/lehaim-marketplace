import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/supabase/user";

export type CohostScope = "missions" | "guests" | "messages" | "expenses";

export const COHOST_SCOPES: { key: CohostScope; column: string }[] = [
  { key: "missions", column: "can_manage_missions" },
  { key: "guests", column: "can_manage_guests" },
  { key: "messages", column: "can_manage_messages" },
  { key: "expenses", column: "can_manage_expenses" },
];

export type Cohost = {
  invitationId: string;
  name: string;
  initial: string;
  scopes: Record<CohostScope, boolean>;
};

/** La délégation dont bénéficie la personne connectée sur ce Shabbat. */
export const getMyCohostRole = cache(async function getMyCohostRole(shabbatId: string): Promise<Cohost | null> {
  const supabase = await createClient();
  const user = await currentUser();
  if (!user) return null;

  const { data } = await supabase
    .from("invitations")
    .select(
      "id, is_cohost, can_manage_missions, can_manage_guests, can_manage_messages, can_manage_expenses, profiles(first_name, last_name)",
    )
    .eq("shabbat_id", shabbatId)
    .eq("guest_id", user.id)
    .maybeSingle();

  if (!data?.is_cohost) return null;

  const profile = data.profiles as unknown as {
    first_name: string | null;
    last_name: string | null;
  } | null;
  const name =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || "";

  return {
    invitationId: data.id as string,
    name,
    initial: (name || "?").charAt(0).toUpperCase(),
    scopes: {
      missions: Boolean(data.can_manage_missions),
      guests: Boolean(data.can_manage_guests),
      messages: Boolean(data.can_manage_messages),
      expenses: Boolean(data.can_manage_expenses),
    },
  };
});

/** Les co-organisateurs d'un Shabbat, vus par l'hôte. */
export const listCohosts = cache(async function listCohosts(shabbatId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invitations")
    .select(
      "id, guest_name, can_manage_missions, can_manage_guests, can_manage_messages, can_manage_expenses, profiles(first_name, last_name)",
    )
    .eq("shabbat_id", shabbatId)
    .eq("is_cohost", true);

  return (data ?? []).map((row) => {
    const profile = row.profiles as unknown as {
      first_name: string | null;
      last_name: string | null;
    } | null;
    const name =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
      (row.guest_name as string) ||
      "";
    return {
      invitationId: row.id as string,
      name,
      initial: (name || "?").charAt(0).toUpperCase(),
      scopes: {
        missions: Boolean(row.can_manage_missions),
        guests: Boolean(row.can_manage_guests),
        messages: Boolean(row.can_manage_messages),
        expenses: Boolean(row.can_manage_expenses),
      },
    };
  });
});
