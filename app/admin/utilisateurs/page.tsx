import { redirect } from "next/navigation";
import { AdminEmpty, AdminTable, AdminTitle, Td } from "@/components/admin";
import { RoleSelect } from "./RoleSelect";
import { requireBackOffice } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type Row = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  locale: string | null;
  back_office_role: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  hosted: number;
  joined: number;
};

/**
 * B2 · Utilisateurs. La liste vient de `auth.users`, pas de `profiles` :
 * c'est elle qui fait foi, et elle seule connaît l'e-mail vérifié et la
 * dernière connexion.
 */
export default async function AdminUsers() {
  const role = await requireBackOffice();
  if (role !== "admin") redirect("/admin");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_user_list");
  const rows = (data ?? []) as Row[];

  if (error) {
    return (
      <>
        <AdminTitle title="Utilisateurs" />
        <AdminEmpty
          title="Liste indisponible"
          text={`La fonction admin_user_list n'a pas répondu : ${error.message}. La migration 0012 a-t-elle été passée ?`}
        />
      </>
    );
  }

  return (
    <>
      <AdminTitle
        title="Utilisateurs"
        action={
          <span className="rounded-full border-[1.5px] border-line bg-white px-4 py-2 text-[12px] font-bold">
            {rows.length} compte{rows.length > 1 ? "s" : ""}
          </span>
        }
      />

      {rows.length ? (
        <AdminTable
          columns={[
            "Nom",
            "E-mail",
            "Inscrit le",
            "Dernière connexion",
            "Shabbats",
            "Langue",
            "Back-office",
          ]}
        >
          {rows.map((row) => {
            const name =
              [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "—";
            return (
              <tr key={row.id}>
                <Td>{name}</Td>
                <Td muted>{row.email ?? "—"}</Td>
                <Td muted>{formatDate(row.created_at)}</Td>
                <Td muted>
                  {row.last_sign_in_at ? formatDate(row.last_sign_in_at) : "jamais"}
                </Td>
                <Td muted>
                  {row.hosted} org · {row.joined} part.
                </Td>
                <Td muted>{(row.locale ?? "fr").toUpperCase()}</Td>
                <Td muted>
                  <RoleSelect userId={row.id} role={row.back_office_role} />
                </Td>
              </tr>
            );
          })}
        </AdminTable>
      ) : (
        <AdminEmpty
          title="Aucun compte"
          text="Les comptes apparaîtront ici au fur et à mesure des inscriptions."
        />
      )}
    </>
  );
}
