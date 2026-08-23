import { Skeleton } from "./ui";

/**
 * Squelette du back-office, monté par les `loading.tsx` de `/admin` et du
 * tunnel marchand.
 *
 * À part de `ScreenSkeleton`, qui dessine une colonne de téléphone : ces
 * écrans-là sont des tableaux de bureau, et une colonne étroite au milieu
 * d'une page large se lirait comme une erreur plutôt que comme une attente.
 *
 * Le squelette se monte À L'INTÉRIEUR de la coquille : la barre latérale et
 * le rail des étapes restent affichés, seul le contenu clignote. C'est ce qui
 * distingue une navigation d'un rechargement.
 */
export function BackOfficeSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true">
      <Skeleton className="mb-6 h-7 w-56" />
      <div className="mb-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-[18px]" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-[68px] rounded-[16px]" />
        ))}
      </div>
    </div>
  );
}
