const CACHE_NAME = 'saldo-justo-v1'

// Assets a pré-cachear (app shell)
const PRECACHE_URLS = [
  '/acesso',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Install: pré-cachear app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// Activate: limpar caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network-first para páginas dinâmicas, cache-first para assets estáticos
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requisições que não são GET ou não são do mesmo origem
  if (request.method !== 'GET' || url.origin !== location.origin) return

  // API routes: sempre rede (sem cache)
  if (url.pathname.startsWith('/api/')) return

  // Páginas dinâmicas do devedor: network-first
  if (url.pathname.startsWith('/devedor/') || url.pathname === '/dashboard') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
    return
  }

  // Assets estáticos: cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
    })
  )
})

// Push notifications
self.addEventListener('push', event => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    requireInteraction: false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Saldo Justo', options)
  )
})

// Notification click: abrir a URL associada
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
