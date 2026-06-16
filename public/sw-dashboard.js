// FixFlow Dashboard Service Worker
// Version injected at build time by scripts/sw-version.js
const BUILD = 'mqh8lh6g';
const CACHE = `fixflow-dashboard-${BUILD}`;

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

// ── Network-first helper ──────────────────────────────────────────────────────
async function networkFirst(request, fallback) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    return cached ?? fallback;
  }
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, and HMR
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/_next/webpack-hmr')) return;

  // Auth routes: always network-only (never cache credentials)
  if (url.pathname.startsWith('/api/auth')) return;

  // API routes: network-first, offline JSON fallback
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(networkFirst(request,
      new Response(JSON.stringify({ error: 'offline' }), {
        headers: { 'Content-Type': 'application/json', 'X-Offline': '1' },
        status: 503,
      })
    ));
    return;
  }

  // Navigation: network-first, offline page fallback
  if (request.mode === 'navigate') {
    e.respondWith(networkFirst(request,
      caches.match('/offline').then((p) => p ?? new Response('Offline', { status: 503 }))
    ));
    return;
  }

  // Static assets (_next/static): content-hashed by Next.js so safe to
  // cache-first — a new hash means a new URL, so stale cache is never hit.
  // Network-first here would fetch every JS chunk on every page load.
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

  // Everything else (images, fonts, icons): network-first, cache fallback
  e.respondWith(networkFirst(request, new Response('', { status: 503 })));
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
