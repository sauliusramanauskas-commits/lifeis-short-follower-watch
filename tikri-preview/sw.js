/* Tikri peržiūra – service worker (tik savo aplanko failai, network-first, kad atnaujinimai matytųsi). */
var CACHE = 'tikri-preview-v9';
var ASSETS = ['./', 'index.html', 'assets/css/app.css?v=9', 'assets/js/config.js?v=9', 'assets/js/data.js?v=9', 'assets/js/icons.js?v=9', 'assets/js/app.js?v=9', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'assets/fonts/inter-latin-wght-normal.woff2', 'assets/fonts/inter-latin-ext-wght-normal.woff2'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('tikri-preview-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); return r; }).catch(function () { return caches.match(e.request).then(function (m) { return m || caches.match('index.html'); }); }));
});
