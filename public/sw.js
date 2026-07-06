const APP_PREFIX = "systeme-pa-";
const version = new URL(self.location.href).searchParams.get("v") || "dev";
const CACHE_NAME = `${APP_PREFIX}${version}`;
const STATIC_SHELL = ["/manifest.webmanifest", "/favicon.svg"];

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  const indexResponse = await fetch(new Request("/index.html", { cache: "reload" }));
  if (!indexResponse.ok) throw new Error(`Unable to cache index.html (${indexResponse.status})`);

  const html = await indexResponse.clone().text();
  const assetUrls = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map(match => new URL(match[1], self.location.origin))
    .filter(url => url.origin === self.location.origin && url.pathname.startsWith("/assets/"))
    .map(url => `${url.pathname}${url.search}`);

  await cache.put("/", indexResponse.clone());
  await cache.put("/index.html", indexResponse);
  await cache.addAll([...STATIC_SHELL, ...new Set(assetUrls)]);
}

self.addEventListener("install", event => {
  event.waitUntil(
    precacheAppShell()
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(APP_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put("/index.html", copy));
          }
          return response;
        })
        .catch(async () => (
          await caches.match(request)
          || await caches.match("/index.html")
          || Response.error()
        ))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
