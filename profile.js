/* =====================================================================
   PERFIL DEL ESTUDIANTE — compartido por el portal (index.html) y los módulos
   · Tipo de ingreso: student (código de administración) · trial (acceso gratuito) · staff (profe)
   · Clasificación → módulo asignado. Se abren el asignado + los inferiores (repaso);
     los superiores se abren cuando aprueba el examen final de su módulo.
   · Acceso gratuito: solo los 2 primeros temas del módulo asignado.
   (Por ahora se guarda en este dispositivo; luego irá a la nube.)
   ===================================================================== */
(function () {
  const KEY = 'mra_profile_v1';
  // 👩‍🏫 MODO PROFE: material abierto solo para dictar clases (no usa ni guarda el perfil/progreso del navegador, sin tours)
  (function () { try { if (/[?&]profe=1/.test(location.search) && !sessionStorage.getItem('mra_teacher')) { const t = JSON.parse(localStorage.getItem('mra_teacher_tmp') || 'null'); if (t && Date.now() - t.at < 120000) sessionStorage.setItem('mra_teacher', JSON.stringify(t)); } } catch (e) { } })();
  const TM = (() => { try { return JSON.parse(sessionStorage.getItem('mra_teacher') || 'null'); } catch (e) { return null; } })();
  window.MRTEACH = { on: () => !!TM, info: TM, exit: () => { try { sessionStorage.removeItem('mra_teacher'); } catch (e) { } location.href = 'profesores.html'; } };
  if (TM) document.documentElement.classList.add('mr-teach');
  // modo profe: en el perfil, "Atrás" lleva de vuelta al portal de profesores
  if (TM && /(\/|index\.html)$/.test(location.pathname)) document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.tb-back'); if (!b) return; e.preventDefault(); e.stopImmediatePropagation(); location.href = 'profesores.html'; }, true);
  const MODS = [
    { id: 'A1', n: 1, name: 'Módulo 1', level: 'Elementary A1', es: 'Elemental (A1)', url: 'modulo-a1.html', key: 'mra_m1_progress_v1', ready: true, classes: 28, topics: 14, img: 'photo-1491438590914-bc09fcaaf77a', desc: 'Saludos, alfabeto, números, verbo To Be, familia, comida, clima, la casa y más.' },
    { id: 'A2', n: 2, name: 'Módulo 2', level: 'Pre-intermediate A2', es: 'Básico (A2)', url: 'modulo-a2.html', key: 'mra_m2_progress_v1', ready: true, classes: 22, topics: 11, img: 'photo-1522202176988-66273c2fd55f', desc: 'La hora, presente y pasado simple, el cuerpo, apariencia, personalidad, modales y phrasal verbs.' },
    { id: 'B2', n: 3, name: 'Módulo 3', level: 'Upper-intermediate B2', es: 'Intermedio alto (B2)', url: 'modulo-b2.html', key: 'mra_m3_progress_v1', ready: true, classes: 26, topics: 13, img: 'photo-1517048676732-d65bc937f952', desc: 'Will y going to, posesivos, presente y pasado perfecto, preposiciones, comparativos, used to, wish, cuantificadores y conectores.' },
    { id: 'B2+', n: 4, name: 'Módulo 4', level: 'Advanced B2+', es: 'Avanzado (B2+)', url: 'modulo-b2p.html', key: 'mra_m4_progress_v1', ready: true, classes: 35, topics: 21, img: 'photo-1552664730-d307ca884978', desc: 'Condicionales, gerundios e infinitivos, voz pasiva, reported speech, cláusulas relativas, futuro perfecto y debates de nivel C1.' },
  ];
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch (e) { return null; } };
  const get = () => TM ? { type: 'staff', teacher: true, first: TM.first || 'Profe', last: '', name: TM.name || 'Profe', tourDone: true, tour1: true, tour2: true, pol1: 1, created: TM.at || Date.now() } : read(KEY);
  const save = (p) => { if (TM) return; try { localStorage.setItem(KEY, JSON.stringify(p)); if (p && p.first) localStorage.setItem('mra_last_user', JSON.stringify({ first: p.look && p.look.nick || p.first, pic: p.look && (p.look.pic === 'photo' ? p.look.photo : p.look.pic === 'avatar' ? p.look.head : '') || '' })); } catch (e) { } return p; };
  // ¿el estudiante vuelve? (ya había entrado antes) — se calcula una vez por sesión del navegador
  function isBack() {
    if (TM) return true;
    try { let v = sessionStorage.getItem('mra_back'); if (v === null) { const p = read(KEY); v = p && p.first && p.lastSeen ? '1' : '0'; sessionStorage.setItem('mra_back', v); if (p && p.first) { p.lastSeen = Date.now(); localStorage.setItem(KEY, JSON.stringify(p)); } } return v === '1'; } catch (e) { return false; }
  }
  const lastUser = () => read('mra_last_user');
  const clear = () => { if (TM) return window.MRTEACH.exit(); try { localStorage.removeItem(KEY); } catch (e) { } };
  const mod = (id) => MODS.find(m => m.id === id || m.n === id);
  const modState = (id) => read(mod(id).key) || {};
  const passed = (id) => { const s = modState(id); return !!(s.final && s.final.passed); };
  const isStaff = () => { const p = get(); return !!(p && p.type === 'staff'); };
  // ---- planes (nube): free · membership · premium, con fecha de vencimiento ----
  const todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function plan() {
    const p = get() || {}; if (p.type === 'staff') return { plan: 'staff', eff: 'staff', paid: true };
    if (!p.cloud) return { plan: p.type === 'trial' ? 'free' : 'legacy', eff: p.type === 'trial' ? 'free' : 'legacy', paid: p.type !== 'trial', legacy: true };
    const pl = p.plan || 'free', paidPlan = pl === 'membership' || pl === 'premium';
    const expired = paidPlan && !!p.planEnd && p.planEnd < todayISO();
    const eff = paidPlan && !expired ? pl : 'free';
    const daysLeft = paidPlan && p.planEnd ? Math.round((new Date(p.planEnd + 'T00:00:00') - new Date(todayISO() + 'T00:00:00')) / 864e5) : null;
    return { plan: pl, eff, paid: eff !== 'free', expired, end: p.planEnd || '', daysLeft, premium: eff === 'premium' };
  }
  const isTrial = () => { const p = get(); if (!p) return false; if (p.type === 'trial') return true; return !!(p.cloud && plan().eff === 'free'); };
  const isBirthday = () => { const p = get(); return !!(p && p.birth && p.birth.slice(5, 10) === todayISO().slice(5)); };
  // módulo asignado: el de la clasificación, y sube solo cuando aprueba el examen final
  function assigned() {
    const p = get(); if (!p || !p.module) return null;
    let n = p.module; if (!isTrial()) while (n < 4 && passed(mod(n).id)) n++;
    return mod(n);
  }
  // acceso gratuito: si su módulo aún no está listo, vive la experiencia en el módulo listo más cercano
  function trialMod() { const a = assigned(); if (!a) return null; if (a.ready) return a; for (let n = a.n - 1; n >= 1; n--) if (mod(n).ready) return mod(n); return null;
  }
  // rol de un módulo para este estudiante: current · review · locked · soon
  function role(id) {
    const m = mod(id), p = get(); if (!m) return 'locked';
    if (!m.ready) return 'soon';
    if (!p) return 'locked';
    if (p.type === 'staff') return 'review';
    if (p.demo) return 'current'; // estudiante de revisión: todo abierto
    if (isTrial()) { const t = trialMod(); return t && t.id === m.id ? 'current' : 'locked'; }
    const a = assigned(); if (!a) return 'locked';
    if (m.n === a.n) return 'current';
    if (m.n < a.n) return isTrial() ? 'locked' : 'review';
    return 'locked';
  }
  function progress(id) {
    const m = mod(id), s = modState(id); const done = Object.values(s.parts || {}).filter(x => x && x.done).length;
    return { done, total: m.classes, pct: m.classes ? Math.round(done / m.classes * 100) : 0 };
  }
  // al aprobar la clasificación: guarda el módulo recomendado (1-4)
  function setPlacement(n, extra) { const p = get() || {}; p.assignedBy = null; p.module = Math.min(4, Math.max(1, n || 1)); p.moduleSet = Date.now(); p.placement = Object.assign({ module: p.module, date: new Date().toISOString() }, extra || {}); return save(p); }
  // personalización: foto / avatar / iniciales, apodo, color del encabezado, guía personalizada
  const look = () => { const p = get(); return (p && p.look) || {}; };
  const pic = () => { const l = look(); return l.pic === 'photo' && l.photo ? l.photo : l.pic === 'avatar' && l.head ? l.head : ''; };
  const initials = () => { const p = get() || {}; return (((p.first || '?')[0] || '') + ((p.last || '')[0] || '')).toUpperCase(); };
  const avHTML = (cls) => { const u = pic(), l = look(); return `<span class="${cls || 'pt-av'}${u ? ' has' : ''}">${u ? `<img src="${u}" alt="">` : initials()}${l.av && l.av.sticker && l.pic === 'avatar' ? `<i class="stk">${l.av.sticker}</i>` : ''}</span>`; };
  const setLook = (o) => { const p = get(); if (!p) return; p.look = Object.assign({}, p.look || {}, o); save(p); return p.look; };
  // 📅 RITMO DEL CURSO (plan pago): los temas que le faltan se abren poco a poco durante 4 meses desde su primer plan pago
  const PACE_MONTHS = 4, PACE_MIN = 80;
  const isoD = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function paceOn() { const p = get(); return !!(p && p.cloud && p.paceStart && !p.demo && p.type !== 'staff' && plan().paid); }
  function paceDate(modN, topicN) {
    if (!paceOn()) return null; const p = get(); const m0 = Math.max(1, +p.paceMod || 1); if (modN < m0) return null;
    let k = topicN - 1, N = 0; for (let n = m0; n < modN; n++) k += mod(n).topics; for (let n = m0; n <= 4; n++) N += mod(n).topics;
    const st = new Date(p.paceStart.slice(0, 10) + 'T00:00:00'), en = new Date(st); en.setMonth(en.getMonth() + PACE_MONTHS);
    const span = Math.round((en - st) / 864e5), d = new Date(st); d.setDate(d.getDate() + Math.floor(k * span / N)); return isoD(d);
  }
  window.MRAP = { KEY, MODS, get, save, clear, mod, modState, passed, assigned, role, progress, isStaff, isTrial, plan, isBirthday, todayISO, setPlacement, trialMod, TRIAL_TOPICS: 2, look, pic, avHTML, setLook, initials, isBack, lastUser, paceOn, paceDate, PACE_MIN };
})();
