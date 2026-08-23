"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IMAGE_EXTENSION, IMAGE_MAX_BYTES, mediaUrl } from "@/lib/media";

/**
 * Dépôt d'une image dans le seau public `shop-media`, pour les fiches
 * traiteur et les produits.
 *
 * Variante de components/MediaUploader.tsx : celui-ci attend un `currentPath`
 * (un chemin) et un `save(path)` qui écrit en base à chaque dépôt — ce qui
 * suppose une ligne déjà créée. Ici, `traiteurs.logo_url` / `cover_url` et
 * `traiteur_products.image_url` stockent l'URL complète (pas un chemin,
 * historique du champ « lien externe » qu'ils remplacent), et un produit pas
 * encore créé n'a pas d'id à sauvegarder. `onUploaded` reçoit donc l'URL
 * publique déjà résolue ; c'est à l'appelant de décider s'il l'enregistre
 * tout de suite (boutique) ou au prochain submit du formulaire (produit).
 */
export function ImageUploader({
  shopId,
  kind,
  label,
  hint,
  currentUrl,
  onUploaded,
  shape = "wide",
}: {
  shopId: string;
  /** Sert à nommer le fichier, et à distinguer deux dépôts sur un même écran. */
  kind: string;
  label: string;
  hint?: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  shape?: "wide" | "square";
}) {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(currentUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setError(null);

    const extension = IMAGE_EXTENSION[file.type];
    if (!extension) {
      setError("Formats acceptés : JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setError("L'image dépasse 5 Mo.");
      return;
    }

    setBusy(true);
    // L'aléa évite qu'une image remplacée reste servie depuis les caches sous
    // son ancienne adresse : un nouveau chemin, une nouvelle URL.
    const path = `${shopId}/${kind}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
    const supabase = createClient();
    const { error: failure } = await supabase.storage
      .from("shop-media")
      .upload(path, file, { contentType: file.type });

    setBusy(false);
    if (failure) {
      setError("Le dépôt a échoué. Réessayez dans un instant.");
      return;
    }

    const publicUrl = mediaUrl(path);
    if (!publicUrl) return;
    setUrl(publicUrl);
    onUploaded(publicUrl);
  }

  const box = shape === "square" ? "size-24" : "h-32 w-full max-w-[280px]";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] font-bold text-ink/55">{label}</span>
        {hint && <span className="text-[11.5px] text-ink/45">{hint}</span>}
      </div>

      <div
        className={`${box} flex items-center justify-center overflow-hidden rounded-[14px] border-[1.5px] border-dashed border-line bg-sand`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <span className="font-mono text-[10.5px] text-ink/40">aucune image</span>
        )}
      </div>

      {error && <p className="text-[12px] font-bold text-coral-deep">{error}</p>}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="self-start rounded-full border-2 border-line bg-white px-4 py-1.5 text-[12px] font-bold disabled:opacity-50"
      >
        {busy ? "Envoi…" : url ? "Remplacer" : "Choisir une image"}
      </button>
    </div>
  );
}
