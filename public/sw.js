const SW_VERSION = '1.0.0'
const CACHE_NAME = 'saldo-justo-v1'

const PRECACHE_URLS = [
  '/acesso',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Install: pré-cachear app shell, mas NÃO skip waiting automaticamente
// (atualização controlada via settings page)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  )
  // Não chamamos self.skipWaiting() aqui — o usuário decide quando atualizar
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

// Mensagens da página para o SW
self.addEventListener('message', event => {
  if (!event.data) return

  // Página de configurações pede para ativar o novo SW agora
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  // Página de configurações quer saber a versão atual
  if (event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: SW_VERSION, cache: CACHE_NAME })
  }
})

// Fetch: network-first para páginas dinâmicas, cache-first para assets estáticos
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.origin !== location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (url.pathname.startsWith('/devedor/') || url.pathname === '/dashboard') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
    return
  }

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
  event.waitUntil(
    self.registration.showNotification(data.title || 'Saldo Justo', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/' },
      vibrate: [100, 50, 100],
      requireInteraction: false,
    })
  )
})

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
