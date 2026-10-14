// Service worker — Facturation Smartdesignforyou
// Réseau d'abord pour la page (les mises à jour arrivent tout de suite),
// cache en secours pour ouvrir l'app hors connexion.
// Les appels Apps Script (archivage Drive) et le taux de change ne sont jamais mis en cache.
const CACHE = 'facturation-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = req.url;
  if (url.includes('script.google.com') || url.includes('googleusercontent.com') || url.includes('exchangerate-api.com')) return;

  event.respondWith(
    fetch(req).then(res => {
      if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() =>
      caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
    )
  );
});
