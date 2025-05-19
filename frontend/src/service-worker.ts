/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

// Definir los tipos que faltan
declare const self: ServiceWorkerGlobalScope;

// Crear un nombre único para el caché
const CACHE = `cache-${version}`;

// Filtrar los recursos para excluir los iconos que no existen
const ASSETS = [
  ...build, // archivos generados por el bundler
  ...files.filter(file => !file.includes('/icons/')) // archivos estáticos excluyendo íconos
];

// Instalar el service worker
self.addEventListener('install', (event) => {
  // Saltarse la fase de espera y activarse inmediatamente
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      // Agregar archivos de uno en uno para manejar errores individualmente
      return Promise.allSettled(
        ASSETS.map(async (asset) => {
          try {
            await cache.add(asset);
          } catch (error) {
            console.warn(`No se pudo cachear el recurso: ${asset}`, error);
          }
        })
      );
    })
  );
});

// Activar el service worker
self.addEventListener('activate', (event) => {
  // Reclamar clientes inmediatamente
  self.clients.claim();
  
  // Limpiar caches anteriores
  event.waitUntil(
    caches.keys().then(async keys => {
      for (const key of keys) {
        if (key !== CACHE) await caches.delete(key);
      }
    })
  );
});

// Estrategia de caché: network first, falling back to cache
self.addEventListener('fetch', (event) => {
  // No interceptar solicitudes a la API
  if (event.request.url.includes('/api/') || event.request.url.includes('/ws/')) {
    return;
  }
  
  // Ignorar solicitudes de íconos faltantes
  if (event.request.url.includes('/icons/')) {
    return;
  }
  
  // Navegación: siempre ir a la red primero
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/').then(response => response || caches.match(event.request).then(resp => resp || new Response('Página no disponible sin conexión', {
          status: 404,
          headers: new Headers({ 'Content-Type': 'text/plain' })
        })));
      })
    );
    return;
  }
  
  // Para otros recursos: cache first, then network
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Si está en caché, retornar respuesta de caché
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Si no está en caché, intentar buscar en la red
      return fetch(event.request)
        .then(networkResponse => {
          // Almacenar en caché la respuesta válida de la red
          if (networkResponse.ok) {
            const clonedResponse = networkResponse.clone();
            caches.open(CACHE).then(cache => {
              cache.put(event.request, clonedResponse);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallar silenciosamente si no se puede conectar
          // O regresar un fallback para imágenes
          if (event.request.destination === 'image') {
            return new Response('', { 
              status: 200, 
              headers: new Headers({ 'Content-Type': 'image/svg+xml' }) 
            });
          }
          return new Response('Contenido no disponible sin conexión', { 
            status: 408, 
            headers: new Headers({ 'Content-Type': 'text/plain' }) 
          });
        });
    })
  );
});

// Service worker desactivado temporalmente
// Archivo vacío para evitar errores
export {}; 