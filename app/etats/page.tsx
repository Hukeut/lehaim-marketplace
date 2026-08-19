import { Alert, Check, Search } from "@/components/icons";
import { Card, Overline, Skeleton, TopBar } from "@/components/ui";

/** 29 · États d'interface */
export default function Etats() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <TopBar title="États d'interface" back="/ecrans" />

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-[18px] pt-2.5 pb-4">
        <Card className="p-3.5">
          <Overline>Chargement</Overline>
          <div className="flex flex-col gap-2">
            <Skeleton />
            <Skeleton />
          </div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-left">
            <Overline>Aucun résultat</Overline>
          </div>
          <span className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-ink/6 text-ink">
            <Search size={20} />
          </span>
          <div className="text-[12.5px] font-bold">Aucun Shabbat ne correspond</div>
          <div className="mt-0.5 text-[11px] text-ink/50">Essayez d&apos;élargir votre recherche</div>
        </Card>

        <div className="flex items-center gap-3 rounded-card bg-coral-wash p-3.5">
          <Alert size={20} className="text-coral-deep" />
          <div className="flex-1">
            <div className="text-[12.5px] font-bold text-coral-deep">Connexion perdue</div>
            <div className="text-[11px] text-coral-deep/75">
              Vos modifications seront synchronisées
            </div>
          </div>
        </div>

        <Card className="p-4 text-center">
          <span className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-olive/14 text-olive">
            <Check size={20} strokeWidth={2.4} />
          </span>
          <div className="text-[12.5px] font-bold">Modifications enregistrées</div>
        </Card>
      </div>
    </main>
  );
}
