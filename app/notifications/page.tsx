import { Bell } from "@/components/icons";
import { ButtonLink } from "@/components/ui";

/** 14 · Autoriser les notifications */
export default function Notifications() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-3.5 px-8 text-center sm:min-h-0">
      <span className="mb-1.5 flex size-[76px] items-center justify-center rounded-full bg-coral/12 text-coral">
        <Bell size={32} />
      </span>

      <h1 className="font-display text-[19px] font-semibold">Ne manquez rien</h1>
      <p className="max-w-[270px] text-[13px] leading-relaxed text-ink/60">
        Activez les notifications pour être prévenu des confirmations, messages et rappels de
        Shabbat.
      </p>

      <div className="mt-4 flex w-full flex-col gap-2.5">
        <ButtonLink href="/accueil">Activer les notifications</ButtonLink>
        <ButtonLink href="/accueil" variant="ghost" size="sm">
          Plus tard
        </ButtonLink>
      </div>
    </main>
  );
}
