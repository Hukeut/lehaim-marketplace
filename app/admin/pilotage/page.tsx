import Link from "next/link";
import { AdminEmpty, AdminTable, AdminTitle, Kpi, KpiGrid, StatusTag, Td } from "@/components/admin";
import { run } from "@/lib/db";
import { money } from "@/lib/money";
import { OPEN_STATUSES, type OrderStatus } from "@/lib/merchant";
import { marketplaceClient } from "@/lib/shops";

/**
 * Le pilotage — les commandes en cours, tous traiteurs confondus.
 *
 * Portée sur marketplace_orders. Ce que cet écran sert à voir : ce qui
 * traîne. Une commande en attente depuis vingt minutes veut dire qu'un
 * traiteur ne regarde pas son écran.
 */

const STATUS_LABEL: Record<OrderStatus, string> = {
  nouvelle: "En attente",
  acceptee: "Acceptée",
  en_preparation: "En préparation",
  prete: "Prête",
  recuperee: "Récupérée",
  annulee: "Annulée",
};

const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

/** Au-delà, c'est qu'un traiteur ne répond pas. */
const STALE_MINUTES = 15;

export default async function Pilotage() {
  // Garde déjà posée par app/admin/layout.tsx (réservé aux admins).
  const supabase = await marketplaceClient();
  const { data } = await run(
    "pilotage",
    supabase
      .from("marketplace_orders")
      .select("id, status, fulfillment, total_amount, created_at, traiteurs(id, name)")
      .in("status", OPEN_STATUSES)
      .order("created_at"),
  );

  const orders = ((data ?? []) as unknown as (Record<string, unknown> & {
    traiteurs: { id: string; name: string } | null;
  })[]).map((o) => ({
    id: o.id as string,
    status: o.status as OrderStatus,
    mode: o.fulfillment as "retrait" | "livraison",
    total: Number(o.total_amount ?? 0),
    placedAt: new Date(o.created_at as string),
    shopName: o.traiteurs?.name ?? "",
    shopId: o.traiteurs?.id ?? "",
  }));

  // L'heure est lue une fois, ici : un écran qui appelle l'horloge pendant
  // son rendu rend un résultat qui dépend de l'instant du rendu.
  const now = new Date();
  const minutesSince = (d: Date) => Math.round((now.getTime() - d.getTime()) / 60000);
  const waiting = orders.filter((o) => o.status === "nouvelle");
  const stale = waiting.filter((o) => minutesSince(o.placedAt) >= STALE_MINUTES);

  return (
    <>
      <AdminTitle title="Pilotage live" />

      <KpiGrid>
        <Kpi label="Commandes en cours" value={orders.length} />
        <Kpi label="En attente de réponse" value={waiting.length} />
        <Kpi
          label="Sans réponse"
          value={stale.length}
          hint={`depuis plus de ${STALE_MINUTES} min`}
        />
        <Kpi label="Volume en cours" value={money(orders.reduce((s, o) => s + o.total, 0))} />
      </KpiGrid>

      {orders.length === 0 ? (
        <AdminEmpty
          title="Aucune commande en cours"
          text="Les commandes en cours de traitement s'affichent ici, tous traiteurs confondus, dans l'ordre où elles sont arrivées."
        />
      ) : (
        <AdminTable columns={["Commande", "Traiteur", "Depuis", "Mode", "État", "Total"]}>
          {orders.map((order) => {
            const age = minutesSince(order.placedAt);
            const late = order.status === "nouvelle" && age >= STALE_MINUTES;
            return (
              <tr key={order.id}>
                <Td>#{order.id.slice(0, 8).toUpperCase()}</Td>
                <Td>
                  <Link href={`/marketplace/${order.shopId}`} className="font-bold text-teal">
                    {order.shopName}
                  </Link>
                </Td>
                <Td>
                  {/* L'âge en clair plutôt que l'heure : ce qu'on cherche,
                      c'est celle qui attend depuis trop longtemps. */}
                  <span className={late ? "font-extrabold text-[#8A2346]" : "text-ink/60"}>
                    {age} min
                  </span>
                  <span className="ms-1.5 text-[11.5px] text-ink/40">
                    {time.format(order.placedAt)}
                  </span>
                </Td>
                <Td muted>{order.mode === "retrait" ? "Retrait" : "Livraison"}</Td>
                <Td>
                  <StatusTag
                    status={late ? "danger" : order.status === "nouvelle" ? "alert" : "info"}
                    label={STATUS_LABEL[order.status]}
                  />
                </Td>
                <Td>{money(order.total)}</Td>
              </tr>
            );
          })}
        </AdminTable>
      )}
    </>
  );
}
