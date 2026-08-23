import { getTranslations } from "next-intl/server";
import { canManage } from "@/lib/access";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { WhatsAppShare } from "@/components/CopyLink";
import { StarSolid } from "@/components/icons";
import { ButtonLink, Card, GlowCircle } from "@/components/ui";
import { formatDate, getShabbat, readinessLabel } from "@/lib/data";

/** 27 · Résumé après l'événement */
export default async function Recap({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("shabbat.recap");
  const tc = await getTranslations("common");

  // Le bilan était réservé aux organisateurs : un convive ne voyait jamais le
  // Shabbat auquel il avait participé. Il n'y a pourtant rien ici qui lui soit
  // interdit — sauf le budget et le message de remerciement, qui restent à
  // l'hôte. `getShabbat` rend null à un non-membre (la RLS s'en charge), donc
  // la page se ferme d'elle-même à qui n'y a pas sa place.
  const [manage, shabbat] = await Promise.all([canManage(id), getShabbat(id)]);
  if (!shabbat) notFound();

  const roles = shabbat.invitations.filter((i) => i.role).length;

  return (
    <main className="flex min-h-dvh flex-1 flex-col overflow-y-auto px-5.5 pt-[54px] pb-6 text-center sm:min-h-0">
      <div className="mb-2 text-start">
        <BackButton fallback={manage ? "/shabbats" : `/invitation/${id}`} />
      </div>

      <div className="relative mx-auto mb-3.5 animate-pop">
        <StarSolid size={10} className="absolute -top-0.5 end-0.5 text-coral" />
        <GlowCircle size={76} glow="rgba(255,209,102,0.4)">
          <span className="flex size-[76px] items-center justify-center rounded-full bg-gold/30 text-gold-deep">
            <StarSolid size={32} />
          </span>
        </GlowCircle>
      </div>

      <h1 className="mb-1 font-display text-xl font-semibold">{t("title")}</h1>
      <p className="mb-4.5 text-[14px] text-ink/60">
        {t("subtitle", { date: formatDate(shabbat.startsAt) })}
      </p>

      <div className="mb-4.5 grid grid-cols-2 gap-2.5 text-start">
        <Tile value={String(shabbat.counts.confirmed)} label={t("guestsPresent")} />
        <Tile value={String(shabbat.counts.contributionsTaken)} label={t("contributionsCovered")} />
        {/* Le budget ne se montre qu'à qui organise : les dépenses sont un
            écran d'hôte partout ailleurs, ce n'est pas ici qu'on l'ouvre. */}
        {manage && (
          <Tile value={`${shabbat.counts.spent.toFixed(0)} €`} label={t("finalBudget")} />
        )}
        <Tile value={String(roles)} label={t("rolesFilled")} />
      </div>

      <p className="mb-4.5 text-[13px] font-bold text-teal">
        {readinessLabel(shabbat.readiness)}
      </p>

      <div className="flex flex-col gap-2.5">
        {/* Remercier ses invités est un geste d'hôte. */}
        {manage && (
          <WhatsAppShare
            token={shabbat.shareToken}
            message={t("thankYouMessage")}
            label={t("thankGuests")}
          />
        )}
        <ButtonLink
          href={manage ? "/shabbats" : "/accueil"}
          variant="secondary"
          size="sm"
        >
          {manage ? t("backToMyShabbats") : tc("backHome")}
        </ButtonLink>
      </div>
    </main>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <Card className="rounded-field p-3">
      <div className="font-display text-[20px] font-semibold">{value}</div>
      <div className="text-[11.5px] font-bold text-ink/65">{label}</div>
    </Card>
  );
}
