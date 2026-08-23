import "server-only";

/**
 * L'aperçu public d'un Shabbat, lu sans session.
 *
 * Appel REST direct plutôt que par le client Supabase habituel : cette
 * fonction sert aussi la fabrique d'image d'aperçu, qui répond à des robots
 * — WhatsApp, iMessage, Signal. Ceux-ci n'ont pas de cookie, et un client qui
 * en cherche un rend la route dynamique pour rien.
 */
export type SharePreview = {
  id: string;
  title: string;
  starts_at: string;
  neighbourhood: string | null;
  host_name: string;
  guest_target: number;
  confirmed: number;
  moments: string[] | null;
  has_sleepover: boolean;
  funding_mode: string;
};

export async function sharePreview(token: string): Promise<SharePreview | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const response = await fetch(`${url}/rest/v1/rpc/shabbat_preview`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
    // L'aperçu est demandé une fois par partage puis mis en cache par les
    // messageries. Une minute suffit à absorber les rafales sans servir un
    // titre périmé après une modification.
    next: { revalidate: 60 },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as SharePreview[] | SharePreview | null;
  const row = Array.isArray(data) ? data[0] : data;
  return row ?? null;
}
