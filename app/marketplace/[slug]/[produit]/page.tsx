import { redirect } from "next/navigation";

/**
 * La fiche produit à part n'existe plus : sans variante à configurer, un
 * produit s'ajoute directement depuis la carte (voir Catalogue.tsx). Cette
 * route reste comme redirection plutôt que de casser un lien déjà partagé.
 */
export default async function Produit({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/marketplace/${slug}/carte`);
}
