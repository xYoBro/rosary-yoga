// Rosary Yoga service worker — offline-first cache for the practice.
// Bump CACHE_NAME whenever app shell or data changes.

const CACHE_NAME = "rosary-yoga-v1";

const ASSETS = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "manifest.webmanifest",
  "data/practice.json",
  "assets/icons/icon.svg",
  "assets/poses/seated_forward_fold.svg",
  "assets/poses/child_pose.svg",
  "assets/poses/supported_butterfly.svg",
  "assets/poses/banana.svg",
  "assets/poses/savasana.svg",
  "assets/poses/knees_to_chest.svg",
  "assets/poses/neutral_back.svg",
  "assets/poses/figure_four.svg",
  "assets/poses/supported_bridge.svg",
  "assets/poses/happy_baby.svg",
  "assets/poses/supported_fish.svg",
  "assets/poses/legs_up_wall.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request)
          .then((res) => {
            if (res && res.ok && res.type === "basic") {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
            return res;
          })
          .catch(() => caches.match("index.html"))
    )
  );
});
