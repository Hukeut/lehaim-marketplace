import { redirect } from "next/navigation";
import { WizardForm } from "@/components/WizardForm";
import { Field, PillChoices, Select, TextArea, WizardFooter, WizardStep } from "@/components/partner";
import { getMyDossier } from "@/lib/partner";
import { saveFirstProduct } from "../actions";

const CATEGORIES: [string, string][] = [
  ["entree", "Entrée"],
  ["plat", "Plat"],
  ["dessert", "Dessert"],
  ["patisserie", "Pâtisserie"],
  ["pain", "Pain · challot"],
  ["boisson", "Boisson"],
  ["epicerie", "Épicerie"],
  ["other", "Autre"],
];

const ALLERGENS: [string, string][] = [
  ["gluten", "Gluten"],
  ["lait", "Lait"],
  ["oeuf", "Œuf"],
  ["arachide", "Arachide"],
  ["fruits_a_coque", "Fruits à coque"],
  ["sesame", "Sésame"],
  ["soja", "Soja"],
  ["poisson", "Poisson"],
  ["moutarde", "Moutarde"],
  ["sulfites", "Sulfites"],
];

// Ce que le client filtre pour chercher : la liste des « sans » est plus
// courte que celle des « contient », et c'est normal — on ne se déclare pas
// sans moutarde, on se déclare sans gluten.
const FREE_FROM: [string, string][] = ALLERGENS.slice(0, 6);

/**
 * Étape 5 · le premier produit.
 *
 * Un seul suffit pour envoyer le dossier : la carte complète se monte après,
 * dans le back-office, et exiger vingt fiches avant même d'être validé ferait
 * abandonner tout le monde.
 *
 * Les allergènes se déclarent sur trois niveaux distincts, jamais fusionnés.
 * « Contient » engage la responsabilité du commerçant, « traces » l'atténue,
 * « sans » la renverse — les confondre serait un risque sanitaire.
 */
export default async function Catalogue() {
  const dossier = await getMyDossier();
  if (!dossier) redirect("/partenaire/dossier/entreprise");

  return (
    <WizardStep
      title="Votre premier produit"
      intro={
        dossier.productCount > 0
          ? `Votre carte compte déjà ${dossier.productCount} produit${dossier.productCount > 1 ? "s" : ""}. Vous pouvez en ajouter un autre, ou continuer.`
          : "Un seul produit suffit pour envoyer votre dossier — vous monterez toute la carte depuis votre back-office une fois validé."
      }
    >
      <WizardForm action={saveFirstProduct}>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Field label="Nom du produit" name="name" placeholder="Rôti de bœuf aux herbes" required />
          <Select label="Catégorie" name="category" options={CATEGORIES} />
          <Field label="Prix (€)" name="price" type="text" placeholder="24,50" required />
        </div>

        <TextArea
          label="Description"
          name="description"
          placeholder="Pièce de macreuse mijotée cinq heures, servie froide, tranchée. Pour six à huit personnes."
        />

        <div className="flex flex-col gap-4 rounded-[16px] bg-sand p-4">
          <p className="text-[12.5px] leading-snug text-ink/60">
            Trois niveaux séparés, à ne pas confondre : ce que le produit contient, ce dont il
            peut porter des traces, et ce dont il est garanti dépourvu.
          </p>
          <PillChoices legend="Contient" name="contains" options={ALLERGENS} tone="wine" />
          <PillChoices legend="Traces possibles" name="traces" options={ALLERGENS} tone="gold" />
          <PillChoices legend="Garanti sans" name="free" options={FREE_FROM} tone="olive" />
        </div>

        <Field
          label="Note d'atelier"
          name="workshop_note"
          hint="Interne : visible par vous et votre équipe, jamais par le client."
        />

        <WizardFooter
          label={dossier.productCount > 0 ? "Ajouter ce produit" : "Continuer"}
          back="/partenaire/dossier/cacherout"
          skip={
            dossier.productCount > 0
              ? { href: "/partenaire/dossier/logistique", label: "Passer cette étape" }
              : undefined
          }
        />
      </WizardForm>
    </WizardStep>
  );
}
