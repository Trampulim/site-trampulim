const CACHE = 'trampulim-player-v4';
const ASSETS = [
  '/player/',
  '/player/index.html',
  '/player/app.css',
  '/player/app.js',
  '/player/manifest.json',
  '/player/icon-192.png',
  '/player/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // listar.php — sempre rede (lista do servidor), nunca cache
  if (url.pathname.endsWith('listar.php')) {
    e.respondWith(fetch(e.request).catch(() => new Response('[]', {
      headers: { 'Content-Type': 'application/json' }
    })));
    return;
  }

  // Arquivos do app (html/css/js/manifest/icons) — network-first:
  // pega a versão nova quando online, cai pro cache quando offline.
  // Assim atualizações aparecem sem precisar limpar cache.
  if (ASSETS.some(a => url.pathname === a || url.pathname.endsWith(a.split('/').pop()))) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Demais (ex: áudios do servidor) — cache-first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
