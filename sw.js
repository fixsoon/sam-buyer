// Service Worker for 山姆代购管理 PWA
// v3: 页面文档改为 network-first —— 保证每次打开都拿到最新版本，离线时回退缓存
const CACHE_NAME = 'sam-buyer-v3';
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

// Fetch:
//  - 页面文档(导航请求) → network-first：优先拉最新，失败才回退缓存
//  - 其他同源静态资源 → cache-first
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE_PATH)) return;

  const accept = req.headers.get('accept') || '';
  const isDocument = req.mode === 'navigate' || accept.includes('text/html');

  if (isDocument) {
    event.respondWith(
      fetch(req).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return response;
      }).catch(() =>
        caches.match(req).then(cached => cached || caches.match(BASE_PATH + 'index.html'))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return response;
      }).catch(() => caches.match(req));
    })
  );
});
