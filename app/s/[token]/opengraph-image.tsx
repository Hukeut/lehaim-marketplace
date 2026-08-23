import { ImageResponse } from "next/og";
import { sharePreview } from "@/lib/share-preview";

/**
 * La carte que voit le destinataire dans WhatsApp.
 *
 * L'image générique du site faisait 560 × 560 — carrée. WhatsApp ne rend une
 * grande carte que pour une image paysage d'au moins 300 × 200 ; une carrée
 * retombe sur une vignette collée au texte, et l'invitation ressemblait alors
 * à un lien nu. D'où le format ci-dessous, qui est celui qu'attendent toutes
 * les messageries.
 *
 * Et surtout : la carte porte le nom du Shabbat, sa date et son hôte. Elle
 * était identique pour tout le monde — « Lehaim · Le Shabbat entre amis » —
 * ce qui donnait à chaque invitation l'air d'une publicité pour l'app plutôt
 * que d'une invitation.
 */
export const alt = "Invitation à un Shabbat";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CREAM = "#fff9f0";
const INK = "#0f274d";
const GOLD = "#f4b83f";
const CORAL = "#b0631a";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const preview = await sharePreview(token);

  const date = preview
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date(preview.starts_at))
    : "";
  const time = preview
    ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(
        new Date(preview.starts_at),
      )
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CREAM,
          padding: "68px 76px",
          position: "relative",
        }}
      >
        {/* Deux disques, comme sur l'écran de rôle : ils donnent une identité
            à la carte sans rien ajouter à lire. */}
        <div
          style={{
            position: "absolute",
            top: -170,
            right: -120,
            width: 460,
            height: 460,
            borderRadius: 999,
            background: "rgba(244,184,63,0.28)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -190,
            left: -110,
            width: 380,
            height: 380,
            borderRadius: 999,
            background: "rgba(232,138,46,0.14)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 6,
              color: CORAL,
            }}
          >
            INVITATION
          </div>
          <div
            style={{
              display: "flex",
              fontSize: preview && preview.title.length > 26 ? 68 : 86,
              fontWeight: 700,
              lineHeight: 1.05,
              color: INK,
              maxWidth: 900,
            }}
          >
            {preview?.title ?? "Un Shabbat vous attend"}
          </div>
          {preview && (
            <div style={{ display: "flex", fontSize: 38, color: INK, opacity: 0.72 }}>
              {date} · {time} · chez {preview.host_name}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", width: 46, height: 46, borderRadius: 999, background: GOLD }} />
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: INK }}>Lehaim</div>
          {preview?.neighbourhood && (
            <div style={{ display: "flex", fontSize: 30, color: INK, opacity: 0.5 }}>
              · {preview.neighbourhood}
            </div>
          )}
        </div>
      </div>
    ),
    size,
  );
}
