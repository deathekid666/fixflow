const CACHE = 'fixflow-dashboard-v2';

const PRECACHE = [
  '/dashboard',
  '/dashboard/workorders/new',
  '/offline',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, and Next.js internals
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/_next/webpack-hmr')) return;

  // Dashboard API: network-first, cache fallback (except auth routes)
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/auth')) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          const cached = await cache.match(request);
          return cached ?? new Response(JSON.stringify({ error: 'offline' }), {
            headers: { 'Content-Type': 'application/json', 'X-Offline': '1' },
            status: 503,
          });
        }
      })
    );
    return;
  }

  // Navigation: network-first, offline page fallback
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            caches.open(CACHE).then((c) => c.put(request, res.clone()));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached ?? caches.match('/dashboard') ?? new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // Static assets (_next/static): cache-first
  if (url.pathname.startsWith('/_next/static')) {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // Images / fonts: stale-while-revalidate
  if (['image', 'font'].includes(request.destination)) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        }).catch(() => cached);
        return cached ?? networkFetch;
      })
    );
  }
});

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  if (!e.data) return;
  let payload;
  try { payload = e.data.json(); } catch { payload = { title: 'FixFlow', body: e.data.text() }; }

  const { title = 'FixFlow', body = '', url = '/dashboard', icon = '/icons/pwa-icon.svg', badge = '/icons/pwa-icon.svg', tag } = payload;

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      data: { url },
      vibrate: [100, 50, 100],
      requireInteraction: false,
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/dashboard';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
