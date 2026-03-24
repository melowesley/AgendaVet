const CACHE_NAME = 'agendavet-v3'
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(STATIC_ASSETS)
      })
  )
  self.skipWaiting()
})

self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url)

  // Nunca cachear HTML (páginas) — sempre buscar da rede para evitar versões velhas
  if (event.request.mode === 'navigate' ||
      event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(fetch(event.request))
    return
  }

  // Para assets estáticos do Next.js (_next/static), usar cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request).then(function(res) {
          var clone = res.clone()
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone)
          })
          return res
        })
      })
    )
    return
  }

  // Para o resto, network-first
  event.respondWith(fetch(event.request))
})

self.addEventListener('activate', function(event) {
  var cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
