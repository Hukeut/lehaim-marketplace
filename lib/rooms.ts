import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/supabase/user";
import { toneFor } from "@/lib/profile";
import type { AvatarTone } from "@/components/ui";

export type RoomOccupant = { id: string; name: string; initial: string; tone: AvatarTone };

export type Room = {
  id: string;
  label: string;
  capacity: number;
  policy: "mixed" | "girls" | "boys" | null;
  occupants: RoomOccupant[];
  free: number;
  mine: boolean;
};

type ProfileRow = { id: string; first_name: string | null; last_name: string | null } | null;

/**
 * Les chambres d'un Shabbat, avec qui dort où. Une seule requête pour les
 * chambres, une pour les invitations : la répartition se fait ici.
 */
export const listRooms = cache(async function listRooms(shabbatId: string, guestFallback: string): Promise<Room[]> {
  const supabase = await createClient();
  const user = await currentUser();

  const [roomsRes, guestsRes] = await Promise.all([
    supabase
      .from("sleeping_rooms")
      .select("id, label, capacity, policy")
      .eq("shabbat_id", shabbatId)
      .order("position"),
    supabase
      .from("invitations")
      .select("guest_id, guest_name, sleeping_room_id, profiles(id, first_name, last_name)")
      .eq("shabbat_id", shabbatId)
      .not("sleeping_room_id", "is", null),
  ]);

  const byRoom = new Map<string, RoomOccupant[]>();
  for (const row of (guestsRes.data ?? []) as unknown as Record<string, unknown>[]) {
    const profile = row.profiles as ProfileRow;
    const name =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
      (row.guest_name as string) ||
      guestFallback;
    const id = (profile?.id as string) ?? (row.guest_id as string) ?? "";
    const list = byRoom.get(row.sleeping_room_id as string) ?? [];
    list.push({ id, name, initial: name.charAt(0).toUpperCase(), tone: toneFor(id || name) });
    byRoom.set(row.sleeping_room_id as string, list);
  }

  return ((roomsRes.data ?? []) as unknown as Record<string, unknown>[]).map((row) => {
    const occupants = byRoom.get(row.id as string) ?? [];
    const capacity = row.capacity as number;
    return {
      id: row.id as string,
      label: row.label as string,
      capacity,
      policy: (row.policy as Room["policy"]) ?? null,
      occupants,
      free: Math.max(0, capacity - occupants.length),
      mine: Boolean(user && occupants.some((o) => o.id === user.id)),
    };
  });
});
