import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllTraiteursForAdmin, isMarketplaceAdmin } from "@/lib/marketplace";
import type { Traiteur, TraiteurStatus } from "@/lib/marketplace-types";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";
import { Card, StatusPill, type PillTone } from "@/components/ui";

const STATUS_TONE: Record<TraiteurStatus, PillTone> = {
  pending: "warning",
  approved: "success",
  rejected: "urgent",
};

const STATUS_LABEL: Record<TraiteurStatus, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
};

/** Admin · Liste des traiteurs à valider. */
export default async function AdminTraiteurs() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion?suite=/admin/traiteurs");

  const isAdmin = await isMarketplaceAdmin();
  if (!isAdmin) {
    return (
      <main className="flex min-h-dvh flex-1 flex-col items-center justify-center px-7 text-center sm:min-h-0">
        <p className="text-[13px] font-bold text-ink/60">Accès réservé à l&apos;équipe lehaim.</p>
      </main>
    );
  }

  const traiteurs = await getAllTraiteursForAdmin();
  const pending = traiteurs.filter((t) => t.status === "pending");
  const others = traiteurs.filter((t) => t.status !== "pending");

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-3 flex items-center gap-2.5">
          <BackButton fallback="/reglages" />
          <h1 className="flex-1 font-display text-[18px] font-semibold">Validation traiteurs</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {pending.length > 0 && (
          <section className="mb-5">
            <div className="mb-2 text-[11px] font-extrabold tracking-[0.03em] text-ink/55 uppercase">
              En attente · {pending.length}
            </div>
            <ul className="flex flex-col gap-2">
              {pending.map((t) => (
                <Row key={t.id} traiteur={t} />
              ))}
            </ul>
          </section>
        )}

        {!pending.length && (
          <p className="mb-5 rounded-field border-[1.5px] border-dashed border-line bg-white px-3.5 py-6 text-center text-[12.5px] text-ink/45">
            Aucun dossier en attente.
          </p>
        )}

        {others.length > 0 && (
          <section>
            <div className="mb-2 text-[11px] font-extrabold tracking-[0.03em] text-ink/55 uppercase">
              Traités
            </div>
            <ul className="flex flex-col gap-2">
              {others.map((t) => (
                <Row key={t.id} traiteur={t} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function Row({ traiteur }: { traiteur: Traiteur }) {
  return (
    <Card as="li" className="rounded-field">
      <Link href={`/admin/traiteurs/${traiteur.id}`} className="flex items-center gap-3 px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold">{traiteur.name}</div>
          <div className="truncate text-[10.5px] text-ink/50">
            {traiteur.address ?? "Adresse non renseignée"}
          </div>
        </div>
        <StatusPill tone={STATUS_TONE[traiteur.status]}>{STATUS_LABEL[traiteur.status]}</StatusPill>
      </Link>
    </Card>
  );
}
