// Minimal Service Worker to satisfy PWA installability requirements
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Basic pass-through fetch handler
    // This satisfies the "register a service worker" requirement for PWAs
    event.respondWith(fetch(event.request));
});
