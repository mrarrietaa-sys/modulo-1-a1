/* =====================================================================
   CIERRE DE SESIÓN POR INACTIVIDAD (estudiantes, profesores y administración)
   · Tras 15 minutos sin usar la plataforma, la sesión se cierra sola.
   · Al minuto 14 aparece un aviso “¿Sigues ahí?” con cuenta regresiva.
   · El progreso NO se borra (queda guardado; luego irá a la nube).
   · La actividad se comparte entre pestañas (localStorage).
   ===================================================================== */
(function () {
  const LIMIT = 15 * 60 * 1000, WARN = 60 * 1000, KEY = 'mra_last_active';
  const now = () => Date.now();
  const get = () => { try { return +localStorage.getItem(KEY) || 0; } catch (e) { return 0; } };
  const set = (t) => { try { localStorage.setItem(KEY, String(t)); } catch (e) { } };
  // ¿hay alguien con sesión abierta en esta página?
  const loggedIn = () => {
    try {
      if (localStorage.getItem('mra_profile_v1')) return true;
      if (sessionStorage.getItem('mra_teacher_session')) return true;
      if (document.body && document.body.dataset.idle === 'always') return true; // páginas sin login (administración)
    } catch (e) { }
    return false;
  };
  function logout(silent) {
    try {
      const p = JSON.parse(localStorage.getItem('mra_profile_v1') || 'null');
      if (p && p.first) localStorage.setItem('mra_last_user', JSON.stringify({ first: (p.look && p.look.nick) || p.first, pic: (p.look && (p.look.pic === 'photo' ? p.look.photo : p.look.pic === 'avatar' ? p.look.head : '')) || '' }));
      localStorage.removeItem('mra_profile_v1');           // cierra la sesión del estudiante / profe (el progreso se conserva)
      sessionStorage.removeItem('mra_teacher_session');     // panel de docentes
      sessionStorage.removeItem('mra_back'); sessionStorage.removeItem('mra_wb');
      sessionStorage.setItem('mra_idle_out', '1');
    } catch (e) { }
    set(0);
    const page = location.pathname.split('/').pop() || 'index.html';
    if (/docente|admin/.test(page)) location.reload(); else location.href = 'index.html';
  }
  let warnEl = null, tick = null;
  function hideWarn() { if (warnEl) { warnEl.remove(); warnEl = null; } }
  function showWarn(left) {
    if (!warnEl) {
      warnEl = document.createElement('div'); warnEl.id = 'idle-warn';
      warnEl.innerHTML = `<div class="iw-card" role="alertdialog" aria-live="assertive"><div class="iw-ic">⏳</div><h3>¿Sigues ahí?</h3>
        <p>Por seguridad, tu sesión se cerrará por inactividad en <b id="iw-s">60</b> segundos.<br><small>Tu progreso queda guardado.</small></p>
        <button class="btn k lg" id="iw-ok">Sí, sigo aquí 👋</button></div>`;
      const st = document.createElement('style'); st.textContent = `#idle-warn{position:fixed;inset:0;z-index:10000;background:rgba(11,42,91,.6);display:grid;place-items:center;padding:16px}
#idle-warn .iw-card{background:#fff;border:3px solid #0B2A5B;border-radius:20px;box-shadow:6px 6px 0 #0B2A5B;max-width:380px;width:100%;padding:22px;text-align:center;font-family:Inter,system-ui,sans-serif;color:#0B2A5B}
#idle-warn h3{margin:6px 0;font:800 24px Poppins,sans-serif}#idle-warn .iw-ic{font-size:44px}#idle-warn p{font-size:16px;margin:8px 0 16px}#idle-warn small{color:#4a5568}
#idle-warn #iw-s{color:#E3242B;font-size:20px}#idle-warn button{width:100%}`;
      warnEl.appendChild(st); document.body.appendChild(warnEl);
      warnEl.querySelector('#iw-ok').onclick = () => { set(now()); hideWarn(); };
    }
    const s = warnEl.querySelector('#iw-s'); if (s) s.textContent = Math.max(0, Math.ceil(left / 1000));
  }
  function check() {
    if (!loggedIn()) { hideWarn(); set(now()); return; }
    const last = get(); if (!last) { set(now()); return; }
    const idle = now() - last;
    if (idle >= LIMIT) { hideWarn(); logout(); return; }
    if (idle >= LIMIT - WARN) showWarn(LIMIT - idle); else hideWarn();
  }
  let lastWrite = 0;
  const activity = () => { if (warnEl) return; const t = now(); if (t - lastWrite > 5000) { lastWrite = t; set(t); } };
  ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll', 'mousemove'].forEach(ev => addEventListener(ev, activity, { passive: true, capture: true }));
  addEventListener('storage', e => { if (e.key === KEY && warnEl && +e.newValue && now() - +e.newValue < LIMIT - WARN) hideWarn(); });
  addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  function start() {
    // al abrir la página: si la última actividad fue hace más de 15 min, la sesión ya expiró
    const last = get();
    if (loggedIn() && last && now() - last >= LIMIT) { logout(true); return; }
    set(now()); tick = setInterval(check, 1000);
    // aviso después de un cierre automático
    try { if (sessionStorage.getItem('mra_idle_out')) { sessionStorage.removeItem('mra_idle_out'); setTimeout(() => { const m = window.M1 && M1.modal; if (m) m(`<div class="center"><div style="font-size:44px">🔒</div><h3>Tu sesión se cerró por inactividad</h3><p>Pasaron 15 minutos sin usar la plataforma. <b>Tu progreso quedó guardado.</b> Escribe tu código para volver a entrar.</p><button class="btn k block" id="iw-x">Entendido</button></div>`, { x: true }); const bx = document.getElementById('iw-x'); if (bx) bx.onclick = () => bx.closest('.modal').remove(); }, 600); } } catch (e) { }
  }
  window.MRIDLE = { LIMIT, logout, touch: () => set(now()) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
