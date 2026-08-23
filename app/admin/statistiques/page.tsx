import { AdminTitle, Kpi, KpiGrid } from "@/components/admin";
import { requireBackOffice } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

/** B6 · Statistiques. Ce qu'on peut mesurer aujourd'hui, sans table d'événements. */
export default async function AdminStats() {
  await requireBackOffice();
  const supabase = await createClient();

  const [locales, missions, claims, moments] = await Promise.all([
    supabase.from("profiles").select("locale"),
    supabase.from("missions").select("title"),
    supabase.from("mission_claims").select("dish_keys"),
    supabase.from("moments").select("kind"),
  ]);

  const byLocale = new Map<string, number>();
  for (const row of locales.data ?? []) {
    const key = ((row.locale as string) ?? "fr").toUpperCase();
    byLocale.set(key, (byLocale.get(key) ?? 0) + 1);
  }

  const byTitle = new Map<string, number>();
  for (const row of missions.data ?? []) {
    const key = (row.title as string) ?? "—";
    byTitle.set(key, (byTitle.get(key) ?? 0) + 1);
  }
  const topMissions = [...byTitle.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  const byDish = new Map<string, number>();
  for (const row of claims.data ?? []) {
    for (const key of ((row.dish_keys as string[]) ?? [])) {
      byDish.set(key, (byDish.get(key) ?? 0) + 1);
    }
  }
  const topDishes = [...byDish.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  const bySleepover = (moments.data ?? []).filter((m) => m.kind === "sleepover").length;

  return (
    <>
      <AdminTitle title="Statistiques" />

      <KpiGrid>
        {[...byLocale.entries()].map(([locale, count]) => (
          <Kpi key={locale} label={`Comptes en ${locale}`} value={count} />
        ))}
        <Kpi label="Shabbats avec couchage" value={bySleepover} />
      </KpiGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Ranking title="Apports les plus proposés" rows={topMissions} empty="Aucun apport pour l'instant." />
        <Ranking title="Plats les plus choisis" rows={topDishes} empty="Aucun plat choisi pour l'instant." />
      </div>

      <p className="mt-6 text-[13px] leading-relaxed text-ink/65">
        Rétention, vues de boutiques et heures de création demandent une table
        d&apos;événements, qui n&apos;existe pas encore : rien n&apos;enregistre aujourd&apos;hui
        les consultations. Ces chiffres-là viendront avec elle.
      </p>
    </>
  );
}

function Ranking({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: [string, number][];
  empty: string;
}) {
  const max = rows[0]?.[1] ?? 1;
  return (
    <div className="rounded-[18px] bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 font-display text-[17px] font-semibold">{title}</div>
      {rows.length ? (
        <ul className="flex flex-col gap-3">
          {rows.map(([label, count]) => (
            <li key={label}>
              <div className="mb-1 flex items-center justify-between text-[13.5px]">
                <span className="font-bold">{label}</span>
                <span className="text-ink/55">{count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-line-soft">
                <div
                  className="h-full rounded-full bg-teal"
                  style={{ width: `${Math.max(6, (count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13.5px] text-ink/45">{empty}</p>
      )}
    </div>
  );
}
