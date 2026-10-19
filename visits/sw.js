// Krissty visits PWA service worker. Network-first everywhere; cache is only an offline fallback.
const CACHE = 'krissty-visits-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './clover.svg'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('krissty-visits-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
function cacheKey(req) {
  // Strip cache-busting ?t= so the offline copy can be found.
  const u = new URL(req.url); u.searchParams.delete('t'); return u.toString();
}
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isApi = url.hostname === 'abacus.jasoncameron.dev';
  if (isApi && !url.pathname.startsWith('/get/')) return; // never touch anything but read endpoints
  if (!isApi && url.origin !== self.location.origin) return;
  const key = req.mode === 'navigate' ? './index.html' : cacheKey(req);
  e.respondWith(fetch(req, isApi ? { cache: 'no-store' } : undefined).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); }
    return res;
  }).catch(() => caches.match(key).then((r) => r || caches.match('./index.html'))));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) if (c.url.includes('/visits/') && 'focus' in c) return c.focus();
    return self.clients.openWindow('./');
  }));
});
