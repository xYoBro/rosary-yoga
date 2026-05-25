// Rosary Yoga service worker — offline-first cache for the practice.
// Bump CACHE_NAME whenever app shell or data changes.

const CACHE_NAME = "rosary-yoga-v19";

const ASSETS = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "training.js",
  "manifest.webmanifest",
  "data/practice.json",
  "assets/icons/icon.svg",
  "assets/poses/photos/seated_forward_fold.jpg",
  "assets/poses/photos/child_pose.jpg",
  "assets/poses/photos/supported_butterfly.jpg",
  "assets/poses/photos/banana.jpg",
  "assets/poses/photos/savasana.jpg",
  "assets/poses/photos/knees_to_chest.jpg",
  "assets/poses/photos/figure_four.jpg",
  "assets/poses/photos/supported_bridge.jpg",
  "assets/poses/photos/happy_baby.jpg",
  "assets/poses/photos/supported_fish.jpg",
  "assets/poses/photos/legs_up_wall.jpg",
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
