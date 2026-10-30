/* POI Tracker — the service worker of app/ (CLAUDE.md, data-model.md v0.18)
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
   v0.5 2026-10-23 — done by rings: a new cache name for app v0.5.
   v0.6 2026-10-23 — the approved screens of D1: a new cache name for app v0.6.
   v0.7 2026-10-26 — the new look: a new cache name for app v0.7.
   v0.8 2026-10-26 — captions and sides: a new cache name for app v0.8.
   v0.9 2026-10-26 — the type change dialog: a new cache name for app v0.9.
   v0.10 2026-10-26 — Cancel removal and the small defects: a new cache name for app v0.10.
   v0.11 2026-10-26 — gold small arrows: a new cache name for app v0.11.
   v0.12 2026-10-26 — a brighter done green for the grid: a new cache name for app v0.12.
   v0.13 2026-10-26 — Undo on the Type set toast: a new cache name for app v0.13.
   v0.14 2026-10-26 — speed step 1, the column redraws only what changed: a new cache name for app v0.14.
   v0.15 2026-10-27 — a temporary test switch for the band on the tablet: a new cache name for app v0.15.
   v0.16 2026-10-28 — a locked disc has no shadow, the test switch removed: a new cache name for app v0.16.
   v0.17 2026-10-28 — no zoom, and leaving the app cancels a half-made pass: a new cache name for app v0.17.
   v0.18 2026-10-28 — a second temporary test switch, for the dark-mode blink of the see-through panels: a new cache name for app v0.18.
   v0.19 2026-10-30 — solid panels, the test switch removed: a new cache name for app v0.19.
   v0.20 2026-10-30 — speed step 2b, the Sync panel's This tablet section measures the side taps and the freezes: a new cache name for app v0.20.
   v0.21 2026-10-30 — the ding is ready before the first pass, the audio context created right after the first screen is drawn: a new cache name for app v0.21.
   v0.22 2026-10-30 — the app shows its version on the This tablet title line: a new cache name for app v0.22.
   v0.23 2026-10-30 — speed step 3, History of the whole route shows the newest 50 rows and Show 50 more: a new cache name for app v0.23.
*/
'use strict';
var CACHE = 'poi-app-v0.23';   // a new name per version; the old caches are deleted
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
