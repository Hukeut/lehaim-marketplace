/**
 * Le formatage des montants, à part du reste.
 *
 * `lib/shops.ts` est `server-only`, et le tunnel de commande en a besoin côté
 * client. Une fonction ne traverse pas la frontière serveur/client comme une
 * prop — il faut que le composant client l'importe lui-même.
 */
export function money(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}
