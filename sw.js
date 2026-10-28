// Son Kare: local-only, subpath-safe offline support for the iPhone edition.
const VERSION = 'ba2646bf34a2';
const CACHE_PREFIX = 'son-kare-iphone-' + encodeURIComponent(self.registration.scope) + '-';
const CACHE = CACHE_PREFIX + VERSION;
const CORE_PATHS = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable.png'];
const CORE = CORE_PATHS.map(path => new URL(path, self.location.href).href);
const INDEX = new URL('./index.html', self.location.href).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE.map(url => new Request(url, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
      return response;
    } catch {
      return request.mode === 'navigate' ? (await cache.match(INDEX)) || Response.error() : Response.error();
    }
  })());
});
