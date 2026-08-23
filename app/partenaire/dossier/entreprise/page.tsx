import { saveCompany } from "../actions";
import { WizardForm } from "@/components/WizardForm";
import { Field, Select, TextArea, WizardFooter, WizardStep } from "@/components/partner";
import { getMyDossier } from "@/lib/partner";

const CATEGORIES: [string, string][] = [
  ["caterer", "Traiteur"],
  ["butcher", "Boucherie"],
  ["bakery", "Boulangerie · pâtisserie"],
  ["grocery", "Épicerie"],
  ["wine", "Cave"],
];

/** Étape 2 · ce qui apparaîtra sur la fiche publique, sauf le SIRET. */
export default async function Entreprise() {
  const dossier = await getMyDossier();
  const shop = dossier?.shop;

  return (
    <WizardStep
      title="Votre commerce"
      intro="Ces informations apparaissent sur votre fiche publique — à l'exception du numéro d'entreprise, qui ne sert qu'à la vérification."
    >
      <WizardForm action={saveCompany}>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Field label="Nom commercial affiché" name="name" defaultValue={shop?.name} required />
          <Field label="Raison sociale" name="legal_name" defaultValue={shop?.legalName} />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Select label="Catégorie" name="category" defaultValue={shop?.category} options={CATEGORIES} />
          <Field
            label="Numéro d'entreprise (SIRET)"
            name="siret"
            defaultValue={shop?.siret}
            hint="Vérifié par notre équipe, jamais affiché publiquement."
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Field label="Adresse du commerce" name="address" defaultValue={shop?.address} />
          <Field label="Ville" name="city" defaultValue={shop?.city} />
          <Field label="Téléphone public" name="phone" defaultValue={shop?.phone} />
        </div>

        <TextArea
          label="Description courte"
          name="description"
          defaultValue={shop?.description}
          placeholder="Cuisine du vendredi préparée le matin même : rôtis, salades et challot tressées à la main."
        />

        <WizardFooter label="Continuer" note="Enregistré à chaque étape" />
      </WizardForm>
    </WizardStep>
  );
}
