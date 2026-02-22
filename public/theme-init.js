// Theme init: runs synchronously before first paint to prevent flash of light mode.
// Separated from index.html to comply with strict CSP (no inline scripts).
(function () {
  try {
    var t = localStorage.getItem('theme');
    var dark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
