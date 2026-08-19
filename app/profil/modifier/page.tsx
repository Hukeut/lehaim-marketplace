import { TopBar } from "@/components/ui";
import { me } from "@/lib/demo";
import { getCurrentProfile } from "@/lib/profile";
import { ProfileForm } from "./ProfileForm";

/** 21 · Modifier le profil — écrit dans la table `profiles` existante. */
export default async function ModifierProfil() {
  const account = await getCurrentProfile();

  const profile = account ?? {
    firstName: me.fullName.split(" ")[0],
    lastName: me.fullName.split(" ").slice(1).join(" ") || null,
    initial: me.initial,
    tone: me.tone,
    avatarUrl: null,
    phone: me.phone,
    about: null,
    email: me.email,
  };

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <TopBar title="Modifier le profil" back="/profil" />
      <ProfileForm profile={profile} editable={Boolean(account)} />
    </main>
  );
}
