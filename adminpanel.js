/* =====================================================================
   PANEL DE ADMINISTRACIÓN — mrarrieta.com (datos en la nube)
   Estudiantes y progreso · planes · inscripciones · placement (audios)
   · reclutamiento (CV + audios) · profesores (disponibilidad y clases
   dictadas) · clases VIP y grupales · grupos · solicitudes · ajustes
   ===================================================================== */
(function () {
  const C = window.M1CONFIG || {}; const app = document.getElementById('app');
  const KK = 'mra_admin_key';
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const J = (s, d) => { if (s && typeof s === 'object') return s; try { return s ? JSON.parse(s) : d; } catch (e) { return d; } };
  const key = () => { try { return sessionStorage.getItem(KK) || ''; } catch (e) { return ''; } };
  const PLAN = { free: ['🟢', 'Acceso gratuito'], membership: ['⭐', 'Membership'], premium: ['👑', 'Premium'], expired: ['⏰', 'Vencido'] };
  const MODN = { 1: 'A1', 2: 'A2', 3: 'B2', 4: 'B2+' };
  const PRICE = { membership: 59900, premium: 349000 };
  const money = (n) => '$' + Math.round(+n || 0).toLocaleString('es-CO');
  const fD = (iso, o) => { if (!iso) return '—'; try { return new Date(String(iso).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CO', o || { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return iso; } };
  const fDT = (iso) => iso ? fD(iso) + (String(iso).length > 10 ? ' · ' + String(iso).slice(11, 16) : '') : '—';
  const fT = (t) => { if (!t) return ''; const [hh, mm] = String(t).split(':').map(Number); return `${((hh + 11) % 12) + 1}:${String(mm || 0).padStart(2, '0')} ${hh >= 12 ? 'p. m.' : 'a. m.'}`; };
  const todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const waLink = (raw, txt) => { let d = String(raw || '').replace(/\D/g, ''); if (!d) return ''; if (d.length === 10) d = '57' + d; return 'https://api.whatsapp.com/send?phone=' + d + (txt ? '&text=' + encodeURIComponent(txt) : ''); };
  const BASE = (C.PLATFORM_URL || location.href.replace(/[^/]*$/, ''));
  function toast(m) { let t = $('#ad-toast'); if (!t) { t = document.createElement('div'); t.id = 'ad-toast'; document.body.appendChild(t); } t.textContent = m; t.className = 'on'; clearTimeout(t._t); t._t = setTimeout(() => t.className = '', 2600); }
  function modal(html) { const m = document.createElement('div'); m.className = 'ad-modal'; m.innerHTML = `<div class="ad-mcard"><button class="ad-mx" aria-label="Cerrar">✕</button>${html}</div>`; document.body.appendChild(m); m.querySelector('.ad-mx').onclick = () => m.remove(); m.addEventListener('click', e => { if (e.target === m) m.remove(); }); return m; }
  async function copy(t) { try { await navigator.clipboard.writeText(t); } catch (e) { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); } toast('📋 Copiado'); }

  async function api(action, data) {
    const r = await MRAC.call(action, Object.assign({ key: key() }, data || {}));
    if (!r.ok && r.err === 'auth') { try { sessionStorage.removeItem(KK); } catch (e) { } toast('Tu sesión expiró. Vuelve a entrar.'); login(); }
    if (!r.ok && r.err === 'network') toast('Sin conexión con la nube 😕');
    return r;
  }
  let REF = { teachers: [], groups: [] };
  async function loadRef() { const r = await api('aTeachers'); if (r.ok) REF = { teachers: r.teachers || [], groups: r.groups || [] }; }
  const tName = (id) => (REF.teachers.find(t => t.id === id) || {}).name || '—';
  const gName = (id) => { const g = REF.groups.find(x => x.id === id); return g ? `${g.name} · ${g.days || ''} ${fT(g.time)}` : '—'; };
  const teacherOpts = (sel) => `<option value="">— Elegir profe —</option>` + REF.teachers.filter(t => t.active !== 'no').map(t => `<option value="${esc(t.id)}" ${t.id === sel ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
  const groupOpts = (sel) => `<option value="">— Sin grupo —</option>` + REF.groups.filter(g => g.active !== 'no').map(g => `<option value="${esc(g.id)}" ${g.id === sel ? 'selected' : ''}>${esc(g.name)} · ${esc(g.level || '')} · ${esc(g.days || '')} ${fT(g.time)}</option>`).join('');

  /* ======================= LOGIN ======================= */
  function login() {
    $('#ad-out') && $('#ad-out').classList.add('hidden');
    if (!MRAC.on) {
      app.innerHTML = `<div class="card ad-login"><div style="font-size:44px">☁️</div><h2>Conecta la nube primero</h2><p>El panel de administración lee los datos desde tu Google Sheets. Sigue los pasos del archivo <b>LEEME-NUBE.md</b> y pega la URL de tu Apps Script en <b>config.js → CLOUD_URL</b>.</p><a class="btn w" href="admin.html">🔑 Generador de códigos (sin nube)</a></div>`;
      return;
    }
    app.innerHTML = `<div class="card ad-login"><img src="mra-present.webp" alt="" class="ad-login-img"><span class="lbl">Solo para administración</span><h2>Panel de administración</h2>
      <p class="muted">Escribe la clave de administración.</p>
      <input class="inp" id="pw" type="password" autocomplete="current-password" placeholder="Clave"><button class="btn k block lg" id="go">Entrar</button><p id="err" class="ad-err"></p></div>`;
    const go = async () => { const v = $('#pw').value.trim(); if (!v) return; $('#go').disabled = true; $('#go').textContent = 'Verificando…';
      const r = await MRAC.call('aLogin', { key: v }); $('#go').disabled = false; $('#go').textContent = 'Entrar';
      if (r.ok) { try { sessionStorage.setItem(KK, v); } catch (e) { } boot(); }
      else $('#err').textContent = r.err === 'change_password' ? '⚠️ Primero cambia ADMIN_PASSWORD en Code.gs y vuelve a implementar (Implementar → Gestionar implementaciones → Editar → Nueva versión).' : r.err === 'auth' ? 'Clave incorrecta.' : 'No hay conexión con la nube. Revisa CLOUD_URL.'; };
    $('#go').onclick = go; $('#pw').onkeydown = e => { if (e.key === 'Enter') go(); }; setTimeout(() => $('#pw').focus(), 100);
  }

  /* ======================= ESTRUCTURA ======================= */
  const TABS = [['home', '📊', 'Resumen'], ['students', '🎓', 'Estudiantes'], ['enroll', '📝', 'Inscripciones'], ['placement', '🧭', 'Placement'], ['recruit', '👩‍🏫', 'Reclutamiento'], ['teachers', '🧑‍🏫', 'Profesores'], ['classes', '📅', 'Clases'], ['requests', '🔁', 'Solicitudes'], ['chats', '💬', 'Chats'], ['settings', '⚙️', 'Ajustes']];
  let TAB = 'home', STATS = null;
  // "Atrás": dentro del panel vuelve al Resumen (nunca saca a otra página por error)
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.tb-back'); if (!b || !key()) return; if (document.querySelector('.modal, .wa-wrap')) return; e.preventDefault(); e.stopImmediatePropagation(); if (TAB !== 'home') go('home'); else window.scrollTo(0, 0); }, true);
  async function boot() {
    if (window.MRBELL) MRBELL.mount({ every: 15000, active: () => !!key(), fetch: async () => { const r = await api('aNotifs'); return r.ok ? r.rows : null; }, markRead: (ids, all) => api('notifRead', all ? { all: true } : { ids }) });
    const out = $('#ad-out'); if (out) { out.classList.remove('hidden'); out.onclick = () => { try { sessionStorage.removeItem(KK); } catch (e) { } login(); }; }
    app.innerHTML = `<nav class="ad-tabs" id="tabs">${TABS.map(([k, i, n]) => `<button data-t="${k}"><span>${i}</span>${n}<i class="ad-badge" data-b="${k}"></i></button>`).join('')}</nav><div id="view" class="ad-view"><div class="ad-loading">⏳ Cargando…</div></div>`;
    $$('#tabs button').forEach(b => b.onclick = () => go(b.dataset.t));
    await loadRef();
    const h = (location.hash || '').slice(1); go(TABS.some(t => t[0] === h) ? h : 'home');
  }
  function go(t) { TAB = t; history.replaceState(null, '', '#' + t); $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); const on = $(`#tabs button[data-t="${t}"]`); on && on.scrollIntoView({ inline: 'center', block: 'nearest' }); window.scrollTo(0, 0); (VIEWS[t] || VIEWS.home)(); }
  const view = () => $('#view');
  function badges(s) { const set = (k, n) => { const e = $(`[data-b="${k}"]`); if (e) { e.textContent = n || ''; e.style.display = n ? '' : 'none'; } };
    set('enroll', s.enrollNew); set('recruit', s.recruitNew); set('requests', s.requestsPending); }

  /* ======================= RESUMEN ======================= */
  async function home() {
    view().innerHTML = '<div class="ad-loading">⏳ Cargando resumen…</div>';
    const s = await api('aStats'); if (!s.ok) return view().innerHTML = '<p class="ad-err">No se pudo cargar el resumen.</p>';
    STATS = s; badges(s); const b = s.byPlan;
    const kpi = (n, l, sub, cls, t) => `<button class="ad-kpi ${cls || ''}" ${t ? `data-go="${t}"` : ''}><b>${n}</b><span>${l}</span>${sub ? `<em>${sub}</em>` : ''}</button>`;
    view().innerHTML = `<div class="ad-head"><h1>👋 Hola, administración</h1><p class="muted">${fD(s.today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
      <div class="ad-kpis">${kpi(s.students, 'Estudiantes', `${s.active7} activos esta semana`, '', 'students')}${kpi(b.premium, '👑 Premium', '', 'prem', 'students:premium')}${kpi(b.membership, '⭐ Membership', '', 'memb', 'students:membership')}${kpi(b.free, '🟢 Acceso gratuito', '', 'free', 'students:free')}${kpi(b.expired, '⏰ Vencidos', 'por renovar', 'exp', 'students:expired')}${kpi(money(s.revenue), 'Ingreso mensual', 'planes activos (estimado)', 'rev')}</div>
      <div class="ad-kpis sm">${kpi(s.enrollNew, 'Inscripciones nuevas', `${s.enrollTotal} en total`, s.enrollNew ? 'alert' : '', 'enroll')}${kpi(s.placementMonth, 'Placement este mes', `${s.placementTotal} en total`, '', 'placement')}${kpi(s.recruitNew, 'Candidatos nuevos', `${s.recruitTotal} en total`, s.recruitNew ? 'alert' : '', 'recruit')}${kpi(s.requestsPending, 'Solicitudes pendientes', 'intentos extra', s.requestsPending ? 'alert' : '', 'requests')}${kpi(s.classesMonth, 'Clases dictadas', 'este mes', '', 'classes')}${kpi(s.classesUpcoming, 'Clases programadas', 'próximas', '', 'classes')}</div>
      <div class="ad-grid2">
        <div class="card"><h3>⏰ Planes por vencer (7 días)</h3>${s.expiring.length ? `<div class="ad-mini">${s.expiring.map(x => `<button class="ad-mrow" data-st="${esc(x.code)}"><b>${esc(x.name)}</b><span>${PLAN[x.plan] ? PLAN[x.plan].join(' ') : ''} · ${x.daysLeft === 0 ? 'vence hoy' : 'vence en ' + x.daysLeft + ' d'} (${fD(x.planEnd)})</span></button>`).join('')}</div>` : '<p class="muted">Ninguno 🎉</p>'}</div>
        <div class="card"><h3>🎂 Cumpleaños del mes</h3>${s.birthdays.length ? `<div class="ad-mini">${s.birthdays.map(x => `<button class="ad-mrow ${x.today ? 'hoy' : ''}" data-st="${esc(x.code)}"><b>${x.today ? '🎉 ' : ''}${esc(x.name)}</b><span>${fD(x.birth, { day: 'numeric', month: 'long' })}${x.today ? ' · ¡HOY! (correo automático enviado 8:00 a. m.)' : ''}</span></button>`).join('')}</div>` : '<p class="muted">Sin cumpleaños este mes.</p>'}</div>
      </div>
      <div class="card"><h3>🧑‍🏫 Profesores</h3>${s.teachers.length ? `<div class="ad-table"><div class="ad-tr th"><span>Profe</span><span>Dictadas (mes)</span><span>Dictadas (total)</span><span>Espacios libres</span></div>${s.teachers.map(t => `<button class="ad-tr" data-tc="${esc(t.id)}"><span><b>${esc(t.name)}</b>${t.active === 'no' ? ' <small>(inactivo)</small>' : ''}</span><span>${t.taughtMonth}</span><span>${t.taughtTotal}</span><span>${t.freeSlots}</span></button>`).join('')}</div>` : '<p class="muted">Aún no hay profesores. Créalos en la pestaña Profesores.</p>'}</div>`;
    $$('[data-go]').forEach(x => x.onclick = () => { const [t, f] = x.dataset.go.split(':'); if (f) LST.students.filter._plan = f; go(t); });
    $$('[data-st]').forEach(x => x.onclick = () => studentDetail(x.dataset.st));
    $$('[data-tc]').forEach(x => x.onclick = () => teacherDetail(x.dataset.tc));
  }

  /* ======================= LISTAS GENÉRICAS ======================= */
  const LST = {
    students: { table: 'Estudiantes', page: 0, q: '', filter: { _plan: '' } },
    enroll: { table: 'Inscripciones', page: 0, q: '', filter: { status: '' } },
    placement: { table: 'Placement', page: 0, q: '', filter: {} },
    recruit: { table: 'Reclutamiento', page: 0, q: '', filter: { status: '' } },
    teachers: { table: 'Profesores', page: 0, q: '', filter: {} },
    classes: { table: 'Clases', page: 0, q: '', filter: { type: '', status: 'scheduled' } },
    groups: { table: 'Grupos', page: 0, q: '', filter: {} },
    requests: { table: 'Solicitudes', page: 0, q: '', filter: { status: 'pendiente' } },
  };
  async function list(k, o) {
    const L = LST[k];
    view().innerHTML = `<div class="ad-lhead"><div><h1>${o.title}</h1>${o.sub ? `<p class="muted">${o.sub}</p>` : ''}</div>${o.add ? `<button class="btn k" id="ad-add">${o.add}</button>` : ''}</div>
      <div class="ad-filters"><input class="inp" id="ad-q" placeholder="🔎 Buscar por nombre, correo, código…" value="${esc(L.q)}">${(o.filters || []).map(f => `<select class="inp" data-f="${f.k}">${f.opts.map(([v, n]) => `<option value="${v}" ${String(L.filter[f.k] || '') === v ? 'selected' : ''}>${n}</option>`).join('')}</select>`).join('')}</div>
      <div id="ad-rows" class="ad-rows"><div class="ad-loading">⏳ Cargando…</div></div><div class="ad-pager" id="ad-pg"></div>`;
    let t = null; $('#ad-q').oninput = e => { clearTimeout(t); t = setTimeout(() => { L.q = e.target.value.trim(); L.page = 0; load(); }, 350); };
    $$('[data-f]').forEach(s => s.onchange = () => { L.filter[s.dataset.f] = s.value; L.page = 0; load(); });
    if (o.add) $('#ad-add').onclick = o.onAdd;
    async function load() {
      const box = $('#ad-rows'); if (!box) return; box.innerHTML = '<div class="ad-loading">⏳ Cargando…</div>';
      const filter = {}; Object.keys(L.filter).forEach(f => { if (L.filter[f]) filter[f] = L.filter[f]; });
      const r = await api('aList', { table: L.table, q: L.q, page: L.page, size: 25, filter, desc: o.desc }); if (!$('#ad-rows')) return;
      if (!r.ok) { box.innerHTML = '<p class="ad-err">No se pudo cargar.</p>'; return; }
      box.innerHTML = r.rows.length ? r.rows.map(o.row).join('') : `<div class="card ad-empty">${o.empty || 'No hay registros.'}</div>`;
      $$('[data-open]', box).forEach(x => x.onclick = (e) => { if (e.target.closest('a,[data-stop]')) return; o.open(x.dataset.open, r.rows.find(y => y.id === x.dataset.open || (!y.id && y.code === x.dataset.open))); });
      if (o.after) o.after(box, r.rows);
      const pages = Math.ceil(r.total / r.size); $('#ad-pg').innerHTML = pages > 1 ? `<button class="btn w sm" id="pp" ${L.page ? '' : 'disabled'}>←</button><span>${L.page + 1} / ${pages} · ${r.total} registros</span><button class="btn w sm" id="pn" ${L.page + 1 < pages ? '' : 'disabled'}>→</button>` : `<span>${r.total} registro${r.total === 1 ? '' : 's'}</span>`;
      if ($('#pp')) { $('#pp').onclick = () => { L.page--; load(); }; $('#pn').onclick = () => { L.page++; load(); }; }
    }
    load(); return load;
  }
  const chip = (txt, cls) => `<i class="ad-chip ${cls || ''}">${txt}</i>`;
  const planChip = (s) => { const st = s._state || {}; const k = st.expired ? 'expired' : (st.eff || s.plan || 'free'); return chip(PLAN[k].join(' '), 'p-' + k); };
  const bar = (pct) => `<span class="ad-bar"><i style="width:${Math.max(0, Math.min(100, +pct || 0))}%"></i></span>`;
  function back(fn, label) { return `<button class="btn w sm ad-back" id="ad-back">← ${label || 'Volver'}</button>`; }
  function wireBack(fn) { const b = $('#ad-back'); if (b) b.onclick = fn; }

  /* ======================= ESTUDIANTES ======================= */
  function students() {
    list('students', { title: '🎓 Estudiantes', sub: 'Progreso, plan, grupo y clases asistidas', add: '＋ Nuevo estudiante', onAdd: newStudent,
      filters: [{ k: '_plan', opts: [['', 'Todos los planes'], ['premium', '👑 Premium'], ['membership', '⭐ Membership'], ['free', '🟢 Acceso gratuito'], ['expired', '⏰ Vencidos']] }],
      row: s => { const pr = J(s.progress, {}); const mod = s.module ? MODN[s.module] : ''; const cur = mod && pr[mod] ? pr[mod].pct : 0;
        return `<div class="card ad-row" data-open="${esc(s.code)}"><div class="ad-av">${esc(((s.first || '?')[0] + (s.last || '')[0]).toUpperCase())}</div><div class="grow"><b>${esc(s.first)} ${esc(s.last)}</b> ${planChip(s)}${s._trial != null ? chip(s._trial > 0 ? '🎁 prueba: ' + s._trial + ' día' + (s._trial > 1 ? 's' : '') : '🔒 prueba terminada', s._trial > 0 ? '' : 'gray') : ''}${s.status && s.status !== 'activo' ? chip(esc(s.status), 'gray') : ''}
          <small>${esc(s.code)} · ${mod ? 'Módulo ' + mod : 'Sin placement'}</small>
          <div class="ad-rowstats">${mod ? `${bar(cur)}<span>${cur}% de su módulo</span>` : ''}<span>✅ ${+s.classesDone || 0} clases de la plataforma</span><span>👩‍🏫 ${s._attended} clases con profe</span><span>🕒 ${s.lastSeen ? fDT(s.lastSeen) : 'nunca'}</span></div></div></div>`; },
      open: (code) => studentDetail(code), empty: 'Aún no hay estudiantes. Crea el primero con “＋ Nuevo estudiante”.' });
  }
  function studentForm(s, isNew) {
    s = s || {};
    return `<div class="ad-form">
      <label>Nombre<input class="inp" name="first" value="${esc(s.first)}" required></label><label>Apellido<input class="inp" name="last" value="${esc(s.last)}"></label>
      <label>Correo<input class="inp" name="email" type="email" value="${esc(s.email)}"></label><label>WhatsApp<input class="inp" name="whatsapp" inputmode="tel" value="${esc(s.whatsapp)}"></label>
      <label class="np-birth" ${isNew || !s.plan || s.plan === 'free' ? 'style="display:none"' : ''}>Fecha de nacimiento<input class="inp" name="birth" type="date" value="${esc(s.birth)}"></label>
      <label>Módulo de su ruta<select class="inp" name="module"><option value="">Que haga la prueba de clasificación</option>${[1, 2, 3, 4].map(n => `<option value="${n}" ${String(s.module) === String(n) ? 'selected' : ''}>Módulo ${n} · ${MODN[n]}</option>`).join('')}</select></label>
      ${isNew ? `<label>Código <small>(vacío = automático)</small><input class="inp" name="code" placeholder="Ej: LAURA-2026" style="text-transform:uppercase"></label>` : `<label>Estado<select class="inp" name="status">${['activo', 'inactivo', 'archivado'].map(x => `<option ${s.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>`}
      <label class="full">Notas internas<textarea class="inp" name="notes" rows="2">${esc(s.notes)}</textarea></label></div>`;
  }
  const formData = (root) => { const o = {}; $$('[name]', root).forEach(i => { o[i.name] = i.type === 'checkbox' ? (i.checked ? 'sí' : 'no') : i.value.trim(); }); return o; };
  function newStudent(prefill) {
    const m = modal(`<h2>＋ Nuevo estudiante</h2>${studentForm(prefill || {}, true)}
      <label class="ad-lab">Plan inicial</label><div class="ad-plans">${['free', 'membership', 'premium'].map((k, i) => `<label class="ad-pl"><input type="radio" name="_plan" value="${k}" ${i ? '' : 'checked'}><span>${PLAN[k].join(' ')}</span></label>`).join('')}</div>
      <div class="ad-form" id="np-m" style="display:none"><label>Meses<select class="inp" id="np-mo">${[1, 2, 3, 6, 12].map(n => `<option>${n}</option>`).join('')}</select></label><label>Valor pagado<input class="inp" id="np-amt" inputmode="numeric" placeholder="Automático"></label></div>
      <label class="ad-pl" style="margin:12px 0"><input type="checkbox" id="np-send" checked><span>📩 Enviarle sus datos de acceso (código y enlace) por <b>correo</b> y <b>WhatsApp</b></span></label>
      <button class="btn k block lg" id="np-ok">Crear estudiante</button>`);
    $$('[name=_plan]', m).forEach(r => r.onchange = () => { const pl = $('[name=_plan]:checked', m).value; $('#np-m', m).style.display = pl === 'free' ? 'none' : ''; $('.np-birth', m).style.display = pl === 'free' ? 'none' : ''; if (pl === 'free') $('[name=birth]', m).value = ''; });
    $('#np-ok', m).onclick = async () => {
      const d = formData($('.ad-form', m)); delete d._plan; if (!d.first) return toast('Escribe el nombre');
      const plan = $('[name=_plan]:checked', m).value; const send = $('#np-send', m).checked;
      if (send && !d.email && !d.whatsapp) return toast('Escribe el correo o el WhatsApp para enviarle sus datos');
      const w = send && d.whatsapp ? window.open('', '_blank') : null; // se abre ya (si no, el navegador lo bloquea) y luego carga WhatsApp
      if (w) w.document.write('<p style="font:18px sans-serif;text-align:center;margin-top:40px">⏳ Preparando el mensaje de WhatsApp…</p>');
      $('#np-ok', m).disabled = true; $('#np-ok', m).textContent = 'Creando…';
      const r = await api('aSave', { table: 'Estudiantes', row: Object.assign(d, { code: d.code ? d.code.toUpperCase() : '', source: 'admin' }) });
      if (!r.ok) { if (w) w.close(); $('#np-ok', m).disabled = false; $('#np-ok', m).textContent = 'Crear estudiante'; return toast(r.err === 'code_exists' ? 'Ese código ya existe' : 'No se pudo crear'); }
      if (plan !== 'free') await api('aPlan', { code: r.row.code, plan, months: +$('#np-mo', m).value, amount: $('#np-amt', m).value.replace(/\D/g, '') || undefined });
      m.remove(); if (TAB === 'students') students();
      if (!send) return shareCode(r.row);
      const s2 = r.row; let mailed = false;
      if (s2.email) { const rw = await api('aWelcome', { code: s2.code }); mailed = !!(rw && rw.ok && rw.mailed); }
      s2.plan = plan; if (w) w.location.href = waLink(s2.whatsapp, accessMsg(s2));
      modal(`<div class="center"><div style="font-size:44px">✅</div><h2>${esc(s2.first)} ya tiene su acceso</h2><div class="ad-code">${esc(s2.code)}</div>
        <p>${s2.email ? (mailed ? '📧 Se le envió el correo con su código y el enlace a <b>' + esc(s2.email) + '</b>.' : '⚠️ No se pudo enviar el correo. Revisa la dirección.') : '📧 Sin correo registrado.'}</p>
        <p>${s2.whatsapp ? '💬 Se abrió WhatsApp con el mensaje listo: solo dale <b>Enviar</b>.' + ` <a href="${waLink(s2.whatsapp, accessMsg(s2))}" target="_blank" rel="noopener">Abrir otra vez</a>` : '💬 Sin WhatsApp registrado.'}</p></div>`);
    };
  }
  // sin emojis: WhatsApp Web los muestra como signos negros (�) cuando llegan por enlace
  const accessMsg = (s) => `¡Hola ${s.first}! Bienvenido(a) a la plataforma de mrarrieta.com.\n\n*Tu código de acceso:* ${s.code}\n*Entra aquí:* ${BASE}\n\nEscribe tu código en la plataforma y empieza a aprender.${s.plan === 'premium' ? '\n\n*Importante:* tus clases VIP y tus clubs no son acumulables. Resérvalos durante la vigencia de tu plan; las que no uses antes de la fecha de vencimiento se pierden.' : ''}${s.plan === 'premium' ? '\n\n*POLÍTICA DE RESERVAS Y CANCELACIONES*\n*Clases VIP:* reserva mínimo 4 horas antes. Cancelación sin penalización mínimo 2 horas antes. Cancelación tardía o inasistencia: la clase se descuenta del paquete y no será repuesta.\n*Clases grupales ilimitadas:* asiste a todas las de tu nivel, sin límite mensual. Reserva tu cupo mínimo 3 horas antes (máximo 10 estudiantes por sesión; si se llena, elige otro horario). Puedes cancelar hasta 2 horas antes; si cancelas después o no asistes, no hay ninguna penalización ni pierdes el acceso a futuras clases grupales.\n*Duración:* todas las clases duran 50 minutos.\nPolítica completa: ' + BASE + 'politica.html' : ''}\n\n¡Aprende inglés HABLANDO!`;
  function shareCode(s) {
    const msg = accessMsg(s);
    const m = modal(`<div class="center"><div style="font-size:44px">🔑</div><h2>Código de ${esc(s.first)}</h2><div class="ad-code">${esc(s.code)}</div><p class="muted">Envíaselo por WhatsApp o cópialo.</p>
      <textarea class="inp" rows="6" readonly>${esc(msg)}</textarea><div class="row" style="justify-content:center;margin-top:10px"><button class="btn w" id="sc-c">📋 Copiar mensaje</button>${s.whatsapp ? `<a class="btn ad-wa" target="_blank" rel="noopener" href="${waLink(s.whatsapp, msg)}">💬 Enviar por WhatsApp</a>` : ''}</div></div>`);
    $('#sc-c', m).onclick = () => copy(msg);
  }
  async function studentDetail(code) {
    view().innerHTML = '<div class="ad-loading">⏳ Cargando estudiante…</div>'; window.scrollTo(0, 0);
    const r = await api('aGet', { table: 'Estudiantes', id: code }); if (!r.ok) return view().innerHTML = `${back()}<p class="ad-err">No se encontró.</p>`, wireBack(() => go('students'));
    const s = r.row, st = r.state, pr = J(s.progress, {}); const k = st.expired ? 'expired' : st.eff;
    view().innerHTML = `${back()}
      <div class="card ad-dhead"><div class="ad-av lg">${esc(((s.first || '?')[0] + (s.last || '')[0]).toUpperCase())}</div><div class="grow"><h1>${esc(s.first)} ${esc(s.last)}</h1>
        <p>${chip(PLAN[k].join(' '), 'p-' + k)} <button class="ad-codebtn" id="d-code" title="Copiar">${esc(s.code)} 📋</button></p>
        <p class="muted">${s.email ? '📧 ' + esc(s.email) : ''} ${s.whatsapp ? ' · 📱 ' + esc(s.whatsapp) : ''} ${s.birth ? ' · 🎂 ' + fD(s.birth, { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p></div>
        <div class="ad-dact">${s.whatsapp ? `<a class="btn ad-wa sm" target="_blank" rel="noopener" href="${waLink(s.whatsapp, 'Hola ' + s.first + '.')}">💬 WhatsApp</a>` : ''}<button class="btn w sm" id="d-share">🔑 Enviar código</button><button class="btn w sm" id="d-rst">♻️ Reiniciar progreso</button><button class="btn w sm ad-del" id="d-del">🗑️ Borrar</button></div></div>
      <div class="card ad-plan"><h3>💎 Plan</h3>
        <p>${st.eff === 'free' && !st.expired ? 'Acceso gratuito: prueba de clasificación + los 2 primeros temas.' : `${PLAN[s.plan] ? PLAN[s.plan].join(' ') : ''} · desde ${fD(s.planStart)} hasta <b>${fD(s.planEnd)}</b> ${st.expired ? chip('VENCIDO', 'p-expired') : st.daysLeft !== null ? chip(st.daysLeft + ' días restantes', st.daysLeft <= 5 ? 'p-expired' : 'gray') : ''}`}</p>
        <div class="ad-planbtns"><button class="btn w" data-plan="membership">⭐ Activar Membership</button><button class="btn k" data-plan="premium">👑 Activar Premium</button>${s.plan !== 'free' ? `<button class="btn w" data-plan="${esc(s.plan)}" data-renew="1">🔁 Renovar ${esc(PLAN[s.plan][1])}</button><button class="btn w" data-plan="free">🟢 Pasar a gratuito</button>` : ''}</div>
        ${st.eff === 'premium' && r.credits ? `<div class="ad-cred"><span>⭐ VIP: <b>${r.credits.vipUsed}/${r.credits.vipTotal}</b> usadas</span><span>🎙️ Clubs asistidos: <b>${r.credits.groupDone}/${r.credits.groupTotal}</b></span><span>Ciclo: ${fD(r.credits.cycleStart)} → ${fD(r.credits.cycleEnd)}</span></div>` : ''}
        ${(r.plans || []).length ? `<details><summary>Historial de pagos/planes (${r.plans.length})</summary><div class="ad-mini">${r.plans.map(p => `<div class="ad-mrow"><b>${PLAN[p.plan] ? PLAN[p.plan].join(' ') : esc(p.plan)} · ${esc(p.months || 0)} mes(es) · ${money(p.amount)}</b><span>${fDT(p.date)} · ${fD(p.start)} → ${fD(p.end)}${p.note ? ' · ' + esc(p.note) : ''}</span></div>`).join('')}</div></details>` : ''}</div>
      <div class="card"><h3>🧭 Progreso en su ruta</h3><p class="muted">Módulo actual: <b>${s.module ? 'Módulo ' + s.module + ' · ' + MODN[s.module] : 'aún sin placement'}</b>${s.moduleBy ? ' (' + (s.moduleBy === 'admin' ? 'asignado por administración' : 'por prueba de clasificación') + ')' : ''} · ✅ ${+s.classesDone || 0} clases · ⚡ ${+s.xp || 0} XP · 🕒 última conexión ${s.lastSeen ? fDT(s.lastSeen) : 'nunca'}</p>
        <div class="ad-mods">${['A1', 'A2', 'B2', 'B2+'].map(id => { const x = pr[id] || { done: 0, total: 0, pct: 0 }; return `<div class="ad-mod${x.passed ? ' ok' : ''}"><b>${id}</b>${bar(x.pct)}<span>${x.done}/${x.total || '—'} clases · ${x.pct || 0}%${x.passed ? ' · 🎓 aprobado' : ''}</span></div>`; }).join('')}</div>
        ${(r.placements || []).length ? `<h4>📝 Exámenes de clasificación</h4><div class="ad-mini">${r.placements.map(p => `<button class="ad-mrow" data-pl="${esc(p.id)}"><b>${esc(p.level || ('Módulo ' + p.module))} · nota ${esc(p.final)}</b><span>${fDT(p.date)} · ▶ ver y escuchar audios</span></button>`).join('')}</div>` : ''}</div>
      <div class="card"><h3>👩‍🏫 Clases con profesores · ${r.classes.filter(c => c.attended).length} asistidas</h3>${r.classes.length ? `<div class="ad-mini">${r.classes.map(c => `<div class="ad-mrow"><b>${c.type === 'vip' ? '⭐ VIP' : c.type === 'club' ? '🎙️ Club' : '👥 Grupal'} · ${fD(c.date)} ${fT(c.time)} · ${esc(c.teacher)}</b><span>${c.status === 'done' ? (c.attended ? '✅ asistió' : '❌ no asistió') : c.status === 'scheduled' ? '📅 programada' : c.status === 'cancelled' ? 'cancelada' : '❌ no asistió'}</span></div>`).join('')}</div>` : '<p class="muted">Sin clases todavía.</p>'}
        ${(r.requests || []).length ? `<h4>🔁 Solicitudes</h4><div class="ad-mini">${r.requests.map(q => `<div class="ad-mrow"><b>${esc(q.preferred)}</b><span>${fDT(q.date)} · ${esc(q.status)}</span></div>`).join('')}</div>` : ''}</div>
      <div class="card"><h3>✏️ Datos del estudiante</h3>${studentForm(s, false)}<button class="btn k" id="d-save">💾 Guardar cambios</button></div>`;
    wireBack(() => go('students'));
    $('#d-code').onclick = () => copy(s.code); $('#d-share').onclick = () => shareCode(s); $('#d-rst').onclick = () => { const m = modal(`<div class="center"><div style="font-size:44px">♻️</div><h2>¿Reiniciar el progreso de ${esc(s.first)}?</h2><p class="muted">Se borran sus clases completadas, puntos y resultado de la prueba de clasificación. Su código y su plan se conservan. Al volver a entrar empezará desde cero.</p><div class="row" style="justify-content:center"><button class="btn w" id="rs-n">Cancelar</button><button class="btn k" id="rs-y">♻️ Sí, reiniciar</button></div></div>`);
      $('#rs-n', m).onclick = () => m.remove(); $('#rs-y', m).onclick = async () => { $('#rs-y', m).disabled = true; const r = await api('aReset', { code: s.code }); m.remove(); if (r.ok) { toast('♻️ Progreso reiniciado'); studentDetail(s.code); } else toast('No se pudo reiniciar'); }; };
    $('#d-del').onclick = () => delAsk('Estudiantes', s.code, (s.first + ' ' + s.last).trim(), 'Se borra su código y sus datos. Ya no podrá entrar a la plataforma.', () => go('students'));
    $$('[data-pl]').forEach(x => x.onclick = () => placementDetail(x.dataset.pl, () => studentDetail(code)));
    $$('[data-plan]').forEach(b => b.onclick = () => planModal(s, b.dataset.plan, !!b.dataset.renew));
    $('#d-save').onclick = async () => { const d = formData($('.ad-form', view())); const b = $('#d-save'); b.disabled = true;
      const res = await api('aSave', { table: 'Estudiantes', row: Object.assign(d, { code: s.code }) }); b.disabled = false; if (res.ok) { toast('✅ Guardado'); studentDetail(code); } else toast('No se pudo guardar'); };
  }
  function planModal(s, plan, renew) {
    const free = plan === 'free';
    const m = modal(`<h2>${free ? '🟢 Pasar a acceso gratuito' : (renew ? '🔁 Renovar ' : 'Activar ') + PLAN[plan].join(' ')}</h2>
      <p class="muted">${esc(s.first)} ${esc(s.last)} · ${esc(s.code)}</p>
      ${free ? '<p>El estudiante conservará su progreso, pero solo tendrá abiertos los 2 primeros temas.</p>' : `<div class="ad-form"><label>Meses<select class="inp" id="pm-m">${[1, 2, 3, 6, 12].map(n => `<option>${n}</option>`).join('')}</select></label>
        <label>Valor pagado (COP)<input class="inp" id="pm-a" inputmode="numeric" value="${PRICE[plan]}"></label>
        <label>Fecha de vencimiento <small>(opcional, manual)</small><input class="inp" id="pm-e" type="date"></label><label>Nota<input class="inp" id="pm-n" placeholder="Ej: transferencia Bancolombia 11 oct"></label></div>
        <label class="ad-chk"><input type="checkbox" id="pm-mail" checked> Enviarle correo de confirmación</label>
        <p class="muted" id="pm-info"></p>`}
      <button class="btn k block lg" id="pm-ok">${free ? 'Confirmar' : '✅ Activar plan'}</button>`);
    if (!free) { const upd = () => { const mo = +$('#pm-m', m).value; $('#pm-a', m).value = PRICE[plan] * mo; $('#pm-info', m).textContent = renew || s.plan === plan ? 'Si el plan sigue activo, los meses se suman a la fecha actual de vencimiento.' : 'El plan empieza hoy.'; }; $('#pm-m', m).onchange = upd; upd(); }
    $('#pm-ok', m).onclick = async () => { $('#pm-ok', m).disabled = true;
      const r = await api('aPlan', free ? { code: s.code, plan: 'free' } : { code: s.code, plan, months: +$('#pm-m', m).value, amount: $('#pm-a', m).value.replace(/\D/g, ''), end: $('#pm-e', m).value || undefined, note: $('#pm-n', m).value, notify: $('#pm-mail', m).checked });
      m.remove(); if (r.ok) { toast(free ? 'Listo' : `✅ ${PLAN[plan][1]} activo hasta ${fD(r.row.planEnd)}`); studentDetail(s.code); } else toast('No se pudo actualizar el plan'); };
  }

  /* ======================= INSCRIPCIONES ======================= */
  const ENR_ST = [['nuevo', '🆕 Nuevo'], ['contactado', '📞 Contactado'], ['inscrito', '✅ Inscrito'], ['descartado', '🗑 Descartado']];
  const planName = (k) => ({ free: '🟢 Acceso gratuito', membership: '⭐ Membership', premium: '👑 Premium' }[k] || k || '—');
  function enroll() {
    list('enroll', { title: '📝 Inscripciones', sub: `Formulario: ${BASE}inscripcion.html`,
      filters: [{ k: 'status', opts: [['', 'Todos los estados']].concat(ENR_ST) }],
      row: x => `<div class="card ad-row" data-open="${esc(x.id)}"><div class="ad-av">${esc((x.first || '?')[0].toUpperCase())}</div><div class="grow"><b>${esc(x.first)} ${esc(x.last)}</b> ${chip((ENR_ST.find(s => s[0] === x.status) || ['', x.status])[1], 'st-' + x.status)}
        <small>${planName(x.plan)} · ${fDT(x.date)}</small><div class="ad-rowstats"><span>📧 ${esc(x.email)}</span><span>📱 ${esc(x.whatsapp)}</span>${x.code ? `<span>🔑 ${esc(x.code)}</span>` : ''}</div></div></div>`,
      open: (id, x) => enrollDetail(x), empty: 'Aún no hay inscripciones. Comparte el formulario de inscripción.' });
  }
  function enrollDetail(x) {
    view().innerHTML = `${back()}<div class="card ad-dhead"><div class="ad-av lg">${esc((x.first || '?')[0].toUpperCase())}</div><div class="grow"><h1>${esc(x.first)} ${esc(x.last)}</h1><p>${planName(x.plan)} · ${fDT(x.date)}</p></div>
      <div class="ad-dact">${x.whatsapp ? `<a class="btn ad-wa sm" target="_blank" rel="noopener" href="${waLink(x.whatsapp, '¡Hola ' + x.first + '! Te escribimos de mrarrieta.com por tu inscripción.')}">💬 WhatsApp</a>` : ''}</div></div>
      <div class="card"><div class="ad-kv">${[['Correo', x.email], ['WhatsApp', x.whatsapp], ['Fecha de nacimiento', x.birth ? fD(x.birth, { day: 'numeric', month: 'long', year: 'numeric' }) : ''], ['Ciudad / país', x.city], ['Plan de interés', planName(x.plan)], ['Nivel aproximado', x.level], ['Horario preferido', [x.schedule, x.days].filter(Boolean).join(' · ')], ['Medio de pago', x.payment], ['¿Cómo nos conoció?', x.source], ['Comentarios', x.comments]].map(([k, v]) => `<span>${k}</span><b>${esc(v || '—')}</b>`).join('')}</div></div>
      <div class="card"><h3>Acceso a la plataforma</h3>${x.code ? `<p>✅ Ya tiene código: <button class="ad-codebtn" id="e-open">${esc(x.code)} → ver estudiante</button></p>` : `<p class="muted">Crea su estudiante con un clic: se genera su código, queda con <b>Acceso gratuito</b> y le llega un correo con el código. Si ya pagó, actívale el plan desde su ficha.</p><button class="btn k lg" id="e-conv">🔑 Crear acceso (código)</button>`}</div>
      <div class="card"><h3>Seguimiento</h3><div class="ad-form"><label>Estado<select class="inp" id="e-st">${ENR_ST.map(([v, n]) => `<option value="${v}" ${x.status === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label class="full">Notas<textarea class="inp" id="e-n" rows="2">${esc(x.notes)}</textarea></label></div><button class="btn w" id="e-sv">💾 Guardar</button></div>`;
    wireBack(() => go('enroll'));
    if ($('#e-open')) $('#e-open').onclick = () => studentDetail(x.code);
    if ($('#e-conv')) $('#e-conv').onclick = async () => { $('#e-conv').disabled = true; $('#e-conv').textContent = 'Creando…'; const r = await api('aConvert', { id: x.id }); if (r.ok) { x.code = r.code; x.status = 'inscrito'; toast('✅ Acceso creado: ' + r.code); shareCode({ code: r.code, first: x.first, whatsapp: x.whatsapp }); enrollDetail(x); } else { toast('No se pudo crear'); $('#e-conv').disabled = false; } };
    $('#e-sv').onclick = async () => { const r = await api('aStatus', { table: 'Inscripciones', id: x.id, status: $('#e-st').value, notes: $('#e-n').value }); if (r.ok) { x.status = $('#e-st').value; x.notes = $('#e-n').value; toast('✅ Guardado'); } };
  }

  /* ======================= ARCHIVOS / AUDIOS ======================= */
  async function fileBlobUrl(id) { const r = await api('aFile', { id }); if (!r.ok) return null; if (r.big || !r.b64) return { drive: r.url }; const bin = atob(r.b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return { url: URL.createObjectURL(new Blob([u8], { type: r.mime })), drive: r.url, name: r.name, mime: r.mime }; }
  function audioList(files, answers) {
    const ans = J(answers, []);
    const fl = J(files, []).filter(f => /audio|webm/.test(f.mime || ''));
    if (!fl.length && !ans.length) return '<p class="muted">Sin grabaciones.</p>';
    const rows = fl.length ? fl : ans;
    return `<div class="ad-audios">${rows.sort((a, b) => (+a.i || 0) - (+b.i || 0)).map(f => { const a = ans.find(x => +x.i === +f.i) || {}; return `<div class="ad-au"><div class="ad-au-h"><b>🎤 Pregunta ${esc(f.i || '')}</b><small>${esc(f.label || a.task || '')}</small></div>
      ${(f.transcript || a.transcript) ? `<p class="ad-tr">“${esc(f.transcript || a.transcript)}”</p>` : ''}${f.fileId ? `<div class="ad-au-p" data-f="${esc(f.fileId)}"><button class="btn w sm">▶ Escuchar</button><a class="ad-drive" target="_blank" rel="noopener" href="https://drive.google.com/file/d/${esc(f.fileId)}/view">Abrir en Drive</a></div>` : '<small class="muted">(audio no subido)</small>'}</div>`; }).join('')}</div>`;
  }
  function wireAudios(root) {
    $$('.ad-au-p', root).forEach(p => { const b = $('button', p); b.onclick = async () => { b.disabled = true; b.textContent = '⏳ Cargando…'; const f = await fileBlobUrl(p.dataset.f);
      if (!f) { b.disabled = false; b.textContent = '▶ Reintentar'; return toast('No se pudo cargar el audio'); }
      if (!f.url) { window.open(f.drive, '_blank'); b.disabled = false; b.textContent = '▶ Escuchar'; return; }
      const au = document.createElement('audio'); au.controls = true; au.src = f.url; au.className = 'ad-player'; b.replaceWith(au); au.play().catch(() => { }); }; });
  }

  /* ======================= PLACEMENT ======================= */
  function placement() {
    list('placement', { title: '🧭 Prueba de clasificación', sub: 'Resultados y audios de Speaking',
      row: x => `<div class="card ad-row" data-open="${esc(x.id)}"><div class="ad-av">${esc((x.name || '?')[0].toUpperCase())}</div><div class="grow"><b>${esc(x.name)}</b> ${chip(esc(x.level || ('Módulo ' + x.module)), 'p-membership')}
        <small>${fDT(x.date)} · ${esc(x.attempt)} ${x.code ? '· 🔑 ' + esc(x.code) : ''}</small><div class="ad-rowstats"><span>🎧 ${esc(x.listening)}</span><span>📖 ${esc(x.reading)}</span><span>✍️ ${esc(x.writing)}</span><span>🎤 ${esc(x.speaking)}</span><span><b>Nota ${esc(x.final)}</b></span><span>🔊 ${J(x.files, []).length} audios</span></div></div></div>`,
      open: (id) => placementDetail(id, () => go('placement')), empty: 'Aún nadie ha tomado la prueba de clasificación con la nube activa.' });
  }
  async function placementDetail(id, onBack) {
    view().innerHTML = '<div class="ad-loading">⏳ Cargando…</div>'; window.scrollTo(0, 0);
    const r = await api('aGet', { table: 'Placement', id }); if (!r.ok) return; const x = r.row; const mods = J(x.mods, {});
    view().innerHTML = `${back()}<div class="card ad-dhead"><div class="ad-av lg">${esc((x.name || '?')[0].toUpperCase())}</div><div class="grow"><h1>${esc(x.name)}</h1><p>${chip(esc(x.level || ''), 'p-membership')} ${x.timedOut ? chip('⏱ se acabó el tiempo', 'gray') : ''}</p><p class="muted">${fDT(x.date)} · ${esc(x.attempt)} · ${esc(x.email)} ${x.whatsapp ? '· ' + esc(x.whatsapp) : ''}</p></div>
      <div class="ad-dact">${x.code ? `<button class="btn w sm" id="p-st">🎓 Ver estudiante</button>` : ''}${x.whatsapp ? `<a class="btn ad-wa sm" target="_blank" rel="noopener" href="${waLink(x.whatsapp, 'Hola ' + x.name + ' 👋')}">💬</a>` : ''}</div></div>
      <div class="card"><h3>Resultados</h3><div class="ad-scores">${[['🎧 Listening', x.listening], ['📖 Reading', x.reading], ['✍️ Writing', x.writing], ['🎤 Speaking', x.speaking], ['⭐ Nota final', x.final]].map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b>${bar(+v * 10)}</div>`).join('')}</div>
        <h4>Dominio por módulo</h4><div class="ad-mods">${[1, 2, 3, 4].map(n => `<div class="ad-mod${+x.module === n ? ' ok' : ''}"><b>${MODN[n]}</b>${bar(mods[n])}<span>${mods[n] != null ? mods[n] + '%' : '—'}${+x.module === n ? ' · 📍 empieza aquí' : ''}</span></div>`).join('')}</div></div>
      <div class="card"><h3>🎤 Grabaciones de Speaking</h3>${audioList(x.files, x.speakingAnswers)}</div>`;
    wireBack(onBack); wireAudios(view()); if ($('#p-st')) $('#p-st').onclick = () => studentDetail(x.code);
  }

  /* ======================= RECLUTAMIENTO ======================= */
  const REC_ST = [['nuevo', '🆕 Nuevo'], ['entrevista', '📞 Entrevista'], ['contratado', '✅ Contratado'], ['descartado', '🗑 Descartado']];
  function recruit() {
    list('recruit', { title: '👩‍🏫 Proceso de selección', sub: `Formulario para candidatos: ${BASE}reclutamiento.html`,
      filters: [{ k: 'status', opts: [['', 'Todos los estados']].concat(REC_ST) }, { k: 'passed', opts: [['', 'Aprobados y no aprobados'], ['sí', '✅ Aprobados'], ['no', '❌ No aprobados']] }],
      row: x => `<div class="card ad-row" data-open="${esc(x.id)}"><div class="ad-av">${esc((x.name || '?')[0].toUpperCase())}</div><div class="grow"><b>${esc(x.name)}</b> ${chip(x.passed === 'sí' ? '✅ Aprobó' : '❌ No aprobó', x.passed === 'sí' ? 'p-premium' : 'p-expired')} ${chip((REC_ST.find(s => s[0] === x.status) || ['', x.status])[1], 'st-' + x.status)}
        <small>${fDT(x.date)} · ${esc(x.city)} · ${esc(x.experience)}</small><div class="ad-rowstats"><span>🎧 ${esc(x.listening)}</span><span>📖 ${esc(x.reading)}</span><span>✍️ ${esc(x.writing)}</span><span>🎤 ${esc(x.speaking)}</span><span><b>Final ${esc(x.final)}</b></span><span>${J(x.cv, null) ? '📄 CV' : 'sin CV'}</span></div></div></div>`,
      open: (id) => recruitDetail(id), empty: 'Aún no hay candidatos. Comparte el enlace del proceso de selección.' });
  }
  async function recruitDetail(id) {
    view().innerHTML = '<div class="ad-loading">⏳ Cargando…</div>'; window.scrollTo(0, 0);
    const r = await api('aGet', { table: 'Reclutamiento', id }); if (!r.ok) return; const x = r.row; const cv = J(x.cv, null);
    view().innerHTML = `${back()}<div class="card ad-dhead"><div class="ad-av lg">${esc((x.name || '?')[0].toUpperCase())}</div><div class="grow"><h1>${esc(x.name)}</h1><p>${chip(x.passed === 'sí' ? '✅ APROBÓ' : '❌ NO APROBÓ', x.passed === 'sí' ? 'p-premium' : 'p-expired')} · nota final <b>${esc(x.final)}</b></p><p class="muted">${fDT(x.date)} · 📧 ${esc(x.email)} · 📱 ${esc(x.whatsapp)}</p></div>
      <div class="ad-dact">${x.whatsapp ? `<a class="btn ad-wa sm" target="_blank" rel="noopener" href="${waLink(x.whatsapp, 'Hola ' + x.name + '. Te escribimos de mrarrieta.com por tu proceso de selección.')}">💬 WhatsApp</a>` : ''}</div></div>
      <div class="card"><div class="ad-kv">${[['Ciudad / país', x.city], ['Experiencia', x.experience], ['Disponibilidad', x.availability], ['Sobre el candidato', x.about]].map(([k, v]) => `<span>${k}</span><b>${esc(v || '—')}</b>`).join('')}</div>
        <h4>📄 Hoja de vida</h4>${cv ? `<div class="row"><button class="btn w" id="r-cv">⬇️ Descargar ${esc(cv.name)}</button><a class="btn w" target="_blank" rel="noopener" href="https://drive.google.com/file/d/${esc(cv.fileId)}/view">Abrir en Drive</a></div>` : '<p class="muted">No adjuntó hoja de vida.</p>'}</div>
      <div class="card"><h3>Resultados de la prueba</h3><div class="ad-scores">${[['🎧 Listening', x.listening], ['📖 Reading', x.reading], ['✍️ Writing', x.writing], ['🎤 Speaking', x.speaking], ['⭐ Final', x.final]].map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b>${bar(+v * 10)}</div>`).join('')}</div></div>
      <div class="card"><h3>🎤 Grabaciones de Speaking</h3>${audioList(x.files, x.speakingAnswers)}</div>
      <div class="card"><h3>Seguimiento</h3><div class="ad-form"><label>Estado<select class="inp" id="r-st">${REC_ST.map(([v, n]) => `<option value="${v}" ${x.status === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label class="full">Notas<textarea class="inp" id="r-n" rows="2">${esc(x.notes)}</textarea></label></div>
        <div class="row"><button class="btn w" id="r-sv">💾 Guardar</button><button class="btn k" id="r-hire">🧑‍🏫 Crear como profesor</button></div></div>`;
    wireBack(() => go('recruit')); wireAudios(view());
    if ($('#r-cv')) $('#r-cv').onclick = async () => { const f = await fileBlobUrl(cv.fileId); if (!f) return toast('No se pudo descargar'); if (!f.url) return window.open(f.drive, '_blank'); const a = document.createElement('a'); a.href = f.url; a.download = cv.name || 'hoja_de_vida'; a.click(); };
    $('#r-sv').onclick = async () => { const res = await api('aStatus', { table: 'Reclutamiento', id: x.id, status: $('#r-st').value, notes: $('#r-n').value }); if (res.ok) toast('✅ Guardado'); };
    $('#r-hire').onclick = () => teacherEdit({ name: x.name, email: x.email, whatsapp: x.whatsapp }, async () => { await api('aStatus', { table: 'Reclutamiento', id: x.id, status: 'contratado' }); });
  }

  /* ======================= PROFESORES ======================= */
  function teachers() {
    list('teachers', { title: '🧑‍🏫 Profesores', sub: `Portal de profes (disponibilidad y asistencia): ${BASE}profesores.html`, add: '＋ Nuevo profesor', onAdd: () => teacherEdit({}),
      row: t => { const s = REF.teachers.find(x => x.id === t.id) || {}; return `<div class="card ad-row" data-open="${esc(t.id)}"><div class="ad-av">${esc((t.name || '?')[0].toUpperCase())}</div><div class="grow"><b>${esc(t.name)}</b> ${t.active === 'no' ? chip('inactivo', 'gray') : chip('activo', 'p-premium')}
        <small>${esc(t.code)}</small><div class="ad-rowstats"><span>✅ ${s.taughtMonth || 0} dictadas este mes</span><span>📚 ${s.taughtTotal || 0} en total (⭐ ${s.vipTotal || 0} VIP · 👥 ${s.groupTotal || 0} grupales)</span><span>📅 ${s.upcoming || 0} programadas</span><span>🟢 ${s.freeSlots || 0} espacios libres</span></div></div></div>`; },
      open: (id) => teacherDetail(id), empty: 'Aún no hay profesores. Crea el primero.' });
    payCard();
  }
  // 💰 pagos a profesores (dentro de la pestaña Profesores)
  async function payCard() {
    const v = view(); v.insertAdjacentHTML('beforeend', `<div class="card" id="py-card" style="margin-top:16px"><h3>💰 Pagos a profesores</h3><p class="muted">Los profes cobran solo las clases <b>dictadas</b>. Si el profe se conecta y el estudiante no asiste, se paga el valor de inasistencia. Las canceladas no se pagan. Marca cada mes como <b>pagado</b> cuando hagas la transferencia: el profe recibe un aviso y un correo.</p>
      <div class="ad-form"><label>Mes<input class="inp" type="month" id="py-m" value="${todayISO().slice(0, 7)}"></label></div><div id="py-out" class="ad-mini"><p class="muted">⏳ Calculando…</p></div>
      <details style="margin-top:12px"><summary><b>⚙️ Valores de pago</b> <small class="muted">(cámbialos cuando se actualicen cada año)</small></summary><div class="ad-form" style="margin-top:8px"><label>Valor por clase dictada (COP)<input class="inp" inputmode="numeric" id="py-rate"></label><label>Valor si el estudiante no asiste (COP)<input class="inp" inputmode="numeric" id="py-ns"></label></div><button class="btn k" id="py-sv">💾 Guardar valores</button></details></div>`);
    const COP = n => '$' + Math.round(+n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const loadPay = async () => { const o = $('#py-out'); if (!o) return; o.innerHTML = '<p class="muted">⏳ Calculando…</p>'; const p = await api('aPayroll', { month: $('#py-m').value });
      if (!p.ok) { o.innerHTML = '<p class="muted">No se pudo calcular.</p>'; return; }
      const tot = p.teachers.reduce((a, t) => a + t.total, 0), pend = p.teachers.filter(t => !t.paid).reduce((a, t) => a + t.total, 0);
      o.innerHTML = p.teachers.length ? p.teachers.map(t => `<div class="ad-pay-row"><div><b>${esc(t.name)}</b><small class="muted" style="display:block">${t.done} dictada(s) · ${t.noshow} inasist.</small></div><b>${COP(t.total)}</b><span class="tp-paid ${t.paid ? 'ok' : 'pend'}">${t.paid ? '✅ Pagado' : '⏳ Pendiente'}</span><button class="btn ${t.paid ? 'w' : 'k'} sm" data-pay="${esc(t.id)}" data-st="${t.paid ? '0' : '1'}">${t.paid ? 'Marcar pendiente' : '💰 Marcar pagado'}</button></div>`).join('') + `<div class="ad-pay-row"><b>Total del mes</b><b>${COP(tot)}</b><span class="muted">Pendiente: <b>${COP(pend)}</b></span><span></span></div>` : '<p class="muted">No hay clases registradas en este mes.</p>';
      $$('[data-pay]', o).forEach(b => b.onclick = async () => { const paid = b.dataset.st === '1'; if (paid && !confirm('¿Confirmas que ya se realizó este pago? El profe recibirá un aviso.')) return; b.disabled = true; const r = await api('aPaySet', { teacherId: b.dataset.pay, month: $('#py-m').value, paid }); if (r.ok) { toast(paid ? '✅ Pago registrado. El profe ya fue notificado.' : 'Marcado como pendiente'); loadPay(); } else { b.disabled = false; toast('No se pudo guardar'); } }); };
    $('#py-m').onchange = loadPay; loadPay();
    const cf = await api('aList', { table: 'Config', size: 200 }); const conf = {}; (cf.rows || []).forEach(x => conf[x.key] = x.value);
    if (!$('#py-rate')) return; $('#py-rate').value = conf.pay_rate || '21800'; $('#py-ns').value = conf.pay_noshow || '10000';
    $('#py-sv').onclick = async () => { const b = $('#py-sv'); b.disabled = true; const rate = $('#py-rate').value.replace(/\D/g, ''), ns = $('#py-ns').value.replace(/\D/g, ''); if (!rate || !ns) { b.disabled = false; return toast('Escribe los dos valores'); }
      await api('aSave', { table: 'Config', row: { key: 'pay_rate', value: rate } }); await api('aSave', { table: 'Config', row: { key: 'pay_noshow', value: ns } }); b.disabled = false; toast('✅ Valores guardados'); loadPay(); };
  }
  function delAsk(table, id, name, note, after) {
    const m = modal(`<div class="center"><div style="font-size:44px">🗑️</div><h2>¿Borrar a ${esc(name)}?</h2><p class="muted">${note}</p><p><b>Esto no se puede deshacer.</b></p><div class="row" style="justify-content:center;margin-top:10px"><button class="btn w" id="dl-no">Cancelar</button><button class="btn k ad-del" id="dl-ok">🗑️ Sí, borrar</button></div></div>`);
    $('#dl-no', m).onclick = () => m.remove();
    $('#dl-ok', m).onclick = async () => { $('#dl-ok', m).disabled = true; const r = await api('aDelete', { table, id }); m.remove(); if (r.ok) { toast('🗑️ Borrado'); after && after(); } else toast('No se pudo borrar'); };
  }
  function teacherEdit(t, after) {
    t = t || {};
    const m = modal(`<h2>${t.id ? '✏️ Editar profesor' : '＋ Nuevo profesor'}</h2><div class="ad-form">
      <label>Nombre<input class="inp" name="name" value="${esc(t.name)}"></label><label>Correo<input class="inp" name="email" type="email" value="${esc(t.email)}"></label>
      <label>WhatsApp<input class="inp" name="whatsapp" value="${esc(t.whatsapp)}"></label><label>Código de profe <small>(vacío = automático)</small><input class="inp" name="code" value="${esc(t.code)}" style="text-transform:uppercase"></label>
      <label>PIN <small>(vacío = automático)</small><input class="inp" name="pin" inputmode="numeric" value="${esc(t.pin)}"></label>${[0, 1, 2].map(i => `<label class="full">Enlace de clase ${i + 1} (Meet/Zoom)${i ? ' <small>— de respaldo</small>' : ''}<input class="inp" name="meet${i}" placeholder="https://meet.google.com/…" value="${esc(String(t.meet || '').split(/[\s,;]+/).filter(Boolean)[i] || '')}"></label>`).join('')}<p class="muted full" style="margin:0">Los 3 enlaces se rotan para que las clases seguidas no usen el mismo.</p>
      <label class="full">Presentación corta (la ven los estudiantes Premium)<input class="inp" name="bio" maxlength="140" value="${esc(t.bio)}"></label>
      <label>Saludo<select class="inp" name="gender"><option value="" ${!t.gender ? 'selected' : ''}>Automático (por el nombre)</option><option value="f" ${t.gender === 'f' ? 'selected' : ''}>Mrs. (mujer)</option><option value="m" ${t.gender === 'm' ? 'selected' : ''}>Mr. (hombre)</option></select></label><label>Activo<select class="inp" name="active"><option value="sí" ${t.active !== 'no' ? 'selected' : ''}>sí</option><option value="no" ${t.active === 'no' ? 'selected' : ''}>no</option></select></label></div>
      <button class="btn k block lg" id="te-ok">💾 Guardar</button>`);
    $('#te-ok', m).onclick = async () => { const d = formData(m); if (!d.name) return toast('Escribe el nombre'); d.meet = [d.meet0, d.meet1, d.meet2].map(x => (x || '').trim()).filter(Boolean).join('\n'); delete d.meet0; delete d.meet1; delete d.meet2; if (t.id) d.id = t.id; d.code = (d.code || '').toUpperCase();
      $('#te-ok', m).disabled = true; const r = await api('aSave', { table: 'Profesores', row: d }); m.remove();
      if (!r.ok) return toast('No se pudo guardar'); await loadRef(); after && after(r.row);
      if (!t.id) modal(`<div class="center"><h2>✅ Profesor creado</h2><div class="ad-code">${esc(r.row.code)} · PIN ${esc(r.row.pin)}</div><p>${r.row.mailed ? '📧 Se le envió un correo automático de bienvenida a <b>' + esc(r.row.email) + '</b> con su código, PIN y el enlace al portal de profesores.' : (r.row.email ? '⚠️ No se pudo enviar el correo de bienvenida. Revisa el correo del profe.' : '⚠️ Agrega el correo del profe para enviarle la bienvenida automática.')}</p></div>`);
      else toast('✅ Guardado');
      if (TAB === 'teachers') { if (t.id) teacherDetail(t.id); else teachers(); } };
  }
  async function teacherDetail(id) {
    view().innerHTML = '<div class="ad-loading">⏳ Cargando…</div>'; window.scrollTo(0, 0);
    const r = await api('aGet', { table: 'Profesores', id }); if (!r.ok) return; const t = r.row, s = r.stats || {};
    const slots = (r.slots || []).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const byDate = {}; slots.forEach(x => (byDate[x.date] = byDate[x.date] || []).push(x));
    view().innerHTML = `${back()}<div class="card ad-dhead"><div class="ad-av lg">${esc((t.name || '?')[0].toUpperCase())}</div><div class="grow"><h1>${esc(t.name)}</h1><p>${esc(t.code)} · PIN ${esc(t.pin)}</p><p class="muted">${esc(t.email)} ${t.whatsapp ? '· ' + esc(t.whatsapp) : ''}</p>${t.meet ? `<p class="muted">🎥 ${String(t.meet).split(/[\s,;]+/).filter(Boolean).map(esc).join('<br>🎥 ')}</p>` : ''}</div><div class="ad-dact"><button class="btn w sm" id="t-ed">✏️ Editar</button><button class="btn w sm ad-del" id="t-del">🗑️ Borrar</button></div></div>
      <div class="ad-kpis sm"><div class="ad-kpi"><b>${s.taughtMonth || 0}</b><span>Dictadas este mes</span></div><div class="ad-kpi"><b>${s.taughtTotal || 0}</b><span>Dictadas en total</span><em>⭐ ${s.vipTotal || 0} VIP · 👥 ${s.groupTotal || 0} grupales</em></div><div class="ad-kpi"><b>${s.upcoming || 0}</b><span>Programadas</span></div><div class="ad-kpi"><b>${s.freeSlots || 0}</b><span>Espacios libres</span></div></div>
      <div class="card"><h3>🗓️ Disponibilidad (espacios para clases VIP)</h3><p class="muted">El profe la publica desde su portal; también puedes agregarla aquí.</p>
        <div class="ad-form"><label>Fecha<input class="inp" type="date" id="sl-d" min="${todayISO()}" value="${addDays(todayISO(), 1)}"></label><label>Horas <small>(separadas por coma)</small><input class="inp" id="sl-h" placeholder="07:00, 18:00, 19:00"></label><label>Repetir semanas<select class="inp" id="sl-w">${[1, 2, 3, 4, 6, 8].map(n => `<option>${n}</option>`).join('')}</select></label><label>Duración<select class="inp" id="sl-u"><option>50</option></select></label></div><button class="btn k" id="sl-add">＋ Agregar espacios</button>
        <div class="ad-slots">${Object.keys(byDate).length ? Object.keys(byDate).map(d => `<div class="ad-sday"><b>${fD(d, { weekday: 'short', day: 'numeric', month: 'short' })}</b><div>${byDate[d].map(x => `<span class="ad-slot ${x.status}">${fT(x.time)}${x.status === 'free' ? ` <button data-del="${esc(x.id)}" title="Borrar">✕</button>` : ' · reservado'}</span>`).join('')}</div></div>`).join('') : '<p class="muted">Sin espacios publicados.</p>'}</div></div>
      <div class="card"><h3>📚 Clases</h3>${(r.classes || []).length ? `<div class="ad-mini">${r.classes.map(c => `<div class="ad-mrow"><b>${c.type === 'vip' ? '⭐ VIP' : c.type === 'club' ? '🎙️ Club' : '👥 Grupal'} · ${fD(c.date)} ${fT(c.time)}</b><span>${J(c.students, []).join(', ')} · ${c.status === 'done' ? '✅ dictada' : c.status === 'scheduled' ? '📅 programada' : c.status === 'cancelled' ? 'cancelada' : 'no asistió'}</span></div>`).join('')}</div>` : '<p class="muted">Sin clases.</p>'}</div>`;
    wireBack(() => go('teachers')); $('#t-ed').onclick = () => teacherEdit(t); $('#t-del').onclick = () => delAsk('Profesores', t.id, t.name, 'Se borra su código y sus espacios libres. El historial de clases dictadas se conserva. Si tiene grupos o clubs asignados, asígnale otro profe.', async () => { await loadRef(); go('teachers'); });
    $('#sl-add').onclick = async () => { const d = $('#sl-d').value; const hs = $('#sl-h').value.split(/[,\s]+/).map(x => x.trim()).filter(Boolean).map(x => x.length === 4 ? '0' + x : x).filter(x => /^\d{2}:\d{2}$/.test(x)); if (!d || !hs.length) return toast('Escribe la fecha y las horas (ej: 18:00)');
      const w = +$('#sl-w').value, slots = []; for (let i = 0; i < w; i++) hs.forEach(h => slots.push({ date: addDays(d, i * 7), time: h, duration: $('#sl-u').value }));
      const res = await api('aSlot', { teacherId: t.id, slots }); if (res.ok) { toast(`✅ ${res.added} espacio(s) agregados`); teacherDetail(id); } };
    $$('[data-del]').forEach(b => b.onclick = async () => { const res = await api('aSlot', { del: true, slotId: b.dataset.del }); if (res.ok) teacherDetail(id); else toast('Ese espacio ya está reservado'); });
  }

  /* ======================= CLASES ======================= */
  function classes() {
    list('classes', { title: '📅 Clases', sub: 'VIP (las reservan los estudiantes Premium) y clubs (se crean solos según el horario de Ajustes)', desc: false,
      filters: [{ k: 'status', opts: [['scheduled', '📅 Programadas'], ['done', '✅ Dictadas'], ['noshow', '❌ No asistió'], ['cancelled', 'Canceladas'], ['', 'Todas']] }, { k: 'type', opts: [['', 'VIP y clubs'], ['vip', '⭐ VIP'], ['club', '🎙️ Clubs']] }],
      row: c => { const st = J(c.students, []); const att = J(c.attendance, {}); return `<div class="card ad-row ad-cl ${c.type}" data-open="${esc(c.id)}"><div class="ad-cdate"><b>${fD(c.date, { day: 'numeric' })}</b><small>${fD(c.date, { month: 'short' })}</small></div><div class="grow"><b>${c.type === 'vip' ? '⭐ VIP' : c.type === 'club' ? '🎙️ Club' : '👥 Grupal'} · ${fT(c.time)} · ${esc(tName(c.teacherId))}</b> ${chip({ scheduled: '📅 programada', done: '✅ dictada', noshow: '❌ no asistió', cancelled: 'cancelada' }[c.status] || esc(c.status), 'st-' + c.status)}
        <small>${st.length} estudiante(s)${c.status === 'done' ? ' · asistieron ' + Object.values(att).filter(Boolean).length : ''}${c.topic ? ' · ' + esc(c.topic) : ''}</small></div></div>`; },
      open: (id, c) => classMark(c), empty: 'No hay clases con este filtro.' });
  }
  function classMark(c) {
    const st = J(c.students, []); const att = J(c.attendance, {});
    const m = modal(`<h2>${c.type === 'vip' ? '⭐ Clase VIP' : '👥 Clase grupal'}</h2><p class="muted">${fD(c.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${fT(c.time)} · ${esc(tName(c.teacherId))}${c.meet ? ` · <a href="${esc(c.meet)}" target="_blank" rel="noopener">enlace</a>` : ''}</p>
      <h4>Asistencia</h4>${st.length ? st.map(s => `<label class="ad-chk"><input type="checkbox" data-a="${esc(s)}" ${att[s] !== false && (c.status === 'done' ? att[s] : true) ? 'checked' : ''}> ${esc(s)}</label>`).join('') : '<p class="muted">Sin estudiantes.</p>'}
      <label class="ad-lab">Notas</label><textarea class="inp" id="cm-n" rows="2">${esc(c.notes)}</textarea>
      <div class="ad-planbtns"><button class="btn k" data-s="done">✅ Dictada</button><button class="btn w" data-s="noshow">❌ No asistió</button><button class="btn w" data-s="cancelled">Cancelar clase</button>${c.status !== 'scheduled' ? '<button class="btn w" data-s="scheduled">↩ Volver a programada</button>' : ''}</div>`);
    $$('[data-s]', m).forEach(b => b.onclick = async () => { const a = {}; $$('[data-a]', m).forEach(i => a[i.dataset.a] = i.checked); const r = await api('aMark', { classId: c.id, status: b.dataset.s, attendance: a, notes: $('#cm-n', m).value }); m.remove(); if (r.ok) { toast('✅ Actualizada'); classes(); } });
  }
  function classNew() {
    const m = modal(`<h2>＋ Programar clase</h2><div class="ad-form"><label>Tipo<select class="inp" name="type"><option value="vip">⭐ VIP</option><option value="group">👥 Grupal</option></select></label>
      <label>Profe<select class="inp" name="teacherId">${teacherOpts()}</select></label><label>Fecha<input class="inp" type="date" name="date" value="${addDays(todayISO(), 1)}"></label><label>Hora<input class="inp" type="time" name="time" value="18:00"></label>
      <label>Grupo (si es grupal)<select class="inp" name="groupId">${groupOpts()}</select></label><label>Códigos de estudiantes <small>(coma)</small><input class="inp" name="students" placeholder="LAURA-4062, ANDRES-1234" style="text-transform:uppercase"></label>
      <label class="full">Enlace (opcional)<input class="inp" name="meet"></label><label class="full">Tema<input class="inp" name="topic"></label></div><button class="btn k block lg" id="cn-ok">Programar</button>`);
    $('#cn-ok', m).onclick = async () => { const d = formData(m); if (!d.teacherId || !d.date || !d.time) return toast('Completa profe, fecha y hora');
      d.students = d.students.toUpperCase().split(/[,\s]+/).filter(Boolean); if (!d.meet) d.meet = (REF.teachers.find(t => t.id === d.teacherId) || {}).meet || ''; d.duration = '50';
      const r = await api('aSave', { table: 'Clases', row: d }); m.remove(); if (r.ok) { toast('✅ Clase programada'); classes(); } };
  }

  /* ======================= SOLICITUDES ======================= */
  function requests() {
    list('requests', { title: '🔁 Solicitudes', sub: 'Intentos extra de exámenes que piden los estudiantes',
      filters: [{ k: 'status', opts: [['pendiente', '⏳ Pendientes'], ['aprobada', '✅ Aprobadas'], ['rechazada', '❌ Rechazadas'], ['', 'Todas']] }],
      row: q => `<div class="card ad-row" data-open="${esc(q.id)}"><div class="ad-av">🔁</div><div class="grow"><b>${esc(q.name)}</b> ${chip(esc(q.status), 'st-' + q.status)}<small>${fDT(q.date)} · actual: ${esc(q.currentGroup || 'sin grupo')}</small><div class="ad-rowstats"><span>Prefiere: <b>${esc(q.preferred)}</b></span>${q.reason ? `<span>Motivo: ${esc(q.reason)}</span>` : ''}</div></div></div>`,
      open: (id, q) => reqModal(q), empty: 'No hay solicitudes. 🎉' });
  }
  function reqModal(q) {
    const m = modal(`<h2>🔁 ${esc(q.name)}</h2><p class="muted">${esc(q.code)} · ${fDT(q.date)}</p><div class="ad-kv"><span>Grupo actual</span><b>${esc(q.currentGroup || '—')}</b><span>Horario preferido</span><b>${esc(q.preferred)}</b><span>Motivo</span><b>${esc(q.reason || '—')}</b></div>
      ${q.status === 'pendiente' ? `<label class="ad-lab">Mensaje para el estudiante</label><textarea class="inp" id="rq-n" rows="2"></textarea>
      <div class="ad-planbtns"><button class="btn k" id="rq-y">✅ Aprobar</button><button class="btn w" id="rq-n2">❌ Rechazar</button></div>` : `<p>Estado: <b>${esc(q.status)}</b> ${q.note ? '· ' + esc(q.note) : ''}</p>`}`);
    const res = async (status) => { const r = await api('aReq', { id: q.id, status, note: $('#rq-n', m).value }); m.remove(); if (r.ok) { toast(status === 'aprobada' ? '✅ Aprobada · se le avisó por correo' : 'Solicitud rechazada'); requests(); } };
    if ($('#rq-y', m)) { $('#rq-y', m).onclick = () => res('aprobada'); $('#rq-n2', m).onclick = () => res('rechazada'); }
  }

  /* ======================= AJUSTES ======================= */
  async function settings() {
    view().innerHTML = '<div class="ad-loading">⏳ Cargando…</div>';
    const r = await api('aList', { table: 'Config', size: 200 }); const conf = {}; (r.rows || []).forEach(x => conf[x.key] = x.value);
    const links = [['🌐 Plataforma (estudiantes)', BASE], ['📝 Formulario de inscripción', BASE + 'inscripcion.html'], ['👩‍🏫 Proceso de selección de profes', BASE + 'reclutamiento.html'], ['🧑‍🏫 Portal de profesores', BASE + 'profesores.html'], ['💬 Chat de docentes', BASE + 'docente.html']];
    view().innerHTML = `<div class="ad-head"><h1>⚙️ Ajustes</h1></div>
      <div class="card"><h3>🔗 Enlaces para compartir</h3><div class="ad-mini">${links.map(([n, u]) => `<div class="ad-mrow ad-link"><b>${n}</b><span>${esc(u)}</span><button class="btn w sm" data-cp="${esc(u)}">📋</button></div>`).join('')}</div></div>
      <div class="card"><h3>📣 Anuncio para todos los estudiantes</h3><p class="muted">Aparece en el perfil de cada estudiante. Déjalo vacío para ocultarlo.</p><textarea class="inp" data-k="announcement" rows="2">${esc(conf.announcement)}</textarea></div>
      <div class="card"><h3>🎙️ Horarios de los clubs (Premium)</h3><p class="muted">Cámbialos cuando un profe se enferme o haya un cambio de último momento. Los estudiantes los ven en su perfil según su nivel. Nunca domingos ni festivos.</p>
        ${[['conv', '🗣️ Conversación'], ['fon', '🔤 Fonética']].map(([k, n]) => [['a', 'A1 · A2'], ['b', 'B2 · B2+']].map(([b, lv]) => { const c = 'club_' + k + '_' + b + '_'; return `<div class="ad-club"><h4>${n} · Niveles ${lv}</h4><div class="ad-form"><label>Día<select class="inp" data-k="${c}day">${['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(d => `<option ${conf[c + 'day'] === d ? 'selected' : ''}>${d}</option>`).join('')}</select></label><label>Hora<input class="inp" type="time" data-k="${c}time" value="${esc(conf[c + 'time'])}"></label><label>Profe<select class="inp" data-k="${c}teacher"><option value="">—</option>${(REF.teachers || []).map(t => `<option value="${esc(t.id)}" ${conf[c + 'teacher'] === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label><label class="full">Enlace (Meet/Zoom)<input class="inp" data-k="${c}link" value="${esc(conf[c + 'link'])}" placeholder="https://meet.google.com/…"></label></div></div>`; }).join('')).join('')}</div>
      <button class="btn k lg" id="cf-sv">💾 Guardar ajustes</button>
      <div class="card" style="margin-top:16px"><h3>🔐 Cambiar clave de administración</h3><p class="muted">Mínimo 8 caracteres. No la compartas con nadie.</p><div class="ad-form"><label>Clave actual<input class="inp" type="password" id="pw-old" autocomplete="current-password"></label><label>Nueva clave<input class="inp" type="password" id="pw-new" autocomplete="new-password"></label><label>Repite la nueva clave<input class="inp" type="password" id="pw-new2" autocomplete="new-password"></label></div><button class="btn k" id="pw-sv">🔐 Cambiar clave</button></div>`;
    $$('[data-cp]').forEach(b => b.onclick = () => copy(b.dataset.cp));
    $('#pw-sv').onclick = async () => { const o = $('#pw-old').value, n = $('#pw-new').value, n2 = $('#pw-new2').value;
      if (o !== key()) return toast('La clave actual no es correcta'); if (n.length < 8) return toast('La nueva clave debe tener mínimo 8 caracteres'); if (n !== n2) return toast('Las dos claves nuevas no coinciden');
      $('#pw-sv').disabled = true; const r = await api('aPass', { newKey: n }); $('#pw-sv').disabled = false;
      if (r.ok) { try { sessionStorage.setItem(KK, n); } catch (e) { } $('#pw-old').value = $('#pw-new').value = $('#pw-new2').value = ''; toast('✅ Clave cambiada. Úsala la próxima vez que entres.'); } else toast('No se pudo cambiar la clave'); };
    $('#cf-sv').onclick = async () => { const b = $('#cf-sv'); b.disabled = true; let clubCh = false; for (const i of $$('[data-k]')) { if ((conf[i.dataset.k] || '') !== i.value.trim()) { await api('aSave', { table: 'Config', row: { key: i.dataset.k, value: i.value.trim() } }); if (/^club_/.test(i.dataset.k)) clubCh = true; } } if (clubCh) await api('aClubSync'); b.disabled = false; toast(clubCh ? '✅ Guardado · se actualizaron las sesiones de los clubs y se avisó a los estudiantes que ya habían confirmado' : '✅ Ajustes guardados'); settings(); };
  }

  function chats() {
    view().innerHTML = `<div class="ad-head"><h1>💬 Chats profe ↔ estudiante</h1></div><div class="card"><p class="muted">Aquí puedes leer todas las conversaciones entre profes y estudiantes (solo lectura). En el chat se les informa que administración puede revisar las conversaciones.</p><button class="btn k lg" id="ch-open">💬 Abrir conversaciones</button></div>`;
    const go = () => window.MRLIVE && MRLIVE.open({ title: 'Chats (solo lectura)', roomsAction: 'aChats', getAction: 'aChatGet', readOnly: true, empty: 'Todavía no hay conversaciones.', call: (a, d) => api(a, d) });
    $('#ch-open').onclick = go; go();
  }
  const VIEWS = { home, students, enroll, placement, recruit, teachers, classes, requests, chats, settings };
  key() && MRAC.on ? boot() : login();
})();
