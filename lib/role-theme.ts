import type { RoleKey } from "@/lib/templates";

/**
 * Le nuancier des treize rôles.
 *
 * Une seule mise en page, treize identités : la page entière prend la teinte
 * du rôle reçu. Les rôles alimentaires prennent les teintes pleines — le
 * caviste en grenat, le chef du chaud en corail profond ; les rôles
 * logistiques prennent les lavis clairs, pour que la table et les assises ne
 * crient pas plus fort que le plat principal.
 *
 * Deux schémas seulement, et le choix entre les deux est une question de
 * contraste, pas de goût : sur un fond dense on écrit en blanc, sur un lavis
 * en encre. Les valeurs ci-dessous ont été retenues parce qu'elles passent le
 * niveau AA sur les treize fonds — le corail vif porte l'encre à 5,7:1 là où
 * le blanc n'aurait donné que 2,6:1.
 *
 * Les couleurs sont posées en style, pas en classes : treize jeux de teintes
 * arbitraires ne se pré-génèrent pas.
 */

export type RoleTheme = {
  /** Fond de la page. */
  bg: string;
  /** Les deux cercles décoratifs, à peine détachés du fond. */
  deco: string;
  /** Texte : nom du rôle, accroche, mentions secondaires. */
  fg: string;
  fgSoft: string;
  fgMute: string;
  /** Disque qui porte l'illustration, et les pastilles. */
  discBg: string;
  chipBg: string;
  /** Halo radial derrière le disque. */
  halo: string;
  /** Rayures du bloc en attente d'illustration. */
  stripe: string;
  /** Les deux étoiles, grande puis petite. */
  star: string;
  starSmall: string;
};

const DARK_HALO = "radial-gradient(circle, rgba(255,212,106,.26) 0%, rgba(255,212,106,0) 66%)";
const DARK_STRIPE =
  "repeating-linear-gradient(45deg,rgba(255,249,240,.26),rgba(255,249,240,.26) 6px,rgba(255,249,240,.13) 6px,rgba(255,249,240,.13) 12px)";
const LIGHT_STRIPE =
  "repeating-linear-gradient(45deg,#fdf6ec,#fdf6ec 6px,#f3ebdd 6px,#f3ebdd 12px)";

/** Fond dense, texte blanc. Le halo reste doré : c'est la note de fête. */
function dark(bg: string, stars: [string, string] = ["#ffd46a", "#f4b83f"]): RoleTheme {
  return {
    bg,
    deco: "rgba(255,255,255,.07)",
    fg: "#ffffff",
    fgSoft: "#ffffff",
    fgMute: "#ffffff",
    discBg: "rgba(255,249,240,.16)",
    chipBg: "rgba(255,249,240,.18)",
    halo: DARK_HALO,
    stripe: DARK_STRIPE,
    star: stars[0],
    starSmall: stars[1],
  };
}

/** Lavis clair, texte encre. Le halo prend la teinte du fond, en plus dense. */
function light(
  bg: string,
  haloRgb: string,
  stars: [string, string] = ["#b0631a", "#ffffff"],
  deco = "rgba(255,249,240,.5)",
): RoleTheme {
  return {
    bg,
    deco,
    fg: "#0f274d",
    fgSoft: "#0f274d",
    fgMute: "#0f274d",
    discBg: "rgba(255,249,240,.66)",
    chipBg: "rgba(255,249,240,.7)",
    halo: `radial-gradient(circle, rgba(${haloRgb},.3) 0%, rgba(${haloRgb},0) 66%)`,
    stripe: LIGHT_STRIPE,
    star: stars[0],
    starSmall: stars[1],
  };
}

export const ROLE_THEME: Record<RoleKey, RoleTheme> = {
  // Corail profond — la teinte la plus dense du nuancier pour le rôle le plus
  // attendu.
  main: dark("#b0631a"),
  // Jaune clair : la mie, la croûte. Étoiles en grenat et corail profond,
  // sans quoi elles disparaîtraient dans l'or.
  bread: light("#ffd46a", "244,184,63", ["#8a2346", "#b0631a"]),
  // Lavis corail, plus doux que le plat principal : le dessert ne doit pas
  // voler la vedette.
  pastry: light("#fbeeda", "232,138,46", ["#e88a2e", "#b0631a"]),
  // Grenat — seule occurrence pleine de la teinte, réservée au vin.
  wine: dark("#8a2346"),
  // Lavis olive : l'olive plein ne portait pas le texte secondaire, le lavis
  // garde le vert de la fraîcheur et remonte l'encre au-dessus de AA.
  salad: light("#e9efdf", "107,143,66", ["#6b8f42", "#b0631a"]),
  // Corail vif, en encre et non en blanc : le blanc y tombait à 2,6:1.
  starter: light("#e88a2e", "255,249,240", ["#8a2346", "#b0631a"]),
  // Bleu principal — le froid, l'eau.
  cold: dark("#224fa7"),
  // Les rôles de mise en place passent dans les bleus profonds.
  table: dark("#173a72"),
  seats: dark("#0f274d"),
  // Sable — le lavis le plus neutre pour le rôle le plus logistique, halo
  // bleu pour le situer.
  bedding: light("#f8f1e5", "34,79,167", ["#224fa7", "#8a2346"], "rgba(255,249,240,.7)"),
  // Or plein — la seule célébration franche : c'est le rôle qui ouvre Shabbat.
  candles: light("#f4b83f", "255,212,106", ["#b0631a", "#8a2346"]),
  // Lavis grenat, écho du caviste en beaucoup plus léger.
  decor: light("#f6e7ec", "138,35,70", ["#8a2346", "#b0631a"]),
  // Ivoire — le rôle le plus discret prend la surface la plus neutre.
  support: light("#fdf6ec", "107,143,66", ["#6b8f42", "#8a2346"]),
};

/**
 * Le nom du rôle rétrécit quand il s'allonge.
 *
 * « Спаситель посадочных мест » fait deux fois « Le renfort ». Sans cette
 * échelle, il passerait sur trois lignes et pousserait l'illustration hors
 * de l'écran.
 */
export function roleNameSize(name: string): { fontSize: string; lineHeight: string } {
  if (name.length > 22) return { fontSize: "26px", lineHeight: "32px" };
  if (name.length > 15) return { fontSize: "30px", lineHeight: "36px" };
  return { fontSize: "34px", lineHeight: "40px" };
}

/** L'étoile de la maquette, en cinq branches découpées. */
export const STAR_CLIP =
  "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 100%,50% 73%,21% 100%,32% 57%,2% 35%,39% 35%)";
