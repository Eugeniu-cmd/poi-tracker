/* POI Tracker — the service worker of app/ (CLAUDE.md, data-model.md v0.16)
   It keeps the app opening with no network: the tablet is online only
   through the phone's hotspot. The page itself is fetched from the
   network first, past the browser's own cache, so a new version arrives
   at once, and taken from this cache after 3 s without an answer or with
   no network. The other files come from the cache. Passes never pass
   through here: they live in the browser's storage, which this file does
   not touch.

   v0.1 2026-10-19 — chapter 6 step 2: offline start and install.
   v0.2 2026-10-21 — the gold: a new cache name, so the tablet fetches
   the gold icon instead of keeping the cached one.
   v0.3 2026-10-21 — the polish: a new cache name for app v0.3.
   v0.4 2026-10-23 — the card: a new cache name for app v0.4.
*/
'use strict';
var CACHE = 'poi-app-v0.4';   // a new name per version; the old caches are deleted
var FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-512.png'];
var WAIT = 3000;              // ms the network has before the cached page is shown

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); })
    .then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('poi-app-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function clean(url) { var u = new URL(url); u.search = ''; u.hash = ''; return u.href; }

function cachedPage(req) {
  return caches.match(req, { ignoreSearch: true }).then(function (hit) {
    return hit || caches.match(new URL('index.html', self.registration.scope).href);
  });
}

function page(req) {
  return new Promise(function (resolve) {
    var done = false;
    function give(res) { if (!done && res) { done = true; resolve(res); } }
    var timer = setTimeout(function () { cachedPage(req).then(give); }, WAIT);
    fetch(new Request(req, { cache: 'no-cache' })).then(function (res) {
      if (res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { return c.put(clean(req.url), copy); });
        clearTimeout(timer);
        give(res);
        return;
      }
      cachedPage(req).then(function (hit) { clearTimeout(timer); give(hit || res); });
    }).catch(function () {
      cachedPage(req).then(function (hit) { clearTimeout(timer); give(hit || Response.error()); });
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') { e.respondWith(page(req)); return; }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(req);
  }));
});
