import { redirect } from "next/navigation";
import { getMyTraiteur, getTraiteurSlots } from "@/lib/marketplace";
import { SlotsManager } from "@/components/marketplace/SlotsManager";
import { BackButton } from "@/components/BackButton";
import { BrandMark } from "@/components/BrandMark";

/** Espace fournisseur · Les créneaux de retrait que le traiteur propose aux clients. */
export default async function TraiteurCreneaux() {
  const traiteur = await getMyTraiteur();
  if (!traiteur) redirect("/devenir-traiteur");

  const slots = await getTraiteurSlots(traiteur.id);

  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-teal-wash sm:min-h-0">
      <div className="px-5 pt-[54px]">
        <BrandMark className="mb-2.5" />
        <div className="mb-4 flex items-center gap-2.5">
          <BackButton fallback="/devenir-traiteur" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[18px] font-semibold">Mes créneaux</h1>
            <p className="truncate text-[11px] text-ink/50">
              Les clients ne peuvent réserver que sur ces créneaux
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <SlotsManager slots={slots} />
      </div>
    </main>
  );
}
