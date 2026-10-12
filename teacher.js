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
  const endHM = (hm, dur) => { const [h, m] = String(hm).split(':').map(Number); const t = h * 60 + m + (+dur || 60); return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

  let S = null, D = null, tab = ss.get(TABKEY) || 'home', clsView = 'up';
  const form = { date: '', hours: [], dur: '60', repeat: false, weeks: 4 };

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
  const typeBadge = (c) => c.type === 'vip' ? '<span class="tp-badge vip">VIP</span>' : '<span class="tp-badge grp">Grupal</span>';
  const statusBadge = (c) => ({ done: '<span class="tp-st done">Dictada ✓</span>', noshow: '<span class="tp-st noshow">No asistió</span>', cancelled: '<span class="tp-st canc">Cancelada</span>' }[c.status] || (c.date <= today() ? '<span class="tp-st pend">Por marcar</span>' : '<span class="tp-st sch">Programada</span>'));
  const whoOf = (c) => c.type === 'vip' ? esc(studentName(c.students[0] || '')) : esc((groupOf(c.groupId) || {}).name || 'Grupo') + ` · ${c.students.length} estudiante${c.students.length === 1 ? '' : 's'}`;

  /* ---------- entrada ---------- */
  function loginView(msg) {
    outBtn.classList.add('hidden');
    const off = !MR.on;
    app.innerHTML = `<section class="card tp-login center">
      <img src="mra-present.webp" alt="" class="tp-login-img" width="200" height="200">
      <span class="lbl">Portal de profesores</span>
      <h1>¡Hola, profe! 👋</h1>
      <p class="muted">Entra con tu código de profesor y tu PIN para ver tus clases, tu disponibilidad y tus grupos.</p>
      ${off ? `<div class="tp-alert">⚠️ El portal todavía no está conectado a la nube de la escuela. Escribe a administración para recibir ayuda.<br><a class="btn w sm" style="margin-top:10px" target="_blank" rel="noopener" href="https://wa.me/${WA}?text=${encodeURIComponent('Hola, soy profe de mrarrieta.com y no puedo entrar al portal de profesores.')}">💬 Escribir por WhatsApp</a></div>` : ''}
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
      S = { tcode, pin }; ss.set(SKEY, S); D = r; tab = 'home'; ss.set(TABKEY, tab); shell();
    };
  }
  function logout() { ss.del(SKEY); ss.del(TABKEY); S = null; D = null; loginView(); }
  async function reload() { const r = await api('tLogin'); if (r.ok) { D = r; shell(); } else if (r.err !== 'auth') toast(errText(r.err), true); return r.ok; }

  /* ---------- estructura principal ---------- */
  const TABS = [['home', '🏠', 'Resumen'], ['avail', '🗓️', 'Mi disponibilidad'], ['classes', '🎓', 'Mis clases'], ['groups', '👥', 'Mis grupos']];
  function shell() {
    outBtn.classList.remove('hidden'); outBtn.onclick = () => { if (confirm('¿Cerrar sesión?')) logout(); };
    const t = D.teacher;
    app.innerHTML = `<div class="tp-head">
        <div class="tp-head-txt"><h1>¡Hola, ${esc(String(t.name || '').split(' ')[0])}! 👋</h1><p class="muted">${dLabel(today(), true)} · <b>${h12(nowHM())}</b> hora Colombia · Código <b>${esc(t.code)}</b></p></div>
        <a class="btn w sm tp-chat" href="docente.html">💬 Chat con estudiantes</a>
      </div>
      <nav class="tp-tabs" role="tablist">${TABS.map(([id, ic, tx]) => `<button class="tp-tab${tab === id ? ' on' : ''}" role="tab" aria-selected="${tab === id}" data-tab="${id}"><span aria-hidden="true">${ic}</span> ${tx}</button>`).join('')}</nav>
      <section id="tp-body"></section>`;
    $$('.tp-tab').forEach((b) => b.onclick = () => { tab = b.dataset.tab; ss.set(TABKEY, tab); shell(); });
    ({ home, avail, classes, groups }[tab] || home)($('#tp-body'));
  }

  /* ---------- 1. Resumen ---------- */
  function classRow(c, opt) {
    const r = rel(c.date), link = meetOf(c), canMark = c.status === 'scheduled' && c.date <= today();
    return `<li class="tp-cls${r === 'Hoy' ? ' today' : r === 'Mañana' ? ' tomorrow' : ''}">
      <div class="tp-cls-when"><b>${r || dLabel(c.date)}</b><span>${r ? dLabel(c.date) + ' · ' : ''}${h12(c.time)} – ${h12(endHM(c.time, c.duration))}</span></div>
      <div class="tp-cls-what">${typeBadge(c)} ${statusBadge(c)}<div class="tp-cls-who">${whoOf(c)}</div>${c.topic ? `<small class="muted">Tema: ${esc(c.topic)}</small>` : ''}
        ${c.status === 'done' ? `<small class="muted">Asistencia: ${c.students.filter((x) => (c.attendance || {})[String(x).toUpperCase()] === true || (c.attendance || {})[x] === true).length}/${c.students.length}</small>` : ''}
        ${c.type === 'group' && c.status === 'scheduled' ? `<small class="muted">✅ ${+c.confirmed || 0} confirmado(s)${c.flags === 'cutoff' ? '' : ' · se cierra 3 h antes'}</small>` : ''}${c.status === 'sin-asistentes' ? '<small class="tp-note">🙌 Nadie confirmó: no necesitas conectarte.</small>' : ''}
        ${c.notes && opt && opt.notes ? `<small class="tp-note">📝 ${esc(c.notes)}</small>` : ''}</div>
      <div class="tp-cls-act">
        ${c.status === 'scheduled' && c.date >= today() ? (link ? `<a class="btn k sm" href="${esc(link)}" target="_blank" rel="noopener">🎥 Entrar a la clase</a>` : '<small class="muted">Sin enlace de clase</small>') : ''}
        ${canMark ? `<button class="btn ok sm" data-mark="${esc(c.id)}">✓ Marcar como dictada</button><button class="btn w sm" data-noshow="${esc(c.id)}">No asistió</button>` : ''}
      </div></li>`;
  }
  function bindMarks(root) {
    $$('[data-mark]', root).forEach((b) => b.onclick = () => markDialog(b.dataset.mark, 'done'));
    $$('[data-noshow]', root).forEach((b) => b.onclick = () => markDialog(b.dataset.noshow, 'noshow'));
  }
  function home(el) {
    setTimeout(() => { const nb = document.getElementById('tp-nread'); if (nb) nb.onclick = async () => { nb.disabled = true; await api('notifRead', { all: true }); (D.notifications || []).forEach(n => n.read = true); shell(); }; }, 0);
    const t0 = today();
    const up = D.classes.filter((c) => c.status === 'scheduled' && c.date >= t0);
    const pend = D.classes.filter((c) => c.status === 'scheduled' && c.date <= t0 && !(c.date === t0 && endHM(c.time, c.duration) > nowHM()));
    const free = D.slots.filter((s) => s.status === 'free' && s.date >= t0).length;
    const nt = (D.notifications || []).slice(0, 12); const unread = nt.filter(n => !n.read);
    el.innerHTML = `${nt.length ? `<div class="card tp-notif"><h3>🔔 Notificaciones ${unread.length ? `<span class="tp-nbadge">${unread.length} nueva${unread.length > 1 ? 's' : ''}</span>` : ''}</h3><div class="tp-nlist">${nt.map(n => `<div class="tp-n${n.read ? '' : ' new'}"><b>${esc(n.title)}</b>${n.body ? `<p>${esc(n.body)}</p>` : ''}<small>${esc(String(n.date || '').replace('T', ' ').slice(0, 16))}</small></div>`).join('')}</div>${unread.length ? '<button class="btn w sm" id="tp-nread">✓ Marcar todas como leídas</button>' : ''}</div>` : ''}<div class="tp-stats">
        <div class="tp-stat red"><b>${+D.stats.taughtMonth || 0}</b><span>clases dictadas este mes</span></div>
        <div class="tp-stat"><b>${+D.stats.taughtTotal || 0}</b><span>clases dictadas en total</span></div>
        <div class="tp-stat"><b>${up.length}</b><span>próximas clases</span></div>
        <div class="tp-stat"><b>${free}</b><span>espacios VIP libres</span></div>
      </div>
      ${pend.length ? `<div class="tp-alert warn"><b>📌 Tienes ${pend.length} clase${pend.length > 1 ? 's' : ''} por marcar.</b> Registra la asistencia para que el estudiante vea su progreso. <button class="btn k sm" data-go="classes">Ir a Mis clases</button></div>` : ''}
      <div class="card tp-card"><div class="tp-card-h"><h2>Próximas clases</h2><small class="muted">hora Colombia</small></div>
        ${up.length ? `<ul class="tp-list">${up.slice(0, 8).map((c) => classRow(c)).join('')}</ul>` : `<div class="tp-empty"><img src="mra-think.webp" alt="" width="110" height="110"><p>No tienes clases programadas.${free ? '' : ' Agrega espacios en <b>Mi disponibilidad</b> para que tus estudiantes Premium reserven clases VIP.'}</p></div>`}
      </div>
      ${!free ? `<div class="tp-alert"><b>🗓️ No tienes espacios VIP libres.</b> Los estudiantes Premium solo pueden reservar en los horarios que publiques. <button class="btn w sm" data-go="avail">Agregar disponibilidad</button></div>` : ''}`;
    $$('[data-go]', el).forEach((b) => b.onclick = () => { tab = b.dataset.go; ss.set(TABKEY, tab); shell(); });
    bindMarks(el);
  }

  /* ---------- 2. Mi disponibilidad ---------- */
  const HOURS = Array.from({ length: 16 }, (_, i) => String(6 + i).padStart(2, '0') + ':00');
  function planned() {
    if (!form.date || !form.hours.length) return [];
    const n = form.repeat ? Math.min(8, Math.max(1, +form.weeks || 1)) : 1, out = [], t0 = today(), hm = nowHM();
    for (let w = 0; w < n; w++) { const d = addDays(form.date, 7 * w); form.hours.slice().sort().forEach((h) => { if ((d > t0 || (d === t0 && h > hm)) && !(window.MRFEST && MRFEST.isOff(d))) out.push({ date: d, time: h, duration: form.dur }); }); }
    return out;
  }
  function avail(el) {
    const t0 = today(); if (!form.date || form.date < t0) form.date = t0;
    const extra = form.hours.filter((h) => HOURS.indexOf(h) < 0);
    const slots = D.slots.filter((s) => s.status !== 'deleted' && s.date >= t0 && !(s.date === t0 && s.status === 'free' && s.time <= nowHM()));
    const byDate = {}; slots.forEach((s) => (byDate[s.date] = byDate[s.date] || []).push(s));
    el.innerHTML = `<div class="card tp-card tp-week"><div class="tp-card-h"><h2>📅 Mi disponibilidad semanal</h2></div>
        <p class="muted tp-small">Marca las horas en que puedes dictar cada semana. La plataforma crea automáticamente tus espacios de <b>1 hora</b> para las próximas <b>4 semanas</b> (y los renueva cada día). Los estudiantes Premium los verán para reservar sus clases VIP.</p>
        <div id="tp-wg"></div><button class="btn k lg block" id="tp-wsave" style="margin-top:12px">Guardar mi disponibilidad semanal</button></div>
      <div class="tp-cols">
      <div class="card tp-card tp-addcard">
        <div class="tp-card-h"><h2>Agregar un espacio extra (fecha específica)</h2></div>
        <p class="muted tp-small">Publica los horarios reales en los que puedes dictar. Los estudiantes Premium los verán y reservarán (mínimo 12 horas antes). Todo en <b>hora Colombia</b>.</p>
        <label class="tp-l" for="tp-date">1. Fecha</label>
        <input class="inp tp-inp" type="date" id="tp-date" min="${t0}" value="${form.date}">
        <div class="tp-l">2. Hora(s) de inicio <small class="muted">(elige una o varias)</small></div>
        <div class="tp-hours" role="group" aria-label="Horas">${HOURS.concat(extra).map((h) => `<button type="button" class="tp-hour${form.hours.indexOf(h) >= 0 ? ' on' : ''}${form.date === t0 && h <= nowHM() ? ' past' : ''}" data-h="${h}" aria-pressed="${form.hours.indexOf(h) >= 0}">${h12(h)}</button>`).join('')}</div>
        <div class="tp-other"><label for="tp-time">Otra hora:</label><input class="inp tp-inp" type="time" id="tp-time" step="300"><button type="button" class="btn w sm" id="tp-addh">Añadir</button></div>
        <div class="tp-l">3. Duración</div>
        <div class="tp-seg" role="radiogroup">${['30', '45', '60'].map((d) => `<button type="button" class="tp-segb${form.dur === d ? ' on' : ''}" data-d="${d}" role="radio" aria-checked="${form.dur === d}">${d} min</button>`).join('')}</div>
        <label class="tp-rep"><input type="checkbox" id="tp-rep" ${form.repeat ? 'checked' : ''}> <span>Repetir cada semana</span></label>
        <div class="tp-weeks${form.repeat ? '' : ' hidden'}"><label for="tp-weeks">durante</label><select class="inp tp-inp" id="tp-weeks">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option value="${n}" ${+form.weeks === n ? 'selected' : ''}>${n} semana${n > 1 ? 's' : ''}</option>`).join('')}</select></div>
        <div class="tp-preview" id="tp-prev"></div>
        <button class="btn k lg block" id="tp-save">Guardar disponibilidad</button>
      </div>
      <div class="card tp-card">
        <div class="tp-card-h"><h2>Mis espacios</h2><small class="muted">${slots.filter((s) => s.status === 'free').length} libres · ${slots.filter((s) => s.status === 'booked').length} reservados</small></div>
        ${Object.keys(byDate).length ? Object.keys(byDate).sort().map((d) => `<div class="tp-day"><h3>${rel(d) ? `<span class="tp-rel">${rel(d)}</span> ` : ''}${dLabel(d, true)}</h3><ul>${byDate[d].map((s) => {
          const c = s.status === 'booked' ? D.classes.find((x) => x.id === s.classId) : null;
          return `<li class="tp-slot ${s.status}"><span class="tp-slot-t">${h12(s.time)} – ${h12(endHM(s.time, s.duration))}<small>${esc(s.duration || 60)} min</small></span>
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
    $('#tp-addh', el).onclick = () => { const v = $('#tp-time', el).value; if (!/^\d{2}:\d{2}$/.test(v)) { toast('Elige una hora válida.', true); return; } if (form.hours.indexOf(v) < 0) form.hours.push(v); avail(el); };
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
        ${g.meet ? `<a class="btn k sm" href="${esc(g.meet)}" target="_blank" rel="noopener">🎥 Enlace de la clase</a>` : ''}</article>`; }).join('')}</div>`
      : `<div class="card tp-card"><div class="tp-empty"><img src="mra-wink.webp" alt="" width="110" height="110"><p>Aún no tienes grupos asignados. La administración te asignará grupos según los niveles que dictas.</p></div></div>`;
  }

  /* ---------- inicio ---------- */
  async function start() {
    S = ss.get(SKEY);
    if (!S || !S.tcode || !MR.on) { S = null; loginView(); return; }
    app.innerHTML = '<div class="tp-loading">Cargando tu portal…</div>';
    const r = await MR.call('tLogin', { tcode: S.tcode, pin: S.pin });
    if (r.ok) { D = r; shell(); } else { if (r.err === 'auth') ss.del(SKEY); loginView(r.err === 'auth' ? '' : errText(r.err)); }
  }
  start();
})();
