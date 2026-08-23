import { Skeleton } from "./ui";

/**
 * Squelette d'écran, monté par les `loading.tsx`. Il rend la navigation
 * instantanée : Next affiche cette coquille dès le tap et ne préchargeait
 * rien tant qu'aucune frontière de chargement n'existait.
 */
export function ScreenSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col px-5 pt-[54px] sm:min-h-0" aria-busy="true">
      <Skeleton className="mb-4 h-6 w-32" />
      <Skeleton className="mb-1.5 h-5 w-48" />
      <Skeleton className="mb-5 h-4 w-36" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-[62px] rounded-card" />
        ))}
      </div>
    </main>
  );
}
