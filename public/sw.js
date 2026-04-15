const CACHE = 'physics-v1'

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([
      '/', '/topics', '/dashboard', '/profile'
    ]))
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Не трогаем API запросы и POST запросы — пропускаем напрямую
  if (url.pathname.startsWith('/api/') || e.request.method !== 'GET') {
    e.respondWith(fetch(e.request))
    return
  }

  // Для обычных GET запросов — сначала сеть, при ошибке кеш
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
