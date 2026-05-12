// Service Worker for 山姆代购管理 PWA
const CACHE_NAME = 'sam-buyer-v2';
const BASE_PATH = self.location.pathname.replace(/sw\.js$/, '');

// 相对路径的资产列表
const ASSETS = [
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'icon-192.png',
  BASE_PATH + 'icon-512.png',
];

// Install: cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for same-scope assets, network-first for others
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Same-origin and within scope: cache-first
  if (url.origin === self.location.origin && url.pathname.startsWith(BASE_PATH)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          // Network failed: try cache as fallback
          return caches.match(event.request);
        });
      })
    );
  }
});
