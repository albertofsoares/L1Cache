const CACHE_VERSION = 'v2';
const STATIC_CACHE = `nosso-site-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `nosso-site-runtime-${CACHE_VERSION}`;

const LOCAL_APP_SHELL = ['./', './index.html', './manifest.webmanifest'];

// Dependências externas críticas para subir a SPA quando já houve ao menos 1 acesso online.
const CRITICAL_CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js',
  'https://esm.sh/lucide-react@0.344.0?bundle'
];

const PRECACHE_URLS = [...LOCAL_APP_SHELL, ...CRITICAL_CDN_ASSETS];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

const isFirebaseDataRequest = (url) => {
  const host = url.hostname;
  return host.includes('firestore.googleapis.com') || host.includes('firebaseinstallations.googleapis.com') || host.includes('identitytoolkit.googleapis.com');
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navegação: network-first para pegar atualização; fallback no shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Endpoints de dados/autenticação: sempre rede primeiro; sem fallback agressivo de cache.
  if (isFirebaseDataRequest(url)) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Assets estáticos: cache-first + revalidação em background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status >= 400) {
            return networkResponse;
          }

          const clone = networkResponse.clone();
          const targetCache = url.origin === self.location.origin ? STATIC_CACHE : RUNTIME_CACHE;
          caches.open(targetCache).then((cache) => cache.put(request, clone));
          return networkResponse;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
