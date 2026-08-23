"use client";

import { useTransition } from "react";
import { setBackOfficeRole } from "@/app/admin/actions";

/** Promeut quelqu'un commerçant ou administrateur, depuis la ligne du tableau. */
export function RoleSelect({ userId, role }: { userId: string; role: string | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={role ?? ""}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => setBackOfficeRole(userId, e.target.value || null))
      }
      className="rounded-full border-[1.5px] border-line bg-white px-3 py-1.5 text-[12.5px] font-bold disabled:opacity-60"
    >
      <option value="">Aucun</option>
      <option value="merchant">Commerçant</option>
      <option value="admin">Administrateur</option>
    </select>
  );
}
