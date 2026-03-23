// Progressive splash guard — gives user feedback at 3s, 6s, and 10s.
// Prevents the user from staring at a pulsing dot forever when JS fails to load.
// Each stage only runs if React has NOT yet replaced #root content.
(function () {
  var STAGE_1_MS = 3000;  // "Ładowanie..."
  var STAGE_2_MS = 6000;  // "Trwa to dłużej niż zwykle..."
  var STAGE_3_MS = 10000; // Error + reload button (was 15s)

  function getSplash() {
    return document.getElementById('app-splash');
  }

  function createEl(tag, styles, text) {
    var el = document.createElement(tag);
    el.style.cssText = styles;
    if (text) el.textContent = text;
    return el;
  }

  // Stage 1: subtle loading text
  setTimeout(function () {
    var splash = getSplash();
    if (!splash) return;
    var hint = createEl('p',
      'color:#94a3b8;font-size:13px;margin-top:16px;transition:opacity 0.3s',
      'Ładowanie aplikacji\u2026');
    hint.id = 'splash-hint-1';
    splash.appendChild(hint);
  }, STAGE_1_MS);

  // Stage 2: "taking longer than usual" warning
  setTimeout(function () {
    var splash = getSplash();
    if (!splash) return;
    // Remove stage 1 hint
    var old = document.getElementById('splash-hint-1');
    if (old) old.remove();
    // Hide pulsing dot
    var dot = document.getElementById('app-splash-dot');
    if (dot) dot.style.display = 'none';

    var wrap = createEl('div', 'margin-top:20px;text-align:center;max-width:300px', '');
    wrap.id = 'splash-hint-2';
    var p1 = createEl('p', 'color:#94a3b8;font-size:13px;margin-bottom:8px',
      'Trwa to dłużej niż zwykle\u2026');
    var p2 = createEl('p', 'color:#64748b;font-size:12px',
      'Sprawdzam połączenie z serwerem.');
    wrap.appendChild(p1);
    wrap.appendChild(p2);
    splash.appendChild(wrap);
  }, STAGE_2_MS);

  // Stage 3: error + reload button
  setTimeout(function () {
    var splash = getSplash();
    if (!splash) return;
    // Clean previous stages
    var h1 = document.getElementById('splash-hint-1');
    var h2 = document.getElementById('splash-hint-2');
    if (h1) h1.remove();
    if (h2) h2.remove();
    var dot = document.getElementById('app-splash-dot');
    if (dot) dot.style.display = 'none';

    var msg = createEl('div', 'margin-top:24px;text-align:center;max-width:320px', '');

    var p = createEl('p', 'color:#64748b;font-size:14px;margin-bottom:4px',
      'Aplikacja nie załadowała się poprawnie.');

    // Show host info for debugging domain issues
    var hostInfo = createEl('p', 'color:#94a3b8;font-size:11px;margin-bottom:12px;word-break:break-all',
      'Host: ' + window.location.host);

    var btn = createEl('button',
      'padding:8px 24px;background:#9b5208;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px',
      'Odśwież stronę');
    btn.addEventListener('click', function () { location.reload(); });

    // Optional: link to non-www version if user is on www
    var host = window.location.host;
    if (host.indexOf('www.') === 0) {
      var canonical = window.location.protocol + '//' + host.slice(4) + window.location.pathname;
      var link = createEl('a',
        'display:block;margin-top:12px;color:#9b5208;font-size:12px;text-decoration:underline;cursor:pointer',
        'Spróbuj: ' + host.slice(4));
      link.href = canonical;
      msg.appendChild(p);
      msg.appendChild(hostInfo);
      msg.appendChild(btn);
      msg.appendChild(link);
    } else {
      msg.appendChild(p);
      msg.appendChild(hostInfo);
      msg.appendChild(btn);
    }

    splash.appendChild(msg);
  }, STAGE_3_MS);
})();
