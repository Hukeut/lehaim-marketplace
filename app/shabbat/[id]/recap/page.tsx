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
  const shabbat = await getShabbat(id);
  if (!shabbat) notFound();

  const roles = shabbat.invitations.filter((i) => i.role).length;

  return (
    <main className="flex min-h-dvh flex-1 flex-col overflow-y-auto px-5.5 pt-[54px] pb-6 text-center sm:min-h-0">
      <div className="mb-2 text-left">
        <BackButton fallback="/shabbats" />
      </div>

      <div className="relative mx-auto mb-3.5 animate-pop">
        <StarSolid size={10} className="absolute -top-0.5 right-0.5 text-coral" />
        <GlowCircle size={76} glow="rgba(255,209,102,0.4)">
          <span className="flex size-[76px] items-center justify-center rounded-full bg-gold/30 text-gold-deep">
            <StarSolid size={32} />
          </span>
        </GlowCircle>
      </div>

      <h1 className="mb-1 font-display text-xl font-semibold">Quel Shabbat !</h1>
      <p className="mb-4.5 text-[12.5px] text-ink/60">
        Grâce à vous, {formatDate(shabbat.startsAt)} restera un beau souvenir
      </p>

      <div className="mb-4.5 grid grid-cols-2 gap-2.5 text-left">
        <Tile value={String(shabbat.counts.confirmed)} label="Invités présents" />
        <Tile value={String(shabbat.counts.dishesTotal)} label="Plats servis" />
        <Tile value={`${shabbat.counts.spent.toFixed(0)} €`} label="Budget final" />
        <Tile value={String(roles)} label="Rôles tenus" />
      </div>

      <p className="mb-4.5 text-[11.5px] font-bold text-teal">
        {readinessLabel(shabbat.readiness)}
      </p>

      <div className="flex flex-col gap-2.5">
        <WhatsAppShare
          token={shabbat.shareToken}
          message="Merci à tous pour ce Shabbat, c'était parfait 🙏"
          label="Remercier mes invités"
        />
        <ButtonLink href="/shabbats" variant="secondary" size="sm">
          Revenir à mes Shabbats
        </ButtonLink>
      </div>
    </main>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <Card className="rounded-field p-3">
      <div className="font-display text-[18px] font-semibold">{value}</div>
      <div className="text-[10px] font-bold text-ink/50">{label}</div>
    </Card>
  );
}
