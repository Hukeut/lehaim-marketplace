import { BackOfficeSkeleton } from "@/components/BackOfficeSkeleton";

/** Couvre tous les écrans du back-office : la barre latérale, elle, reste. */
export default function Loading() {
  return <BackOfficeSkeleton rows={5} />;
}
