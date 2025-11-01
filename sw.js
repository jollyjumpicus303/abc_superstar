const CACHE_NAME = 'abc-abenteuer-cache-v1';
const FILES_TO_CACHE = [
  '/alphabet.html'
  // Die Icons werden vom Browser automatisch gecacht, wenn sie im Manifest referenziert sind.
];

// 1. Installieren: Cache öffnen und App-Shell-Dateien hinzufügen
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching App Shell');
        return cache.addAll(FILES_TO_CACHE);
      })
  );
});

// 2. Abrufen: Anfragen abfangen und aus dem Cache bedienen
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Wenn die Anfrage im Cache gefunden wird, wird sie von dort zurückgegeben.
        // Andernfalls wird die Anfrage normal an das Netzwerk weitergeleitet.
        return response || fetch(event.request);
      })
  );
});