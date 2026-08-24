import Link from "next/link";
import { AdminEmpty, AdminTable, AdminTitle, StatusTag, Td } from "@/components/admin";
import { allTraiteursForAdmin } from "@/lib/shops";

/**
 * File de validation des traiteurs.
 *
 * Portée sur le schéma traiteurs (statut pending/approved/rejected, un seul
 * motif de refus) — plus simple que la file d'origine de Rraven666/lehaim
 * (shop_applications avec pièces jointes, complément de dossier, SIRET) :
 * ce backend n'a ni documents ni statut intermédiaire.
 */

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
};

const STATUS_TONE: Record<string, string> = {
  pending: "waiting",
  approved: "ok",
  rejected: "danger",
};

function ageTone(days: number): string {
  if (days >= 4) return "danger";
  if (days >= 2) return "alert";
  return "ok";
}

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

export default async function Validation() {
  // Garde déjà posée par app/admin/layout.tsx (réservé aux admins).
  const traiteurs = await allTraiteursForAdmin();
  const pending = traiteurs.filter((t) => t.status === "pending");
  const now = Date.now();
  const late = pending.filter(
    (t) => Math.floor((now - new Date(t.createdAt).getTime()) / 86_400_000) >= 2,
  ).length;

  return (
    <>
      <AdminTitle title="Validation des traiteurs" />

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <StatusTag status="waiting" label={`En attente · ${pending.length}`} />
        <StatusTag
          status="ok"
          label={`Approuvés · ${traiteurs.filter((t) => t.status === "approved").length}`}
        />
        <StatusTag
          status="danger"
          label={`Rejetés · ${traiteurs.filter((t) => t.status === "rejected").length}`}
        />
      </div>

      {traiteurs.length ? (
        <>
          <AdminTable columns={["Commerce", "Ville", "Cacherout", "Déposé", "Ancienneté", "Statut", ""]}>
            {traiteurs.map((t) => {
              const days = Math.floor((now - new Date(t.createdAt).getTime()) / 86_400_000);
              return (
                <tr key={t.id}>
                  <Td>{t.name}</Td>
                  <Td muted>{t.city ?? "—"}</Td>
                  <Td muted>{t.hechsherName ?? "—"}</Td>
                  <Td muted>{dateFormat.format(new Date(t.createdAt))}</Td>
                  <Td>
                    {t.status === "pending" ? (
                      <StatusTag status={ageTone(days)} label={days === 0 ? "aujourd'hui" : `${days} j`} />
                    ) : (
                      <span className="text-ink/45">—</span>
                    )}
                  </Td>
                  <Td>
                    <StatusTag status={STATUS_TONE[t.status]} label={STATUS_LABEL[t.status]} />
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/validation/${t.id}`}
                      className="inline-block rounded-full border-2 border-teal px-3.5 py-1.5 text-[12px] font-bold text-teal"
                    >
                      Ouvrir
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </AdminTable>

          <p className="mt-3.5 text-[13px] text-ink/55">
            Objectif de traitement : 48 h ouvrées
            {late > 0 && <span className="font-bold text-coral-deep"> · {late} hors délai</span>}
          </p>
        </>
      ) : (
        <AdminEmpty
          title="Aucun dossier"
          text="Les candidatures déposées par les traiteurs apparaîtront ici, du plus ancien au plus récent."
        />
      )}
    </>
  );
}
