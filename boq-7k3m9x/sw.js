/* JK BOQ - offline service worker */
const VERSION = 'jkboq-1';
const FILES = ['./', './index.html', './full.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];
const LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})));
    await Promise.all(LIBS.map(u => fetch(u, {mode: 'no-cors'}).then(r => c.put(u, r)).catch(() => {})));
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('jkboq-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const lib = url.hostname === 'cdnjs.cloudflare.com' || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com');
  if (url.origin !== location.origin && !lib) return;
  if (req.mode === 'navigate') {
    // page: fresh copy when online, cached copy when offline
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r; })
      .catch(() => caches.match(req, {ignoreSearch: true}).then(h => h || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  })));
});
