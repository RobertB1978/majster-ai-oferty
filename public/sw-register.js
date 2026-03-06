// Runtime freshness guard:
// We intentionally disable Service Worker runtime caching in production,
// because stale SW-controlled assets could survive successful deploys.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys
            .filter((key) => key.startsWith('majster-ai-'))
            .map((key) => caches.delete(key)),
        );
      }
    } catch (error) {
      console.warn('Service Worker cleanup failed:', error);
    }
  });
}
