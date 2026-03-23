// Safety net: if React fails to mount within 15s, show error + reload button.
// Prevents the user from staring at a pulsing dot forever when JS crashes.
setTimeout(function () {
  var splash = document.getElementById('app-splash');
  if (!splash) return; // React mounted and replaced #root content — all good
  var dot = document.getElementById('app-splash-dot');
  if (dot) dot.style.display = 'none';
  var msg = document.createElement('div');
  msg.style.cssText = 'margin-top:24px;text-align:center;max-width:320px';
  var p = document.createElement('p');
  p.style.cssText = 'color:#64748b;font-size:14px;margin-bottom:12px';
  p.textContent = 'Aplikacja nie za\u0142adowa\u0142a si\u0119 poprawnie.';
  var btn = document.createElement('button');
  btn.style.cssText = 'padding:8px 24px;background:#9b5208;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px';
  btn.textContent = 'Od\u015bwie\u017c stron\u0119';
  btn.addEventListener('click', function () { location.reload(); });
  msg.appendChild(p);
  msg.appendChild(btn);
  splash.appendChild(msg);
}, 15000);
