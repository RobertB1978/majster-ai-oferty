// Global error handler: if an uncaught error prevents React from mounting,
// remove the splash and show an error message so the user is not stuck forever.
// Kept as external file because CSP script-src 'self' blocks inline scripts.
window.addEventListener('error', function onGlobalError(e) {
  var splash = document.getElementById('app-splash');
  if (!splash) return; // React already mounted, nothing to do
  // Show error + reload button instead of an infinite pulsing dot
  splash.innerHTML =
    '<div style="text-align:center;max-width:320px;padding:0 16px">' +
    '<p style="color:#94a3b8;font-size:14px;margin-bottom:12px">Aplikacja nie załadowała się poprawnie.</p>' +
    '<p style="color:#64748b;font-size:11px;margin-bottom:12px;word-break:break-all">' + (e.message || 'Unknown error') + '</p>' +
    '<button onclick="location.reload()" style="padding:8px 24px;background:#9b5208;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">Odśwież stronę</button>' +
    '</div>';
});
