import Link from "next/link";
import { redirect } from "next/navigation";
import { WizardStep } from "@/components/partner";
import { getMyDossier, missingPieces } from "@/lib/partner";
import { submitDossier } from "../actions";

const longDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Étape 8 · l'envoi, puis l'attente.
 *
 * Le même écran sert avant et après l'envoi : c'est l'adresse qu'on garde en
 * favori pour savoir où en est son dossier. Ce qu'il montre dépend donc de
 * l'état réel, pas d'un paramètre d'URL.
 *
 * Quand il manque une pièce, elle est nommée. « Dossier incomplet » sans dire
 * quoi n'aide personne à finir.
 */
export default async function Statut() {
  const dossier = await getMyDossier();
  if (!dossier) redirect("/partenaire/dossier/entreprise");

  const { application } = dossier;
  const missing = missingPieces(dossier);

  if (application.status === "approved") {
    return (
      <WizardStep
        title="Votre boutique est validée"
        intro="Votre fiche est en ligne. Vous pouvez maintenant monter votre carte complète et recevoir vos premières commandes."
      >
        <Link
          href="/admin"
          className="self-start rounded-full bg-coral-deep px-6 py-3 font-display text-[14.5px] font-semibold text-white"
        >
          Ouvrir mon back-office
        </Link>
      </WizardStep>
    );
  }

  if (application.status === "submitted") {
    return (
      <WizardStep
        title="Votre dossier est en cours d'examen"
        intro="Notre équipe vérifie vos pièces et votre certificat. Comptez deux jours ouvrés — vous serez prévenu dès qu'une décision est prise."
      >
        <div className="rounded-[16px] bg-sand px-5 py-4 text-[13px]">
          <span className="font-bold">Dossier {application.reference}</span>
          {application.submittedAt && (
            <span className="text-ink/55"> · envoyé le {longDate.format(new Date(application.submittedAt))}</span>
          )}
        </div>
      </WizardStep>
    );
  }

  const refused = application.status === "rejected";
  const toComplete = application.status === "complement";

  return (
    <WizardStep
      title={
        refused
          ? "Votre dossier n'a pas été retenu"
          : toComplete
            ? "Un complément vous est demandé"
            : missing.length > 0
              ? "Il manque encore quelques éléments"
              : "Votre dossier est complet"
      }
      intro={
        refused
          ? "Vous pouvez corriger ce qui est indiqué ci-dessous et nous renvoyer le dossier."
          : toComplete
            ? "Corrigez le point signalé, puis renvoyez votre dossier — il repassera en tête de file."
            : missing.length > 0
              ? "Cliquez sur un élément pour rouvrir l’étape concernée — tout ce que vous avez déjà rempli est conservé."
              : "Tout y est. Notre équipe l'examine sous deux jours ouvrés."
      }
    >
      {application.decisionReason && (
        <div className="rounded-[16px] bg-gold-wash px-5 py-4">
          <div className="text-[12px] font-bold text-gold-ink">
            {refused ? "Motif du refus" : "Ce qui est demandé"}
          </div>
          <p className="mt-1 text-[13.5px] leading-relaxed text-gold-ink/85">
            {application.decisionReason}
          </p>
        </div>
      )}

      {missing.length > 0 && (
        <ul className="flex flex-col gap-2 rounded-[16px] bg-coral-wash px-5 py-4">
          {missing.map((item) => (
            <li key={item.label}>
              <Link
                href={`/partenaire/dossier/${item.step}`}
                className="flex items-start gap-2.5 text-[13.5px] font-bold text-coral-deep underline decoration-coral-deep/30 underline-offset-4"
              >
                <span aria-hidden="true">·</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <form action={submitDossier}>
        <div className="mt-1 flex flex-wrap items-center gap-3 border-t border-line-soft pt-5">
          <Link
            href="/partenaire/dossier/contrat"
            className="rounded-full border-2 border-line px-5 py-2.5 font-display text-[14px] font-semibold text-ink/60"
          >
            Retour
          </Link>
          <button
            type="submit"
            disabled={missing.length > 0}
            className="ms-auto rounded-full bg-coral-deep px-6 py-3 font-display text-[14.5px] font-semibold text-white disabled:opacity-40"
          >
            {refused || toComplete ? "Renvoyer mon dossier" : "Envoyer mon dossier"}
          </button>
        </div>
      </form>
    </WizardStep>
  );
}
