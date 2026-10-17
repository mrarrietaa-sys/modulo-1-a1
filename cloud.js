/* =====================================================================
   NUBE (cliente) — conecta la plataforma con Google Apps Script
   · MRAC.call(action, data)  → POST JSON a la nube (sin CORS preflight)
   · Inicio de sesión con código guardado en la nube (plan, módulo, grupo)
   · Sincroniza el progreso completo (todas las claves mra_*) en la nube
     para que el estudiante continúe desde cualquier dispositivo.
   · Si CLOUD_URL está vacío, la plataforma funciona como antes (local).
   Adaptador único: si algún día la nube cambia (p. ej. Firebase), solo
   se reemplaza este archivo.
   ===================================================================== */
(function () {
  const C = window.M1CONFIG || {};
  const URL_ = String((function () { try { return localStorage.getItem('mra_cloud_dev'); } catch (e) { return ''; } })() || C.CLOUD_URL || '').trim();
  const SYNC_RX = /^mra_(profile_v1|m\d_progress_v1|m\d_exam_v1|placement_v1|final_progress_v1|final_exam_v1)$/;
  const OWNER = 'mra_owner', TS = 'mra_sync_ts', ME = 'mra_me_cache';
  const ls = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } }, del: (k) => { try { localStorage.removeItem(k); } catch (e) { } } };
  const J = (s, d) => { try { return s ? JSON.parse(s) : d; } catch (e) { return d; } };

  async function call(action, data, opt) {
    if (!URL_) return { ok: false, err: 'offline' };
    const ctl = window.AbortController ? new AbortController() : null; const to = setTimeout(() => ctl && ctl.abort(), (opt && opt.timeout) || 30000);
    try {
      const r = await fetch(URL_, { method: 'POST', body: JSON.stringify(Object.assign({ action }, data || {})), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow', signal: ctl ? ctl.signal : undefined });
      const d = await r.json(); return d || { ok: false, err: 'empty' };
    } catch (e) { return { ok: false, err: 'network' }; } finally { clearTimeout(to); }
  }
  const prof = () => J(ls.get('mra_profile_v1'), null);
  const code = () => { if (window.MRTEACH && MRTEACH.on()) return ''; const p = prof(); return p && p.cloud && p.code ? p.code : ''; };

  // ---------- perfil local a partir de los datos de la nube ----------
  function typeFor(st, state) { const eff = state ? state.eff : (st.plan || 'free'); return eff === 'membership' || eff === 'premium' || eff === 'premium8' ? 'student' : 'trial'; }
  function applyStudent(st, state, base) {
    const p = Object.assign({ created: Date.now() }, base || prof() || {});
    Object.assign(p, { cloud: true, code: st.code, plan: st.plan || 'free', planStart: st.planStart || '', planEnd: st.planEnd || '', paceStart: st.paceStart || '', paceMod: +st.paceMod || 0, type: typeFor(st, state), expired: !!(state && state.expired), groupId: st.groupId || '' });
    ['first', 'last', 'email', 'whatsapp', 'birth'].forEach(k => { if (st[k] && !p[k]) p[k] = st[k]; });
    if (p.first && !p.name) p.name = (p.first + ' ' + (p.last || '')).trim();
    if (!st.module && st.moduleSet && (+st.moduleSet || 0) > (+p.moduleSet || 0)) { p.module = null; p.placement = null; p.moduleSet = +st.moduleSet; p.assignedBy = null; } // administración reinició su progreso
    if (st.module && (+st.moduleSet || 0) >= (+p.moduleSet || 0)) { p.module = +st.module; p.moduleSet = +st.moduleSet || 0; p.assignedBy = st.moduleBy === 'admin' ? 'admin' : null; }
    try { localStorage.setItem('mra_profile_v1', JSON.stringify(p)); } catch (e) { }
    return p;
  }
  function collect() { const keys = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (SYNC_RX.test(k)) keys[k] = localStorage.getItem(k); } } catch (e) { } return keys; }
  function wipeLocal(block) { try { const ks = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (SYNC_RX.test(k) && k !== 'mra_profile_v1') ks.push(k); } ks.forEach(k => localStorage.removeItem(k)); } catch (e) { } ls.del(TS); if (block) { window.__mraWiped = true; ls.set('mra_wipe', String(Date.now())); } }
  function applyData(data, profileOnly) { if (!data || !data.keys) return; if (!profileOnly) wipeLocal(); if (!profileOnly) Object.keys(data.keys).forEach(k => { if (SYNC_RX.test(k) && k !== 'mra_profile_v1') ls.set(k, data.keys[k]); });
    const rp = J(data.keys.mra_profile_v1, null); const p = prof();
    if (rp && p) { ['look', 'tourDone', 'tour1', 'tour2', 'pol1', 'bdY', 'first', 'last', 'name', 'birth', 'email', 'placement', 'lastSeen', 'module', 'moduleSet', 'assignedBy'].forEach(k => { if (rp[k] !== undefined && (p[k] === undefined || p[k] === null || p[k] === '' || (k === 'module' && (+rp.moduleSet || 0) > (+p.moduleSet || 0)) || k === 'look' || k === 'tourDone' || k === 'tour1' || k === 'tour2' || k === 'pol1' || k === 'bdY')) p[k] = rp[k]; }); ls.set('mra_profile_v1', JSON.stringify(p)); }
    if (!profileOnly) ls.set(TS, String(data.ts || Date.now())); }

  // ---------- inicio de sesión ----------
  async function login(rawCode) {
    const c = String(rawCode || '').trim().toUpperCase(); if (!c) return { ok: false, err: 'empty' };
    const r = await call('login', { code: c }); if (!r.ok) return r;
    window.__mraWiped = false; // nueva sesión en esta página
    const owner = ls.get(OWNER), same = owner === r.student.code;
    // primer uso de la nube en este dispositivo y la nube aún no tiene progreso → se sube lo que ya había aquí
    const migrate = false; const hadProf = !!prof(); // nunca se sube a un estudiante el progreso que había en el dispositivo (podía ser de otra persona)
    if (!same && !migrate) { wipeLocal(); ls.del('mra_profile_v1'); }
    applyStudent(r.student, r.state, same || migrate ? prof() : {});
    const localTs = +ls.get(TS) || 0;
    if (r.data && (!same || (+r.data.ts || 0) > localTs)) applyData(r.data);
    else if (r.data && !hadProf) applyData(r.data, true); // tras cerrar sesión: recupera solo el perfil (foto, tour visto…), nunca pisa el progreso de este dispositivo
    ls.set(OWNER, r.student.code); cacheMe(r);
    if (migrate) setTimeout(() => sync(true), 1500);
    return r;
  }
  function cacheMe(r) { try { sessionStorage.setItem(ME, JSON.stringify({ t: Date.now(), r })); } catch (e) { } applyExtras(r && r.extras); saveClubs(r && r.clubs); }
  // horarios de los clubs (los cambia administración) → los usa clubes.html
  function saveClubs(c) { if (!c || !c.list) return; const o = { start: c.start, band: c.band }; c.list.forEach(k => { o[k.key + '_' + c.band] = { day: k.day, time: k.time, link: k.link, teacher: k.teacher }; }); ls.set('mra_clubs', JSON.stringify(o)); }
  // intentos extra aprobados por administración → se suman al examen en este dispositivo (una sola vez por aprobación)
  function applyExtras(ex) { if (!ex) return; Object.keys(ex).forEach(k => { if (!/^mra_[a-z0-9_]+$/.test(k)) return; const st = J(ls.get(k), {}) || {}; const g = +ex[k] || 0, done = +st.cloudExtra || 0; if (g > done) { st.extra = (+st.extra || 0) + (g - done); st.cloudExtra = g; ls.set(k, JSON.stringify(st)); try { window.dispatchEvent(new CustomEvent('mra-extra', { detail: k })); } catch (e) { } } }); }
  function cachedMe() { try { return J(sessionStorage.getItem(ME), null); } catch (e) { return null; } }
  // datos frescos del estudiante (plan, créditos, grupo, próximas clases)
  async function me(force) {
    const c = code(); if (!c) return null; const cm = cachedMe();
    if (!force && cm && Date.now() - cm.t < 60000) return cm.r;
    const r = await call('me', { code: c }); if (!r.ok) { if (r.err === 'notfound' || r.err === 'inactive' || r.err === 'trial_over') { return r; } return cm ? cm.r : null; }
    applyStudent(r.student, r.state); cacheMe(r); return r;
  }
  // ---------- sincronización del progreso ----------
  function summary() {
    const P = window.MRAP; const p = prof() || {}; const mods = {}; let done = 0, xp = 0;
    if (P) P.MODS.forEach(m => { const pr = P.progress(m.id); done += pr.done; const s = P.modState(m.id); xp += +s.xp || 0; mods[m.id] = { done: pr.done, total: pr.total, pct: pr.pct, passed: P.passed(m.id) }; });
    return { mods, classesDone: done, xp, first: p.first, last: p.last, email: p.email, birth: p.birth, whatsapp: p.whatsapp, module: p.module, moduleSet: p.moduleSet || 0 };
  }
  let timer = null, busy = false, dirty = false;
  async function sync(now) {
    const c = code(); if (!c || window.__mraWiped) return false;
    if (!now) { dirty = true; clearTimeout(timer); timer = setTimeout(() => sync(true), 15000); return true; }
    if (busy) { for (let i = 0; i < 40 && busy; i++) await new Promise(r => setTimeout(r, 250)); if (busy) { dirty = true; return false; } } busy = true; dirty = false; const ts = Date.now();
    const r = await call('sync', { code: c, ts, base: +ls.get(TS) || 0, keys: collect(), summary: summary() });
    if (!r.ok && r.err === 'reset') { busy = false; wipeLocal(true); const p0 = prof(); if (p0) { p0.module = null; p0.placement = null; ls.set('mra_profile_v1', JSON.stringify(p0)); } ls.set(TS, String(Date.now())); try { location.reload(); } catch (e) { } return false; }
    busy = false; if (r.ok) { ls.set(TS, String(ts)); if (r.student) applyStudent(r.student, r.state); }
    if (dirty) { clearTimeout(timer); timer = setTimeout(() => sync(true), 15000); }
    return r.ok;
  }
  function beacon(force) { const c = code(); if (window.__mraWiped || !c || !URL_ || (!dirty && force !== true)) return; try { const ts = Date.now(); const body = JSON.stringify({ action: 'sync', code: c, ts, base: +ls.get(TS) || 0, keys: collect(), summary: summary() }); if (navigator.sendBeacon && navigator.sendBeacon(URL_, new Blob([body], { type: 'text/plain;charset=utf-8' }))) { ls.set(TS, String(ts)); dirty = false; } } catch (e) { } }
  // detecta cambios en el progreso para sincronizar solo cuando hace falta (ahorra cuota con muchos usuarios)
  try { const orig = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (this === window.localStorage && window.__mraWiped && SYNC_RX.test(k) && k !== 'mra_profile_v1') return; /* tras borrar el dispositivo, esta página (con datos viejos en memoria) ya no puede volver a escribir progreso */ orig.apply(this, arguments); if (this === window.localStorage && SYNC_RX.test(k) && code()) sync(false); }; } catch (e) { }
  // si en otra pestaña se cerró sesión o administración reinició el progreso, esta pestaña se recarga (no puede reescribir datos viejos)
  window.addEventListener('storage', (e) => { if (e.key === 'mra_wipe' && e.newValue) { window.__mraWiped = true; try { location.reload(); } catch (x) { } } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) beacon(); });
  window.addEventListener('pagehide', beacon);

  // ---------- archivos (audios, CV) ----------
  const toB64 = (blob) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1] || ''); fr.onerror = rej; fr.readAsDataURL(blob); });
  async function upload(kind, id, blob, meta) {
    if (!blob || !URL_) return { ok: false };
    if (blob.size > 10 * 1024 * 1024) return { ok: false, err: 'size' };
    const b64 = await toB64(blob);
    return call('upload', Object.assign({ kind, id, b64, mime: (blob.type || 'application/octet-stream').split(';')[0] }, meta || {}), { timeout: 90000 });
  }
  // ---------- avisos a profes / administración ----------
  const premium = () => { const p = prof() || {}; return p.cloud && (p.plan === 'premium' || p.plan === 'premium8') && !(p.planEnd && p.planEnd < new Date().toISOString().slice(0, 10)); };
  // resultado de cualquier examen (módulos, final del curso, clasificación) → notificación al profe y a administración
  async function examResult(o) { const c = code(); if (!c) return { ok: false, err: 'offline' }; return call('examResult', Object.assign({ code: c }, o)); }
  // solicitud de intento extra (solo cuando agotó sus intentos)
  async function requestAttempt(exam, examKey, reason) { const c = code(); if (!c) return { ok: false, err: 'offline' }; return call('attemptReq', { code: c, exam, examKey, reason: reason || '' }); }
  // tarea → el profe la revisa y da feedback (solo Premium)
  async function homework(o) { const c = code(); if (!c || !premium()) return { ok: false, err: 'not_premium' }; return call('homework', Object.assign({ code: c }, o)); }
  // feedback recibido de una tarea (desde las notificaciones guardadas en caché)
  function feedbackFor(part) { const cm = cachedMe(); const ns = (cm && cm.r && cm.r.notifications) || []; return ns.filter(n => n.type === 'feedback' && n.data && n.data.part === part).map(n => ({ date: n.date, teacher: n.data.teacher, feedback: n.data.feedback })); }
  async function evalSave(o) { const c = code(); if (!c) return { ok: false, err: 'offline' }; return call('evalSave', Object.assign({ code: c }, o)); }
  function notifications() { const cm = cachedMe(); return (cm && cm.r && cm.r.notifications) || []; }
  async function markRead(ids, all) { const c = code(); if (!c) return; const r = await call('notifRead', { code: c, ids: ids || [], all: !!all }); const cm = cachedMe(); if (cm && cm.r && cm.r.notifications) { cm.r.notifications.forEach(n => { if (all || (ids || []).includes(n.id)) n.read = true; }); try { sessionStorage.setItem(ME, JSON.stringify(cm)); } catch (e) { } } return r; }
  // perfil: nombre, nacimiento, correo
  async function saveProfile(fields) { const c = code(); if (!c) return { ok: false }; return call('profile', Object.assign({ code: c }, fields)); }

  // al abrir cualquier página con sesión: refresca plan, avisos e intentos extra (máx. 1 vez por minuto)
  setTimeout(() => { if (code()) me().catch(() => { }); }, 800);
  // cerrar sesión: guarda en la nube y deja el dispositivo limpio (el siguiente que entre no ve el progreso de otro)
  async function signOut() { if (window.MRTEACH && MRTEACH.on()) { MRTEACH.exit(); return true; } const ok = await sync(true); if (ok) { wipeLocal(true); ls.del(OWNER); ls.del(ME); try { sessionStorage.removeItem(ME); } catch (e) { } } return ok; }
  window.MRAC = { signOut, flush: () => beacon(true), examResult, requestAttempt, homework, feedbackFor, evalSave, notifications, markRead, isPremium: premium, cachedMe: () => { const c = cachedMe(); return c && c.r; }, on: !!URL_, url: URL_, call, login, me, sync, upload, saveProfile, code, toB64, applyStudent, wipeLocal,
    planName: (p) => ({ free: 'Acceso gratuito', membership: 'Plataforma', premium: 'Premium · 4 clases', premium8: 'Premium · 8 clases' }[p] || 'Acceso gratuito') };
})();
