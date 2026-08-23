import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronRight, Sliders } from "@/components/icons";
import { IconTile } from "@/components/ui";
import { readSurvey } from "@/lib/survey";

/**
 * Invitation à remplir le profil enrichi (P00 → P05), posée en haut de
 * l'accueil. Elle reste tant que le questionnaire n'est pas terminé :
 * « Plus tard » ne la fait pas disparaître, il note seulement le report.
 */
export async function SurveyBanner() {
  const survey = await readSurvey();
  if (!survey || survey.completed) return null;

  const t = await getTranslations("survey.banner");

  return (
    <Link
      href="/profil/decouverte"
      className="mb-3.5 flex items-center gap-3 rounded-card border-[1.5px] border-teal/25 bg-teal/8 px-3.5 py-3 transition-transform duration-100 active:scale-[0.995]"
    >
      <IconTile tone="teal" size={34}>
        <Sliders size={16} />
      </IconTile>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-bold">
          {survey.postponed ? t("titlePostponed") : t("titleDefault")}
        </div>
        <div className="text-[12.5px] text-ink/55">
          {t("subtitle")}
        </div>
      </div>
      <ChevronRight size={15} className="shrink-0 text-teal" />
    </Link>
  );
}
