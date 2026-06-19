const CACHE_NAME = 'caddyshot-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js',
  'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap',
  'https://cdn.tailwindcss.com',
  'https://img.icons8.com/color/512/golf-ball.png',
  'https://img.icons8.com/color/192/golf-ball.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).catch(err => console.warn("SW install cache warning:", err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((response) => {
        if (response && response.status === 200 && (e.request.url.startsWith(self.location.origin) || e.request.url.includes('unpkg.com') || e.request.url.includes('googleapis.com'))) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback: return a minimal 503 response so respondWith is
      // fulfilled rather than rejected (a rejected promise produces a hard
      // network error visible to the user instead of a graceful failure).
      return new Response('Offline – please reconnect.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    })
  );
});
