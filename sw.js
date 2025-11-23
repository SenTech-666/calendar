// sw.js — Service Worker для PWA (оффлайн + кэш), адаптированный для /calendar/
const CACHE_NAME = 'nails-app-v3';
const urlsToCache = [
  '/calendar/',  // Корень поддиректории
  '/calendar/index.html',
  '/calendar/calendar.html',
  '/calendar/styles.css',
  '/calendar/src/main.js',
  '/calendar/src/store.js',
  '/calendar/src/components.js',
  '/calendar/src/modal.js',
  '/calendar/src/toast.js',
  '/calendar/src/telegram.js',
  '/calendar/src/telegram-client.js',
  '/calendar/src/firebase.js',
  '/calendar/src/calendar.js',  // Если есть
  '/calendar/icon-192.png',
  '/calendar/icon-512.png',
  '/calendar/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});