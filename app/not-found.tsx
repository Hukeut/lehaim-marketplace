import { getTranslations } from "next-intl/server";
import { Search } from "@/components/icons";
import { ButtonLink, Card, Screen, ScreenBody } from "@/components/ui";

/**
 * Page introuvable.
 *
 * `notFound()` est appelée dans une quinzaine d'écrans — un lien de partage
 * expiré, un Shabbat supprimé, un identifiant recopié de travers. Jusqu'ici
 * tous ces cas aboutissaient à la page 404 par défaut de Next, hors de la
 * coquille mobile.
 *
 * Le texte est délibérément actionnable : dans ce produit, une 404 signifie
 * presque toujours « le lien qu'on vous a envoyé ne marche plus », et la
 * bonne action est d'en redemander un.
 */
export default async function NotFound() {
  const t = await getTranslations("errors.notFound");

  return (
    <Screen>
      <ScreenBody className="flex flex-col justify-center">
        <Card className="p-5 text-center">
          <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-ink/6 text-ink">
            <Search size={20} />
          </span>

          <h1 className="font-display text-[17px] leading-snug font-semibold">{t("title")}</h1>
          <p className="mx-auto mt-2 max-w-[280px] text-[14px] leading-relaxed text-ink/55">
            {t("text")}
          </p>

          <ButtonLink href="/" variant="secondary" className="mt-5">
            {t("home")}
          </ButtonLink>
        </Card>
      </ScreenBody>
    </Screen>
  );
}
