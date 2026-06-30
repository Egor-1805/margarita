// Pueblo — service worker
// Стратегия: stale-while-revalidate — мгновенно отдаём из кэша,
// в фоне тянем свежую версию и обновляем кэш (обновления доходят со 2-й загрузки).
const CACHE = 'margarita-v13';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/cards.js',
  './js/cards-en.js',
  './js/cards-en-extra.js',
  './js/cards-de.js',
  './js/cards-de-extra-a.js',
  './js/cards-de-extra-b.js',
  './js/srs.js',
  './js/store.js',
  './js/avatar.js',
  './js/audio.js',
  './js/locations.js',
  './js/sprites.js',
  './js/world.js',
  './js/minigames.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  // только свой origin кэшируем
  if (new URL(request.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res && res.status === 200) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        // отдаём кэш сразу, если он есть; иначе ждём сеть
        return cached || network;
      })
    )
  );
});
