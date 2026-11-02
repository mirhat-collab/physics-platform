// Mirha_Edu service worker: сайт открывается как приложение и работает без интернета
// там, где это возможно (тренажёр формул, справочник, уже открытые страницы).
const VERSION = 'v2'
const STATIC = `static-${VERSION}`
const PAGES = `pages-${VERSION}`
const PRECACHE = ['/formulas', '/reference', '/daily', '/dashboard', '/offline.html', '/logo-mark.png', '/icon-192.png']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(PAGES)
      // Каждую страницу по отдельности: одна ошибка не должна сорвать установку
      .then(c => Promise.all(PRECACHE.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== STATIC && k !== PAGES).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const req = e.request
  const url = new URL(req.url)
  // Только свои GET-запросы. API, база и вход — всегда напрямую в сеть.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return

  // Файлы сборки не меняются (в имени хэш) — сначала кэш
  if (url.pathname.startsWith('/_next/static/') || /\.(png|jpg|jpeg|svg|webp|woff2?|ico)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(STATIC).then(c => c.put(req, copy)) }
        return res
      }))
    )
    return
  }

  // Страницы: сначала сеть (свежие данные), без сети — сохранённая копия
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(PAGES).then(c => c.put(req, copy)) }
        return res
      }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('/offline.html')))
    )
  }
})
