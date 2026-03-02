/**
 * Majster.AI — Service Worker v4
 * PR-19: PWA Offline Minimum
 *
 * Strategie:
 *  - Static assets:             cache-first  (js/css/img/fonts)
 *  - Nawigacja (HTML):          network-first z fallbackiem do /index.html
 *  - Supabase GET offers:       stale-while-revalidate  ← NOWE
 *  - Supabase GET v2_projects:  stale-while-revalidate  ← NOWE
 *  - Pozostale Supabase:        pass-through (mutacje ida siecią lub failuja)
 */

const SW_VERSION   = 'v4';
const STATIC_CACHE = 'majster-ai-static-' + SW_VERSION;
const SHELL_CACHE  = 'majster-ai-shell-'  + SW_VERSION;
const API_CACHE    = 'majster-ai-api-'    + SW_VERSION;

/** Adresy URL cachowane przy instalacji (app shell) */
var SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

/**
 * Wzorce URL Supabase REST, ktore cachujemy (stale-while-revalidate).
 * Pasuje do:
 *   https://<proj>.supabase.co/rest/v1/offers?select=...
 *   https://<proj>.supabase.co/rest/v1/v2_projects?select=...
 */
var SUPABASE_CACHEABLE_PATTERNS = [
  /\/rest\/v1\/offers(\?|$)/,
  /\/rest\/v1\/v2_projects(\?|$)/,
];

// ── install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(function(cache) { return cache.addAll(SHELL_URLS); })
      .then(function() { return self.skipWaiting(); })
  );
});

// ── activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', function(event) {
  var validCaches = [STATIC_CACHE, SHELL_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys()
      .then(function(names) {
        return Promise.all(
          names
            .filter(function(n) { return validCaches.indexOf(n) === -1; })
            .map(function(n) { return caches.delete(n); })
        );
      })
      .then(function() { return self.clients.claim(); })
  );
});

// ── fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', function(event) {
  var request = event.request;

  // Tylko GET
  if (request.method !== 'GET') return;

  var url = new URL(request.url);

  // Pomijamy nieobslugiwane protokoly
  if (!url.protocol.startsWith('http')) return;

  // ── 1. Supabase API ──────────────────────────────────────────────────────
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.in')) {
    var isCacheable = SUPABASE_CACHEABLE_PATTERNS.some(function(re) {
      return re.test(url.pathname + url.search);
    });

    if (isCacheable) {
      // Stale-while-revalidate: serwuj z cache natychmiast, aktualizuj w tle
      event.respondWith(staleWhileRevalidate(request, API_CACHE));
    }
    // Pozostale Supabase (mutacje, auth, storage) — pass-through
    return;
  }

  // ── 2. Statyczne zasoby ──────────────────────────────────────────────────
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── 3. Nawigacja (HTML) ──────────────────────────────────────────────────
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithShellFallback(request));
    return;
  }
});

// ── Strategie ────────────────────────────────────────────────────────────────

/**
 * Stale-While-Revalidate:
 *   1. Zwroc z cache jesli dostepny (natychmiastowa odpowiedz offline).
 *   2. Rownolegle zaktualizuj cache z sieci (w tle).
 */
function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(cached) {
      var networkFetch = fetch(request).then(function(response) {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      }).catch(function() {
        return null;
      });

      // Jesli jest w cache — zwroc natychmiast; siec aktualizuje w tle
      return cached || networkFetch;
    });
  });
}

/**
 * Cache-First:
 *   1. Zwroc z cache.
 *   2. Jesli brak — pobierz z sieci i zapisz w cache.
 */
function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      });
    });
  });
}

/**
 * Network-First z fallbackiem do app shell:
 *   1. Probuj siec.
 *   2. Jesli offline — serwuj /index.html (SPA obsluzy trase przez React Router).
 */
function networkFirstWithShellFallback(request) {
  return fetch(request).then(function(response) {
    if (response && response.ok) {
      caches.open(SHELL_CACHE).then(function(cache) {
        cache.put(request, response.clone());
      });
    }
    return response;
  }).catch(function() {
    return caches.open(SHELL_CACHE).then(function(cache) {
      return cache.match(request).then(function(cached) {
        if (cached) return cached;
        // Ostatni fallback — strona glowna SPA
        return cache.match('/index.html').then(function(idx) {
          return idx || cache.match('/');
        });
      });
    });
  });
}

// ── Pomocnicze ───────────────────────────────────────────────────────────────

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif)$/i.test(pathname);
}

// ── Komunikaty z aplikacji ───────────────────────────────────────────────────

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
