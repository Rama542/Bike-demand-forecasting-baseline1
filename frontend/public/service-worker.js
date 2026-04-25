// VeloAI Service Worker — force refresh on every new deployment
const CACHE_NAME = "veloai-v4";

// On install — clear ALL old caches so stale JS bundles don't break the app
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

// Activate immediately and take control of all clients
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Network-first strategy: always try network, fall back to cache
self.addEventListener("fetch", (event) => {
  // Only intercept GET requests for same-origin resources
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
