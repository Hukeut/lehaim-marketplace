"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordDocument } from "@/app/partenaire/dossier/actions";
import type { DocumentKind } from "@/lib/market";

/**
 * Dépôt d'une pièce du dossier.
 *
 * Le fichier part du navigateur vers le seau `shop-documents`, pas par une
 * Server Action : faire transiter dix mégaoctets par le serveur pour les
 * renvoyer au même stockage n'aurait servi personne. L'action ne reçoit que le
 * chemin, une fois le dépôt confirmé.
 *
 * Le chemin est `{shop_id}/{pièce}-{aléa}.{ext}` — le premier segment porte la
 * sécurité, c'est lui que la politique de stockage lit pour vérifier la
 * propriété. L'aléa évite qu'un second dépôt écrase le premier avant que
 * l'administration ait vu le premier.
 */

type State = "pending" | "uploaded" | "rejected";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const MAX_BYTES = 10 * 1024 * 1024;

export function Uploader({
  shopId,
  kind,
  label,
  hint,
  optional = false,
  initialState = "pending",
  initialPath = null,
  rejectedReason = null,
}: {
  shopId: string;
  kind: DocumentKind;
  label: string;
  hint?: string;
  optional?: boolean;
  initialState?: State;
  initialPath?: string | null;
  rejectedReason?: string | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>(initialState);
  const [name, setName] = useState<string | null>(initialPath?.split("/").pop() ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function upload(file: File) {
    setError(null);

    const extension = EXTENSIONS[file.type];
    if (!extension) {
      setError("Formats acceptés : JPEG, PNG, WebP ou PDF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Le fichier dépasse 10 Mo.");
      return;
    }

    setBusy(true);
    const path = `${shopId}/${kind}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
    const supabase = createClient();
    const { error: failure } = await supabase.storage
      .from("shop-documents")
      .upload(path, file, { contentType: file.type });

    if (failure) {
      setBusy(false);
      // Message générique : la cause exacte d'un refus de stockage n'aide pas
      // celui qui dépose, et peut renseigner celui qui sonde.
      setError("Le dépôt a échoué. Réessayez dans un instant.");
      return;
    }

    startTransition(async () => {
      await recordDocument(kind, path);
      setState("uploaded");
      setName(file.name);
      setBusy(false);
    });
  }

  const tone =
    state === "uploaded"
      ? "border-olive bg-olive-wash"
      : state === "rejected"
        ? "border-[#8A2346] bg-coral-wash"
        : "border-line bg-sand";

  return (
    <div className={`flex flex-col gap-2.5 rounded-[16px] border-[1.5px] border-dashed p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[13.5px] font-bold">
            {label}
            {optional && <span className="ms-1.5 font-normal text-ink/45">facultatif</span>}
          </span>
          {hint && <span className="text-[11.5px] leading-snug text-ink/50">{hint}</span>}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
            state === "uploaded"
              ? "bg-olive text-white"
              : state === "rejected"
                ? "bg-[#8A2346] text-white"
                : "bg-white text-ink/45"
          }`}
        >
          {state === "uploaded" ? "Déposé" : state === "rejected" ? "À refaire" : "Attendu"}
        </span>
      </div>

      {state === "rejected" && rejectedReason && (
        <p className="text-[12px] leading-snug font-bold text-[#8A2346]">{rejectedReason}</p>
      )}

      {name && state === "uploaded" && (
        <p className="truncate font-mono text-[11.5px] text-ink/55">{name}</p>
      )}

      {error && <p className="text-[12px] font-bold text-coral-deep">{error}</p>}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
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
        className="self-start rounded-full border-2 border-line bg-white px-4 py-2 text-[12.5px] font-bold disabled:opacity-50"
      >
        {busy ? "Envoi…" : state === "uploaded" ? "Remplacer" : "Choisir un fichier"}
      </button>
    </div>
  );
}
