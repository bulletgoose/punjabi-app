// Increment this value whenever the application shell changes. Activation
// removes older Punjabi app caches while leaving unrelated origin caches alone.
const CACHE_VERSION = 'v16';
const CACHE_PREFIX = 'punjabi-sentence-builder-';
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;

const APP_SHELL_PATHS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './firebase-config.js?v=7',
  './firebase-auth.js',
  './speech-client.js?v=11',
  './data/vocabulary-catalog.js?v=1',
  './catalog-state.js?v=1',
  './storage-cleanup.js?v=1',
  './data/sentence-semantic-parameters.js?v=2',
  './lexical-semantics.js?v=2',
  './sentence-learning.js?v=1',
  './learning-context.js?v=4',
  './linguistic-system.js?v=6',
  './grammar-engine.js?v=4',
  './data/VOCABULARY_LICENSE.txt',
  './vendor/ts-fsrs-5.4.2/index.umd.js',
  './fsrs-memory.js?v=1',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
];

const APP_SHELL = APP_SHELL_PATHS.map(path =>
  new URL(path, self.registration.scope).href
);
const INDEX_URL = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL.map(url=>new Request(url,{cache:'reload'}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => /punjabi/i.test(key) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
      .then(async () => {
        // Old open tabs must stop writing the discarded library/audio back.
        const clients=await self.clients.matchAll({type:'window'});
        await Promise.all(clients.filter(client=>client.url.startsWith(self.registration.scope)).map(client=>client.navigate(client.url)));
      })
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/service-worker.js')) return;
  // Authenticated speech responses belong only in IndexedDB under explicit
  // speech-cache keys. Never let the application-shell cache store API audio.
  if (url.pathname.includes('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Cache the current shell only; obsolete data URLs and arbitrary downloads
  // must never be retained as another hidden copy of a previous vocabulary.
  if(APP_SHELL.includes(url.href))event.respondWith(staleWhileRevalidate(request, event));
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request,{cache:'no-store'});
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match(INDEX_URL)) ||
      Response.error();
  }
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(async response => {
      if (response && response.ok) await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    // Keep the cached response fast while refreshing it for the next request.
    event.waitUntil(network);
    return cached;
  }

  return (await network) || Response.error();
}
