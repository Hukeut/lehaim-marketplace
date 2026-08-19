import { BackButton } from "@/components/BackButton";
import { getCurrentProfile } from "@/lib/profile";
import { CreateForm } from "./CreateForm";
import { BrandMark } from "@/components/BrandMark";

/** 06 · Créer un Shabbat — étape 1/5 */
export default async function CreerShabbat() {
  const profile = await getCurrentProfile();

  return (
    <main className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      <div className="flex items-center gap-3 px-5 pt-[54px] pb-3">
        <BackButton fallback="/accueil" />
        <BrandMark />
      </div>
      <CreateForm canCreate={Boolean(profile)} />
    </main>
  );
}
