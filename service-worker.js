const cacheName = "tetris-game-v40";
const filesToCache = [
  "./",
  "./index.html",
  "./style.css?v=40",
  "./game-config.js?v=40",
  "./game-renderer.js?v=40",
  "./game-engine.js?v=40",
  "./game-ui.js?v=40",
  "./game-controls.js?v=40",
  "./game.js?v=40",
  "./manifest.json",
  "./icon.svg",
  "./tetris-logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(filesToCache))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(cacheName).then((cache) => cache.put("./index.html", responseToCache));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(caches.match(event.request).then((cachedResponse) => {
    return cachedResponse || fetch(event.request);
  }));
});
