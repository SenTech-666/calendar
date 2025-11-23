// sw.js — Service Worker для PWA (оффлайн + кэш)
const CACHE_NAME = 'nails-app-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/calendar.html',
  '/styles.css',
  '/src/main.js',
  '/src/store.js',
  '/src/components.js',
  '/src/modal.js',
  '/src/toast.js',
  '/src/telegram.js',
  '/src/telegram-client.js',
  '/src/firebase.js',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
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