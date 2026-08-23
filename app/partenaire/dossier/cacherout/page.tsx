import { redirect } from "next/navigation";
import { Uploader } from "@/components/Uploader";
import { WizardForm } from "@/components/WizardForm";
import { Field, PillChoices, TextArea, WizardFooter, WizardStep } from "@/components/partner";
import { getMyDossier } from "@/lib/partner";
import { saveKashrut } from "../actions";

const MENTIONS: [string, string][] = [
  ["halav_israel", "Halav Israel"],
  ["pat_israel", "Pat Israel"],
  ["bishoul_israel", "Bishoul Israel"],
  ["viande", "Cuisine viande"],
  ["parve", "Parvé"],
];

/**
 * Étape 4 · le certificat de cacherout.
 *
 * C'est la pièce qui distingue cette place de marché d'une autre, et la seule
 * qui périme. Elle a donc ses dates en clair plutôt qu'un simple fichier : ce
 * sont elles qui déclencheront la relance avant expiration.
 */
export default async function Cacherout() {
  const dossier = await getMyDossier();
  if (!dossier) redirect("/partenaire/dossier/entreprise");

  const { shop, documents, certificate } = dossier;

  return (
    <WizardStep
      title="Votre certificat de cacherout"
      intro="Les dates de validité sont affichées sur votre fiche : c'est ce que le client regarde en premier. Nous vous préviendrons un mois avant l'expiration."
    >
      <Uploader
        shopId={shop.id}
        kind="kashrut"
        label="Le certificat lui-même"
        hint="Le document délivré par l'organisme, photographié ou scanné."
        initialState={documents.kashrut.status}
        initialPath={documents.kashrut.filePath}
        rejectedReason={documents.kashrut.rejectedReason}
      />

      <WizardForm action={saveKashrut}>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Field
            label="Organisme certificateur"
            name="authority"
            defaultValue={certificate?.authority}
            placeholder="Beth Din de Paris"
            required
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Field
            label="Valable à partir du"
            name="valid_from"
            type="date"
            defaultValue={certificate?.validFrom}
            required
          />
          <Field
            label="Jusqu'au"
            name="valid_to"
            type="date"
            defaultValue={certificate?.validTo}
            required
          />
        </div>

        <PillChoices
          legend="Mentions portées par le certificat"
          name="mentions"
          options={MENTIONS}
          selected={certificate?.mentions}
          tone="olive"
        />

        <TextArea
          label="Précisions"
          name="detail"
          defaultValue={certificate?.detail}
          rows={2}
          placeholder="Supervision permanente le vendredi matin, mashguiah présent en cuisine."
        />

        <WizardFooter
          label="Continuer"
          back="/partenaire/dossier/documents"
          note="Vérifié par notre équipe"
        />
      </WizardForm>
    </WizardStep>
  );
}
