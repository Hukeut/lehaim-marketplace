/**
 * Service worker de Lehaim.
 *
 * Écrit à la main plutôt que produit par une bibliothèque : le fichier reste
 * lisible, il n'ajoute aucune dépendance, et le jour où on y branchera les
 * notifications, l'endroit exact où le faire sera évident.
 *
 * Trois stratégies, choisies selon ce que la ressource peut se permettre :
 *
 *  · les fichiers versionnés (`/_next/static/…`) ne changent jamais sous le
 *    même nom : cache d'abord, sans jamais revalider ;
 *  · les images de marque changent rarement : cache d'abord, mise à jour en
 *    arrière-plan ;
 *  · les pages doivent être fraîches : réseau d'abord, et la page hors-ligne
 *    en dernier recours.
 *
 * Ce qui n'est PAS mis en cache, délibérément : les réponses de Supabase. Une
 * liste d'invités périmée servie comme si elle était à jour serait pire que
 * pas de liste du tout.
 */
const VERSION = "v1";
const STATIQUE = `lehaim-statique-${VERSION}`;
const IMAGES = `lehaim-images-${VERSION}`;
const PAGES = `lehaim-pages-${VERSION}`;

/** Le strict nécessaire pour afficher quelque chose sans réseau. */
const SOCLE = ["/hors-ligne.html", "/logo.svg", "/lehaim/candles.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIQUE).then((cache) => cache.addAll(SOCLE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const gardes = [STATIQUE, IMAGES, PAGES];
  event.waitUntil(
    caches
      .keys()
      .then((noms) => Promise.all(noms.filter((n) => !gardes.includes(n)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Jamais de cache sur les données : mieux vaut rien qu'une liste périmée.
  if (url.pathname.startsWith("/auth") || url.pathname.startsWith("/rest")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheDAbord(request, STATIQUE));
    return;
  }

  // `/_next/image` n'a pas d'extension dans son chemin — le format et la
  // taille voyagent en paramètres. Les icônes de mission et les illustrations
  // de rôle passent toutes par là et échappaient donc au cache.
  if (
    url.pathname === "/_next/image" ||
    /\.(?:png|jpe?g|svg|webp|gif|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(cacheDAbord(request, IMAGES));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(reseauDAbord(request));
  }
});

async function cacheDAbord(request, nomDuCache) {
  const cache = await caches.open(nomDuCache);
  const enCache = await cache.match(request);
  if (enCache) return enCache;

  const reponse = await fetch(request);
  if (reponse.ok) cache.put(request, reponse.clone());
  return reponse;
}

async function reseauDAbord(request) {
  try {
    const reponse = await fetch(request);
    // On ne garde que ce qui s'est bien passé : une redirection vers l'écran
    // de connexion mise en cache enfermerait la personne dehors.
    if (reponse.ok && reponse.type === "basic") {
      const cache = await caches.open(PAGES);
      cache.put(request, reponse.clone());
    }
    return reponse;
  } catch {
    const cache = await caches.open(PAGES);
    const enCache = await cache.match(request);
    if (enCache) return enCache;
    return caches.match("/hors-ligne.html");
  }
}
