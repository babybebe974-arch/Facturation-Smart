// Ancien emplacement de Spend Smart : se désinstalle tout seul.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.map(n => caches.delete(n))))
    .then(() => self.registration.unregister())));
