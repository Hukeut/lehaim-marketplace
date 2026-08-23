/**
 * Les huit temps du tunnel marchand.
 *
 * À part du reste de `lib/partner.ts`, qui est `server-only` : le rail a
 * besoin de cette liste côté client pour savoir quelle étape est regardée, et
 * il n'y a rien de sensible dans une suite de libellés.
 */

export const STEPS = [
  { slug: "compte", label: "Compte" },
  { slug: "entreprise", label: "Informations entreprise" },
  { slug: "documents", label: "Vérification KYC" },
  { slug: "cacherout", label: "Certificat de cacherout" },
  { slug: "catalogue", label: "Catalogue" },
  { slug: "logistique", label: "Logistique" },
  { slug: "contrat", label: "Paiement & contrat" },
  { slug: "statut", label: "Validation" },
] as const;

export type StepSlug = (typeof STEPS)[number]["slug"];

export function stepNumber(slug: StepSlug): number {
  return STEPS.findIndex((s) => s.slug === slug) + 1;
}
