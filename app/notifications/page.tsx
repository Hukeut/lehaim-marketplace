import { getTranslations } from "next-intl/server";
import { Bell } from "@/components/icons";
import { ButtonLink } from "@/components/ui";

/** 14 · Autoriser les notifications */
export default async function Notifications() {
  const t = await getTranslations("settings.notificationsPrompt");
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-3.5 px-8 text-center sm:min-h-0">
      <span className="mb-1.5 flex size-[76px] items-center justify-center rounded-full bg-coral/12 text-coral">
        <Bell size={32} />
      </span>

      <h1 className="font-display text-[21px] font-semibold">{t("title")}</h1>
      <p className="max-w-[270px] text-[14.5px] leading-relaxed text-ink/60">{t("text")}</p>

      <div className="mt-4 flex w-full flex-col gap-2.5">
        <ButtonLink href="/accueil">{t("enable")}</ButtonLink>
        <ButtonLink href="/accueil" variant="ghost" size="sm">
          {t("later")}
        </ButtonLink>
      </div>
    </main>
  );
}
