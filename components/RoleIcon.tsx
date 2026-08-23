import Image from "next/image";
import type { RoleKey } from "@/lib/templates";

/**
 * L'illustration d'un rôle.
 *
 * Une par rôle, à part des icônes d'apport : « le gardien des hallot » et
 * « les hallot » ne sont pas la même chose — l'une est un personnage, l'autre
 * un objet à cocher sur une liste.
 *
 * `priority` parce que c'est le sujet de l'écran d'assignation : la charger
 * paresseusement ferait apparaître un disque vide pendant l'animation
 * d'arrivée, c'est-à-dire exactement pendant qu'on la regarde.
 */
export function RoleIcon({
  role,
  size,
  className = "",
}: {
  role: RoleKey;
  size: number;
  className?: string;
}) {
  return (
    <Image
      src={`/roles/${role}.webp`}
      alt=""
      width={size}
      height={size}
      priority
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}
