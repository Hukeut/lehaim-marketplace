import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTitle, StatusTag } from "@/components/admin";
import { money, traiteurForAdmin } from "@/lib/shops";
import { DecisionPanel } from "./DecisionPanel";

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

/**
 * Revue d'un dossier traiteur.
 *
 * Deux colonnes : ce que le traiteur a déclaré (et son premier catalogue),
 * puis la décision. Pas de pièces jointes ni de checklist déduite — ce
 * backend n'a ni documents ni certificat à échéance à vérifier, juste ce que
 * le formulaire de candidature a demandé.
 */
export default async function DossierTraiteur({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  // Garde déjà posée par app/admin/layout.tsx (réservé aux admins).
  const { reference: id } = await params;
  const dossier = await traiteurForAdmin(id);
  if (!dossier) notFound();

  const decided = dossier.status !== "pending";

  return (
    <>
      <AdminTitle
        title={dossier.name}
        action={
          <Link
            href="/admin/validation"
            className="rounded-full border-[1.5px] border-line bg-white px-4 py-2 text-[12.5px] font-bold shadow-[var(--shadow-pill)]"
          >
            Retour à la file
          </Link>
        }
      />

      <div className="mb-5">
        <StatusTag status={STATUS_TONE[dossier.status]} label={STATUS_LABEL[dossier.status]} />
      </div>

      {dossier.status === "rejected" && dossier.rejectionReason && (
        <div className="mb-5 rounded-[18px] bg-gold-wash px-5 py-4">
          <div className="text-[13px] font-bold text-gold-ink">Motif du refus</div>
          <p className="mt-1 text-[13.5px] leading-relaxed text-gold-ink/85">
            {dossier.rejectionReason}
          </p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <div className="rounded-[18px] bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="mb-3.5 font-display text-[16px] font-semibold">Informations déclarées</div>
            <dl className="grid gap-y-2.5 text-[13.5px] sm:grid-cols-[160px_1fr]">
              {[
                ["Nom commercial", dossier.name],
                ["Adresse", dossier.address],
                ["Ville", dossier.city],
                ["Téléphone", dossier.phone],
                ["Numéro de patente", dossier.patenteNumber],
                ["Cacherout", dossier.hechsherName],
                [
                  "Livraison",
                  dossier.deliveryAvailable
                    ? `Oui${dossier.deliveryZone ? ` · ${dossier.deliveryZone}` : ""}`
                    : "Non",
                ],
              ].map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-[12.5px] font-bold text-ink/55">{label}</dt>
                  <dd className={value ? "font-bold" : "text-ink/40"}>{value || "non renseigné"}</dd>
                </div>
              ))}
            </dl>

            {dossier.description && (
              <p className="mt-3.5 border-t border-line-soft pt-3.5 text-[13.5px] leading-relaxed text-ink/65">
                {dossier.description}
              </p>
            )}
          </div>

          <div className="rounded-[18px] bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="mb-3.5 font-display text-[16px] font-semibold">
              Catalogue ({dossier.products.length})
            </div>
            {dossier.products.length ? (
              <ul className="flex flex-col gap-2">
                {dossier.products.map((p) => (
                  <li key={p.id} className="flex items-baseline justify-between text-[13px]">
                    <span className="text-ink/70">{p.name}</span>
                    <span className="font-bold">{money(p.price)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-ink/50">Aucun produit.</p>
            )}
          </div>
        </div>

        <div className="rounded-[18px] bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="mb-3 font-display text-[16px] font-semibold">Décision</div>
          {decided ? (
            <p className="text-[13.5px] leading-relaxed text-ink/60">
              Ce dossier est {dossier.status === "approved" ? "approuvé" : "rejeté"}.
            </p>
          ) : (
            <DecisionPanel id={dossier.id} />
          )}
        </div>
      </div>
    </>
  );
}
