
/// <reference lib="webworker" />

const CACHE_NAME = 'curecast-v1';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Cache basic assets
      await cache.addAll(ASSETS_TO_CACHE);
      console.log('Service worker installed');
    })()
  );
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event: any) => {
  // Clean up old caches
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      console.log('Service worker activated');
    })()
  );
  
  // Take control immediately
  self.clients.claim();
});

self.addEventListener('fetch', (event: any) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip some requests
  if (
    event.request.url.includes('/api/') || // API requests
    event.request.url.includes('chrome-extension://') // Chrome extensions
  ) {
    return;
  }
  
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      try {
        // Try the network first
        const networkResponse = await fetch(event.request);
        
        // If the response is valid, clone and cache it
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // If network fails, try the cache
        const cachedResponse = await cache.match(event.request);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If nothing in cache, return offline page
        return cache.match(OFFLINE_URL);
      }
    })()
  );
});

// Self type declaration
declare var self: ServiceWorkerGlobalScope;
export {};
