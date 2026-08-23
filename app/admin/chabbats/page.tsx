import { AdminEmpty, AdminTable, AdminTitle, StatusTag, Td } from "@/components/admin";
import { requireBackOffice } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const STATUS_LABEL: Record<string, string> = {
  planning: "En préparation",
  published: "Publié",
  done: "Terminé",
};

/** B3 · Shabbats. */
export default async function AdminShabbats() {
  const role = await requireBackOffice();
  if (role !== "admin") redirect("/admin");

  const supabase = await createClient();
  const { data } = await supabase
    .from("shabbats")
    .select("id, title, starts_at, status, guest_target, city:neighbourhood, profiles:host_id(first_name, last_name)")
    .order("starts_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Record<string, unknown>[];

  return (
    <>
      <AdminTitle title="Shabbats" />

      {rows.length ? (
        <AdminTable columns={["Titre", "Hôte", "Date", "Ville", "Convives", "Statut"]}>
          {rows.map((row) => {
            const host = row.profiles as { first_name?: string; last_name?: string } | null;
            const hostName =
              [host?.first_name, host?.last_name].filter(Boolean).join(" ").trim() || "—";
            const status = (row.status as string) ?? "planning";
            return (
              <tr key={row.id as string}>
                <Td>{row.title as string}</Td>
                <Td muted>{hostName}</Td>
                <Td muted>{formatDate(row.starts_at as string)}</Td>
                <Td muted>{(row.city as string) ?? "—"}</Td>
                <Td muted>{(row.guest_target as number) ?? "—"}</Td>
                <Td>
                  <StatusTag
                    status={status === "done" ? "suspended" : status === "published" ? "live" : "draft"}
                    label={STATUS_LABEL[status] ?? status}
                  />
                </Td>
              </tr>
            );
          })}
        </AdminTable>
      ) : (
        <AdminEmpty title="Aucun Shabbat" text="Les Shabbats créés dans l'app apparaîtront ici." />
      )}
    </>
  );
}
