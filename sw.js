const CACHE_NAME = 'fpt-calendario-v1';
const ASSETS = [
  '/calendario-tenis/',
  '/calendario-tenis/index.html',
  '/calendario-tenis/manifest.json',
  '/calendario-tenis/hero.jpg',
  '/calendario-tenis/logo-color.svg',
  '/calendario-tenis/logo-white.svg',
  '/calendario-tenis/icon-192x192.png',
  '/calendario-tenis/icon-512x512.png'
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first for Google Sheets, cache first for assets
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Always fetch Google Sheets live (don't cache spreadsheet data)
  if (url.includes('docs.google.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('[]')));
    return;
  }

  // Google Fonts — network first, fallback to cache
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // All other assets — cache first, fallback to network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
