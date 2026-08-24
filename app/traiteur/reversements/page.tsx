import { AdminTable, AdminTitle, Kpi, KpiGrid, Td } from "@/components/admin";
import { money } from "@/lib/money";
import { payoutSummary, requireMyShop } from "@/lib/merchant";

const FREQUENCY: Record<string, string> = {
  weekly: "chaque semaine, le lundi",
  biweekly: "tous les quinze jours",
  monthly: "une fois par mois",
};

const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

/**
 * Les reversements.
 *
 * Seules les commandes livrées comptent : une commande acceptée n'est pas de
 * l'argent, et une commande refusée n'en a jamais été. La commission est
 * affichée en clair — c'est le seul chiffre du back-office qui coûte quelque
 * chose au commerçant, il n'a rien à faire en petits caractères.
 */
export default async function Reversements() {
  const shop = await requireMyShop();
  const summary = await payoutSummary(shop.id);

  return (
    <>
      <AdminTitle title="Reversements" />

      <KpiGrid>
        <Kpi label="Encaissé pour vous" value={money(summary.total)} hint={`${summary.count} commandes livrées`} />
        <Kpi label="Commission Lehaim" value={money(summary.commission)} hint={`${shop.commissionRate} % du panier`} />
        <Kpi label="Vous revient" value={money(summary.payout)} hint={FREQUENCY[shop.payoutFrequency] ?? ""} />
      </KpiGrid>

      <div className="mt-5 rounded-[18px] bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="mb-1 font-display text-[16px] font-semibold">Par mois</div>
        <p className="mb-3.5 text-[12px] leading-snug text-ink/50">
          Les virements sont déclenchés à la main pour l&apos;instant : le circuit de paiement
          n&apos;est pas branché. Ces montants disent ce qui vous est dû, pas ce qui a été versé.
        </p>

        {summary.months.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-ink/55">
            Rien à reverser pour l&apos;instant.
          </p>
        ) : (
          <AdminTable columns={["Mois", "Commandes", "Encaissé", "Commission", "Vous revient"]}>
            {summary.months.map((m) => (
              <tr key={m.month}>
                <Td>
                  <span className="first-letter:uppercase">
                    {monthLabel.format(new Date(`${m.month}-01T12:00:00`))}
                  </span>
                </Td>
                <Td muted>{m.count}</Td>
                <Td muted>{money(m.gross)}</Td>
                <Td muted>{money(m.commission)}</Td>
                <Td>{money(m.payout)}</Td>
              </tr>
            ))}
          </AdminTable>
        )}
      </div>
    </>
  );
}
