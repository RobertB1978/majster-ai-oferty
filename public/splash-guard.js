/**
 * Splash Guard — safety net for boot failures.
 *
 * If React does not boot within TIMEOUT_MS, removes the splash overlay
 * and shows a minimal error message. Also provides boot checkpoint logging
 * via window.__BOOT_LOG for production diagnosis.
 *
 * Boot checkpoints:
 *   BOOT_1 — main.tsx module loaded
 *   BOOT_2 — React root created
 *   BOOT_3 — App component render started
 *   BOOT_4 — Router mounted
 *   BOOT_5 — Auth init start
 *   BOOT_6 — Auth init done
 *   BOOT_7 — Public route rendered
 *   BOOT_8 — Splash hidden
 */
(function () {
  'use strict';

  var TIMEOUT_MS = 15000; // 15 s — generous for slow 3G
  var LOG = [];

  window.__BOOT_LOG = LOG;

  window.__BOOT = function (checkpoint, detail) {
    var entry = {
      c: checkpoint,
      t: Date.now(),
      d: detail || null,
    };
    LOG.push(entry);

    // Also log to console for DevTools diagnosis
    if (typeof console !== 'undefined' && console.log) {
      console.log('[BOOT] ' + checkpoint + (detail ? ' — ' + detail : ''));
    }

    // BOOT_8 means React took over — clear the splash explicitly
    if (checkpoint === 'BOOT_8') {
      hideSplash();
    }
  };

  function hideSplash() {
    var splash = document.getElementById('app-splash');
    if (splash) {
      splash.style.transition = 'opacity 0.2s ease-out';
      splash.style.opacity = '0';
      setTimeout(function () {
        if (splash.parentNode) {
          splash.parentNode.removeChild(splash);
        }
      }, 250);
    }
  }

  // Safety timeout — if React never boots, show fallback
  var timer = setTimeout(function () {
    var lastCheckpoint = LOG.length > 0 ? LOG[LOG.length - 1].c : 'NONE';

    if (typeof console !== 'undefined' && console.error) {
      console.error(
        '[SPLASH-GUARD] React did not boot within ' +
          TIMEOUT_MS +
          'ms. Last checkpoint: ' +
          lastCheckpoint
      );
      console.error('[SPLASH-GUARD] Full boot log:', JSON.stringify(LOG));
    }

    // Remove splash
    hideSplash();

    // If React never rendered anything useful, show minimal fallback
    var root = document.getElementById('root');
    if (root && !root.querySelector('[data-reactroot]') && root.childElementCount <= 1) {
      var fallback = document.createElement('div');
      fallback.style.cssText =
        'padding:2rem;text-align:center;font-family:system-ui,sans-serif;';
      fallback.innerHTML =
        '<h1 style="font-size:1.5rem;margin-bottom:1rem;">Majster.AI</h1>' +
        '<p style="color:#666;margin-bottom:1rem;">Aplikacja nie załadowała się poprawnie.</p>' +
        '<p style="color:#999;font-size:0.85rem;margin-bottom:1rem;">Ostatni checkpoint: ' +
        lastCheckpoint +
        '</p>' +
        '<button onclick="location.reload()" style="padding:0.5rem 1.5rem;background:#9b5208;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;">Odśwież stronę</button>';
      root.appendChild(fallback);
    }
  }, TIMEOUT_MS);

  // If React boots successfully (BOOT_8), cancel the safety timeout
  var origBoot = window.__BOOT;
  window.__BOOT = function (checkpoint, detail) {
    origBoot(checkpoint, detail);
    if (checkpoint === 'BOOT_8') {
      clearTimeout(timer);
    }
  };

  // Global error trap — catches module-level errors that try/catch in main.tsx cannot.
  // These errors (e.g. circular chunk dependency, missing export) crash the entire
  // module graph BEFORE any application code runs.
  window.addEventListener('error', function (ev) {
    LOG.push({ c: 'GLOBAL_ERROR', t: Date.now(), d: ev.message + ' @ ' + (ev.filename || '?') + ':' + (ev.lineno || '?') });
    if (typeof console !== 'undefined' && console.error) {
      console.error('[SPLASH-GUARD] Uncaught error:', ev.message, ev.filename, ev.lineno);
    }
  });

  window.addEventListener('unhandledrejection', function (ev) {
    var msg = ev.reason ? (ev.reason.message || String(ev.reason)) : 'unknown';
    LOG.push({ c: 'UNHANDLED_REJECTION', t: Date.now(), d: msg });
    if (typeof console !== 'undefined' && console.error) {
      console.error('[SPLASH-GUARD] Unhandled rejection:', msg);
    }
  });
})();
