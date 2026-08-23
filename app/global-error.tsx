"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Dernier recours : cette page ne s'affiche que si le layout racine lui-même
 * a échoué. Elle le remplace entièrement — donc pas de `globals.css`, pas de
 * classes Tailwind, pas de variables de couleur, pas de polices, et pas de
 * `NextIntlClientProvider`.
 *
 * D'où deux partis pris assumés :
 *
 *  · tout est en styles en ligne, avec les valeurs de la charte recopiées à
 *    la main. Le seul écran dont le travail est de fonctionner quand tout le
 *    reste est cassé ne doit dépendre de rien ;
 *
 *  · les textes vivent ici plutôt que dans `messages/`, pour la même raison,
 *    et la langue se lit dans le cookie que pose déjà `proxy.ts`. Cinq
 *    phrases dupliquées, contre une page qui marche à coup sûr.
 */
const TEXTS = {
  fr: { title: "L'application n'a pas pu démarrer", retry: "Recharger" },
  en: { title: "The app could not start", retry: "Reload" },
  es: { title: "La aplicación no ha podido iniciarse", retry: "Recargar" },
  he: { title: "האפליקציה לא הצליחה לעלות", retry: "רענון" },
  ru: { title: "Приложение не смогло запуститься", retry: "Обновить" },
} as const;

type Lang = keyof typeof TEXTS;

const INK = "#0f274d";
const CREAM = "#fff9f0";

function readLocale(): Lang {
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  const value = match?.[1];
  return value && value in TEXTS ? (value as Lang) : "fr";
}

/** Le cookie ne change pas pendant la vie de cet écran : rien à réabonner. */
const noSubscribe = () => () => {};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Le rendu serveur ne connaît pas le cookie du navigateur. `useSyncExternalStore`
  // est fait pour ça : le serveur rend le français, le client relit le cookie
  // après hydratation, et React ne signale aucune divergence.
  const lang = useSyncExternalStore(noSubscribe, readLocale, () => "fr" as Lang);

  useEffect(() => {
    console.error("[lehaim] échec fatal du layout racine", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  const t = TEXTS[lang];

  return (
    <html lang={lang} dir={lang === "he" ? "rtl" : "ltr"}>
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: CREAM,
          color: INK,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 320 }}>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Lehaim</div>

          <h1 style={{ margin: "14px 0 0", fontSize: 17, fontWeight: 600, lineHeight: 1.35 }}>
            {t.title}
          </h1>

          <button
            onClick={reset}
            style={{
              marginTop: 22,
              width: "100%",
              padding: "13px 20px",
              border: 0,
              borderRadius: 999,
              background: INK,
              color: CREAM,
              font: "inherit",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t.retry}
          </button>

          {error.digest && (
            <p style={{ marginTop: 16, fontSize: 11, opacity: 0.35, fontFamily: "monospace" }}>
              {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
