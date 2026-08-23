import { redirect } from "next/navigation";
import { AdminTitle, Kpi, KpiGrid } from "@/components/admin";
import { adminMetrics, backOfficeRole } from "@/lib/admin";

/** B1 · Tableau de bord. Les chiffres viennent de la base, pas d'un jeu d'essai. */
export default async function AdminDashboard() {
  const role = await backOfficeRole();

  // Un commerçant n'a rien à faire sur le tableau de bord de la plateforme :
  // son écran d'accueil, c'est son service du jour.
  if (role === "merchant") redirect("/admin/service");

  const metrics = await adminMetrics();

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

      {role === "admin" ? (
        <>
          <KpiGrid>
            <Kpi label="Comptes créés" value={metrics.accounts} />
            <Kpi label="Shabbats créés" value={metrics.shabbats} />
            <Kpi label="Shabbats à venir" value={metrics.upcoming} hint="30 derniers jours" />
            <Kpi
              label="Invitations acceptées"
              value={`${metrics.acceptance}%`}
              hint={`${metrics.confirmed} sur ${metrics.invitations}`}
            />
          </KpiGrid>
          <KpiGrid>
            <Kpi label="Boutiques" value={metrics.shops} />
            <Kpi label="Produits au catalogue" value={metrics.products} />
            <Kpi label="Commandes" value={0} hint="Aucun paiement branché" />
            <Kpi label="Chiffre d'affaires" value="0 €" hint="Aucun paiement branché" />
          </KpiGrid>
        </>
      ) : (
        <KpiGrid>
          <Kpi label="Vos boutiques" value={metrics.shops} />
          <Kpi label="Produits au catalogue" value={metrics.products} />
          <Kpi label="Commandes" value={0} hint="Aucun paiement branché" />
          <Kpi label="Chiffre d'affaires" value="0 €" hint="Aucun paiement branché" />
        </KpiGrid>
      )}

      <p className="mt-4 text-[13px] leading-relaxed text-ink/65">
        Les compteurs de commandes et de chiffre d&apos;affaires restent à zéro tant
        qu&apos;aucun moyen de paiement n&apos;est branché : ils affichent la réalité, pas
        une projection.
      </p>
    </>
  );
}
