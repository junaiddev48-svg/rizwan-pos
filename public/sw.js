const CACHE_NAME = 'rizwan-pos-v2';
const ASSETS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  if (url.hostname.includes('supabase')) {
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        fetch(e.request)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone();
              cache.put(e.request, clone);
            }
            return res;
          })
          .catch(() => cache.match(e.request).then((cached) => cached || new Response(JSON.stringify({ data: [] }), { headers: { 'Content-Type': 'application/json' } })))
      )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match('/index.html')))
  );
});
