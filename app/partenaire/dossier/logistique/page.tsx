import { redirect } from "next/navigation";
import { WizardForm } from "@/components/WizardForm";
import { Field, PillChoices, WizardFooter, WizardStep } from "@/components/partner";
import { getMyDossier } from "@/lib/partner";
import { saveLogistics } from "../actions";

const MODES: [string, string][] = [
  ["pickup", "Retrait sur place"],
  ["platform", "Livraison par Lehaim"],
  ["own", "Livraison par mes soins"],
];

// Dimanche en tête : c'est le jour où la semaine recommence pour un commerce
// cacher, et le vendredi — jour de pointe — se lit mieux en fin de grille.
const DAYS = [
  [0, "Dimanche"],
  [1, "Lundi"],
  [2, "Mardi"],
  [3, "Mercredi"],
  [4, "Jeudi"],
  [5, "Vendredi"],
  [6, "Samedi"],
] as const;

/**
 * Étape 6 · horaires, créneaux et modes de remise.
 *
 * Un jour laissé vide est un jour de fermeture — il n'y a pas de case « fermé »
 * à cocher, l'absence suffit et se remplit plus vite.
 */
export default async function Logistique() {
  const dossier = await getMyDossier();
  if (!dossier) redirect("/partenaire/dossier/entreprise");

  const { shop, hours } = dossier;
  const grid = new Map(hours.map((h) => [h.weekday, h]));

  return (
    <WizardStep
      title="Vos horaires et votre logistique"
      intro="Laissez un jour vide pour indiquer une fermeture. Le samedi est fermé par défaut, mais rien ne vous y oblige."
    >
      <WizardForm action={saveLogistics}>
        <PillChoices
          legend="Comment vos clients récupèrent leur commande"
          name="modes"
          options={MODES}
          selected={shop.deliveryModes}
        />

        <div className="flex flex-col gap-2.5 rounded-[16px] bg-sand p-4">
          <span className="text-[12px] font-bold text-ink/55">Horaires d&apos;ouverture</span>
          {DAYS.map(([day, label]) => {
            const row = grid.get(day);
            return (
              <div key={day} className="flex items-center gap-3">
                <span className="w-[86px] shrink-0 text-[13px] font-bold text-ink/70">{label}</span>
                <input
                  type="time"
                  name={`open_${day}`}
                  defaultValue={row?.opensAt}
                  className="min-w-0 flex-1 rounded-[11px] border-[1.5px] border-line bg-white px-3 py-2 text-[13px] font-bold outline-none focus:border-teal"
                />
                <span className="text-[12px] text-ink/35">→</span>
                <input
                  type="time"
                  name={`close_${day}`}
                  defaultValue={row?.closesAt}
                  className="min-w-0 flex-1 rounded-[11px] border-[1.5px] border-line bg-white px-3 py-2 text-[13px] font-bold outline-none focus:border-teal"
                />
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Field
            label="Temps de préparation"
            name="prep_minutes"
            type="number"
            defaultValue={String(shop.prepMinutes)}
            hint="En minutes, pour une commande courante."
          />
          <Field
            label="Commandes par créneau"
            name="slot_capacity"
            type="number"
            defaultValue={String(shop.slotCapacity)}
            hint="Au-delà, le créneau se ferme tout seul."
          />
          <Field
            label="Clôture des précommandes"
            name="preorder_deadline"
            defaultValue={shop.preorderDeadline}
            placeholder="Jeudi 18 h"
            hint="Pour les commandes du vendredi."
          />
        </div>

        <WizardFooter label="Continuer" back="/partenaire/dossier/catalogue" />
      </WizardForm>
    </WizardStep>
  );
}
