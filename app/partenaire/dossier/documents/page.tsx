import { redirect } from "next/navigation";
import { Uploader } from "@/components/Uploader";
import { WizardStep } from "@/components/partner";
import { getMyDossier } from "@/lib/partner";
import { finishDocuments } from "../actions";

/**
 * Étape 3 · les pièces d'identité et d'entreprise.
 *
 * La licence est facultative : toutes les catégories n'en ont pas. Le
 * certificat de cacherout a son étape à lui, avec ses dates — le déposer ici
 * sans dire jusqu'à quand il vaut ne servirait à rien.
 */
export default async function Documents() {
  const dossier = await getMyDossier();
  if (!dossier) redirect("/partenaire/dossier/entreprise");

  const { shop, documents } = dossier;
  const ready =
    documents.id_front.status === "uploaded" &&
    documents.id_back.status === "uploaded" &&
    documents.kbis.status === "uploaded";

  const pieces = [
    {
      kind: "id_front" as const,
      label: "Pièce d'identité — recto",
      hint: "Carte d'identité, passeport ou titre de séjour du gérant.",
    },
    { kind: "id_back" as const, label: "Pièce d'identité — verso" },
    {
      kind: "kbis" as const,
      label: "Justificatif d'entreprise",
      hint: "Extrait Kbis ou avis de situation, de moins de trois mois.",
    },
    {
      kind: "license" as const,
      label: "Licence d'exploitation",
      hint: "Si votre activité en demande une.",
      optional: true,
    },
  ];

  return (
    <WizardStep
      title="Vos pièces justificatives"
      intro="Ces documents ne quittent jamais notre équipe de validation : ils ne sont ni affichés sur votre fiche, ni transmis à vos clients."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {pieces.map((piece) => (
          <Uploader
            key={piece.kind}
            shopId={shop.id}
            kind={piece.kind}
            label={piece.label}
            hint={piece.hint}
            optional={piece.optional}
            initialState={documents[piece.kind].status}
            initialPath={documents[piece.kind].filePath}
            rejectedReason={documents[piece.kind].rejectedReason}
          />
        ))}
      </div>

      <form action={finishDocuments}>
        <div className="mt-1 flex flex-wrap items-center gap-3 border-t border-line-soft pt-5">
          <a
            href="/partenaire/dossier/entreprise"
            className="rounded-full border-2 border-line px-5 py-2.5 font-display text-[14px] font-semibold text-ink/60"
          >
            Retour
          </a>
          <span className="ms-auto flex items-center gap-4">
            {!ready && (
              <span className="text-[12px] text-ink/45">
                Identité et justificatif d&apos;entreprise attendus
              </span>
            )}
            <button
              type="submit"
              disabled={!ready}
              className="rounded-full bg-coral-deep px-6 py-3 font-display text-[14.5px] font-semibold text-white disabled:opacity-40"
            >
              Continuer
            </button>
          </span>
        </div>
      </form>
    </WizardStep>
  );
}
