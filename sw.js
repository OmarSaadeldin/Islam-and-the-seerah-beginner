const CACHE = 'seerah-v1';
const URLS = ['.', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => {
        console.log('Service Worker: Caching app shell');
        return c.addAll(URLS);
      })
      .catch(error => console.log('Cache addAll error:', error))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  console.log('Service Worker: Activated');
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
      .then(r => {
        if (r) {
          console.log('Service Worker: Serving from cache:', e.request.url);
          return r;
        }
        return fetch(e.request)
          .then(res => {
            // Don't cache non-successful responses
            if (!res || res.status !== 200 || res.type === 'error') {
              return res;
            }
            
            let clone = res.clone();
            caches.open(CACHE)
              .then(c => {
                c.put(e.request, clone);
              });
            return res;
          })
          .catch(error => {
            console.log('Fetch failed:', error);
            // Return offline page or cached fallback if available
            return new Response('Offline - Please check your internet connection', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});
