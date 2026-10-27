// T212 DEMO PWA service worker (scope: /t212-demo/). Network-first; cache is only an offline fallback.
// Only the app shell and the (encrypted) data file are cached - never plaintext.
// Cache names use the 'demo212-' prefix so the real app's worker (which prunes 't212-*') never touches them, and vice versa.
const CACHE = 'demo212-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './favicon-32.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('demo212-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.includes('/t212-demo/')) return;
  url.searchParams.delete('t');
  const key = req.mode === 'navigate' ? new URL('./index.html', self.location).toString() : url.toString();
  e.respondWith(fetch(req, { cache: 'no-store' }).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); }
    return res;
  }).catch(() => caches.match(key).then((r) => r || (req.mode === 'navigate' ? caches.match(new URL('./index.html', self.location).toString()) : Response.error()))));
});
