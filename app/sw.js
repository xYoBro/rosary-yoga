// Rosary Yoga service worker — offline-first cache for the practice.
//
// Strategy:
//   - Code and data (HTML, CSS, JS, JSON): network-first. The browser
//     always tries the network when online so updates land immediately,
//     and falls back to cache only when offline. This avoids the
//     "old PWA serving stale code after a deploy" trap.
//   - Images and icons: cache-first. Pose photos and icons don't change
//     between versions; serve them fast and update opportunistically.
//
// Bump CACHE_NAME whenever app shell or data changes.

const CACHE_NAME = "rosary-yoga-v20";

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

const IMAGE_RE = /\.(svg|png|jpe?g|webp|gif|ico)$/i;

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Cache-first for images: assets that don't change between versions.
  if (IMAGE_RE.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Network-first for everything else (HTML, CSS, JS, JSON). The browser
  // always tries the network when online — that's how the user picks up
  // new versions without manual cache eviction.
  event.respondWith(networkFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.ok && res.type === "basic") {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, res.clone());
    }
    return res;
  } catch (e) {
    return caches.match("index.html");
  }
}

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res && res.ok && res.type === "basic") {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, res.clone());
    }
    return res;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Navigation request fallback: return the cached shell so the app
    // can still load offline even on URLs the SW hasn't pre-seen.
    if (request.mode === "navigate") {
      const shell = await caches.match("index.html");
      if (shell) return shell;
    }
    throw e;
  }
}
