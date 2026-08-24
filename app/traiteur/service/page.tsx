import { AdminTitle, StatusTag } from "@/components/admin";
import { money } from "@/lib/money";
import {
  openOrders,
  requireMyShop,
  nextStatus,
  type MerchantOrder,
  type OrderStatus,
} from "@/lib/merchant";
import { AcceptPanel } from "./AcceptPanel";
import { RefusePanel } from "./RefusePanel";
import { advanceOrder } from "./actions";

/**
 * Le service du jour, en trois colonnes.
 *
 * À accepter · En cuisine · Prêtes. Ce découpage n'est pas décoratif : il dit
 * qui doit agir. La première colonne demande une décision, la deuxième un
 * travail, la troisième une remise.
 *
 * Porté depuis Rraven666/lehaim, rebranché sur le backend traiteur de
 * lehaim-marketplace (marketplace_orders). Pas d'étape « en route » dans ce
 * schéma : une commande à livrer passe directement de « prête » à
 * « récupérée », comme une commande à retirer.
 */

const COLUMNS: { title: string; hint: string; statuses: OrderStatus[]; tone: string }[] = [
  {
    title: "À accepter",
    hint: "Le client attend une réponse",
    statuses: ["nouvelle"],
    tone: "border-coral",
  },
  {
    title: "En cuisine",
    hint: "Acceptées, en cours de préparation",
    statuses: ["acceptee", "en_preparation"],
    tone: "border-gold-ink",
  },
  {
    title: "Prêtes",
    hint: "À remettre ou à faire partir",
    statuses: ["prete"],
    tone: "border-olive",
  },
];

const STATUS_LABEL: Record<string, string> = {
  nouvelle: "En attente",
  acceptee: "Acceptée",
  en_preparation: "En préparation",
  prete: "Prête",
};

const ADVANCE_LABEL: Record<string, string> = {
  acceptee: "Mettre en préparation",
  en_preparation: "Marquer prête",
  prete: "Remettre au client",
};

const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const dateLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" });

export default async function Service() {
  const shop = await requireMyShop();
  const orders = await openOrders(shop.id);

  const waiting = orders.filter((o) => o.status === "nouvelle").length;

  return (
    <>
      <AdminTitle
        title={`Service · ${shop.name}`}
        action={
          shop.status === "approved" ? (
            <StatusTag status="ok" label="Boutique en ligne" />
          ) : (
            <StatusTag status="draft" label="Boutique hors ligne" />
          )
        }
      />

      {shop.status !== "approved" && (
        <p className="mb-5 rounded-[16px] bg-gold-wash px-5 py-3.5 text-[13px] leading-relaxed font-bold text-gold-ink">
          Votre boutique n&apos;est pas visible des clients : aucune nouvelle commande
          n&apos;arrivera tant qu&apos;elle n&apos;est pas approuvée.
        </p>
      )}

      {orders.length === 0 ? (
        <div className="rounded-[18px] bg-white p-8 text-center shadow-[var(--shadow-card)]">
          <div className="font-display text-[17px] font-semibold">Aucune commande en cours</div>
          <p className="mx-auto mt-1.5 max-w-[46ch] text-[13.5px] leading-relaxed text-ink/60">
            Les commandes arrivent ici dès qu&apos;un client valide la sienne. Vérifiez que vos
            créneaux sont ouverts et que votre carte est à jour.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((column) => {
            const list = orders.filter((o) => column.statuses.includes(o.status));
            return (
              <section key={column.title} className="flex min-w-0 flex-col gap-3">
                <div className={`border-t-[3px] pt-2.5 ${column.tone}`}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[15.5px] font-semibold">{column.title}</span>
                    <span className="text-[12.5px] font-bold text-ink/45">{list.length}</span>
                    {column.title === "À accepter" && waiting > 0 && (
                      <span className="ms-auto rounded-full bg-coral px-2 py-0.5 text-[11px] font-extrabold text-white">
                        {waiting}
                      </span>
                    )}
                  </div>
                  <div className="text-[11.5px] text-ink/45">{column.hint}</div>
                </div>

                {list.length === 0 ? (
                  <div className="rounded-[16px] border-[1.5px] border-dashed border-line px-4 py-6 text-center text-[12.5px] text-ink/40">
                    Rien ici
                  </div>
                ) : (
                  list.map((order) => (
                    <OrderCard key={order.id} order={order} prepMinutes={shop.prepMinutes} />
                  ))
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function OrderCard({ order, prepMinutes }: { order: MerchantOrder; prepMinutes: number }) {
  const next = nextStatus(order.status, order.mode);

  return (
    <article className="flex flex-col gap-3 rounded-[16px] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-2">
        <div className="min-w-0">
          <div className="font-display text-[14.5px] font-semibold">{order.customerName}</div>
          <div className="text-[11.5px] text-ink/50">
            {order.reference} · {time.format(new Date(order.placedAt))}
          </div>
        </div>
        <span className="ms-auto shrink-0 font-display text-[14.5px] font-semibold">
          {money(order.total)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <StatusTag
          status={order.mode === "retrait" ? "info" : "draft"}
          label={order.mode === "retrait" ? "Retrait" : "Livraison"}
        />
        {order.pickupDate && (
          <StatusTag
            status="draft"
            label={`${dateLabel.format(new Date(`${order.pickupDate}T12:00:00`))}${
              order.pickupSlot ? ` · ${order.pickupSlot}` : ""
            }`}
          />
        )}
        {order.status !== "nouvelle" && (
          <StatusTag status="draft" label={STATUS_LABEL[order.status] ?? order.status} />
        )}
      </div>

      <ul className="flex flex-col gap-1 border-t border-line-soft pt-2.5 text-[12.5px]">
        {order.items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex gap-2">
            <span className="font-bold">{item.quantity}×</span>
            <span className="min-w-0 flex-1">{item.name}</span>
          </li>
        ))}
      </ul>

      {order.customerNote && (
        <p className="rounded-[10px] bg-gold-wash px-3 py-2 text-[11.5px] leading-snug text-gold-ink">
          {order.customerNote}
        </p>
      )}

      {order.mode === "livraison" && order.deliveryAddress && (
        <p className="text-[11.5px] leading-snug text-ink/60">{order.deliveryAddress}</p>
      )}

      {order.customerPhone && (
        <a href={`tel:${order.customerPhone}`} className="text-[11.5px] font-bold text-teal">
          {order.customerPhone}
        </a>
      )}

      {order.status === "nouvelle" ? (
        <div className="flex flex-col gap-2.5 border-t border-line-soft pt-3">
          <AcceptPanel id={order.id} defaultMinutes={prepMinutes} />
          <RefusePanel id={order.id} />
        </div>
      ) : (
        next && (
          <form action={advanceOrder} className="border-t border-line-soft pt-3">
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="from" value={order.status} />
            <button
              type="submit"
              className="w-full rounded-full bg-teal px-4 py-2.5 font-display text-[13px] font-semibold text-white"
            >
              {ADVANCE_LABEL[order.status]}
            </button>
          </form>
        )
      )}
    </article>
  );
}
