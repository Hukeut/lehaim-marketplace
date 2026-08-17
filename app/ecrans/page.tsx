import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { Banner } from "@/components/States";
import { Card, Overline } from "@/components/ui";
import { Wordmark } from "@/components/Wordmark";
import { listHostedShabbats } from "@/lib/data";
import { getCurrentProfile } from "@/lib/profile";

/** Planche de revue : toutes les routes de l'app. */
export default async function Ecrans() {
  const profile = await getCurrentProfile();
  const hosted = profile ? await listHostedShabbats() : [];
  const sample = hosted[0];

  const groups = [
    {
      title: "Entrée dans l'app",
      screens: [
        { id: "01", label: "Splash", href: "/" },
        { id: "02–03", label: "Onboarding", href: "/onboarding" },
        { id: "13", label: "Connexion", href: "/connexion" },
        { id: "14", label: "Autoriser les notifications", href: "/notifications" },
      ],
    },
    {
      title: "Onglets principaux",
      screens: [
        { id: "04", label: "Accueil / Dashboard", href: "/accueil" },
        { id: "17", label: "Mes Shabbats", href: "/shabbats" },
        { id: "18", label: "Messages", href: "/messages" },
        { id: "12", label: "Profil", href: "/profil" },
      ],
    },
    {
      title: "Parcours hôte",
      screens: [
        { id: "S02", label: "Créer un Shabbat · 1/5", href: "/creer" },
        ...(sample
          ? [
              { id: "S03", label: "Choisir un modèle · 2/5", href: `/creer/${sample.id}/modele` },
              { id: "S04a", label: "Que proposez-vous ?", href: `/creer/${sample.id}/moments` },
              { id: "S04", label: "Personnaliser les missions · 3/5", href: `/creer/${sample.id}/missions` },
              { id: "S05bis", label: "Mode de financement · 4/5", href: `/creer/${sample.id}/financement` },
              { id: "S05ter", label: "Compte à rebours · 5/5", href: `/creer/${sample.id}/rebours` },
              { id: "23", label: "Shabbat publié", href: `/creer/${sample.id}/publie` },
            ]
          : []),
      ],
    },
    {
      title: "Piloter le Chabbat",
      screens: sample
        ? [
            { id: "S10", label: "Dashboard hôte", href: `/shabbat/${sample.id}` },
            { id: "S12", label: "Tableau des besoins", href: `/shabbat/${sample.id}/besoins` },
            { id: "S07", label: "Choisir une mission", href: `/shabbat/${sample.id}/missions` },
            { id: "S13", label: "Matériel", href: `/shabbat/${sample.id}/materiel` },
            { id: "S15", label: "Dépenses", href: `/shabbat/${sample.id}/depenses` },
            { id: "S16", label: "Messages WhatsApp", href: `/shabbat/${sample.id}/messages` },
            { id: "S17", label: "Shabbat Ready", href: `/shabbat/${sample.id}/ready` },
            { id: "26", label: "Gérer les invités", href: `/shabbat/${sample.id}/invites` },
            { id: "27", label: "Résumé après l'événement", href: `/shabbat/${sample.id}/recap` },
            { id: "19", label: "Discussion", href: `/discussion/${sample.id}` },
          ]
        : [],
    },
    {
      title: "Côté invité",
      screens: sample
        ? [
            { id: "S01", label: "Page d'invitation par lien", href: `/s/${sample.shareToken}` },
            { id: "09b", label: "Vue invité", href: `/invitation/${sample.id}` },
            { id: "S06", label: "RSVP par moment", href: `/invitation/${sample.id}/rsvp` },
            { id: "09", label: "Invitation confirmée", href: `/invitation/${sample.id}/confirmee` },
            { id: "10", label: "Jour J", href: `/invitation/${sample.id}/jour-j` },
          ]
        : [],
    },
    {
      title: "Compte et système",
      screens: [
        { id: "20", label: "Réglages", href: "/reglages" },
        { id: "21", label: "Modifier le profil", href: "/profil/modifier" },
        { id: "29", label: "États d'interface", href: "/etats" },
        { id: "—", label: "Ancienne maquette (stand-by)", href: "/legacy" },
      ],
    },
  ];

  return (
    <main className="flex min-h-dvh flex-1 flex-col overflow-y-auto px-[18px] pt-[54px] pb-8 sm:min-h-0">
      <header className="mb-5">
        <div className="mb-3">
          <BackButton fallback="/accueil" />
        </div>
        <div className="mb-2 text-[11px] font-extrabold tracking-[0.08em] text-teal uppercase">
          Écrans de l&apos;application · v2
        </div>
        <Wordmark className="text-[26px]" />
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink/55">
          Toutes les données viennent de Supabase. Les écrans liés à un Shabbat n&apos;apparaissent
          qu&apos;une fois connecté et après en avoir créé un.
        </p>
      </header>

      {!profile && (
        <div className="mb-5">
          <Banner tone="warning">
            Vous n&apos;êtes pas connecté : les écrans de données afficheront un état vide.{" "}
            <Link href="/connexion?suite=/ecrans" className="underline">
              Se connecter
            </Link>
          </Banner>
        </div>
      )}

      {profile && !sample && (
        <div className="mb-5">
          <Banner>
            Créez un premier Shabbat pour débloquer les écrans de détail, d&apos;invitation et de
            partage.
          </Banner>
        </div>
      )}

      {groups.map((group) => (
        <section key={group.title} className="mb-5">
          <Overline>{group.title}</Overline>
          <ul className="flex flex-col gap-1.5">
            {group.screens.map((screen) => (
              <Card as="li" key={screen.href + screen.id} className="rounded-field">
                <Link
                  href={screen.href}
                  className="flex items-center gap-3 px-3.5 py-3 active:bg-line-soft/60"
                >
                  <span className="w-9 shrink-0 font-display text-[11px] font-semibold text-teal">
                    {screen.id}
                  </span>
                  <span className="flex-1 text-[12.5px] font-bold">{screen.label}</span>
                  <span className="text-ink/30">›</span>
                </Link>
              </Card>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
