const CACHE_NAME = 'austin-cache-v2'

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return

  // Network-first for API calls, cache fallback
  if (event.request.url.includes('api.espn.com') || event.request.url.includes('api.the-odds-api.com')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Cache-first for static assets
  if (event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff2?|ttf|eot|ico)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          return response
        })
      })
    )
    return
  }

  // Network-first for navigation, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        return response
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('/')))
  )
})
