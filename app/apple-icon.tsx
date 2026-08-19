import { brandIcon } from "@/lib/brand-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Icône de l'écran d'accueil iOS. */
export default function AppleIcon() {
  return brandIcon(size.width);
}
