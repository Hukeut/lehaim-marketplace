import { notFound } from "next/navigation";
import { Check, StarSolid } from "@/components/icons";
import { CopyLink } from "@/components/CopyLink";
import { ButtonLink, GlowCircle } from "@/components/ui";
import { formatDate, getShabbat } from "@/lib/data";
import { BrandMark } from "@/components/BrandMark";

/** 23 · Shabbat publié */
export default async function ShabbatPublie({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shabbat = await getShabbat(id);
  if (!shabbat) notFound();

  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center px-6.5 text-center sm:min-h-0">
      <div className="w-full pt-[54px] text-left">
        <BrandMark />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3.5">
        <div className="relative animate-pop">
          <StarSolid size={11} className="absolute -top-1 left-0 text-gold" />
          <StarSolid size={8} className="absolute right-[-6px] bottom-1 text-gold" />
          <GlowCircle size={88} glow="rgba(255,209,102,0.35)">
            <span className="flex size-[88px] items-center justify-center rounded-full bg-olive/16 text-olive">
              <Check size={38} strokeWidth={2.4} />
            </span>
          </GlowCircle>
        </div>

        <h1 className="font-display text-[22px] font-semibold">Votre table est ouverte</h1>
        <p className="max-w-[260px] text-[13px] leading-relaxed text-ink/60">
          Vos proches peuvent maintenant rejoindre le {formatDate(shabbat.startsAt)}. Vous serez
          le premier averti à chaque réponse.
        </p>

        <CopyLink token={shabbat.shareToken} />
      </div>

      <div className="flex w-full flex-col gap-2.5 pb-[34px]">
        <ButtonLink href={`/shabbat/${id}/invites`}>Inviter mes premiers convives</ButtonLink>
        <ButtonLink href={`/shabbat/${id}`} variant="secondary" size="sm">
          Voir mon Shabbat
        </ButtonLink>
        <ButtonLink href="/accueil" variant="ghost" size="sm">
          Revenir à l&apos;accueil
        </ButtonLink>
      </div>
    </main>
  );
}
