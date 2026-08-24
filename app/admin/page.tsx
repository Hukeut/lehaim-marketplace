import { AdminTitle, Kpi, KpiGrid } from "@/components/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Tableau de bord de la place de marché.
 *
 * Réécrit pour ce dépôt plutôt que porté tel quel : la version lehaim
 * (`adminMetrics()` dans lib/admin.ts) compte aussi des Shabbats, des
 * invitations et l'ancien système `shops`/`shop_products` — hors périmètre
 * de cette fusion (marketplace uniquement). Ici, uniquement des chiffres
 * traiteurs/commandes, tirés des tables réellement présentes dans ce dépôt.
 *
 * Pas de branche commerçant : /admin est réservé aux admins par son layout
 * (voir app/admin/layout.tsx) depuis la séparation admin/traiteur — un
 * commerçant n'atteint plus cet écran.
 */
export default async function AdminDashboard() {
  const supabase = await createClient();
  const [traiteurs, approved, produits, commandes] = await Promise.all([
    supabase.from("traiteurs").select("*", { count: "exact", head: true }),
    supabase.from("traiteurs").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("traiteur_products").select("*", { count: "exact", head: true }),
    supabase.from("marketplace_orders").select("*", { count: "exact", head: true }),
  ]);

  return (
    <>
      <AdminTitle
        title="Tableau de bord"
        action={
          <span className="rounded-full border-[1.5px] border-line bg-white px-4 py-2 text-[12px] font-bold shadow-[var(--shadow-pill)]">
            Depuis le lancement
          </span>
        }
      />

      <KpiGrid>
        <Kpi label="Traiteurs" value={traiteurs.count ?? 0} />
        <Kpi label="Traiteurs approuvés" value={approved.count ?? 0} />
        <Kpi label="Produits au catalogue" value={produits.count ?? 0} />
        <Kpi label="Commandes" value={commandes.count ?? 0} />
      </KpiGrid>

      <p className="mt-4 text-[13px] leading-relaxed text-ink/65">
        Les compteurs de commissions restent à zéro tant qu&apos;aucun moyen de
        paiement n&apos;est branché : le règlement se fait en direct au retrait
        ou à la livraison.
      </p>
    </>
  );
}
