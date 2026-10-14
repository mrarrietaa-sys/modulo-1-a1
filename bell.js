// 🔔 Campana de notificaciones (estudiantes, profes y administración) — arriba a la derecha, se mueve si hay pendientes
(function () {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2z"/></svg>';
  let O = null, items = [], btn = null, panel = null;
  const unread = () => items.filter((n) => !n.read);
  const when = (d) => { const s = String(d || ''); const m = s.match(/^(\d{4})-(\d{2})-(\d{2})\D+(\d{2}):(\d{2})/); if (!m) return esc(s.slice(0, 16)); const dt = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]); return dt.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) + ' · ' + dt.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }); };
  function place() {
    const tb = document.querySelector('.topbar'); if (!tb || !O) return;
    if (O.active && !O.active()) { if (btn) { btn.remove(); btn = null; } close(); return; }
    if (btn && tb.contains(btn)) return;
    btn = document.createElement('button'); btn.type = 'button'; btn.className = 'mr-bell'; btn.setAttribute('aria-label', 'Notificaciones');
    btn.innerHTML = SVG + '<span class="mr-bell-n" hidden></span>';
    btn.onclick = (e) => { e.stopPropagation(); toggle(); };
    const sp = tb.querySelector('.sp'); if (sp && sp.nextSibling) tb.insertBefore(btn, sp.nextSibling); else tb.appendChild(btn);
    paint();
  }
  function paint() {
    if (!btn) return; const n = unread().length; const b = btn.querySelector('.mr-bell-n');
    b.hidden = !n; b.textContent = n > 9 ? '9+' : n; btn.classList.toggle('ring', n > 0);
    btn.setAttribute('aria-label', n ? `Notificaciones: ${n} sin leer` : 'Notificaciones');
    if (panel) render();
  }
  function render() {
    const n = unread().length;
    panel.innerHTML = `<div class="mr-bp-h"><b>🔔 Notificaciones</b>${n ? `<button type="button" class="mr-bp-all">Marcar leídas</button>` : ''}<button type="button" class="mr-bp-x" aria-label="Cerrar">✕</button></div>
      <div class="mr-bp-list">${items.length ? items.slice(0, 40).map((x) => `<div class="mr-bp-i${x.read ? '' : ' new'}${x.type === 'chat' ? ' chat' : ''}" data-id="${esc(x.id)}"><b>${esc(x.title)}</b>${x.body ? `<p>${esc(x.body)}</p>` : ''}<small>${when(x.date)}</small></div>`).join('') : '<p class="mr-bp-empty">No tienes notificaciones todavía.</p>'}</div>`;
    panel.querySelector('.mr-bp-x').onclick = close;
    const all = panel.querySelector('.mr-bp-all'); if (all) all.onclick = () => { const ids = unread().map((x) => x.id); items.forEach((x) => x.read = true); paint(); try { O.markRead && O.markRead(ids, true); } catch (e) { } };
    panel.querySelectorAll('.mr-bp-i').forEach((el) => el.onclick = () => { const x = items.find((i) => String(i.id) === el.dataset.id); if (!x) return;
      if (!x.read) { x.read = true; paint(); try { O.markRead && O.markRead([x.id], false); } catch (e) { } }
      if (x.type === 'tema' && window.MRAP && x.data && x.data.m) { const md = MRAP.mod(+x.data.m); if (md) { close(); location.href = md.url; return; } }
      if (x.type === 'chat') { const room = x.data && x.data.room; close(); if (window.MRCHATOPEN) window.MRCHATOPEN(room); else if (window.MRLIVE && MRLIVE.openStudent) MRLIVE.openStudent({ room }); } });
  }
  function toggle() { panel ? close() : open(); }
  function open() {
    panel = document.createElement('div'); panel.className = 'mr-bp'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Notificaciones');
    panel.onclick = (e) => e.stopPropagation(); document.body.appendChild(panel); render();
    setTimeout(() => document.addEventListener('click', close, { once: true }), 0);
  }
  function close() { if (panel) { panel.remove(); panel = null; } }
  async function refresh() { if (!O || !O.fetch || document.hidden) return; try { const r = await O.fetch(); if (Array.isArray(r)) set(r); } catch (e) { } }
  function set(list) { items = (list || []).slice(); place(); paint(); }
  // opts: { fetch: async () => [notifs], markRead: (ids, all) => {}, every: ms }
  let started = false;
  function mount(opts) { O = opts || {}; place(); if (started) { refresh(); return; } started = true; setInterval(place, 1500); refresh(); setInterval(refresh, (O && O.every) || 120000); }
  function unmount() { O = null; items = []; close(); if (btn) { btn.remove(); btn = null; } }
  window.MRBELL = { mount, set, refresh, unmount };
})();
// estudiantes: se monta solo en las páginas del estudiante (portal y módulos) cuando hay un código en la nube
(function () {
  if (/profesores|administracion|admin\.html|docente/.test(location.pathname)) return;
  let tries = 0;
  const go = () => {
    const A = window.MRAC; if (!A || !A.code || !A.code()) { if (++tries < 20) setTimeout(go, 1500); return; }
    MRBELL.set(A.notifications ? A.notifications() : []);
    MRBELL.mount({ every: 15000, active: () => !!A.code(), fetch: async () => { const r = await A.call('notifs', { code: A.code() }).catch(() => null); return r && r.ok ? (r.notifications || []) : null; }, markRead: (ids, all) => A.markRead && A.markRead(ids, all) });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(go, 1200)); else setTimeout(go, 1200);
})();
