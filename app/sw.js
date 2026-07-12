// Rosary Yoga service worker — offline-first cache for the practice.
// Bump CACHE_NAME whenever app shell or data changes.

const CACHE_NAME = "rosary-yoga-v28";

const ASSETS = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "sequence.js",
  "manifest.webmanifest",
  "data/practice.json",
  "assets/icons/icon.svg",
  "assets/fonts/eb-garamond-400.woff2",
  "assets/fonts/eb-garamond-400-italic.woff2",
  "assets/fonts/eb-garamond-500.woff2",
  "assets/fonts/eb-garamond-600.woff2",
  "assets/fonts/cormorant-sc-500.woff2",
  "assets/fonts/cormorant-sc-600.woff2",
  "assets/poses/mountain_prayer.svg",
  "assets/poses/arm_floats.svg",
  "assets/poses/half_salutation.svg",
  "assets/poses/standing_crescent.svg",
  "assets/poses/arms_up.svg",
  "assets/poses/standing_fold.svg",
  "assets/poses/half_lift.svg",
  "assets/poses/plank.svg",
  "assets/poses/cobra.svg",
  "assets/poses/down_dog.svg",
  "assets/poses/chair.svg",
  "assets/poses/warrior_1_right.svg",
  "assets/poses/warrior_1_left.svg",
  "assets/poses/vinyasa.svg",
  "assets/poses/photos/mountain_prayer.jpg",
  "assets/poses/photos/arms_up.jpg",
  "assets/poses/photos/half_lift.jpg",
  "assets/poses/photos/standing_fold.jpg",
  "assets/poses/photos/down_dog.jpg",
  "assets/poses/photos/warrior_1_left.jpg",
  "assets/poses/photos/plank.jpg",
  "assets/poses/photos/cobra.jpg",
  "assets/poses/photos/arm_floats.jpg",
  "assets/poses/photos/warrior_1_right.jpg",
  "assets/poses/photos/standing_crescent.jpg",
  "assets/poses/photos/chair.jpg",
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
    caches.open(CACHE_NAME).then((cache) =>
      // cache: "reload" bypasses the browser's HTTP cache. Without it, a new
      // cache version can be filled with stale copies the browser already
      // held — a bumped CACHE_NAME serving old files (seen in the field).
      cache.addAll(ASSETS.map((url) => new Request(url, { cache: "reload" })))
    )
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
