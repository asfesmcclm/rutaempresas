const CACHE_NAME = 'albacete-v2';
const ASSETS_ESTATICOS = [
    './',
    './index.html',
    './manifest.json'
];

// Instalación: guarda solo los assets estáticos en caché
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_ESTATICOS))
    );
    self.skipWaiting();
});

// Limpia cachés antiguas al activar
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Estrategia:
// - datos.js → Network-first (para recibir siempre los datos actualizados)
// - resto     → Cache-first (para carga rápida offline)
self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);

    if (url.pathname.endsWith('datos.js')) {
        // Network-first: intenta red y si falla usa caché
        e.respondWith(
            fetch(e.request)
                .then(res => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
                    return res;
                })
                .catch(() => caches.match(e.request))
        );
    } else {
        // Cache-first para el resto
        e.respondWith(
            caches.match(e.request).then(cached => cached || fetch(e.request))
        );
    }
});
