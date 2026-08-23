import { redirect } from "next/navigation";
import { WizardForm } from "@/components/WizardForm";
import { Field, Select, WizardFooter, WizardStep } from "@/components/partner";
import { getMyDossier } from "@/lib/partner";
import { saveContract } from "../actions";

const FREQUENCIES: [string, string][] = [
  ["weekly", "Chaque semaine, le lundi"],
  ["biweekly", "Tous les quinze jours"],
  ["monthly", "Une fois par mois"],
];

/**
 * Étape 7 · reversements et contrat.
 *
 * Le taux de commission est affiché en gros et rappelé dans les conditions :
 * c'est le seul chiffre du dossier qui coûte de l'argent au commerçant, il
 * n'a rien à faire en petits caractères.
 */
export default async function Contrat() {
  const dossier = await getMyDossier();
  if (!dossier) redirect("/partenaire/dossier/entreprise");

  const { shop } = dossier;

  return (
    <WizardStep
      title="Reversements et contrat"
      intro="Vos ventes vous sont reversées sur ce compte, commission déduite. Vous pouvez changer de rythme à tout moment depuis votre back-office."
    >
      <div className="flex flex-wrap items-center gap-5 rounded-[16px] bg-teal/10 px-5 py-4">
        <div className="flex flex-col">
          <span className="font-display text-[28px] leading-none font-semibold text-teal-deep">
            {shop.commissionRate} %
          </span>
          <span className="mt-1 text-[12px] font-bold text-ink/55">de commission</span>
        </div>
        <p className="min-w-[16ch] flex-1 text-[12.5px] leading-relaxed text-ink/65">
          Prélevée sur le montant de chaque commande livrée. Aucun abonnement, aucun frais
          d&apos;entrée : si vous ne vendez rien, vous ne payez rien.
        </p>
      </div>

      <WizardForm action={saveContract}>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Field
            label="IBAN"
            name="iban"
            defaultValue={shop.iban}
            placeholder="FR76 3000 1007 9412 3456 7890 185"
            required
          />
          <Select
            label="Rythme des reversements"
            name="payout_frequency"
            defaultValue={shop.payoutFrequency}
            options={FREQUENCIES}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-[16px] border-[1.5px] border-line bg-sand p-4">
          <span className="text-[12px] font-bold text-ink/55">Contrat partenaire</span>
          <div className="max-h-[190px] overflow-y-auto pe-2 text-[12.5px] leading-relaxed text-ink/70">
            <p className="mb-2">
              Le commerçant conserve la pleine responsabilité de la conformité de ses produits,
              de leur cacherout et de leur étiquetage, y compris la déclaration des allergènes.
              Lehaim n&apos;intervient ni dans la préparation ni dans la certification.
            </p>
            <p className="mb-2">
              Lehaim met à disposition la place de marché, encaisse les commandes pour le compte
              du commerçant et lui en reverse le montant, déduction faite de la commission de{" "}
              {shop.commissionRate} %, selon le rythme choisi ci-dessus.
            </p>
            <p className="mb-2">
              Le certificat de cacherout doit être maintenu en cours de validité. À son
              expiration, la fiche est retirée de la vitrine jusqu&apos;au dépôt d&apos;un
              certificat renouvelé.
            </p>
            <p>
              Chaque partie peut mettre fin au contrat à tout moment, sans préavis ni
              indemnité. Les commandes déjà passées restent dues.
            </p>
          </div>

          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              name="accept"
              className="mt-0.5 size-[18px] shrink-0 accent-[var(--color-teal)]"
            />
            <span className="text-[12.5px] leading-snug font-bold">
              J&apos;accepte ces conditions et la commission de {shop.commissionRate} %.
            </span>
          </label>
        </div>

        <Field
          label="Signature"
          name="signature"
          defaultValue={shop.contractSignature}
          placeholder="Nom et prénom du gérant"
          hint="Votre nom saisi ici vaut signature."
          required
        />

        <WizardFooter label="Signer et continuer" back="/partenaire/dossier/logistique" />
      </WizardForm>
    </WizardStep>
  );
}
