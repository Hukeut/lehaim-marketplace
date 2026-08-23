import { ScreenSkeleton } from "@/components/ScreenSkeleton";

/** Couvre la fiche d'un commerce, sa carte, une fiche produit et la recherche. */
export default function Loading() {
  return <ScreenSkeleton rows={4} />;
}
