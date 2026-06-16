const CACHE = 'fixflow-repairs-v1';
const OFFLINE_URL = '/customer-app/my-repairs';

const PRECACHE = [
  '/customer-app',
  '/customer-app/my-repairs',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Cache repair API responses (network-first, fallback to cache)
  if (url.pathname.startsWith('/api/customer/repairs')) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json', 'X-Offline': '1' } });
        }
      })
    );
    return;
  }

  // Navigation: serve from cache, update in background
  if (request.mode === 'navigate') {
    e.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()));
          return res;
        });
        return cached || network;
      })
    );
    return;
  }

  // Static assets: cache-first
  if (['script', 'style', 'font', 'image'].includes(request.destination)) {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()));
          return res;
        });
      })
    );
  }
});

// Background sync: post message to clients when back online
self.addEventListener('online', () => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage({ type: 'ONLINE' }));
  });
});
