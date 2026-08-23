/**
 * Les images du seau public `shop-media`.
 *
 * Les lignes stockent un chemin, jamais une URL : l'URL publique se dérive du
 * chemin, l'inverse n'est pas vrai. Stocker l'URL figerait le domaine du
 * projet Supabase dans chaque produit — insupportable le jour d'une
 * migration, et faux dès qu'on a un environnement de préversion.
 */

const BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/shop-media`;

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${BASE}/${path}`;
}

/** Le seau plafonne à 5 Mo, et n'accepte que ces trois formats. */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const IMAGE_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
