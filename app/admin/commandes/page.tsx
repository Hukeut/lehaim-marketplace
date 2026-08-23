import { AdminTable, AdminTitle, StatusTag, Td } from "@/components/admin";
import { money } from "@/lib/money";
import { pastOrders, requireMyShop } from "@/lib/merchant";

const STATUS: Record<string, { tone: string; label: string }> = {
  recuperee: { tone: "ok", label: "Récupérée" },
  annulee: { tone: "draft", label: "Annulée" },
};

const when = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** L'historique — ce qui est clos, dans un sens ou dans l'autre. */
export default async function Historique() {
  const shop = await requireMyShop();
  const orders = await pastOrders(shop.id);

  const delivered = orders.filter((o) => o.status === "recuperee");
  const revenue = delivered.reduce((sum, o) => sum + o.payout, 0);

  return (
    <>
      <AdminTitle
        title="Historique"
        action={
          <StatusTag
            status="info"
            label={`${delivered.length} livrées · ${money(revenue)} pour vous`}
          />
        }
      />

      {orders.length === 0 ? (
        <div className="rounded-[18px] border-[1.5px] border-dashed border-line bg-white/60 px-6 py-12 text-center">
          <div className="mb-1.5 font-display text-[17px] font-semibold">Aucune commande close</div>
          <p className="mx-auto max-w-[44ch] text-[13.5px] leading-relaxed text-ink/55">
            Les commandes livrées, annulées ou refusées se retrouvent ici.
          </p>
        </div>
      ) : (
        <AdminTable columns={["Commande", "Client", "Quand", "Mode", "État", "Total", "Pour vous"]}>
          {orders.map((order) => (
            <tr key={order.id}>
              <Td>{order.reference}</Td>
              <Td>{order.customerName}</Td>
              <Td muted>{when.format(new Date(order.placedAt))}</Td>
              <Td muted>{order.mode === "retrait" ? "Retrait" : "Livraison"}</Td>
              <Td>
                <StatusTag
                  status={STATUS[order.status]?.tone ?? "draft"}
                  label={STATUS[order.status]?.label ?? order.status}
                />
              </Td>
              <Td muted>{money(order.total)}</Td>
              {/* Pas de commission modélisée pour l'instant : ce qui reste au
                  commerce, c'est le total encaissé. */}
              <Td>{order.status === "recuperee" ? money(order.payout) : "—"}</Td>
            </tr>
          ))}
        </AdminTable>
      )}
    </>
  );
}
