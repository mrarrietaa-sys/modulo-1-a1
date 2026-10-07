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
  const MODS = [
    { id: 'A1', n: 1, name: 'Módulo 1', level: 'Elementary A1', es: 'Elemental (A1)', url: 'modulo-a1.html', key: 'mra_m1_progress_v1', ready: true, classes: 28, topics: 14, img: 'photo-1491438590914-bc09fcaaf77a', desc: 'Saludos, alfabeto, números, verbo To Be, familia, comida, clima, la casa y más.' },
    { id: 'A2', n: 2, name: 'Módulo 2', level: 'Pre-intermediate A2', es: 'Básico (A2)', url: 'modulo-a2.html', key: 'mra_m2_progress_v1', ready: true, classes: 22, topics: 11, img: 'photo-1522202176988-66273c2fd55f', desc: 'La hora, presente y pasado simple, el cuerpo, apariencia, personalidad, modales y phrasal verbs.' },
    { id: 'B1', n: 3, name: 'Módulo 3', level: 'Intermediate B1', es: 'Intermedio (B1)', url: 'modulo-b1.html', key: 'mra_m3_progress_v1', ready: false, classes: 0, topics: 0, img: 'photo-1517048676732-d65bc937f952', desc: 'Futuro, presente perfecto, comparativos, pasado perfecto, conectores y más.' },
    { id: 'B2', n: 4, name: 'Módulo 4', level: 'Upper-intermediate B2-C1', es: 'Avanzado (B2-C1)', url: 'modulo-b2.html', key: 'mra_m4_progress_v1', ready: false, classes: 0, topics: 0, img: 'photo-1552664730-d307ca884978', desc: 'Condicionales, voz pasiva, reported speech, cláusulas relativas y fluidez avanzada.' },
  ];
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch (e) { return null; } };
  const get = () => read(KEY);
  const save = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); if (p && p.first) localStorage.setItem('mra_last_user', JSON.stringify({ first: p.look && p.look.nick || p.first, pic: p.look && (p.look.pic === 'photo' ? p.look.photo : p.look.pic === 'avatar' ? p.look.head : '') || '' })); } catch (e) { } return p; };
  // ¿el estudiante vuelve? (ya había entrado antes) — se calcula una vez por sesión del navegador
  function isBack() {
    try { let v = sessionStorage.getItem('mra_back'); if (v === null) { const p = read(KEY); v = p && p.first && p.lastSeen ? '1' : '0'; sessionStorage.setItem('mra_back', v); if (p && p.first) { p.lastSeen = Date.now(); localStorage.setItem(KEY, JSON.stringify(p)); } } return v === '1'; } catch (e) { return false; }
  }
  const lastUser = () => read('mra_last_user');
  const clear = () => { try { localStorage.removeItem(KEY); } catch (e) { } };
  const mod = (id) => MODS.find(m => m.id === id || m.n === id);
  const modState = (id) => read(mod(id).key) || {};
  const passed = (id) => { const s = modState(id); return !!(s.final && s.final.passed); };
  const isStaff = () => { const p = get(); return !!(p && p.type === 'staff'); };
  const isTrial = () => { const p = get(); return !!(p && p.type === 'trial'); };
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
  function setPlacement(n, extra) { const p = get() || {}; p.module = Math.min(4, Math.max(1, n || 1)); p.placement = Object.assign({ module: p.module, date: new Date().toISOString() }, extra || {}); return save(p); }
  // personalización: foto / avatar / iniciales, apodo, color del encabezado, guía personalizada
  const look = () => { const p = get(); return (p && p.look) || {}; };
  const pic = () => { const l = look(); return l.pic === 'photo' && l.photo ? l.photo : l.pic === 'avatar' && l.head ? l.head : ''; };
  const initials = () => { const p = get() || {}; return (((p.first || '?')[0] || '') + ((p.last || '')[0] || '')).toUpperCase(); };
  const avHTML = (cls) => { const u = pic(), l = look(); return `<span class="${cls || 'pt-av'}${u ? ' has' : ''}">${u ? `<img src="${u}" alt="">` : initials()}${l.av && l.av.sticker && l.pic === 'avatar' ? `<i class="stk">${l.av.sticker}</i>` : ''}</span>`; };
  const setLook = (o) => { const p = get(); if (!p) return; p.look = Object.assign({}, p.look || {}, o); save(p); return p.look; };
  window.MRAP = { KEY, MODS, get, save, clear, mod, modState, passed, assigned, role, progress, isStaff, isTrial, setPlacement, trialMod, TRIAL_TOPICS: 2, look, pic, avHTML, setLook, initials, isBack, lastUser };
})();
