// Chika service worker (web version only): keeps the app and Firebase code on the phone,
// so after the first visit Chika opens instantly, even on 2G or with no signal.
const CACHE = "chika-v1";
const SDK = "https://www.gstatic.com/firebasejs/";

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./"])).catch(() => {}));
});
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Firebase code is versioned and never changes: cache first
  if (url.href.startsWith(SDK)) {
    e.respondWith(caches.open(CACHE).then(async c =>
      (await c.match(req)) || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; })));
    return;
  }

  // The app itself: show the saved copy right away, refresh it in the background
  if (url.origin === location.origin) {
    const net = caches.open(CACHE).then(c =>
      fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }));
    e.waitUntil(net.catch(() => {}));
    e.respondWith(caches.open(CACHE).then(async c =>
      (await c.match(req, { ignoreSearch: true })) || net));
  }
  // Everything else (Firestore traffic) goes straight to the network
});
