import Link from "next/link";
import { Sliders } from "@/components/icons";
import { SignOutButton } from "@/components/SignOutButton";
import { Avatar, Card, ScreenBody, SectionTitle, StatTile } from "@/components/ui";
import { me } from "@/lib/demo";
import { getCurrentProfile } from "@/lib/profile";
import { BrandMark } from "@/components/BrandMark";

/** 12 · Profil — identité réelle (table `profiles`), compteurs encore en démo. */
export default async function Profil() {
  const account = await getCurrentProfile();

  // Sans compte, on affiche la maquette : c'est ce qui permet de faire relire
  // les écrans sans obliger à se connecter.
  const profile = account ?? {
    fullName: me.fullName,
    initial: me.initial,
    tone: me.tone,
    avatarUrl: null,
    memberSince: me.memberSince,
  };

  return (
    <ScreenBody>
      <BrandMark className="mb-3" />
      <div className="mb-4 flex items-center gap-3">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt=""
            className="size-13 shrink-0 rounded-full object-cover"
          />
        ) : (
          <Avatar initial={profile.initial} tone={profile.tone} size={52} />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-base font-semibold">
            {profile.fullName}
          </div>
          <div className="truncate text-[11.5px] text-ink/50">{profile.memberSince}</div>
        </div>
        <Link
          href="/reglages"
          aria-label="Réglages"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-[var(--shadow-float)]"
        >
          <Sliders size={15} />
        </Link>
      </div>

      {!account && (
        <Card className="mb-4 border-[1.5px] border-gold/40 bg-gold-wash p-3.5">
          <div className="text-[12px] font-bold text-gold-ink">Aperçu sans compte</div>
          <p className="mt-1 text-[11.5px] leading-snug text-gold-ink/80">
            Vous consultez la maquette avec des données de démonstration.{" "}
            <Link href="/connexion?suite=/profil" className="underline">
              Se connecter
            </Link>{" "}
            pour voir votre vrai profil.
          </p>
        </Card>
      )}

      <div className="mb-5 grid grid-cols-3 gap-2">
        <StatTile value={me.stats.organises} label="Organisés" />
        <StatTile value={me.stats.joined} label="Participés" />
        <StatTile value={me.stats.contacts} label="Proches" />
      </div>

      <SectionTitle>Mes proches</SectionTitle>
      <ul className="mb-5 flex flex-col gap-1.5">
        {me.circles.map((circle) => (
          <Card as="li" key={circle.label} className="rounded-field">
            <div className="flex items-center justify-between px-3.5 py-3">
              <span className="text-[12.5px] font-bold">{circle.label}</span>
              <span className="text-[11.5px] text-ink/50">{circle.count}</span>
            </div>
          </Card>
        ))}
      </ul>

      <div className="flex flex-col">
        <Row href="/profil/modifier" label="Modifier le profil" />
        <Row href="/reglages" label="Notifications" />
        <Row href="/shabbats" label="Historique" />
        {account ? (
          <div className="px-0.5 py-3.5">
            <SignOutButton />
          </div>
        ) : (
          <Link href="/connexion?suite=/profil" className="px-0.5 py-3.5">
            <span className="text-[12.5px] font-bold text-teal">Se connecter</span>
          </Link>
        )}
      </div>
    </ScreenBody>
  );
}

function Row({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between border-b border-line px-0.5 py-3.5"
    >
      <span className="text-[12.5px] font-bold">{label}</span>
      <span className="text-ink/30">›</span>
    </Link>
  );
}
