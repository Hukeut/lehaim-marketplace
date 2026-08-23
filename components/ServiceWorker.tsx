"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker.
 *
 * Après le chargement plutôt que pendant : l'installation télécharge le socle
 * hors-ligne, et rien ne justifie de disputer la bande passante au premier
 * rendu.
 *
 * En développement, on s'abstient — un worker qui met en cache pendant qu'on
 * modifie le code sert surtout à se demander pourquoi rien ne change.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const enregistrer = () => {
      navigator.serviceWorker.register("/sw.js").catch((erreur) => {
        console.error("[lehaim] service worker non enregistré", erreur);
      });
    };

    if (document.readyState === "complete") enregistrer();
    else window.addEventListener("load", enregistrer, { once: true });
  }, []);

  return null;
}
