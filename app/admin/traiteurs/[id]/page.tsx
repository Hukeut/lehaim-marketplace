import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTraiteurWithProducts, isMarketplaceAdmin } from "@/lib/marketplace";
import { CATEGORY_LABEL } from "@/lib/marketplace-types";
import { TraiteurAdminActions } from "@/components/marketplace/TraiteurAdminActions";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";
import { Card, StatusPill } from "@/components/ui";
import { MapPin } from "@/components/icons";

/** Admin · Détail d'un traiteur, avec actions d'approbation. */
export default async function AdminTraiteurDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?suite=/admin/traiteurs/${id}`);

  const isAdmin = await isMarketplaceAdmin();
  if (!isAdmin) {
    return (
      <main className="flex min-h-dvh flex-1 flex-col items-center justify-center px-7 text-center sm:min-h-0">
        <p className="text-[13px] font-bold text-ink/60">Accès réservé à l&apos;équipe lehaim.</p>
      </main>
    );
  }

  const result = await getTraiteurWithProducts(id);
  if (!result) notFound();
  const { traiteur, products } = result;

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-3 flex items-center gap-2.5">
          <BackButton fallback="/admin/traiteurs" />
          <h1 className="flex-1 truncate font-display text-[18px] font-semibold">
            {traiteur.name}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div className="mb-4 flex items-center gap-2">
          <StatusPill
            tone={
              traiteur.status === "approved"
                ? "success"
                : traiteur.status === "rejected"
                  ? "urgent"
                  : "warning"
            }
          >
            {traiteur.status === "approved"
              ? "Approuvé"
              : traiteur.status === "rejected"
                ? "Refusé"
                : "En attente"}
          </StatusPill>
        </div>

        <Card className="mb-3.5 p-3.5">
          <div className="mb-2.5 text-[9.5px] font-extrabold tracking-[0.04em] text-ink/45 uppercase">
            Dossier
          </div>
          <dl className="flex flex-col gap-2 text-[12.5px]">
            <Field label="Adresse" value={traiteur.address} icon={<MapPin size={13} />} />
            <Field label="Téléphone" value={traiteur.phone} />
            <Field label="Numéro de patente" value={traiteur.patenteNumber} />
            <Field label="Hechsher / cacherout" value={traiteur.hechsherName} />
            <Field
              label="Livraison"
              value={
                traiteur.deliveryAvailable
                  ? `Oui${traiteur.deliveryZone ? ` · ${traiteur.deliveryZone}` : ""}`
                  : "Non"
              }
            />
          </dl>
        </Card>

        <Card className="mb-4 p-3.5">
          <div className="mb-2.5 text-[9.5px] font-extrabold tracking-[0.04em] text-ink/45 uppercase">
            Catalogue ({products.length})
          </div>
          {products.length ? (
            <ul className="flex flex-col gap-1.5">
              {products.map((p) => (
                <li key={p.id} className="flex justify-between text-[12px]">
                  <span className="text-ink/70">
                    {p.title}{" "}
                    <span className="text-ink/40">· {CATEGORY_LABEL[p.category]}</span>
                  </span>
                  <span className="font-bold">{p.price.toFixed(0)}₪</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-ink/45">Aucun produit.</p>
          )}
        </Card>

        {traiteur.status === "rejected" && traiteur.rejectionReason && (
          <div className="mb-4 rounded-card bg-coral-wash p-3.5">
            <p className="text-[11.5px] font-bold leading-relaxed text-coral-deep">
              Motif du refus : {traiteur.rejectionReason}
            </p>
          </div>
        )}

        <TraiteurAdminActions traiteurId={traiteur.id} />
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line-soft pb-2 last:border-0 last:pb-0">
      <span className="flex items-center gap-1.5 text-ink/50">
        {icon}
        {label}
      </span>
      <span className="text-right font-bold">{value ?? "—"}</span>
    </div>
  );
}
