/* JK Jayakrishnan Regulations - offline service worker */
const VERSION = 'jkreg-4850f1a2d6';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('jkreg-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // app shell: serve cached copy instantly, refresh it in the background
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match('./index.html') || await c.match('./');
      const net = fetch(req).then(r => { if (r.ok) c.put('./index.html', r.clone()); return r; }).catch(() => null);
      return hit || (await net) || new Response('Offline', {status: 503});
    }));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  })));
});
