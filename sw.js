// Service Worker for Media Caching
// Version 4.0 - Smart cache checking before download

const CACHE_NAME = 'signage-media-cache-v4';
const DATA_CACHE_NAME = 'signage-data-cache-v4';

// Enable aggressive caching for signage devices
const AGGRESSIVE_CACHE = true; // Set to true for signage, false for web

// Files to cache immediately on install
const STATIC_CACHE = [
  './',
  './index.html',
  './menu.html',
  './category.html',
  './product.html'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static files');
      return cache.addAll(STATIC_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Check if it's a media file (video, image, audio)
  const isMedia = /\.(mp4|MP4|webm|ogg|jpg|jpeg|png|gif|webp|mp3|wav)$/i.test(url.pathname);

  // Check if it's a data file (JSON)
  const isData = /\.json$/i.test(url.pathname) && !url.pathname.includes('version.txt');

  if (isMedia) {
    // Media files: Cache-first strategy (ALWAYS serve from device storage if available)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Service Worker] 💾 Serving from device storage:', url.pathname);
          return cachedResponse;
        }

        // If not in cache, fetch and store for future use
        console.log('[Service Worker] 📥 Downloading to device:', url.pathname);
        return fetch(event.request).then((response) => {
          // Don't cache if not successful
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
            console.log('[Service Worker] ✅ Stored on device:', url.pathname);
          });

          return response;
        }).catch((error) => {
          console.error('[Service Worker] ❌ Download failed:', url.pathname, error);
          // For signage: show placeholder or retry instead of error
          throw error;
        });
      })
    );
  } else if (isData) {
    // Data files: Network-first, fallback to cache
    event.respondWith(
      fetch(event.request).then((response) => {
        const responseToCache = response.clone();
        caches.open(DATA_CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
  } else {
    // Other files: Cache-first with network fallback
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('[Service Worker] All caches cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }

  if (event.data.action === 'preloadMedia') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        // First, check which files are NOT in cache
        const cachedUrls = await Promise.all(
          urls.map(async (url) => {
            const cached = await cache.match(url);
            return cached ? url : null;
          })
        );

        const alreadyCached = cachedUrls.filter(url => url !== null);
        const needsDownload = urls.filter(url => !alreadyCached.includes(url));

        console.log(`[Service Worker] Cache status: ${alreadyCached.length}/${urls.length} files already cached`);

        if (needsDownload.length === 0) {
          console.log('[Service Worker] ✅ All files already cached, no download needed');
          // Notify that everything is ready (no download needed)
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                action: 'alreadyCached',
                total: urls.length
              });
            });
          });
          return;
        }

        console.log(`[Service Worker] 📥 Downloading ${needsDownload.length} new files to device storage...`);
        let downloaded = 0;

        // Download only files that are NOT in cache
        for (const url of needsDownload) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
              downloaded++;
              console.log(`[Service Worker] ✅ Downloaded ${downloaded}/${needsDownload.length}: ${url}`);

              // Send progress update to page
              self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                  client.postMessage({
                    action: 'downloadProgress',
                    current: downloaded,
                    total: needsDownload.length,
                    url: url
                  });
                });
              });
            } else {
              console.warn('[Service Worker] ⚠️ Failed to download:', url, response.status);
            }
          } catch (error) {
            console.error('[Service Worker] ❌ Error downloading:', url, error);
          }
        }

        console.log(`[Service Worker] ✅ Download complete: ${downloaded}/${needsDownload.length} new files stored on device`);

        // Notify page that download is complete
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              action: 'downloadComplete',
              downloaded: downloaded,
              total: needsDownload.length,
              totalFiles: urls.length
            });
          });
        });
      })
    );
  }
});
