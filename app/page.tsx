import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui";
import { LehaimIcon, type LehaimIconName } from "@/components/LehaimIcon";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * G01 · Page d'accueil publique.
 *
 * Pas d'image : la marque, une promesse, et les cinq temps du produit en
 * pastilles colorées. C'est le seul écran qu'on voit avant de se connecter,
 * quelle que soit l'adresse demandée (cf. `proxy.ts`).
 */
const STEPS = [
  { key: "setup", icon: "step-setup" },
  { key: "invite", icon: "step-invite" },
  { key: "share", icon: "step-share" },
  { key: "buy", icon: "step-buy" },
  { key: "celebrate", icon: "step-celebrate" },
] satisfies { key: string; icon: LehaimIconName }[];

export default async function Landing() {
  // Sans cookie de session, personne n'est connecté : on ne paie pas
  // l'aller-retour de validation du jeton pour l'apprendre. C'est le visiteur
  // qui découvre l'app qui l'aurait payé — exactement celui qu'on ne veut pas
  // faire attendre.
  const jar = await cookies();
  const connecte = jar.getAll().some((c) => /^sb-.*-auth-token(\.\d+)?$/.test(c.name));

  if (connecte) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // Quelqu'un de déjà connecté n'a rien à faire sur une page d'acquisition.
    if (user) redirect("/accueil");
  }

  const t = await getTranslations("landing");

  return (
    <main className="flex min-h-dvh flex-1 flex-col overflow-hidden bg-cream sm:min-h-0">
      <div className="shrink-0 animate-[var(--animate-landing-logo)] px-6 pt-20 text-center opacity-0">
        <div className="font-display text-[50px] leading-[0.95] font-semibold tracking-[-0.01em]">
          Lehaim
        </div>
      </div>

      <div className="shrink-0 animate-[var(--animate-landing-title)] px-6 pt-4.5 text-center opacity-0">
        <h1 className="font-display text-[24px] leading-[1.25] font-semibold">{t("title")}</h1>
      </div>

      <ul className="flex flex-1 flex-col justify-center gap-6 px-7 pt-11">
        {STEPS.map((step, index) => (
          <li
            key={step.key}
            className="flex animate-[var(--animate-landing-step)] items-center gap-3.5 opacity-0"
            style={{ animationDelay: `${0.35 + index * 0.15}s` }}
          >
            <span
              className="flex size-[64px] shrink-0 animate-[var(--animate-landing-bubble)] items-center justify-center"
              style={{ animationDelay: `${index * 0.3}s` }}
            >
              <LehaimIcon name={step.icon} size={64} />
            </span>
            <span className="flex-1 rounded-[15px] bg-white px-4 py-2.5 shadow-[0_4px_12px_rgba(15,39,77,0.06)]">
              <span className="block font-display text-[15.5px] font-semibold">
                {t(`steps.${step.key}.title`)}
              </span>
              <span className="block text-[12px] text-ink/65">
                {t(`steps.${step.key}.text`)}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex shrink-0 animate-[var(--animate-landing-cta)] flex-col gap-2.5 px-6.5 pt-6 pb-[22px] opacity-0">
        <ButtonLink
          href="/connexion?mode=signup"
          size="lg"
          className="animate-[var(--animate-landing-glow)]"
        >
          {t("cta")}
        </ButtonLink>
        <ButtonLink href="/connexion" variant="secondary">
          {t("ctaSignIn")}
        </ButtonLink>
      </div>
    </main>
  );
}
