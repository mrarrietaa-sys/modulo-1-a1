/* =====================================================================
   PORTAL DE PROFESORES · mrarrieta.com
   · Entrada con código de profe + PIN (MRAC.call('tLogin')).
   · Resumen, disponibilidad para clases VIP, mis clases (asistencia),
     mis grupos. Todo en hora Colombia (UTC−5, sin horario de verano).
   · Sesión: sessionStorage 'mra_tp_session' = {tcode, pin} (idle.js la cierra).
   ===================================================================== */
(function () {
  const C = window.M1CONFIG || {}, MR = window.MRAC || { on: false, call: async () => ({ ok: false, err: 'offline' }) };
  const WA = C.WHATSAPP || '573017810841', SKEY = 'mra_tp_session', TABKEY = 'mra_tp_tab';
  const app = document.getElementById('tp-app'), outBtn = document.getElementById('tp-out');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const ss = { get: (k) => { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }, del: (k) => { try { sessionStorage.removeItem(k); } catch (e) { } } };

  /* ---------- hora Colombia ---------- */
  const coNow = () => new Date(Date.now() - 5 * 36e5);                 // getUTC* = hora Colombia
  const today = () => coNow().toISOString().slice(0, 10);
  const nowHM = () => coNow().toISOString().slice(11, 16);
  const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const DOW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'], MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const DOWL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dLabel = (iso, long) => { const d = new Date(iso + 'T12:00:00Z'); return long ? `${DOWL[d.getUTCDay()]} ${d.getUTCDate()} de ${MON[d.getUTCMonth()]}` : `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`; };
  const rel = (iso) => { const t = today(); return iso === t ? 'Hoy' : iso === addDays(t, 1) ? 'Mañana' : iso === addDays(t, -1) ? 'Ayer' : ''; };
  const h12 = (hm) => { if (!/^\d{1,2}:\d{2}/.test(hm || '')) return hm || ''; let [h, m] = hm.split(':').map(Number); const ap = h < 12 ? 'a. m.' : 'p. m.'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; };
  const endHM = (hm, dur) => { const [h, m] = String(hm).split(':').map(Number); const t = h * 60 + m + 50; return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

  let S = null, D = null, tab = ss.get(TABKEY) || 'home', clsView = 'up';
  const form = { date: '', hours: [], dur: '50', repeat: false, weeks: 4 };

  /* ---------- utilidades de UI ---------- */
  function toast(msg, bad) { const t = document.createElement('div'); t.className = 'tp-toast' + (bad ? ' bad' : ''); t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); requestAnimationFrame(() => t.classList.add('on')); setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 300); }, 3200); }
  function modal(html) { const m = document.createElement('div'); m.className = 'tp-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.innerHTML = `<div class="tp-modal-card card">${html}</div>`; document.body.appendChild(m); m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-x]')) m.remove(); }); return m; }
  const errText = (e) => ({ offline: 'El portal no está conectado a la nube.', network: 'Sin conexión. Revisa tu internet e inténtalo de nuevo.', auth: 'Tu sesión no es válida. Vuelve a entrar.', booked: 'Ese espacio ya fue reservado por un estudiante.', notfound: 'No encontramos ese registro.' }[e] || 'Algo salió mal (' + e + '). Inténtalo de nuevo.');
  async function api(action, extra) {
    const r = await MR.call(action, Object.assign({ tcode: S.tcode, pin: S.pin }, extra || {}));
    if (!r.ok && r.err === 'auth') { logout(); toast(errText('auth'), true); }
    return r;
  }
  const studentName = (code) => { const s = D && D.students[String(code).toUpperCase()]; return s ? s.name || s.code : code; };
  const groupOf = (id) => (D.groups || []).find((g) => g.id === id);
  const meetOf = (c) => c.meet || (c.groupId && groupOf(c.groupId) ? groupOf(c.groupId).meet : '') || (D.teacher && String(D.teacher.meet || '').split(/[\s,;]+/).filter(Boolean)[0]) || '';
  const typeBadge = (c) => c.type === 'vip' ? '<span class="tp-badge vip">Individual</span>' : (c.type === 'club' ? '<span class="tp-badge grp">Club</span>' : '<span class="tp-badge grp">Grupal</span>');
  const statusBadge = (c) => ({ done: '<span class="tp-st done">Dictada ✓</span>', noshow: '<span class="tp-st noshow">No asistió</span>', cancelled: '<span class="tp-st canc">Cancelada</span>', latecancel: '<span class="tp-st canc">Cancelada tarde</span>', tnoshow: '<span class="tp-st noshow">⚠️ No te conectaste</span>' }[c.status] || (c.date <= today() ? '<span class="tp-st pend">Por marcar</span>' : '<span class="tp-st sch">Programada</span>'));
  const whoOf = (c) => c.type === 'vip' ? esc(studentName(c.students[0] || '')) : esc(c.type === 'club' ? (c.topic || 'Club') : ((groupOf(c.groupId) || {}).name || 'Grupo')) + ` · ${c.students.length} estudiante${c.students.length === 1 ? '' : 's'}`;

  /* ---------- entrada ---------- */
  function loginView(msg) {
    outBtn.classList.add('hidden');
    const off = !MR.on;
    app.innerHTML = `<section class="card tp-login center">
      <img src="mra-present.webp" alt="" class="tp-login-img" width="200" height="200">
      <span class="lbl">Portal de profesores</span>
      <h1>¡Hola, profe! 👋</h1>
      <p class="muted">Entra con tu código de profesor y tu PIN para ver tus clases, tu disponibilidad y tus grupos.</p>
      ${off ? `<div class="tp-alert">⚠️ El portal todavía no está conectado a la nube de la escuela. Escribe a administración para recibir ayuda.<br><a class="btn w sm" style="margin-top:10px" target="_blank" rel="noopener" href="https://wa.me/${WA}?text=${encodeURIComponent((window.MRNE || String)('Hola, soy profe de mrarrieta.com y no puedo entrar al portal de profesores.'))}">💬 Escribir por WhatsApp</a></div>` : ''}
      <form id="tp-lf" class="tp-lform" novalidate>
        <label for="tp-code">Código de profesor</label>
        <input class="inp" id="tp-code" autocomplete="username" autocapitalize="characters" placeholder="Ej: PROFE-ANA" required>
        <label for="tp-pin">PIN</label>
        <input class="inp" id="tp-pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="••••" required>
        <p class="tp-err" id="tp-lerr" ${msg ? '' : 'hidden'}>${esc(msg || '')}</p>
        <button class="btn k lg block" id="tp-go" ${off ? 'disabled' : ''}>Entrar</button>
      </form>
      <p class="muted tp-small">¿Olvidaste tu PIN? Pídelo a administración.</p>
    </section>`;
    $('#tp-lf').onsubmit = async (e) => {
      e.preventDefault();
      const tcode = $('#tp-code').value.trim().toUpperCase(), pin = $('#tp-pin').value.trim(), er = $('#tp-lerr'), b = $('#tp-go');
      if (!tcode || !pin) { er.textContent = 'Escribe tu código y tu PIN.'; er.hidden = false; return; }
      b.disabled = true; b.textContent = 'Entrando…';
      const r = await MR.call('tLogin', { tcode, pin });
      b.disabled = false; b.textContent = 'Entrar';
      if (!r.ok) { er.textContent = r.err === 'auth' ? 'Código o PIN incorrecto.' : errText(r.err); er.hidden = false; return; }
      S = { tcode, pin }; ss.set(SKEY, S); D = r; tab = 'home'; ss.set(TABKEY, tab); shell(); firstTour() ? tour() : (welcome(), setTimeout(popNew, 1500));
    };
  }
  // 🧭 tour de Mr. Arrieta: la primera vez que el profe entra (por código, en este dispositivo y en la nube)
  const TKEY = () => 'mra_ttour_' + String((D && D.teacher && D.teacher.code) || '').toUpperCase();
  function firstTour() { if (D && D.teacher && D.teacher.tour) return false; try { return !localStorage.getItem(TKEY()); } catch (e) { return true; } }
  function tour() {
    const first = esc(String((D.teacher || {}).name || '').split(/\s+/)[0]);
    const steps = [
      ['welcome', `¡Welcome, ${first}! 👋`, 'Soy Mr. Arrieta. Te muestro en 1 minuto cómo funciona tu portal de profesor.', null],
      ['point', '🏠 Resumen', 'Aquí ves tus <b>notificaciones</b> (clases individuales reservadas y mensajes de tus estudiantes), tus próximas clases y tus estadísticas.', 'home'],
      ['idea', '🗓️ Mi disponibilidad', 'Marca las horas en que puedes dar clases <b>de lunes a sábado</b>. Los estudiantes Premium solo pueden reservar clases individuales en esos horarios. Domingos y festivos no hay clases.', 'avail'],
      ['present', '🎓 Mis clases', 'Aquí entras a cada clase con tu enlace de Meet y, al terminar, la marcas como <b>dictada</b> o <b>no asistió</b>.', 'classes'],
      ['pointside', '💬 Chat con estudiantes', 'Con el botón <b>Chat con estudiantes</b> respondes las dudas y tareas de tus estudiantes.', null],
      ['watch', '🔔 Correos diarios', 'Cada mañana te llega un correo con tu resumen del día.', null],
      ['thumbs', '¡Listo! 🚀', 'Para empezar, escribe tu <b>disponibilidad semanal</b>.', 'avail'],
    ];
    try { localStorage.setItem(TKEY(), '1'); } catch (e) { } if (D && D.teacher && !D.teacher.tour) { D.teacher.tour = 1; api('tTour').catch(() => { }); } // marcado desde que empieza
    let i = 0;
    const m = document.createElement('div'); m.className = 'tp-modal'; document.body.appendChild(m);
    const end = (go) => { m.remove(); try { localStorage.setItem(TKEY(), '1'); } catch (e) { } if (D && D.teacher && !D.teacher.tour) { D.teacher.tour = '1'; api('tTour').catch(() => { }); } if (go) { tab = 'avail'; ss.set(TABKEY, tab); shell(); } };
    const draw = () => {
      const [mood, t, d, tb] = steps[i]; const last = i === steps.length - 1;
      if (tb && tab !== tb && !last) { tab = tb; ss.set(TABKEY, tab); shell(); document.body.appendChild(m); }
      m.innerHTML = `<div class="tp-modal-card card" style="text-align:center"><img src="mra-${mood}.webp" alt="Mr. Arrieta" style="height:150px;margin:0 auto 6px;display:block"><h2>${t}</h2><p>${d}</p>
        <p class="muted" style="font-size:13px">${i + 1} / ${steps.length}</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">${i ? '<button class="btn w" data-b>← Atrás</button>' : '<button class="btn w" data-s>Saltar</button>'}<button class="btn k" data-n>${last ? '📅 Escribir mi disponibilidad' : 'Siguiente →'}</button></div></div>`;
      m.querySelector('[data-n]').onclick = () => { if (last) return end(true); i++; draw(); };
      const b = m.querySelector('[data-b]'); if (b) b.onclick = () => { i--; draw(); };
      const sk = m.querySelector('[data-s]'); if (sk) sk.onclick = () => { end(false); tab = 'home'; ss.set(TABKEY, tab); shell(); welcome(); };
    };
    draw();
    // voz de bienvenida también en el tour
    const sl = String((D.teacher || {}).name || '').split(/\s+/)[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
    const say = () => { const A = window.AUD || {}; const k = A['wb_' + sl] ? 'wb_' + sl : (A['wb_'] ? 'wb_' : ''); if (k) try { new Audio('data:audio/mpeg;base64,' + A[k]).play().catch(() => { }); } catch (e) { } };
    const sc = document.createElement('script'); sc.src = 'js/audio/wb_' + (sl[0] || 'x') + '.js'; sc.onload = say; sc.onerror = () => { const s2 = document.createElement('script'); s2.src = 'wb_' + (sl[0] || 'x') + '.js'; s2.onload = say; document.head.appendChild(s2); }; document.head.appendChild(sc);
  }
  // saludo al entrar: voz "Welcome back, Nombre!" + recordatorio de la disponibilidad
  function welcome() {
    const t = D.teacher || {}; const first = String(t.name || '').split(/\s+/)[0];
    const sl = first.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
    const hasWeek = Object.keys(t.weekly || {}).length > 0;
    const m = modal(`<div style="text-align:center"><div style="font-size:52px">👋</div><h2>¡Welcome, ${esc(first)}!</h2>
      <p>${hasWeek ? 'Antes de empezar, revisa que tu <b>disponibilidad semanal</b> esté al día. Los estudiantes Premium solo pueden reservar clases individuales en los horarios que publiques.' : '<b>Aún no has escrito tu disponibilidad semanal.</b> Márcala ahora para que los estudiantes Premium puedan reservar tus clases VIP.'}</p>
      <p class="muted">Lunes a sábado · domingos y festivos no hay clases.</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px"><button class="btn k" id="wl-av">📅 ${hasWeek ? 'Revisar' : 'Escribir'} mi disponibilidad</button><button class="btn w" data-x>Más tarde</button></div></div>`);
    $('#wl-av', m).onclick = () => { m.remove(); tab = 'avail'; ss.set(TABKEY, tab); shell(); };
    // voz pregrabada (misma de la plataforma)
    const say = () => { const A = window.AUD || {}; const k = A['wb_' + sl] ? 'wb_' + sl : (A['wb_'] ? 'wb_' : ''); if (!k) return; try { new Audio('data:audio/mpeg;base64,' + A[k]).play().catch(() => { }); } catch (e) { } };
    const tryLoad = (paths) => { if (!paths.length) return say(); const sc = document.createElement('script'); sc.src = paths[0]; sc.onload = say; sc.onerror = () => { sc.remove(); tryLoad(paths.slice(1)); }; document.head.appendChild(sc); };
    tryLoad(['js/audio/wb_' + (sl[0] || 'x') + '.js', 'wb_' + (sl[0] || 'x') + '.js']);
  }
  function logout() { ss.del(SKEY); ss.del(TABKEY); S = null; D = null; loginView(); }
  async function reload() { const r = await api('tLogin'); if (r.ok) { D = r; shell(); } else if (r.err !== 'auth') toast(errText(r.err), true); return r.ok; }

  /* ---------- estructura principal ---------- */
  const TABS = [['home', '🏠', 'Resumen'], ['avail', '🗓️', 'Mi disponibilidad'], ['classes', '🎓', 'Mis clases'], ['pay', '💰', 'Mis pagos']];
  function shell() {
    bell();
    outBtn.classList.remove('hidden'); outBtn.onclick = () => { if (confirm('¿Cerrar sesión?')) logout(); };
    const t = D.teacher;
    app.innerHTML = `<div class="tp-head">
        <div class="tp-head-txt"><h1>¡Hola, ${esc(t.hello || String(t.name || '').split(' ')[0])}! 👋</h1><p class="muted">${dLabel(today(), true)} · <b>${h12(nowHM())}</b> hora Colombia · Código <b>${esc(t.code)}</b></p></div>
        <button class="btn k sm" id="tp-mat">📚 Material de clases</button><button class="btn sm wa-btn tp-chat" id="tp-chat"><span class="wa-dot"><svg viewBox="0 0 32 32" width="18" height="18" aria-hidden="true"><path fill="#fff" d="M16 3C8.8 3 3 8.6 3 15.6c0 2.5.8 4.9 2.1 6.9L3.6 28l5.7-1.5c2 1.1 4.3 1.7 6.7 1.7 7.2 0 13-5.6 13-12.6S23.2 3 16 3zm6.3 17.6c-.3.8-1.6 1.5-2.2 1.6-.6.1-1.3.1-2.1-.1-.5-.2-1.1-.4-1.9-.7-3.3-1.4-5.5-4.7-5.6-4.9-.2-.2-1.3-1.8-1.3-3.4s.8-2.4 1.1-2.7c.3-.3.6-.4.8-.4h.6c.2 0 .5-.1.7.6.3.7.9 2.3 1 2.5.1.2.1.4 0 .6-.1.2-.2.4-.3.6l-.5.6c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.9 1.8.4.2.6.1.8-.1.2-.2.9-1 1.1-1.4.2-.4.5-.3.8-.2.3.1 2 .9 2.3 1.1.3.2.6.3.7.4.1.3.1 1-.2 1.8z"/></svg></span> Chat con estudiantes</button><button class="btn w sm" id="tp-tour" style="margin-top:6px">🧭 Ver el tour</button>
      </div>
      <nav class="tp-tabs" role="tablist">${TABS.map(([id, ic, tx]) => `<button class="tp-tab${tab === id ? ' on' : ''}" role="tab" aria-selected="${tab === id}" data-tab="${id}"><span aria-hidden="true">${ic}</span> ${tx}</button>`).join('')}</nav>
      <section id="tp-body"></section>`;
    if ($('#tp-tour')) $('#tp-tour').onclick = () => tour();
    if ($('#tp-mat')) $('#tp-mat').onclick = material;
    if ($('#tp-chat')) $('#tp-chat').onclick = () => openChat();
    if (/#chat\b/.test(location.hash)) { history.replaceState(null, '', location.pathname); setTimeout(() => openChat(), 300); }
    $$('.tp-tab').forEach((b) => b.onclick = () => { tab = b.dataset.tab; ss.set(TABKEY, tab); shell(); });
    ({ home, avail, classes, groups, pay }[tab] || home)($('#tp-body'));
  }

  /* ---------- 1. Resumen ---------- */
  function classRow(c, opt) {
    const r = rel(c.date), link = meetOf(c), canMark = c.status === 'scheduled' && c.date <= today();
    return `<li class="tp-cls${r === 'Hoy' ? ' today' : r === 'Mañana' ? ' tomorrow' : ''}">
      <div class="tp-cls-when"><b>${r || dLabel(c.date)}</b><span>${r ? dLabel(c.date) + ' · ' : ''}${h12(c.time)} – ${h12(endHM(c.time, c.duration))}</span></div>
      <div class="tp-cls-what">${typeBadge(c)} ${statusBadge(c)}<div class="tp-cls-who">${whoOf(c)}</div>${c.topic && c.type !== 'club' ? `<small class="muted">Tema: ${esc(c.topic)}</small>` : ''}
        ${c.status === 'done' ? `<small class="muted">Asistencia: ${c.students.filter((x) => (c.attendance || {})[String(x).toUpperCase()] === true || (c.attendance || {})[x] === true).length}/${c.students.length}</small>` : ''}
        ${(c.type === 'group' || c.type === 'club') && c.status === 'scheduled' ? `<small class="muted">✅ ${+c.confirmed || 0} confirmado(s)${c.flags === 'cutoff' ? '' : ' · se cierra 3 h antes'}</small>` : ''}${c.status === 'sin-asistentes' ? '<small class="tp-note">🙌 Nadie confirmó: no necesitas conectarte.</small>' : ''}
        ${c.notes && opt && opt.notes ? `<small class="tp-note">📝 ${esc(c.notes)}</small>` : ''}</div>
      <div class="tp-cls-act">
        ${c.status === 'scheduled' && c.date >= today() ? (link ? `<a class="btn k sm" href="${esc(link)}" target="_blank" rel="noopener"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 6h11a2 2 0 0 1 2 2v1.6l3.4-2.3A1 1 0 0 1 22 8.1v7.8a1 1 0 0 1-1.6.8L17 14.4V16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/></svg> Entrar a la clase</a>` : '<small class="muted">Sin enlace de clase</small>') : ''}
        ${canMark ? `<button class="btn ok sm" data-mark="${esc(c.id)}">✓ Marcar como dictada</button><button class="btn w sm" data-noshow="${esc(c.id)}">No asistió</button>` : ''}
      </div></li>`;
  }
  function bindMarks(root) {
    $$('[data-mark]', root).forEach((b) => b.onclick = () => markDialog(b.dataset.mark, 'done'));
    $$('[data-noshow]', root).forEach((b) => b.onclick = () => markDialog(b.dataset.noshow, 'noshow'));
  }
  function home(el) {
    const t0 = today();
    const up = D.classes.filter((c) => c.status === 'scheduled' && c.date >= t0);
    const pend = D.classes.filter((c) => c.status === 'scheduled' && c.date <= t0 && !(c.date === t0 && endHM(c.time, c.duration) > nowHM()));
    const free = D.slots.filter((s) => s.status === 'free' && s.date >= t0).length;
    el.innerHTML = `<div class="tp-stats">
        <div class="tp-stat red"><b>${+D.stats.taughtMonth || 0}</b><span>clases dictadas este mes</span></div>
        <div class="tp-stat"><b>${+D.stats.taughtTotal || 0}</b><span>clases dictadas en total</span></div>
        <div class="tp-stat"><b>${up.length}</b><span>próximas clases</span></div>
        <div class="tp-stat"><b>${free}</b><span>espacios libres</span></div>
      </div>
      ${pend.length ? `<div class="tp-alert warn"><b>📌 Tienes ${pend.length} clase${pend.length > 1 ? 's' : ''} por marcar.</b> Registra la asistencia para que el estudiante vea su progreso. <button class="btn k sm" data-go="classes">Ir a Mis clases</button></div>` : ''}
      <div class="card tp-card"><div class="tp-card-h"><h2>Próximas clases</h2><small class="muted">hora Colombia</small></div>
        ${up.length ? `<ul class="tp-list">${up.slice(0, 8).map((c) => classRow(c)).join('')}</ul>` : `<div class="tp-empty"><img src="mra-think.webp" alt="" width="110" height="110"><p>No tienes clases programadas.${free ? '' : ' Agrega espacios en <b>Mi disponibilidad</b> para que tus estudiantes Premium reserven clases VIP.'}</p></div>`}
      </div>
      ${!free ? `<div class="tp-alert"><b>🗓️ No tienes espacios libres.</b> Los estudiantes Premium solo pueden reservar en los horarios que publiques. <button class="btn w sm" data-go="avail">Agregar disponibilidad</button></div>` : ''}`;
    $$('[data-go]', el).forEach((b) => b.onclick = () => { tab = b.dataset.go; ss.set(TABKEY, tab); shell(); });
    bindMarks(el);
  }

  /* ---------- 2. Mi disponibilidad ---------- */
  // 🕒 horario laboral: L–V 7:00 a. m.–9:00 p. m. · sábado 7:00 a. m.–5:00 p. m. · domingos y festivos de Colombia NO (clases de 50 min)
  const HOURS = Array.from({ length: 14 }, (_, i) => String(7 + i).padStart(2, '0') + ':00');
  const workOK = (d, h) => { if (window.MRFEST && MRFEST.isOff(d)) return false; const dow = new Date(d + 'T12:00:00').getDay(); if (dow === 0) return false; const [a, b] = String(h).split(':').map(Number); const st = a * 60 + (b || 0); return st >= 420 && st + 50 <= (dow === 6 ? 1020 : 1260); };
  function planned() {
    if (!form.date || !form.hours.length) return [];
    const n = form.repeat ? Math.min(8, Math.max(1, +form.weeks || 1)) : 1, out = [], t0 = today(), hm = nowHM();
    for (let w = 0; w < n; w++) { const d = addDays(form.date, 7 * w); form.hours.slice().sort().forEach((h) => { if ((d > t0 || (d === t0 && h > hm)) && workOK(d, h)) out.push({ date: d, time: h, duration: form.dur }); }); }
    return out;
  }
  function avail(el) {
    const t0 = today(); if (!form.date || form.date < t0) form.date = t0;
    const extra = form.hours.filter((h) => HOURS.indexOf(h) < 0);
    const slots = D.slots.filter((s) => s.status !== 'deleted' && s.date >= t0 && !(s.date === t0 && s.status === 'free' && s.time <= nowHM()));
    const byDate = {}; slots.forEach((s) => (byDate[s.date] = byDate[s.date] || []).push(s));
    el.innerHTML = `<div class="card tp-card tp-week"><div class="tp-card-h"><h2>📅 Mi disponibilidad semanal</h2></div>
        <p class="muted tp-small">Marca las horas en que puedes dictar cada semana. La plataforma crea automáticamente tus espacios de <b>50 minutos</b> para las próximas <b>4 semanas</b> (y los renueva cada día). Los estudiantes Premium los verán para reservar sus clases VIP.</p>
        <div id="tp-wg"></div><button class="btn k lg block" id="tp-wsave" style="margin-top:12px">Guardar mi disponibilidad semanal</button></div>
      <div class="tp-cols">
      <div class="card tp-card tp-addcard">
        <div class="tp-card-h"><h2>Agregar un espacio extra (fecha específica)</h2></div>
        <p class="muted tp-small">Publica los horarios reales en los que puedes dictar. Los estudiantes Premium los verán y reservarán (mínimo 4 horas antes). Pueden cancelar sin penalidad hasta 2 horas antes; te llega un correo y un aviso aquí cuando reservan o cancelan. <a href="politica.html" target="_blank" rel="noopener">📌 Política de reservas y cancelaciones</a> Todo en <b>hora Colombia</b>.</p>
        <label class="tp-l" for="tp-date">1. Fecha</label>
        <input class="inp tp-inp" type="date" id="tp-date" min="${t0}" value="${form.date}">
        <div class="tp-l">2. Hora(s) de inicio <small class="muted">(elige una o varias)</small></div>
        <div class="tp-hours" role="group" aria-label="Horas">${HOURS.concat(extra).map((h) => `<button type="button" class="tp-hour${form.hours.indexOf(h) >= 0 ? ' on' : ''}${(form.date === t0 && h <= nowHM()) || !workOK(form.date, h) ? ' past' : ''}" data-h="${h}" aria-pressed="${form.hours.indexOf(h) >= 0}">${h12(h)}</button>`).join('')}</div>
        <div class="tp-other"><label for="tp-time">Otra hora:</label><input class="inp tp-inp" type="time" id="tp-time" step="300"><button type="button" class="btn w sm" id="tp-addh">Añadir</button></div>
        <div class="tp-l">3. Duración</div>
        <p class="tp-dur">⏱️ Todas las clases de la escuela duran <b>50 minutos</b>.</p>
        <label class="tp-rep"><input type="checkbox" id="tp-rep" ${form.repeat ? 'checked' : ''}> <span>Repetir cada semana</span></label>
        <div class="tp-weeks${form.repeat ? '' : ' hidden'}"><label for="tp-weeks">durante</label><select class="inp tp-inp" id="tp-weeks">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option value="${n}" ${+form.weeks === n ? 'selected' : ''}>${n} semana${n > 1 ? 's' : ''}</option>`).join('')}</select></div>
        <div class="tp-preview" id="tp-prev"></div>
        <button class="btn k lg block" id="tp-save">Guardar disponibilidad</button>
      </div>
      <div class="card tp-card">
        <div class="tp-card-h"><h2>Mis espacios</h2><small class="muted">${slots.filter((s) => s.status === 'free').length} libres · ${slots.filter((s) => s.status === 'booked').length} reservados</small></div>
        ${Object.keys(byDate).length ? Object.keys(byDate).sort().map((d) => `<div class="tp-day"><h3>${rel(d) ? `<span class="tp-rel">${rel(d)}</span> ` : ''}${dLabel(d, true)}</h3><ul>${byDate[d].map((s) => {
          const c = s.status === 'booked' ? D.classes.find((x) => x.id === s.classId) : null;
          return `<li class="tp-slot ${s.status}"><span class="tp-slot-t">${h12(s.time)} – ${h12(endHM(s.time, s.duration))}<small>50 min</small></span>
            ${s.status === 'free' ? `<span class="tp-st free">Libre</span><button class="tp-del" data-del="${esc(s.id)}" title="Borrar espacio" aria-label="Borrar espacio de las ${esc(s.time)}">🗑</button>`
              : `<span class="tp-st booked">Reservado</span><span class="tp-slot-who">👤 ${c ? esc(studentName(c.students[0] || '')) : 'Estudiante'}</span>`}</li>`; }).join('')}</ul></div>`).join('')
          : `<div class="tp-empty"><img src="mra-point.webp" alt="" width="110" height="110"><p>Aún no tienes espacios publicados. Agrega tus horarios con el formulario.</p></div>`}
      </div></div>`;
    const WG = window.MRWG ? MRWG.render($('#tp-wg', el), (D.teacher && D.teacher.weekly) || {}) : null;
    $('#tp-wsave', el).onclick = async () => { const b = $('#tp-wsave', el); b.disabled = true; b.textContent = 'Guardando…';
      const r = await api('tWeekly', { weekly: WG ? WG.get() : {} }); b.disabled = false; b.textContent = 'Guardar mi disponibilidad semanal';
      if (!r.ok) { if (r.err !== 'auth') toast(errText(r.err), true); return; } D = r; toast('✅ Disponibilidad semanal guardada. Tus espacios de las próximas 4 semanas ya están publicados.'); avail(el); };
    const prev = () => { const p = planned(), box = $('#tp-prev', el); const dates = [...new Set(p.map((x) => x.date))];
      box.innerHTML = p.length ? `Se crearán <b>${p.length}</b> espacio${p.length > 1 ? 's' : ''} de ${form.dur} min: ${dates.slice(0, 8).map((d) => dLabel(d)).join(', ')} · ${[...new Set(p.map((x) => x.time))].map(h12).join(', ')}` : '<span class="muted">Elige fecha y al menos una hora futura.</span>';
      $('#tp-save', el).disabled = !p.length; };
    $('#tp-date', el).oninput = (e) => { const v = e.target.value; if (window.MRFEST && MRFEST.isOff(v)) toast('🚫 El ' + v + ' es ' + MRFEST.why(v) + ': no se dictan clases. Elige otro día.', true); };
    $('#tp-date', el).onchange = (e) => { form.date = e.target.value < t0 ? t0 : e.target.value; avail(el); };
    $$('.tp-hour', el).forEach((b) => b.onclick = () => { const h = b.dataset.h, i = form.hours.indexOf(h); i >= 0 ? form.hours.splice(i, 1) : form.hours.push(h); b.classList.toggle('on', i < 0); b.setAttribute('aria-pressed', i < 0); prev(); });
    $('#tp-addh', el).onclick = () => { const v = $('#tp-time', el).value; if (!/^\d{2}:\d{2}$/.test(v)) { toast('Elige una hora válida.', true); return; } if (!workOK(form.date, v)) { toast('Fuera del horario laboral: L–V 7:00 a. m.–9:00 p. m. y sábados 7:00 a. m.–5:00 p. m. (la clase de 50 min debe terminar dentro del horario).', true); return; } if (form.hours.indexOf(v) < 0) form.hours.push(v); avail(el); };
    $$('.tp-segb', el).forEach((b) => b.onclick = () => { form.dur = b.dataset.d; $$('.tp-segb', el).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); prev(); });
    $('#tp-rep', el).onchange = (e) => { form.repeat = e.target.checked; $('.tp-weeks', el).classList.toggle('hidden', !form.repeat); prev(); };
    $('#tp-weeks', el).onchange = (e) => { form.weeks = +e.target.value; prev(); };
    $('#tp-save', el).onclick = async () => {
      const p = planned(); if (!p.length) return; const b = $('#tp-save', el); b.disabled = true; b.textContent = 'Guardando…';
      const r = await api('tSlotAdd', { slots: p });
      b.disabled = false; b.textContent = 'Guardar disponibilidad';
      if (!r.ok) { if (r.err !== 'auth') toast(errText(r.err), true); return; }
      const skipped = p.length - (+r.added || 0);
      form.hours = []; toast(`✅ ${r.added} espacio${r.added === 1 ? '' : 's'} agregado${r.added === 1 ? '' : 's'}${skipped > 0 ? ` (${skipped} ya existía${skipped > 1 ? 'n' : ''})` : ''}`);
      await reload();
    };
    $$('[data-del]', el).forEach((b) => b.onclick = async () => {
      const s = D.slots.find((x) => x.id === b.dataset.del); if (!s || !confirm(`¿Borrar el espacio del ${dLabel(s.date)} a las ${h12(s.time)}?`)) return;
      b.disabled = true; const r = await api('tSlotDel', { slotId: s.id });
      if (!r.ok) { b.disabled = false; if (r.err !== 'auth') toast(errText(r.err), true); if (r.err === 'booked') reload(); return; }
      toast('🗑 Espacio borrado'); await reload();
    });
    prev();
  }

  /* ---------- 3. Mis clases ---------- */
  function classes(el) {
    const t0 = today();
    const up = D.classes.filter((c) => c.status === 'scheduled' && c.date >= t0);
    const past = D.classes.filter((c) => !(c.status === 'scheduled' && c.date >= t0)).slice().reverse();
    const pend = D.classes.filter((c) => c.status === 'scheduled' && c.date <= t0).length;
    const list = clsView === 'up' ? up : past;
    el.innerHTML = `<div class="tp-seg tp-subtabs" role="tablist">
        <button class="tp-segb${clsView === 'up' ? ' on' : ''}" data-v="up" role="tab" aria-selected="${clsView === 'up'}">Próximas (${up.length})</button>
        <button class="tp-segb${clsView === 'past' ? ' on' : ''}" data-v="past" role="tab" aria-selected="${clsView === 'past'}">Pasadas · 60 días (${past.length})</button>
      </div>
      ${pend ? `<div class="tp-alert warn">📌 <b>${pend}</b> clase${pend > 1 ? 's' : ''} de hoy o anteriores sin marcar. Usa <b>“Marcar como dictada”</b> o <b>“No asistió”</b>.</div>` : ''}
      <div class="card tp-card">${list.length ? `<ul class="tp-list">${list.map((c) => classRow(c, { notes: true })).join('')}</ul>` : `<div class="tp-empty"><img src="mra-shrug.webp" alt="" width="110" height="110"><p>${clsView === 'up' ? 'No tienes clases próximas.' : 'No hay clases en los últimos 60 días.'}</p></div>`}</div>`;
    $$('.tp-subtabs .tp-segb', el).forEach((b) => b.onclick = () => { clsView = b.dataset.v; classes(el); });
    bindMarks(el);
  }
  function markDialog(id, status) {
    const c = D.classes.find((x) => x.id === id); if (!c) return;
    const done = status === 'done';
    const m = modal(`<button class="tp-x" data-x aria-label="Cerrar">✕</button>
      <h3>${done ? '✓ Marcar como dictada' : 'Registrar inasistencia'}</h3>
      <p class="muted">${typeBadge(c)} ${dLabel(c.date, true)} · ${h12(c.time)} (hora Colombia)</p>
      ${done ? `<div class="tp-l">Asistencia</div><div class="tp-att">${c.students.length ? c.students.map((code) => `<label class="tp-attrow"><input type="checkbox" data-code="${esc(String(code).toUpperCase())}" checked><span>${esc(studentName(code))}</span><small>${esc(code)}</small></label>`).join('') : '<p class="muted">Esta clase no tiene estudiantes asignados.</p>'}</div>`
        : `<p>${c.type === 'vip' ? `Se registrará que <b>${esc(studentName(c.students[0] || ''))}</b> no se presentó a la clase.` : 'Se registrará que <b>ningún estudiante</b> se presentó a la clase.'}</p>`}
      <label class="tp-l" for="tp-notes">Notas de la clase <small class="muted">(opcional)</small></label>
      <textarea class="inp tp-inp" id="tp-notes" rows="3" maxlength="800" placeholder="${done ? 'Tema visto, avances, tareas…' : 'Ej: esperé 15 minutos, le escribí por WhatsApp…'}">${esc(c.notes || '')}</textarea>
      <p class="tp-payinfo">💰 ${done ? 'Clase dictada: se paga ' + COP((D.pay && D.pay.cur && D.pay.cur.rate) || 21800) : 'Si te conectaste y el estudiante no llegó, se pagan ' + COP((D.pay && D.pay.cur && D.pay.cur.noshowRate) || 10000)}. Al guardar, les llega un aviso al estudiante, a ti y a administración.</p>
      <div class="row tp-mbtns"><button class="btn w" data-x>Cancelar</button><button class="btn ${done ? 'ok' : 'k'}" id="tp-msave">${done ? 'Guardar clase dictada ✓' : 'Guardar: no asistió'}</button></div>`);
    $('#tp-msave', m).onclick = async () => {
      const attendance = {}; c.students.forEach((code) => { attendance[String(code).toUpperCase()] = false; });
      if (done) $$('[data-code]', m).forEach((x) => { attendance[x.dataset.code] = x.checked; });
      const b = $('#tp-msave', m); b.disabled = true; b.textContent = 'Guardando…';
      const r = await api('tMark', { classId: c.id, status, attendance, notes: $('#tp-notes', m).value.trim() });
      if (!r.ok) { b.disabled = false; b.textContent = 'Reintentar'; if (r.err !== 'auth') toast(errText(r.err), true); else m.remove(); return; }
      m.remove(); toast(done ? '✅ Clase marcada como dictada' : 'Inasistencia registrada'); await reload();
    };
  }


  // 📚 acceso de profe a TODO el material de los módulos (modo profe en la plataforma de estudiantes)
  window.MRCHATOPEN = (room) => openChat(room);
  function openChat(room) { if (!window.MRLIVE) return; MRLIVE.open({ room, title: 'Chat con estudiantes', roomsAction: 'tChats', empty: 'Aquí aparecerán tus estudiantes cuando tengan clases contigo.', call: (a, d) => api(a, d) }); }
  function material() {
    const t = D.teacher || {}; const info = { id: t.id || '', name: t.name || 'Profe', first: t.hello || String(t.name || 'Profe').split(' ')[0], at: Date.now() };
    try { sessionStorage.setItem('mra_teacher', JSON.stringify(info)); localStorage.setItem('mra_teacher_tmp', JSON.stringify(info)); } catch (e) { }
    window.open('index.html?profe=1', '_blank');
  }
  /* ---------- 💰 Mis pagos ---------- */
  const COP = (n) => (+n < 0 ? '−' : '') + '$' + Math.abs(Math.round(+n || 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const MES = (ym) => { const [y, m] = String(ym).split('-').map(Number); return new Date(y, m - 1, 15).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }); };
  const PST = { done: ['ok', 'Dictada'], noshow: ['warn', 'Te conectaste · el estudiante no asistió'], cancelled: ['off', 'Cancelada a tiempo'], latecancel: ['off', 'Cancelada fuera de tiempo'], 'sin-asistentes': ['off', 'Sin reservas'], tnoshow: ['bad', '⚠️ No te conectaste · penalización (el estudiante lo reportó)'] };
  let payMonth = '', payCache = {};
  async function pay(el) {
    const months = (D.pay && D.pay.months) || []; if (!payMonth) payMonth = (D.pay && D.pay.cur && D.pay.cur.month) || (months[0] && months[0].month) || '';
    if (D.pay && D.pay.cur) payCache[D.pay.cur.month] = D.pay.cur;
    let P = payCache[payMonth];
    if (!P) { el.innerHTML = '<div class="card tp-card"><p class="muted">⏳ Cargando…</p></div>'; const r = await api('tPay', { month: payMonth }); if (!r.ok) { el.innerHTML = '<div class="card tp-card"><p class="muted">No se pudo cargar. Intenta de nuevo.</p></div>'; return; } P = payCache[payMonth] = r; }
    const mm = months.find((x) => x.month === payMonth) || {}; const paid = P.paid || mm.paid; const paidAt = P.paidAt || mm.paidAt;
    el.innerHTML = `<div class="tp-pay-top"><label class="tp-l" for="tp-pm">Mes</label><select class="inp tp-inp" id="tp-pm">${months.map((x) => `<option value="${x.month}"${x.month === payMonth ? ' selected' : ''}>${esc(MES(x.month))} · ${COP(x.total)} · ${x.paid ? '✅ Pagado' : '⏳ Pendiente'}</option>`).join('')}</select>
        <button class="btn w sm" id="tp-pdf">⬇️ Descargar volante (PDF)</button></div>
      <div class="tp-pay-hero card"><span class="lbl">Total · ${esc(MES(P.month))}</span><b>${COP(P.total)}</b>
        <div class="tp-pay-k"><span><b>${P.done}</b> clase${P.done === 1 ? '' : 's'} dictada${P.done === 1 ? '' : 's'} × ${COP(P.rate)}</span><span><b>${P.noshow}</b> inasistencia${P.noshow === 1 ? '' : 's'} del estudiante × ${COP(P.noshowRate)}</span>${P.tnoshow ? `<span class="tp-pen"><b>${P.tnoshow}</b> penalización${P.tnoshow === 1 ? '' : 'es'} × −${COP(P.penalty)}</span>` : ''}</div>
        <span class="tp-paid ${paid ? 'ok' : 'pend'}">${paid ? '✅ Pagado' + (paidAt ? ' el ' + esc(dLabel(String(paidAt).slice(0, 10))) : '') : '⏳ Pendiente por pagar'}</span></div>
      <div class="tp-alert"><b>¿Cómo se calcula?</b> Se paga cada clase <b>dictada</b> (${COP(P.rate)} por clase de 50 min). Si <b>te conectas y el estudiante no asiste</b>, se pagan ${COP(P.noshowRate)}. Las clases canceladas (a tiempo o fuera de tiempo) y las no dictadas no se pagan. <b>Si no te conectas</b> y el estudiante lo reporta, se descuentan ${COP(P.penalty || 10000)} de penalización (administración puede revisarlo en casos de fuerza mayor). El pago es mensual. Recuerda <b>marcar cada clase</b> en Mis clases.</div>
      <div class="card tp-card"><div class="tp-card-h"><h2>Detalle</h2><small class="muted">hora Colombia</small></div>
      ${P.items.length ? `<ul class="tp-list tp-pay-list">${P.items.map((x) => { const st = PST[x.status] || ['off', x.status]; return `<li class="tp-pay-row"><div><b>${dLabel(x.date)} · ${h12(x.time)}</b><small>${x.type === 'vip' ? 'Individual' : esc(x.club || 'Clase grupal')}${x.who ? ' · ' + esc(x.who) : ''}</small></div><span class="tp-pst ${st[0]}">${esc(st[1])}</span><b class="tp-amt">${COP(x.amount)}</b></li>`; }).join('')}</ul>` : '<p class="muted">No hay clases registradas en este mes.</p>'}</div>`;
    $('#tp-pm', el).onchange = (e) => { payMonth = e.target.value; pay(el); };
    $('#tp-pdf', el).onclick = () => payPdf(P, paid, paidAt);
  }
  // volante de pago imprimible → "Guardar como PDF"
  function payPdf(P, paid, paidAt) {
    const t = D.teacher || {}; const w = window.open('', '_blank'); if (!w) { toast('Permite las ventanas emergentes para descargar el PDF', true); return; }
    const rows = P.items.map((x) => `<tr><td>${esc(dLabel(x.date))}</td><td>${esc(h12(x.time))}</td><td>${x.type === 'vip' ? 'Individual' : esc(x.club || 'Clase grupal')}</td><td>${esc(x.who || '')}</td><td>${esc((PST[x.status] || ['', x.status])[1])}</td><td class="r">${COP(x.amount)}</td></tr>`).join('');
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Volante de pago ${esc(t.name)} ${esc(P.month)}</title><style>
      body{font-family:Arial,Helvetica,sans-serif;color:#1a202c;margin:32px}h1{color:#0B2A5B;font-size:22px;margin:16px 0 4px}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #E3242B;padding-bottom:12px}
      .top img{height:60px}.meta{font-size:14px;line-height:1.6}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}th,td{border:1px solid #dfe3ea;padding:7px 8px;text-align:left}th{background:#0B2A5B;color:#fff}
      .r{text-align:right}.sum{margin-top:16px;width:340px;margin-left:auto}.sum td{font-size:14px}.tot td{font-weight:800;font-size:16px;background:#f4f6fa}.st{display:inline-block;margin-top:10px;padding:6px 12px;border-radius:999px;font-weight:700;background:${paid ? '#dcfce7;color:#166534' : '#fff3cd;color:#8a5a00'}}
      .foot{margin-top:28px;font-size:12px;color:#4a5568}@media print{body{margin:14mm}}</style></head><body>
      <div class="top"><img src="${location.href.replace(/[^/]*$/, '')}mra-brand.png" alt="mrarrieta.com"><div class="meta" style="text-align:right"><b>VOLANTE DE PAGO</b><br>${esc(MES(P.month))}</div></div>
      <h1>${esc(t.name || '')}</h1><div class="meta">Código: ${esc(t.code || '')}${t.email ? ' · ' + esc(t.email) : ''}<br>Periodo: ${esc(MES(P.month))} · Valor por clase dictada: ${COP(P.rate)} · Inasistencia del estudiante: ${COP(P.noshowRate)}</div>
      <span class="st">${paid ? 'PAGADO' + (paidAt ? ' · ' + esc(dLabel(String(paidAt).slice(0, 10))) : '') : 'PENDIENTE POR PAGAR'}</span>
      <table><thead><tr><th>Fecha</th><th>Hora</th><th>Clase</th><th>Estudiante(s)</th><th>Estado</th><th class="r">Valor</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Sin clases registradas</td></tr>'}</tbody></table>
      <table class="sum"><tr><td>Clases dictadas (${P.done} × ${COP(P.rate)})</td><td class="r">${COP(P.done * P.rate)}</td></tr><tr><td>Inasistencias (${P.noshow} × ${COP(P.noshowRate)})</td><td class="r">${COP(P.noshow * P.noshowRate)}</td></tr>${P.tnoshow ? `<tr><td>Penalizaciones (${P.tnoshow} × ${COP(P.penalty)})</td><td class="r">−${COP(P.tnoshow * P.penalty)}</td></tr>` : ''}<tr class="tot"><td>TOTAL</td><td class="r">${COP(P.total)}</td></tr></table>
      <p class="foot">mrarrieta.com · ¡Aprende inglés HABLANDO! · Generado el ${esc(dLabel(today(), true))}. Las clases canceladas y las no dictadas no generan pago.</p>
      <script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>`);
    w.document.close();
  }
  /* ---------- 4. Mis grupos ---------- */
  function groups(el) {
    const gs = D.groups || [];
    const studs = Object.values(D.students || {});
    el.innerHTML = gs.length ? `<div class="tp-groups">${gs.map((g) => { const list = studs.filter((s) => s.groupId === g.id);
      const next = D.classes.find((c) => c.groupId === g.id && c.status === 'scheduled' && c.date >= today());
      return `<article class="card tp-group"><div class="tp-group-h"><h2>${esc(g.name || 'Grupo')}</h2>${g.level ? `<span class="tp-badge grp">${esc(g.level)}</span>` : ''}</div>
        <p class="tp-group-when">🗓️ ${esc(g.days || 'Días por definir')} · ⏰ ${h12(g.time) || '—'} <small class="muted">hora Colombia</small></p>
        ${next ? `<p class="tp-small">Próxima sesión: <b>${rel(next.date) || dLabel(next.date)}</b> · ${h12(next.time)}</p>` : ''}
        <div class="tp-l">Estudiantes (${list.length})</div>
        ${list.length ? `<ul class="tp-studs">${list.map((s) => `<li><span class="tp-av">${esc((s.name || '?')[0].toUpperCase())}</span><span>${esc(s.name || s.code)}<small>${esc(s.code)}${s.module ? ' · Módulo ' + esc(s.module) : ''}</small></span></li>`).join('')}</ul>` : '<p class="muted tp-small">Aún no hay estudiantes en este grupo.</p>'}
        ${g.meet ? `<a class="btn k sm" href="${esc(g.meet)}" target="_blank" rel="noopener"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 6h11a2 2 0 0 1 2 2v1.6l3.4-2.3A1 1 0 0 1 22 8.1v7.8a1 1 0 0 1-1.6.8L17 14.4V16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/></svg> Enlace de la clase</a>` : ''}</article>`; }).join('')}</div>`
      : `<div class="card tp-card"><div class="tp-empty"><img src="mra-wink.webp" alt="" width="110" height="110"><p>Aún no tienes grupos asignados. La administración te asignará grupos según los niveles que dictas.</p></div></div>`;
  }

  // 🔔 pop-up: reservas, cancelaciones y confirmaciones nuevas (al entrar y cada 2 minutos)
  const POPPED = new Set();
  function popNew() {
    if (!D || document.querySelector('.tp-modal')) return;
    const nw = (D.notifications || []).filter(n => !n.read && (n.type === 'vip' || n.type === 'club') && !POPPED.has(n.id)); if (!nw.length) return;
    nw.forEach(n => POPPED.add(n.id));
    const m = modal(`<h3>🔔 ${nw.length === 1 ? 'Tienes una novedad' : 'Tienes ' + nw.length + ' novedades'}</h3><div class="tp-pop-list">${nw.map(n => `<div><b>${esc(n.title)}</b><small>${esc(n.body || '')}</small></div>`).join('')}</div><button class="btn k block" id="tp-pok">Entendido</button>`);
    $('#tp-pok', m).onclick = () => { m.remove(); api('notifRead', { ids: nw.map(n => n.id) }).catch(() => { }); nw.forEach(n => n.read = true); if (tab === 'home') shell(); };
  }
  // "Atrás": dentro del portal vuelve al Resumen; nunca saca al profe a otra página por error
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.tb-back'); if (!b || !S || !D) return; e.preventDefault(); e.stopImmediatePropagation(); const wa = document.querySelector('.wa-wrap'); if (wa && window.MRLIVE) return MRLIVE.close(); if (tab !== 'home') { tab = 'home'; ss.set(TABKEY, tab); shell(); } window.scrollTo(0, 0); }, true);
  let bellOn = false;
  function bell() { if (bellOn || !window.MRBELL) { if (window.MRBELL && D) MRBELL.set(D.notifications || []); return; } bellOn = true;
    MRBELL.set(D.notifications || []);
    MRBELL.mount({ every: 15000, active: () => !!S, fetch: async () => { if (!S || !D) return null; const r = await api('notifs').catch(() => null); if (!r || !r.ok) return null; const had = new Set((D.notifications || []).map(n => n.id)); D.notifications = r.notifications; if ((r.notifications || []).some(n => !had.has(n.id))) popNew(); return r.notifications; },
      markRead: (ids, all) => api('notifRead', all ? { all: true } : { ids }).catch(() => { }) }); }
  /* ---------- inicio ---------- */
  async function start() {
    S = ss.get(SKEY);
    if (!S || !S.tcode || !MR.on) { S = null; loginView(); return; }
    app.innerHTML = '<div class="tp-loading">Cargando tu portal…</div>';
    const r = await MR.call('tLogin', { tcode: S.tcode, pin: S.pin });
    if (r.ok) { D = r; shell(); setTimeout(popNew, 600); } else { if (r.err === 'auth') ss.del(SKEY); loginView(r.err === 'auth' ? '' : errText(r.err)); }
  }
  start();
})();
