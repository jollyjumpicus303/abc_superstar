const CACHE_NAME = 'abc-abenteuer-cache-v8';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './sw.js'
];

// 1. Installieren: Cache öffnen und App-Shell-Dateien hinzufügen
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching App Shell');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        // Sofort aktivieren, ohne auf alte Tabs zu warten
        return self.skipWaiting();
      })
  );
});

// 2. Aktivieren: Alte Caches aufräumen
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Service Worker übernimmt sofort alle offenen Tabs
        return self.clients.claim();
      })
  );
});

// 3. Abrufen: Cache-First-Strategie mit Network-Fallback
self.addEventListener('fetch', (event) => {
  // Nur GET-Anfragen cachen
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Im Cache gefunden - zurückgeben
          return response;
        }

        // Nicht im Cache - vom Netzwerk laden und cachen
        return fetch(event.request)
          .then((fetchResponse) => {
            // Nur erfolgreiche Antworten cachen
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type === 'error') {
              return fetchResponse;
            }

            // Response klonen, da sie nur einmal gelesen werden kann
            const responseToCache = fetchResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return fetchResponse;
          })
          .catch(() => {
            // Netzwerk fehlgeschlagen und nicht im Cache
            console.log('[ServiceWorker] Fetch failed for:', event.request.url);
          });
      })
  );
});