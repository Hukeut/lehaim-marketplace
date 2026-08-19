import { ImageResponse } from "next/og";

/** Tracé de `StarSolid`, en viewBox 24. Source unique du dessin de marque. */
const STAR_PATH =
  "M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z";

const INK = "#0D2B3E";
const GOLD = "#FFD166";

/** L'étoile occupe 0,47 du carré, comme dans `LogoTile`. */
const STAR_RATIO = 0.47;

/**
 * Rend l'icône de marque en PNG à la taille demandée.
 *
 * Le carré est plein, sans coins arrondis : c'est la forme attendue par iOS
 * et par les icônes « maskable » d'Android, qui appliquent eux-mêmes leur
 * masque. La variante à coins arrondis vit dans `public/logo.svg`.
 */
export function brandIcon(size: number) {
  const star = Math.round(size * STAR_RATIO);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${star}" height="${star}" fill="${GOLD}"><path d="${STAR_PATH}"/></svg>`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: INK,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={star}
          height={star}
          alt=""
          src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`}
        />
      </div>
    ),
    { width: size, height: size },
  );
}
