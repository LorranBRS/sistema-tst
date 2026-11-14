// Service worker do Sistema TST: guarda o app no aparelho para abrir sem internet.
// Os dados já ficam no navegador (localStorage); aqui só guardamos os arquivos do app.
const CACHE = 'sistema-tst-app-v1'
const BASE = new URL('./', self.location).href

async function guardarApp() {
  const cache = await caches.open(CACHE)
  const resp = await fetch(BASE + 'index.html', { cache: 'no-store' })
  const html = await resp.clone().text()
  await cache.put(BASE, resp.clone())
  await cache.put(BASE + 'index.html', resp)
  // arquivos gerados pelo build (assets/*.js|css) e ícones citados no index.html
  const urls = [...html.matchAll(/(?:src|href)="\.?\/?([^"#?]+\.(?:js|css|svg|png|webmanifest))"/g)].map((m) => BASE + m[1])
  await Promise.all(
    [...new Set([...urls, BASE + 'icon-192.png', BASE + 'icon-512.png'])].map((u) =>
      fetch(u).then((r) => r.ok && cache.put(u, r)).catch(() => {}),
    ),
  )
}

self.addEventListener('install', (e) => {
  e.waitUntil(guardarApp().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n.startsWith('sistema-tst-app-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || !req.url.startsWith(BASE)) return

  // Páginas: tenta a internet primeiro (para pegar atualizações) e cai para a cópia guardada
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copia = r.clone()
          caches.open(CACHE).then((c) => c.put(BASE + 'index.html', copia))
          // nova versão publicada: atualiza os arquivos guardados em segundo plano
          guardarApp().catch(() => {})
          return r
        })
        .catch(() => caches.match(BASE + 'index.html').then((r) => r || caches.match(BASE))),
    )
    return
  }

  // Arquivos: usa a cópia guardada e busca na internet só se não tiver
  e.respondWith(
    caches.match(req).then(
      (r) =>
        r ||
        fetch(req).then((resp) => {
          if (resp.ok) {
            const copia = resp.clone()
            caches.open(CACHE).then((c) => c.put(req, copia))
          }
          return resp
        }),
    ),
  )
})
