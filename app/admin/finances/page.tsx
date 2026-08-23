import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminEmpty, AdminTable, AdminTitle, Kpi, KpiGrid, StatusTag, Td } from "@/components/admin";
import { requireBackOffice } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { run } from "@/lib/db";
import { money } from "@/lib/money";

/**
 * Les finances de la place de marché.
 *
 * L'écran était vide « jusqu'à ce que le circuit de paiement soit branché ».
 * Il ne l'est toujours pas — mais les montants, eux, existent : chaque
 * commande porte son total, sa commission et ce qui revient au commerce,
 * figés au moment où elle est passée.
 *
 * Ce que cet écran dit donc : ce qui est dû. Pas ce qui a été versé. La
 * différence est écrite en toutes lettres plutôt que laissée à deviner.
 */

const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

export default async function AdminFinances() {
  const role = await requireBackOffice();
  if (role !== "admin") redirect("/admin/reversements");

  const supabase = await createClient();
  const { data } = await run(
    "finances",
    supabase
      .from("orders")
      .select("total, commission_amount, payout_amount, placed_at, shops(name, slug)")
      .eq("status", "completed")
      .order("placed_at", { ascending: false })
      .limit(2000),
  );

  const rows = ((data ?? []) as unknown as (Record<string, unknown> & {
    shops: { name: string; slug: string } | null;
  })[]).map((r) => ({
    total: Number(r.total),
    commission: Number(r.commission_amount),
    payout: Number(r.payout_amount),
    month: (r.placed_at as string).slice(0, 7),
    shopName: r.shops?.name ?? "—",
    shopSlug: r.shops?.slug ?? "",
  }));

  if (rows.length === 0) {
    return (
      <>
        <AdminTitle title="Finances" />
        <AdminEmpty
          title="Aucune commande livrée"
          text="Les commissions se calculent sur les commandes effectivement livrées. Une commande acceptée n'est pas encore de l'argent, et une commande refusée n'en a jamais été."
        />
      </>
    );
  }

  const sum = (key: "total" | "commission" | "payout") =>
    rows.reduce((s, r) => s + r[key], 0);

  const byShop = new Map<string, { name: string; slug: string; gross: number; commission: number; payout: number; count: number }>();
  for (const r of rows) {
    const bucket = byShop.get(r.shopSlug) ?? {
      name: r.shopName, slug: r.shopSlug, gross: 0, commission: 0, payout: 0, count: 0,
    };
    bucket.gross += r.total;
    bucket.commission += r.commission;
    bucket.payout += r.payout;
    bucket.count += 1;
    byShop.set(r.shopSlug, bucket);
  }

  const byMonth = new Map<string, { gross: number; commission: number; count: number }>();
  for (const r of rows) {
    const bucket = byMonth.get(r.month) ?? { gross: 0, commission: 0, count: 0 };
    bucket.gross += r.total;
    bucket.commission += r.commission;
    bucket.count += 1;
    byMonth.set(r.month, bucket);
  }

  const shops = [...byShop.values()].sort((a, b) => b.gross - a.gross);
  const months = [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <>
      <AdminTitle
        title="Finances"
        action={<StatusTag status="alert" label="Montants dus, non versés" />}
      />

      <KpiGrid>
        <Kpi label="Volume livré" value={money(sum("total"))} hint={`${rows.length} commandes`} />
        <Kpi label="Commission Lehaim" value={money(sum("commission"))} />
        <Kpi label="Dû aux commerces" value={money(sum("payout"))} />
        <Kpi
          label="Panier moyen"
          value={money(sum("total") / rows.length)}
          hint={`sur ${shops.length} commerce${shops.length > 1 ? "s" : ""}`}
        />
      </KpiGrid>

      <p className="mb-5 rounded-[16px] bg-gold-wash px-5 py-3.5 text-[12.5px] leading-relaxed font-bold text-gold-ink">
        Le circuit de paiement n&apos;est pas branché : ces montants disent ce qui est dû, pas ce
        qui a été versé. Les virements sont à déclencher à la main.
      </p>

      <div className="mb-5 rounded-[18px] bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="mb-3.5 font-display text-[16px] font-semibold">Par commerce</div>
        <AdminTable columns={["Commerce", "Commandes", "Volume", "Commission", "À reverser"]}>
          {shops.map((shop) => (
            <tr key={shop.slug}>
              <Td>
                <Link href={`/marketplace/${shop.slug}`} className="font-bold text-teal">
                  {shop.name}
                </Link>
              </Td>
              <Td muted>{shop.count}</Td>
              <Td muted>{money(shop.gross)}</Td>
              <Td>{money(shop.commission)}</Td>
              <Td muted>{money(shop.payout)}</Td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <div className="rounded-[18px] bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="mb-3.5 font-display text-[16px] font-semibold">Par mois</div>
        <AdminTable columns={["Mois", "Commandes", "Volume", "Commission"]}>
          {months.map(([month, m]) => (
            <tr key={month}>
              <Td>
                <span className="first-letter:uppercase">
                  {monthLabel.format(new Date(`${month}-01T12:00:00`))}
                </span>
              </Td>
              <Td muted>{m.count}</Td>
              <Td muted>{money(m.gross)}</Td>
              <Td>{money(m.commission)}</Td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </>
  );
}
