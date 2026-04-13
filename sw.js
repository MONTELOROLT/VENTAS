// ── Service Worker — Monteloro Ventas ──
// Actualizar este número cada vez que subes una nueva versión del index.html
const CACHE_VERSION = 'monteloro-v1.4.260413';
const CACHE_FILES   = ['./index.html', './manifest.json'];

// Instalar: cachear archivos del app
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(CACHE_FILES))
  );
});

// Activar: eliminar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: primero red, si falla usa cache (network-first para mantener datos frescos)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Peticiones a Google Apps Script: siempre red, nunca cachear
  if (url.hostname.includes('script.google.com') ||
      url.hostname.includes('googleapis.com')) {
    return; // deja que el browser lo maneje normalmente
  }

  // Archivos del app (mismo origen): network-first con fallback a cache
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          // Guardar copia fresca en cache si es una respuesta válida
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(e.request)) // sin red: usar cache
    );
  }
});
