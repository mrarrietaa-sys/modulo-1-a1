/* =====================================================================
   MRARRIETA.COM — NUBE DE LA PLATAFORMA (Google Apps Script + Sheets + Drive)
   ---------------------------------------------------------------------
   Guarda en la nube: estudiantes y su progreso, planes (Acceso gratuito,
   Membership, Premium), examen de clasificación (con audios), formulario
   de inscripción, proceso de selección de profes (CV + audios),
   profesores, disponibilidad, clases VIP y grupales, asistencia,
   solicitudes de cambio de horario y correos automáticos (cumpleaños,
   vencimiento de plan, reservas).

   ✅ INSTALACIÓN (una sola vez) — ver LEEME-NUBE.md
     1) Cambia ADMIN_PASSWORD aquí abajo.
     2) Ejecuta la función  setup  (menú ▶ Ejecutar) y acepta permisos.
     3) Implementar → Nueva implementación → Aplicación web
        · Ejecutar como: Yo   · Quién tiene acceso: Cualquier usuario
     4) Copia la URL /exec y pégala en config.js → CLOUD_URL.

   Escalabilidad: cada estudiante tiene su progreso completo en un archivo
   propio de Drive (no hay límite de tamaño por celda) y las hojas solo
   guardan el resumen. Las búsquedas usan TextFinder (rápido aunque haya
   miles de filas) y el panel pagina los resultados en el servidor.
   ===================================================================== */

const CONFIG = {
  ADMIN_PASSWORD: 'Teacher2017',          // ⚠️ cámbiala antes de implementar
  SCHOOL: 'mrarrieta.com',
  ADMIN_EMAIL: 'mrarrietaa@gmail.com',
  WHATSAPP: '573017810841',
  PLATFORM_URL: 'https://mrarrietaa-sys.github.io/plataforma/',
  TZ: 'America/Bogota',
  VIP_PER_MONTH: 2,        // créditos VIP por mes (Premium)
  GROUP_PER_MONTH: 4,      // clases grupales por mes (Premium)
  CANCEL_HOURS: 24,        // horas mínimas para cancelar una VIP y recuperar el crédito
  BOOK_MIN_HOURS: 4,       // anticipación mínima para reservar una VIP
  GROUP_CONFIRM_HOURS: 3,  // anticipación mínima para confirmar una clase grupal
  // Correos a los profes con EmailJS (si TEMPLATE está vacío se usa Gmail)
  EMAILJS: { SERVICE: 'service_dxc9gsh', TEMPLATE: '', PUBLIC_KEY: 'F1fEtbt3ocfrt5V3C', PRIVATE_KEY: '' },
  PRICES: { membership: 59900, premium: 349000 },
};

/* ---------- estructura de la base de datos (una pestaña por tabla) ---------- */
const TABLES = {
  Estudiantes: ['code', 'first', 'last', 'email', 'whatsapp', 'birth', 'plan', 'planStart', 'planEnd', 'module', 'moduleSet', 'moduleBy', 'groupId', 'status', 'created', 'lastSeen', 'xp', 'classesDone', 'progress', 'placementScore', 'source', 'notes', 'dataFileId', 'updated', 'extras'],
  Planes: ['id', 'date', 'code', 'name', 'plan', 'months', 'start', 'end', 'amount', 'note'],
  Placement: ['id', 'date', 'code', 'name', 'email', 'whatsapp', 'attempt', 'listening', 'reading', 'writing', 'speaking', 'final', 'module', 'level', 'mods', 'speakingAnswers', 'files', 'timedOut'],
  Inscripciones: ['id', 'date', 'first', 'last', 'email', 'whatsapp', 'birth', 'city', 'plan', 'level', 'schedule', 'days', 'payment', 'source', 'comments', 'status', 'code', 'notes'],
  Reclutamiento: ['id', 'date', 'name', 'email', 'whatsapp', 'city', 'experience', 'levels', 'availability', 'about', 'listening', 'reading', 'writing', 'speaking', 'final', 'passed', 'speakingAnswers', 'cv', 'files', 'status', 'notes'],
  Profesores: ['id', 'code', 'name', 'email', 'whatsapp', 'pin', 'meet', 'levels', 'bio', 'active', 'created', 'weekly'],
  Disponibilidad: ['id', 'teacherId', 'date', 'time', 'duration', 'status', 'classId', 'created', 'src'],
  Clases: ['id', 'type', 'date', 'time', 'duration', 'teacherId', 'groupId', 'students', 'status', 'attendance', 'meet', 'topic', 'notes', 'slotId', 'created', 'createdBy', 'confirmed', 'flags'],
  Grupos: ['id', 'name', 'level', 'teacherId', 'days', 'time', 'duration', 'meet', 'active', 'notes', 'created'],
  Solicitudes: ['id', 'date', 'code', 'name', 'type', 'currentGroup', 'preferred', 'reason', 'status', 'note', 'resolved', 'newGroup', 'exam', 'examKey'],
  Config: ['key', 'value'],
  Notificaciones: ['id', 'date', 'to', 'type', 'title', 'body', 'data', 'read'],
  Examenes: ['id', 'date', 'code', 'name', 'exam', 'attempt', 'listening', 'reading', 'writing', 'speaking', 'final', 'passed', 'teacherIds'],
  Tareas: ['id', 'date', 'code', 'name', 'module', 'part', 'title', 'text', 'score', 'teacherIds', 'status', 'feedback', 'feedbackBy', 'feedbackDate'],
  Evaluaciones: ['id', 'date', 'code', 'teacherId', 'module', 'q1', 'q2', 'q3', 'score', 'premium'],
  Reconocimientos: ['id', 'date', 'quarter', 'teacherId', 'teacherName', 'score', 'evaluations', 'ranking'],
  Correos: ['date', 'type', 'to', 'code', 'subject'],
};
const KEYCOL = { Estudiantes: 'code', Config: 'key' }; // las demás usan 'id'
const PUBLIC_COLS = { Profesores: ['id', 'name', 'levels', 'bio', 'meet'] };

/* =====================================================================
   INSTALACIÓN
   ===================================================================== */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABLES).forEach(name => {
    let s = ss.getSheetByName(name);
    if (!s) s = ss.insertSheet(name);
    const H = TABLES[name];
    const cur = s.getLastColumn() ? s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0] : [];
    if (!cur.length || !cur[0]) { s.getRange(1, 1, 1, H.length).setValues([H]); }
    else { H.forEach(h => { if (cur.indexOf(h) < 0) s.getRange(1, s.getLastColumn() + 1).setValue(h); }); }
    s.setFrozenRows(1);
    s.getRange(1, 1, 1, s.getLastColumn()).setFontWeight('bold').setBackground('#0B2A5B').setFontColor('#ffffff');
    s.getRange(1, 1, Math.max(s.getMaxRows(), 1000), s.getLastColumn()).setNumberFormat('@'); // todo como texto
  });
  const d = ss.getSheetByName('Sheet1') || ss.getSheetByName('Hoja 1') || ss.getSheetByName('Hoja1');
  if (d && ss.getSheets().length > 1 && d.getLastRow() === 0) ss.deleteSheet(d);
  // carpetas en Drive
  const P = PropertiesService.getScriptProperties();
  let root = P.getProperty('ROOT') ? safeFolder(P.getProperty('ROOT')) : null;
  if (!root) { root = DriveApp.createFolder('MRA Plataforma — Archivos'); P.setProperty('ROOT', root.getId()); }
  ['Progreso', 'Placement', 'Reclutamiento', 'CV'].forEach(n => { if (!P.getProperty('F_' + n) || !safeFolder(P.getProperty('F_' + n))) P.setProperty('F_' + n, root.createFolder(n).getId()); });
  // valores iniciales de configuración
  const clubDef = { club_start: '2026-10-12', club_fon_a_day: 'Lunes', club_fon_a_time: '18:00', club_fon_b_day: 'Lunes', club_fon_b_time: '19:00', club_conv_a_day: 'Miércoles', club_conv_a_time: '18:00', club_conv_b_day: 'Miércoles', club_conv_b_time: '19:00', club_conv_a_link: '', club_conv_b_link: '', club_fon_a_link: '', club_fon_b_link: '', club_conv_a_teacher: '', club_conv_b_teacher: '', club_fon_a_teacher: '', club_fon_b_teacher: '' };
  Object.keys(clubDef).forEach(k => { if (getConf(k) === null) setConf(k, clubDef[k]); });
  const defaults = { club_title: 'Club de conversación y fonética', club_text: 'Todos los sábados · 10:00 a. m. (hora Colombia) · 60 minutos. Practica conversación real y pronunciación con un profe y otros estudiantes Premium.', club_link: '', group_info: 'La escuela te asigna tu grupo según tu nivel. Si el horario no te funciona, solicita un cambio.', announcement: '' };
  Object.keys(defaults).forEach(k => { if (getConf(k) === null) setConf(k, defaults[k]); });
  // tarea diaria (cumpleaños + vencimientos)
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'daily').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('daily').timeBased().atHour(8).everyDays(1).inTimezone(CONFIG.TZ).create();
  // tarea cada hora (clases grupales automáticas + aviso al profe si nadie confirmó)
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'hourly').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('hourly').timeBased().everyHours(1).create();
  Logger.log('✅ Listo. Ahora: Implementar → Nueva implementación → Aplicación web.');
}
function safeFolder(id) { try { return DriveApp.getFolderById(id); } catch (e) { return null; } }
function folder(n) { const id = PropertiesService.getScriptProperties().getProperty('F_' + n); const f = id && safeFolder(id); if (f) return f; setup(); return DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('F_' + n)); }

/* =====================================================================
   ENTRADA HTTP
   ===================================================================== */
function doGet(e) {
  const a = e && e.parameter && e.parameter.action;
  if (a === 'ping') return out({ ok: true, school: CONFIG.SCHOOL, time: now() });
  return out({ ok: true, msg: 'Nube de mrarrieta.com funcionando ✅', time: now() });
}
function doPost(e) {
  let req = {};
  try { req = JSON.parse(e.postData.contents || '{}'); } catch (err) { return out({ ok: false, err: 'bad_json' }); }
  try {
    const fn = ACTIONS[req.action];
    if (!fn) return out({ ok: false, err: 'unknown_action' });
    return out(fn(req) || { ok: true });
  } catch (err) {
    return out({ ok: false, err: String(err && err.message || err) });
  }
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

const ACTIONS = {
  // --- estudiantes ---
  login: (r) => studentLogin(r),
  me: (r) => studentMe(r),
  sync: (r) => studentSync(r),
  profile: (r) => studentProfile(r),
  placement: (r) => placementSave(r),
  upload: (r) => uploadFile(r),
  vipOptions: (r) => vipOptions(r),
  vipBook: (r) => vipBook(r),
  groupConfirm: (r) => groupConfirm(r),
  stuMsg: (r) => studentMessage(r),
  vipCancel: (r) => vipCancel(r),
  changeReq: (r) => changeRequest(r),
  examResult: (r) => examResult(r),
  attemptReq: (r) => attemptRequest(r),
  homework: (r) => homeworkSave(r),
  evalSave: (r) => evalSave(r),
  notifRead: (r) => notifRead(r),
  // --- formularios públicos ---
  enroll: (r) => enrollSave(r),
  recruit: (r) => recruitSave(r),
  recruitDone: (r) => recruitDone(r),
  // --- profesores ---
  tLogin: (r) => teacherData(teacherAuth(r)),
  tSlotAdd: (r) => teacherSlotAdd(teacherAuth(r), r),
  tWeekly: (r) => teacherWeekly(teacherAuth(r), r),
  tSlotDel: (r) => teacherSlotDel(teacherAuth(r), r),
  tMark: (r) => classMark(r, teacherAuth(r)),
  tFeedback: (r) => homeworkFeedback(teacherAuth(r), r),
  // --- administración ---
  aLogin: (r) => (adminAuth(r), { ok: true }),
  aStats: (r) => (adminAuth(r), adminStats()),
  aList: (r) => (adminAuth(r), adminList(r)),
  aGet: (r) => (adminAuth(r), adminGet(r)),
  aSave: (r) => (adminAuth(r), adminSave(r)),
  aPlan: (r) => (adminAuth(r), adminPlan(r)),
  aStatus: (r) => (adminAuth(r), adminStatus(r)),
  aReq: (r) => (adminAuth(r), adminRequest(r)),
  aFile: (r) => (adminAuth(r), adminFile(r)),
  aSessions: (r) => (adminAuth(r), adminSessions(r)),
  aSlot: (r) => (adminAuth(r), adminSlot(r)),
  aMark: (r) => (adminAuth(r), classMark(r, null)),
  aConvert: (r) => (adminAuth(r), adminConvert(r)),
  aRanking: (r) => (adminAuth(r), { ok: true, ranking: ranking(r.quarter || prevQuarter()), quarter: r.quarter || prevQuarter(), current: ranking(quarterOf(today())), currentQuarter: quarterOf(today()), history: all('Reconocimientos').reverse() }),
  aRecognize: (r) => (adminAuth(r), recognize(r.quarter || prevQuarter(), true)),
  aNotifs: (r) => (adminAuth(r), { ok: true, rows: notifsFor('admin', 60) }),
  aTeachers: (r) => (adminAuth(r), { ok: true, teachers: teachersFull(), groups: all('Grupos') }),
};

/* =====================================================================
   UTILIDADES DE HOJAS
   ===================================================================== */
const _cache = {};
function sheet(name) {
  if (_cache[name]) return _cache[name];
  const ss = SpreadsheetApp.getActiveSpreadsheet(); let s = ss.getSheetByName(name);
  if (!s) { setup(); s = ss.getSheetByName(name); }
  return (_cache[name] = s);
}
function headers(name) { const s = sheet(name); return s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].map(String); }
function norm(v) {
  if (v instanceof Date) { const y = v.getFullYear(); if (y <= 1900) return Utilities.formatDate(v, CONFIG.TZ, 'HH:mm'); const t = Utilities.formatDate(v, CONFIG.TZ, 'HH:mm:ss'); return Utilities.formatDate(v, CONFIG.TZ, t === '00:00:00' ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm:ss"); }
  return v === null || v === undefined ? '' : String(v);
}
function all(name) {
  const s = sheet(name); const n = s.getLastRow(); if (n < 2) return [];
  const H = headers(name); const v = s.getRange(2, 1, n - 1, H.length).getValues();
  return v.map((r, i) => { const o = { _r: i + 2 }; H.forEach((h, j) => o[h] = norm(r[j])); return o; }).filter(o => o[H[0]] !== '');
}
function findRow(name, key) {
  const s = sheet(name); const n = s.getLastRow(); if (n < 2 || !key) return null;
  const H = headers(name); const col = H.indexOf(KEYCOL[name] || 'id') + 1;
  const cell = s.getRange(2, col, n - 1, 1).createTextFinder(String(key)).matchEntireCell(true).matchCase(false).findNext();
  if (!cell) return null;
  const r = cell.getRow(); const v = s.getRange(r, 1, 1, H.length).getValues()[0];
  const o = { _r: r }; H.forEach((h, j) => o[h] = norm(v[j])); return o;
}
function insert(name, obj) {
  const s = sheet(name); const H = headers(name);
  const row = H.map(h => obj[h] === undefined || obj[h] === null ? '' : (typeof obj[h] === 'object' ? JSON.stringify(obj[h]) : String(obj[h])));
  const r = s.getLastRow() + 1; s.getRange(r, 1, 1, H.length).setNumberFormat('@').setValues([row]);
  return Object.assign({ _r: r }, obj);
}
function patch(name, rowObj, changes) {
  const s = sheet(name); const H = headers(name);
  Object.keys(changes).forEach(k => {
    let j = H.indexOf(k); if (j < 0) return;
    const v = changes[k]; const val = v === undefined || v === null ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
    s.getRange(rowObj._r, j + 1).setNumberFormat('@').setValue(val); rowObj[k] = val;
  });
  return rowObj;
}
function J(s, d) { try { return s ? JSON.parse(s) : d; } catch (e) { return d; } }
function uid(p) { return (p || '') + Utilities.getUuid().replace(/-/g, '').slice(0, 10); }
function now() { return Utilities.formatDate(new Date(), CONFIG.TZ, "yyyy-MM-dd'T'HH:mm:ss"); }
function today() { return Utilities.formatDate(new Date(), CONFIG.TZ, 'yyyy-MM-dd'); }
function addMonths(iso, m) { const p = iso.split('-').map(Number); const d = new Date(p[0], p[1] - 1 + m, p[2]); if (d.getDate() !== p[2]) d.setDate(0); return Utilities.formatDate(d, CONFIG.TZ, 'yyyy-MM-dd'); }
function addDays(iso, n) { const p = iso.split('-').map(Number); const d = new Date(p[0], p[1] - 1, p[2] + n); return Utilities.formatDate(d, CONFIG.TZ, 'yyyy-MM-dd'); }
function dt(date, time) { const p = String(date).split('-').map(Number), t = String(time || '00:00').split(':').map(Number); return new Date(p[0], p[1] - 1, p[2], t[0] || 0, t[1] || 0); } // hora local del script
function hoursUntil(date, time) { return (dt(date, time).getTime() - Date.now()) / 36e5; }
function clean(s, n) { return String(s === undefined || s === null ? '' : s).trim().slice(0, n || 500); }
function upCode(c) { return String(c || '').trim().toUpperCase(); }
function lock(fn) { const l = LockService.getScriptLock(); l.waitLock(20000); try { return fn(); } finally { l.releaseLock(); } }
function getConf(k) { const r = findRow('Config', k); return r ? r.value : null; }
function setConf(k, v) { const r = findRow('Config', k); if (r) patch('Config', r, { value: v }); else insert('Config', { key: k, value: v }); }
function confAll() { const o = {}; all('Config').forEach(r => o[r.key] = r.value); return o; }

/* =====================================================================
   AUTENTICACIÓN
   ===================================================================== */
function adminAuth(r) {
  if (CONFIG.ADMIN_PASSWORD === 'CAMBIA-ESTA-CLAVE') throw new Error('change_password'); // obliga a cambiar la clave por defecto
  if (!r.key || String(r.key) !== CONFIG.ADMIN_PASSWORD) throw new Error('auth');
}
function studentAuth(r) {
  const s = findRow('Estudiantes', upCode(r.code));
  if (!s) throw new Error('notfound');
  if (s.status === 'inactivo' || s.status === 'archivado') throw new Error('inactive');
  return s;
}
function teacherAuth(r) {
  const list = all('Profesores'); const c = upCode(r.tcode);
  const x = list.find(p => upCode(p.code) === c && String(p.pin) === String(r.pin || '').trim());
  if (!x || x.active === 'no') throw new Error('auth');
  return x;
}

/* =====================================================================
   PLAN Y CRÉDITOS
   ===================================================================== */
function planState(s) {
  const t = today(); const plan = s.plan || 'free';
  const paid = plan === 'membership' || plan === 'premium';
  const active = !paid || !s.planEnd || s.planEnd >= t;
  const eff = paid && active ? plan : 'free';
  const daysLeft = paid && s.planEnd ? Math.round((dt(s.planEnd).getTime() - dt(t).getTime()) / 864e5) : null;
  return { plan, eff, active, expired: paid && !active, planStart: s.planStart, planEnd: s.planEnd, daysLeft };
}
// ciclo mensual actual del plan (desde planStart, mes a mes)
function cycle(s) {
  const t = today(); let start = s.planStart || t; if (start > t) start = t;
  let k = 0; while (addMonths(start, k + 1) <= t && k < 600) k++;
  return { start: addMonths(start, k), end: addDays(addMonths(start, k + 1), -1) };
}
function studentClasses(code, classesAll) {
  const c = upCode(code); const list = classesAll || matching('Clases', 'students', c);
  return list.filter(x => J(x.students, []).map(upCode).indexOf(c) >= 0);
}
// filas cuya columna contiene un texto (TextFinder: no recorre toda la hoja en JS — rápido con muchos años de datos)
function matching(name, col, text) {
  const s = sheet(name); const n = s.getLastRow(); if (n < 2 || !text) return [];
  const H = headers(name); const j = H.indexOf(col) + 1; if (!j) return [];
  const cells = s.getRange(2, j, n - 1, 1).createTextFinder(String(text)).matchCase(false).findAll();
  return cells.map(cell => { const r = cell.getRow(); const v = s.getRange(r, 1, 1, H.length).getValues()[0]; const o = { _r: r }; H.forEach((h, k) => o[h] = norm(v[k])); return o; });
}
function attended(x, code) { const a = J(x.attendance, {}); const c = upCode(code); return x.status === 'done' && (a[c] === true || (x.type === 'vip' && a[c] !== false)); }
function credits(s, classesAll) {
  const cy = cycle(s); const mine = studentClasses(s.code, classesAll);
  const vipUsed = mine.filter(x => x.type === 'vip' && x.status !== 'cancelled' && String(x.created).slice(0, 10) >= cy.start && String(x.created).slice(0, 10) <= cy.end).length;
  const groupDone = mine.filter(x => x.type === 'group' && x.date >= cy.start && x.date <= cy.end && attended(x, s.code)).length;
  return { cycleStart: cy.start, cycleEnd: cy.end, vipTotal: CONFIG.VIP_PER_MONTH, vipUsed, vipLeft: Math.max(0, CONFIG.VIP_PER_MONTH - vipUsed), groupTotal: CONFIG.GROUP_PER_MONTH, groupDone };
}

/* =====================================================================
   ESTUDIANTES
   ===================================================================== */
function publicStudent(s) {
  return { code: s.code, first: s.first, last: s.last, email: s.email, whatsapp: s.whatsapp, birth: s.birth, plan: s.plan || 'free', planStart: s.planStart, planEnd: s.planEnd, module: s.module ? +s.module : null, moduleSet: +s.moduleSet || 0, moduleBy: s.moduleBy, groupId: s.groupId, status: s.status };
}
function readData(s) { if (!s.dataFileId) return null; try { return J(DriveApp.getFileById(s.dataFileId).getBlob().getDataAsString(), null); } catch (e) { return null; } }
function studentLogin(r) {
  let s; try { s = studentAuth(r); } catch (e) { return { ok: false, err: e.message }; }
  patch('Estudiantes', s, { lastSeen: now() });
  return Object.assign({ ok: true, student: publicStudent(s), state: planState(s), data: readData(s) }, premiumInfo(s));
}
function studentMe(r) {
  let s; try { s = studentAuth(r); } catch (e) { return { ok: false, err: e.message }; }
  patch('Estudiantes', s, { lastSeen: now() });
  return Object.assign({ ok: true, student: publicStudent(s), state: planState(s) }, premiumInfo(s));
}
function premiumInfo(s) {
  const st = planState(s); const conf = confAll(); const info = { conf: { announcement: conf.announcement || '', prices: CONFIG.PRICES } };
  const classesAll = matching('Clases', 'students', upCode(s.code)); const mine = studentClasses(s.code, classesAll);
  info.attendedTotal = mine.filter(x => attended(x, s.code)).length;
  info.extras = J(s.extras, {});
  info.notifications = notifsFor('S:' + upCode(s.code), 25);
  info.teacherId = studentTeachers(s, classesAll)[0] || '';
  if (st.eff !== 'premium') return info;
  info.clubs = clubsFor(s, conf);
  const teachers = all('Profesores'); const tname = id => { const t = teachers.find(x => x.id === id); return t ? t.name : ''; };
  const g = s.groupId ? findRow('Grupos', s.groupId) : null;
  info.premium = {
    credits: credits(s, classesAll),
    group: g ? { id: g.id, name: g.name, level: g.level, teacher: tname(g.teacherId), days: g.days, time: g.time, duration: g.duration, meet: g.meet } : null,
    upcoming: mine.concat(g ? matching('Clases', 'groupId', g.id).filter(x => x.groupId === g.id && x.type === 'group' && !mine.some(m => m.id === x.id)) : []).filter(x => x.status === 'scheduled' && x.date >= today() && hoursUntil(x.date, x.time) > -1).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 12)
      .map(x => ({ id: x.id, type: x.type, date: x.date, time: x.time, duration: x.duration, teacher: tname(x.teacherId), meet: x.meet || (x.type === 'group' && g ? g.meet : ''), topic: x.topic, canCancel: x.type === 'vip' && hoursUntil(x.date, x.time) >= CONFIG.CANCEL_HOURS, confirmed: J(x.confirmed, []).map(upCode).indexOf(upCode(s.code)) >= 0, canConfirm: x.type === 'group' && hoursUntil(x.date, x.time) >= CONFIG.GROUP_CONFIRM_HOURS })),
    history: mine.filter(x => x.status !== 'scheduled').sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 20)
      .map(x => ({ type: x.type, date: x.date, time: x.time, teacher: tname(x.teacherId), status: x.status, attended: attended(x, s.code) })),
    requests: matching('Solicitudes', 'code', upCode(s.code)).filter(q => upCode(q.code) === upCode(s.code)).slice(-5).map(q => ({ date: q.date, preferred: q.preferred, status: q.status, note: q.note })),
    groupInfo: conf.group_info || '', cancelHours: CONFIG.CANCEL_HOURS,
  };
  return info;
}
// el estudiante actualiza su nombre, fecha de nacimiento, correo y WhatsApp desde su perfil
function studentProfile(r) {
  const s = studentAuth(r); const ch = {};
  ['first', 'last', 'email', 'whatsapp', 'birth'].forEach(k => { if (r[k] !== undefined && r[k] !== '') ch[k] = clean(r[k], 120); });
  ch.updated = now(); patch('Estudiantes', s, ch); return { ok: true, student: publicStudent(s) };
}
// guarda TODO el progreso del estudiante (archivo propio en Drive) + resumen en la hoja
function studentSync(r) {
  const s = studentAuth(r);
  const data = { ts: +r.ts || Date.now(), keys: r.keys || {} };
  const str = JSON.stringify(data);
  if (str.length > 4e6) return { ok: false, err: 'too_big' };
  let f = null;
  if (s.dataFileId) { try { f = DriveApp.getFileById(s.dataFileId); f.setContent(str); } catch (e) { f = null; } }
  if (!f) { f = folder('Progreso').createFile('progreso_' + s.code + '.json', str, 'application/json'); }
  const sum = r.summary || {}; const ch = { dataFileId: f.getId(), lastSeen: now(), updated: now() };
  if (sum.xp !== undefined) ch.xp = sum.xp;
  if (sum.classesDone !== undefined) ch.classesDone = sum.classesDone;
  if (sum.mods) ch.progress = sum.mods;
  // nombre/módulo: el más reciente gana
  ['first', 'last', 'email', 'birth', 'whatsapp'].forEach(k => { if (sum[k] && !s[k]) ch[k] = clean(sum[k], 120); });
  if (sum.module && +sum.moduleSet > (+s.moduleSet || 0)) { ch.module = sum.module; ch.moduleSet = sum.moduleSet; ch.moduleBy = 'placement'; }
  patch('Estudiantes', s, ch);
  return { ok: true, student: publicStudent(s), state: planState(s) };
}

/* =====================================================================
   EXAMEN DE CLASIFICACIÓN (con audios)
   ===================================================================== */
function placementSave(r) {
  const id = uid('pl_');
  const row = { id, date: now(), code: upCode(r.code), name: clean(r.name, 120), email: clean(r.email, 120), whatsapp: clean(r.whatsapp, 40), attempt: clean(r.attempt, 30),
    listening: r.listening, reading: r.reading, writing: r.writing, speaking: r.speaking, final: r.final, module: r.module, level: clean(r.level, 60), mods: r.mods || {}, speakingAnswers: r.speakingAnswers || [], files: [], timedOut: r.timedOut ? 'sí' : '' };
  insert('Placement', row);
  if (row.code) { const s = findRow('Estudiantes', row.code); if (s) { const ch = { placementScore: r.final }; if (r.module) { ch.module = r.module; ch.moduleSet = r.moduleSet || Date.now(); ch.moduleBy = 'placement'; } if (r.email && !s.email) ch.email = row.email; patch('Estudiantes', s, ch); } }
  return { ok: true, id };
}
// subida de archivos (audios del placement / del reclutamiento, CV) en pedazos pequeños
function uploadFile(r) {
  const kinds = { placement: ['Placement', 'Placement'], recruit: ['Reclutamiento', 'Reclutamiento'], cv: ['Reclutamiento', 'CV'] };
  const k = kinds[r.kind]; if (!k) return { ok: false, err: 'kind' };
  const b64 = String(r.b64 || ''); if (!b64 || b64.length > 14e6) return { ok: false, err: 'size' };
  const mime = clean(r.mime, 80) || 'application/octet-stream';
  if (!/^(audio\/|video\/webm|application\/pdf|application\/msword|application\/vnd\.openxmlformats|image\/)/.test(mime)) return { ok: false, err: 'type' };
  return lock(() => {
    const row = findRow(k[0], r.id); if (!row) return { ok: false, err: 'notfound' };
    const name = clean(r.name, 120) || ('archivo_' + Date.now());
    const f = folder(k[1]).createFile(Utilities.newBlob(Utilities.base64Decode(b64), mime, (row.name || row.code || '') + ' — ' + name));
    const meta = { fileId: f.getId(), name, mime, i: r.i, label: clean(r.label, 300), transcript: clean(r.transcript, 1500) };
    if (r.kind === 'cv') patch(k[0], row, { cv: meta });
    else { const files = J(row.files, []); files.push(meta); patch(k[0], row, { files }); }
    return { ok: true, fileId: f.getId() };
  });
}

/* =====================================================================
   CLASES VIP (reserva con créditos) Y SOLICITUDES DE CAMBIO
   ===================================================================== */
function vipOptions(r) {
  const s = studentAuth(r); const st = planState(s);
  if (st.eff !== 'premium') return { ok: false, err: 'not_premium' };
  const t0 = today(), t1 = addDays(t0, 45);
  const teachers = all('Profesores').filter(t => t.active !== 'no');
  const slots = all('Disponibilidad').filter(x => x.status === 'free' && x.date >= t0 && x.date <= t1 && hoursUntil(x.date, x.time) >= CONFIG.BOOK_MIN_HOURS && !FEST.isOff(x.date));
  return { ok: true, credits: credits(s), teachers: teachers.map(t => ({ id: t.id, name: t.name, bio: t.bio, slots: slots.filter(x => x.teacherId === t.id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(x => ({ id: x.id, date: x.date, time: x.time, duration: x.duration || '60' })) })).filter(t => t.slots.length) };
}
function vipBook(r) {
  return lock(() => {
    const s = studentAuth(r); const st = planState(s);
    if (st.eff !== 'premium') return { ok: false, err: 'not_premium' };
    const cr = credits(s); if (cr.vipLeft <= 0) return { ok: false, err: 'no_credits' };
    const slot = findRow('Disponibilidad', r.slotId);
    if (!slot || slot.status !== 'free') return { ok: false, err: 'taken' };
    if (hoursUntil(slot.date, slot.time) < CONFIG.BOOK_MIN_HOURS) return { ok: false, err: 'too_late' };
    if (FEST.isOff(slot.date)) return { ok: false, err: 'holiday', why: FEST.why(slot.date) };
    const t = findRow('Profesores', slot.teacherId);
    const id = uid('cl_');
    insert('Clases', { id, type: 'vip', date: slot.date, time: slot.time, duration: slot.duration || '60', teacherId: slot.teacherId, groupId: '', students: [s.code], status: 'scheduled', attendance: {}, meet: pickMeet(t, slot.date, slot.time), confirmed: [s.code], topic: clean(r.topic, 200), notes: '', slotId: slot.id, created: now(), createdBy: s.code });
    patch('Disponibilidad', slot, { status: 'booked', classId: id });
    const when = niceDate(slot.date) + ' · ' + slot.time;
    const sname = (s.first + ' ' + s.last).trim();
    const pr = J(s.progress, {}); const MID = { 1: 'A1', 2: 'A2', 3: 'B2', 4: 'B2+' }[s.module] || '';
    notify('T:' + slot.teacherId, 'vip', '📅 Nueva clase VIP: ' + sname + ' · ' + when, `Tema a reforzar: ${clean(r.topic, 200) || '— (no indicó)'}. Ruta: ${MID ? 'Módulo ' + s.module + ' · ' + MID + (pr[MID] ? ' (' + pr[MID].pct + '% · ' + pr[MID].done + '/' + pr[MID].total + ' clases)' : '') : 'sin placement'}.`, { classId: id, code: s.code, topic: clean(r.topic, 200) });
    if (s.email) mail(s.email, '✅ Tu clase VIP quedó reservada — ' + when, 'Clase VIP reservada', `<p>Hola <b>${h(s.first)}</b>, tu clase VIP quedó reservada.</p>${box([['Profesor', t ? t.name : ''], ['Fecha', when + ' (hora Colombia)'], ['Enlace', t && t.meet ? `<a href="${h(t.meet)}">${h(t.meet)}</a>` : 'Te llegará antes de la clase']])}<p>Te quedan <b>${cr.vipLeft - 1}</b> crédito(s) VIP este mes. Puedes cancelar hasta ${CONFIG.CANCEL_HOURS} horas antes desde tu perfil y recuperar el crédito.</p>`, s.code, 'vip');
    if (t && t.email) tmail(t.email, '📅 Nueva clase VIP — ' + sname + ' — ' + when, 'Nueva clase VIP', `<p>Hola <b>${h(t.name)}</b>, tienes una nueva clase VIP.</p>${box([['Estudiante', sname], ['Nivel', s.module ? 'Módulo ' + s.module : ''], ['Fecha', when], ['Tema a reforzar', clean(r.topic, 200) || '—'], ['Progreso', MID && pr[MID] ? pr[MID].pct + '% del módulo (' + pr[MID].done + '/' + pr[MID].total + ' clases)' : '—']])}`, s.code, 'vip');
    mail(CONFIG.ADMIN_EMAIL, 'VIP reservada: ' + sname + ' con ' + (t ? t.name : '') + ' — ' + when, 'Nueva reserva VIP', box([['Estudiante', sname + ' (' + s.code + ')'], ['Profesor', t ? t.name : ''], ['Fecha', when]]), s.code, 'vip');
    return { ok: true, id };
  });
}

/* =====================================================================
   CLASES GRUPALES AUTOMÁTICAS + CONFIRMACIÓN DE ASISTENCIA
   - Cada grupo tiene días y hora fijos: la nube crea sus clases de las próximas 2 semanas
     (sin domingos ni festivos). Nadie tiene que "programarlas".
   - El estudiante confirma su asistencia hasta 3 h antes; al profe le llega aviso en su perfil y por correo.
   - Si a 3 h nadie confirmó: aviso al profe en su perfil → no necesita conectarse.
   ===================================================================== */
function parseDays(txt) {
  const t = String(txt || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); const out = [];
  [['lun', 1], ['mar', 2], ['mie', 3], ['jue', 4], ['vie', 5], ['sab', 6]].forEach(([k, d]) => { if (new RegExp('\\b' + k).test(t)) out.push(d); });
  return out;
}
// enlaces de Meet: el profe puede tener varios (uno por línea); clases seguidas usan enlaces distintos
function meetLinks(t) { return String((t && t.meet) || '').split(/[\n,; ]+/).map(x => x.trim()).filter(x => /^https?:\/\//.test(x)); }
function pickMeet(t, date, time) {
  const L = meetLinks(t); if (!L.length) return ''; if (L.length === 1) return L[0];
  const before = all('Clases').filter(c => c.teacherId === t.id && c.date === date && c.status !== 'cancelled' && c.time < time).length;
  return L[before % L.length];
}
function autoGroupSessions() {
  const groups = all('Grupos').filter(g => g.active !== 'no' && g.teacherId && g.time && parseDays(g.days).length);
  if (!groups.length) return 0;
  const ex = all('Clases').filter(c => c.type === 'group'); const teachers = all('Profesores'); let n = 0;
  groups.forEach(g => {
    const dows = parseDays(g.days); const t = teachers.find(x => x.id === g.teacherId);
    for (let i = 0; i < 14; i++) {
      const d = addDays(today(), i); if (FEST.isOff(d)) continue;
      if (dows.indexOf(new Date(d + 'T12:00:00').getDay()) < 0) continue;
      if (i === 0 && hoursUntil(d, g.time) < 0) continue;
      if (ex.some(c => c.groupId === g.id && c.date === d)) continue;
      const meet = clean(g.meet, 300) || pickMeet(t, d, g.time);
      insert('Clases', { id: uid('cl_'), type: 'group', date: d, time: g.time, duration: g.duration || '60', teacherId: g.teacherId, groupId: g.id, students: [], status: 'scheduled', attendance: {}, meet, topic: '', notes: '', slotId: '', created: now(), createdBy: 'auto', confirmed: [], flags: '' }); n++;
    }
  });
  return n;
}
function groupConfirm(r) {
  return lock(() => {
    const s = studentAuth(r); if (planState(s).eff !== 'premium') return { ok: false, err: 'not_premium' };
    const c = findRow('Clases', r.classId);
    if (!c || c.type !== 'group' || c.groupId !== s.groupId) return { ok: false, err: 'notfound' };
    if (c.status !== 'scheduled') return { ok: false, err: 'state' };
    if (hoursUntil(c.date, c.time) < CONFIG.GROUP_CONFIRM_HOURS) return { ok: false, err: 'too_late' };
    const conf = J(c.confirmed, []).map(upCode); if (conf.indexOf(upCode(s.code)) >= 0) return { ok: true, already: true };
    conf.push(upCode(s.code)); const st = J(c.students, []).map(upCode); if (st.indexOf(upCode(s.code)) < 0) st.push(upCode(s.code));
    patch('Clases', c, { confirmed: conf, students: st });
    const t = findRow('Profesores', c.teacherId); const g = findRow('Grupos', c.groupId); const sname = (s.first + ' ' + s.last).trim();
    const when = niceDate(c.date) + ' · ' + c.time;
    notify('T:' + c.teacherId, 'group', '✅ ' + sname + ' confirmó la clase grupal · ' + when, 'Grupo ' + (g ? g.name : '') + ' · ' + conf.length + ' confirmado(s) hasta ahora.', { classId: c.id });
    const html = `<p>Hola <b>${h(t ? t.name : '')}</b>, <b>${h(sname)}</b> confirmó su asistencia a tu clase grupal.</p>${box([['Grupo', g ? g.name : ''], ['Fecha', when + ' (hora Colombia)'], ['Confirmados', String(conf.length)], ['Enlace', c.meet || (g ? g.meet : '')]])}`;
    if (t && t.email) tmail(t.email, '✅ Confirmación clase grupal — ' + when, 'Nueva confirmación', html, s.code, 'grupo');
    return { ok: true, count: conf.length };
  });
}
function teacherWelcome(t) {
  const u = CONFIG.PLATFORM_URL;
  return tmail(t.email, '🎉 Bienvenido(a) al equipo de mrarrieta.com', '¡Bienvenido(a), ' + h(t.name) + '! 🎉',
    `<p>Ya eres parte del equipo de profesores de <b>mrarrieta.com</b>. Estos son tus datos de acceso:</p>${box([['Portal de profesores', `<a href="${u}profesores.html">${u}profesores.html</a>`], ['Código', '<b>' + h(t.code) + '</b>'], ['PIN', '<b>' + h(t.pin) + '</b>'], ['Chat de docentes', `<a href="${u}docente.html">${u}docente.html</a>`]])}
    <p><b>Primeros pasos:</b></p><ol><li>Entra al portal con tu código y PIN.</li><li>Marca tu <b>disponibilidad semanal</b> (lunes a sábado; domingos y festivos no hay clases).</li><li>Revisa tus notificaciones: ahí te llegan las clases VIP reservadas y las confirmaciones de clases grupales.</li><li>Si nadie confirma una clase grupal, te avisamos 3 horas antes para que no tengas que conectarte.</li></ol>
    <p>No compartas tu PIN con nadie.</p><p style="text-align:center"><a class="btn" href="${u}profesores.html">Entrar al portal</a></p>`, t.code, 'bienvenida');
}
// mensaje del estudiante a su profe (el correo y el WhatsApp del profe nunca se muestran al estudiante)
function studentMessage(r) {
  const s = studentAuth(r); const text = clean(r.text, 1500); if (!text) return { ok: false, err: 'empty' };
  const tid = r.teacherId || (studentTeachers(s)[0] || ''); const t = tid ? findRow('Profesores', tid) : null; if (!t) return { ok: false, err: 'noteacher' };
  const sname = (s.first + ' ' + s.last).trim();
  notify('T:' + t.id, 'msg', '✉️ Mensaje de ' + sname, text, { code: s.code });
  const html = `<p>Hola <b>${h(t.name)}</b>, tu estudiante <b>${h(sname)}</b> (${h(s.code)}) te escribió:</p><p style="padding:12px;background:#f4f6fa;border-left:4px solid #E3242B">${h(text).replace(/\n/g, '<br>')}</p><p style="color:#666">Responde desde tu portal de profesor.</p>`;
  if (t.email) tmail(t.email, '✉️ Mensaje de tu estudiante ' + sname, 'Mensaje de ' + h(sname), html, s.code, 'msg');
  return { ok: true };
}
function hourly() {
  try { autoGroupSessions(); } catch (e) { }
  const cls = all('Clases').filter(c => c.type === 'group' && c.status === 'scheduled' && c.flags !== 'cutoff' && c.date >= addDays(today(), -1));
  cls.forEach(c => {
    const hu = hoursUntil(c.date, c.time); if (hu > CONFIG.GROUP_CONFIRM_HOURS || hu < -2) return;
    const conf = J(c.confirmed, []); const g = findRow('Grupos', c.groupId); const when = niceDate(c.date) + ' · ' + c.time;
    if (!conf.length) { notify('T:' + c.teacherId, 'group', '🙌 Nadie confirmó la clase grupal de ' + when, 'Ningún estudiante del grupo ' + (g ? g.name : '') + ' confirmó su asistencia. No necesitas conectarte a esta clase.', { classId: c.id }); patch('Clases', c, { flags: 'cutoff', status: 'sin-asistentes' }); }
    else { notify('T:' + c.teacherId, 'group', '📋 Clase grupal de ' + when + ': ' + conf.length + ' confirmado(s)', 'Grupo ' + (g ? g.name : '') + '. Ya no se reciben más confirmaciones.', { classId: c.id }); patch('Clases', c, { flags: 'cutoff' }); }
  });
}
function vipCancel(r) {
  return lock(() => {
    const s = studentAuth(r); const c = findRow('Clases', r.classId);
    if (!c || c.type !== 'vip' || J(c.students, []).map(upCode).indexOf(upCode(s.code)) < 0) return { ok: false, err: 'notfound' };
    if (c.status !== 'scheduled') return { ok: false, err: 'state' };
    if (hoursUntil(c.date, c.time) < CONFIG.CANCEL_HOURS) return { ok: false, err: 'too_late' };
    patch('Clases', c, { status: 'cancelled', notes: 'Cancelada por el estudiante ' + now() });
    if (c.slotId) { const sl = findRow('Disponibilidad', c.slotId); if (sl) patch('Disponibilidad', sl, { status: 'free', classId: '' }); }
    const t = findRow('Profesores', c.teacherId);
    if (t && t.email) mail(t.email, 'Clase VIP cancelada — ' + niceDate(c.date) + ' ' + c.time, 'Clase VIP cancelada', `<p>${h(s.first + ' ' + s.last)} canceló su clase VIP del ${niceDate(c.date)} a las ${c.time}. El espacio volvió a quedar disponible.</p>`, s.code, 'vip');
    return { ok: true };
  });
}
function changeRequest(r) {
  const s = studentAuth(r);
  if (planState(s).eff !== 'premium') return { ok: false, err: 'not_premium' };
  const g = s.groupId ? findRow('Grupos', s.groupId) : null;
  const pend = matching('Solicitudes', 'code', upCode(s.code)).find(q => upCode(q.code) === upCode(s.code) && q.status === 'pendiente');
  if (pend) return { ok: false, err: 'pending' };
  const id = uid('sq_');
  insert('Solicitudes', { id, date: now(), code: s.code, name: (s.first + ' ' + s.last).trim(), type: 'cambio de horario', currentGroup: g ? g.name + ' · ' + g.days + ' ' + g.time : '', preferred: clean(r.preferred, 300), reason: clean(r.reason, 600), status: 'pendiente', note: '', resolved: '', newGroup: '' });
  notify('admin', 'solicitud', '🔁 Cambio de horario: ' + s.first + ' ' + s.last, 'Prefiere: ' + clean(r.preferred, 300), { code: s.code });
  mail(CONFIG.ADMIN_EMAIL, 'Solicitud de cambio de horario — ' + s.first + ' ' + s.last, 'Solicitud de cambio de horario', box([['Estudiante', s.first + ' ' + s.last + ' (' + s.code + ')'], ['Grupo actual', g ? g.name + ' · ' + g.days + ' ' + g.time : '—'], ['Horario preferido', clean(r.preferred, 300)], ['Motivo', clean(r.reason, 600)]]) + '<p>Apruébala o recházala en el panel de administración → Solicitudes.</p>', s.code, 'solicitud');
  return { ok: true, id };
}

/* =====================================================================
   FORMULARIOS PÚBLICOS: INSCRIPCIÓN Y RECLUTAMIENTO
   ===================================================================== */
function enrollSave(r) {
  if (!r.first || !r.email || !r.whatsapp) return { ok: false, err: 'missing' };
  const id = uid('in_');
  const row = { id, date: now(), first: clean(r.first, 80), last: clean(r.last, 80), email: clean(r.email, 120), whatsapp: clean(r.whatsapp, 40), birth: clean(r.birth, 10), city: clean(r.city, 120), plan: clean(r.plan, 30), level: clean(r.level, 60), schedule: clean(r.schedule, 120), days: clean(r.days, 120), payment: clean(r.payment, 60), source: clean(r.source, 80), comments: clean(r.comments, 1500), status: 'nuevo', code: '', notes: '' };
  insert('Inscripciones', row);
  const planName = { free: 'Acceso gratuito', membership: 'Membership', premium: 'Premium' }[row.plan] || row.plan;
  mail(row.email, '¡Recibimos tu inscripción en mrarrieta.com! 🎉', '¡Bienvenido(a) a mrarrieta.com!', `<p>Hola <b>${h(row.first)}</b>, ¡gracias por inscribirte! Recibimos tus datos y muy pronto te escribiremos por WhatsApp con tu <b>código de acceso</b> a la plataforma.</p>${box([['Plan de interés', planName], ['WhatsApp', row.whatsapp], ['Horario preferido', [row.schedule, row.days].filter(String).join(' · ') || '—']])}<p>Con tu código podrás tomar tu examen de clasificación y empezar tu <b>ruta de aprendizaje</b>.</p>`, '', 'inscripcion');
  mail(CONFIG.ADMIN_EMAIL, '🆕 Nueva inscripción: ' + row.first + ' ' + row.last + ' — ' + planName, 'Nueva inscripción', box([['Nombre', row.first + ' ' + row.last], ['Correo', row.email], ['WhatsApp', `<a href="https://wa.me/${waNum(row.whatsapp)}">${h(row.whatsapp)}</a>`], ['Nacimiento', row.birth], ['Ciudad', row.city], ['Plan', planName], ['Nivel', row.level], ['Horario', row.schedule + ' ' + row.days], ['Pago', row.payment], ['¿Cómo nos conoció?', row.source], ['Comentarios', row.comments]]) + '<p>Créale su código desde el panel → Inscripciones → “Crear acceso”.</p>', '', 'inscripcion');
  return { ok: true, id };
}
function recruitSave(r) {
  if (!r.name || !r.email) return { ok: false, err: 'missing' };
  const id = uid('rc_');
  insert('Reclutamiento', { id, date: now(), name: clean(r.name, 120), email: clean(r.email, 120), whatsapp: clean(r.whatsapp, 40), city: clean(r.city, 120), experience: clean(r.experience, 300), levels: clean(r.levels, 120), availability: clean(r.availability, 300), about: clean(r.about, 1500),
    listening: r.listening, reading: r.reading, writing: r.writing, speaking: r.speaking, final: r.final, passed: r.passed ? 'sí' : 'no', speakingAnswers: r.speakingAnswers || [], cv: '', files: [], status: 'nuevo', notes: '' });
  return { ok: true, id };
}
function recruitDone(r) {
  const x = findRow('Reclutamiento', r.id); if (!x) return { ok: false, err: 'notfound' };
  const cv = J(x.cv, null);
  mail(CONFIG.ADMIN_EMAIL, '👩‍🏫 Nuevo candidato: ' + x.name + ' — ' + (x.passed === 'sí' ? 'APROBÓ' : 'no aprobó') + ' (' + x.final + ')', 'Nuevo candidato — Proceso de selección', box([['Nombre', x.name], ['Correo', x.email], ['WhatsApp', `<a href="https://wa.me/${waNum(x.whatsapp)}">${h(x.whatsapp)}</a>`], ['Ciudad', x.city], ['Experiencia', x.experience], ['Niveles', x.levels], ['Disponibilidad', x.availability], ['Listening', x.listening], ['Reading', x.reading], ['Writing', x.writing], ['Speaking', x.speaking], ['Resultado', x.final + ' — ' + (x.passed === 'sí' ? 'APROBADO' : 'NO APROBADO')], ['Hoja de vida', cv ? `<a href="https://drive.google.com/file/d/${cv.fileId}/view">${h(cv.name)}</a>` : '—']]) + '<p>Escucha sus audios en el panel de administración → Reclutamiento.</p>', '', 'reclutamiento');
  return { ok: true };
}

/* =====================================================================
   PROFESORES
   ===================================================================== */
function teachersFull() {
  const cls = all('Clases'), slots = all('Disponibilidad'); const t0 = today(), m0 = t0.slice(0, 7);
  return all('Profesores').map(t => {
    const mine = cls.filter(c => c.teacherId === t.id);
    return Object.assign({}, t, { _r: undefined,
      taughtTotal: mine.filter(c => c.status === 'done').length,
      taughtMonth: mine.filter(c => c.status === 'done' && c.date.slice(0, 7) === m0).length,
      vipTotal: mine.filter(c => c.status === 'done' && c.type === 'vip').length,
      groupTotal: mine.filter(c => c.status === 'done' && c.type === 'group').length,
      upcoming: mine.filter(c => c.status === 'scheduled' && c.date >= t0).length,
      freeSlots: slots.filter(s => s.teacherId === t.id && s.status === 'free' && s.date >= t0).length });
  });
}
function teacherData(t) {
  const t0 = today(); const studs = {};
  const cls = all('Clases').filter(c => c.teacherId === t.id);
  const codes = {}; cls.forEach(c => J(c.students, []).forEach(x => codes[upCode(x)] = 1));
  const groups = all('Grupos').filter(g => g.teacherId === t.id);
  const st = all('Estudiantes');
  st.forEach(s => { if (codes[upCode(s.code)] || groups.some(g => g.id === s.groupId)) studs[upCode(s.code)] = { code: s.code, name: (s.first + ' ' + s.last).trim(), module: s.module, groupId: s.groupId, progress: J(s.progress, {}), classesDone: +s.classesDone || 0, lastSeen: s.lastSeen, weak: '' }; });
  return { ok: true, teacher: { id: t.id, name: t.name, code: t.code, email: t.email, meet: t.meet, weekly: J(t.weekly, {}) },
    slots: all('Disponibilidad').filter(s => s.teacherId === t.id && s.date >= addDays(t0, -1)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(s => ({ id: s.id, date: s.date, time: s.time, duration: s.duration, status: s.status, classId: s.classId })),
    classes: cls.filter(c => c.date >= addDays(t0, -60)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(c => ({ id: c.id, type: c.type, date: c.date, time: c.time, duration: c.duration, groupId: c.groupId, students: J(c.students, []), confirmed: J(c.confirmed, []).length, flags: c.flags || '', status: c.status, attendance: J(c.attendance, {}), meet: c.meet, topic: c.topic, notes: c.notes })),
    groups: groups.map(g => ({ id: g.id, name: g.name, level: g.level, days: g.days, time: g.time, meet: g.meet })),
    students: studs,
    notifications: notifsFor('T:' + t.id, 40),
    homework: matching('Tareas', 'teacherIds', t.id).reverse().slice(0, 60).map(x => ({ id: x.id, date: x.date, code: x.code, name: x.name, module: x.module, part: x.part, title: x.title, text: x.text, score: x.score, status: x.status, feedback: x.feedback, feedbackDate: x.feedbackDate })),
    evaluations: matching('Evaluaciones', 'teacherId', t.id).filter(e => e.teacherId === t.id).reverse().slice(0, 60).map(e => ({ date: e.date.slice(0, 10), module: e.module, q: [+e.q1, +e.q2, +e.q3], score: +e.score })),
    evalQuestions: EVALQ,
    recognitions: all('Reconocimientos').reverse().slice(0, 8).map(x => ({ quarter: x.quarter, teacherName: x.teacherName, score: x.score, me: x.teacherId === t.id })),
    stats: { taughtTotal: all('Clases').filter(c => c.teacherId === t.id && c.status === 'done').length, taughtMonth: cls.filter(c => c.status === 'done' && c.date.slice(0, 7) === t0.slice(0, 7)).length } };
}
// disponibilidad SEMANAL del profe (cuadrícula L–S): se convierte en espacios reales para las próximas 4 semanas
function cleanWeekly(w) { const o = {}; Object.keys(w || {}).forEach(d => { if (!/^[0-6]$/.test(d)) return; o[d] = (w[d] || []).map(x => clean(x, 5)).filter(x => /^\d{2}:\d{2}$/.test(x)).slice(0, 24); }); return o; }
function teacherWeekly(t, r) {
  const w = cleanWeekly(r.weekly);
  patch('Profesores', t, { weekly: w }); t.weekly = JSON.stringify(w);
  regenWeekly(t, w);
  return teacherData(t);
}
function regenWeekly(t, w) {
  return lock(() => {
    const t0 = today(); const ex = all('Disponibilidad').filter(s => s.teacherId === t.id && s.date >= t0 && s.status !== 'deleted');
    const want = {};
    for (let i = 0; i < 28; i++) { const d = addDays(t0, i); const dow = String(new Date(d + 'T12:00:00').getDay()); if (FEST.isOff(d)) continue; (w[dow] || []).forEach(h => { if (i === 0 && hoursUntil(d, h) < 1) return; want[d + ' ' + h] = 1; }); }
    Object.keys(want).forEach(k => { const [d, h] = k.split(' '); if (!ex.some(s => s.date === d && s.time === h)) insert('Disponibilidad', { id: uid('av_'), teacherId: t.id, date: d, time: h, duration: '60', status: 'free', classId: '', created: now(), src: 'w' }); });
    ex.forEach(s => { if (s.src === 'w' && s.status === 'free' && !want[s.date + ' ' + s.time]) patch('Disponibilidad', s, { status: 'deleted' }); });
    return true;
  });
}
/* =====================================================================
   DOMINGOS Y FESTIVOS DE COLOMBIA: no hay clases VIP, grupales ni clubs
   ===================================================================== */
const FEST = (function () {
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  const add = (d, n) => new Date(d.getTime() + n * 864e5);
  function easter(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return new Date(Date.UTC(y, mo - 1, da)); }
  const toMon = d => { const w = d.getUTCDay(); return w === 1 ? d : add(d, (8 - w) % 7); };
  const cache = {};
  function year(y) {
    if (cache[y]) return cache[y]; const H = {}; const D = (m, d) => new Date(Date.UTC(y, m - 1, d)); const E = easter(y);
    [[D(1, 1), 'Año Nuevo'], [D(5, 1), 'Día del Trabajo'], [D(7, 20), 'Día de la Independencia'], [D(8, 7), 'Batalla de Boyacá'], [D(12, 8), 'Inmaculada Concepción'], [D(12, 25), 'Navidad'],
     [add(E, -3), 'Jueves Santo'], [add(E, -2), 'Viernes Santo']].forEach(([d, n]) => H[iso(d)] = n);
    [[D(1, 6), 'Reyes Magos'], [D(3, 19), 'San José'], [D(6, 29), 'San Pedro y San Pablo'], [D(8, 15), 'Asunción de la Virgen'], [D(10, 12), 'Día de la Raza'], [D(11, 1), 'Todos los Santos'], [D(11, 11), 'Independencia de Cartagena'],
     [add(E, 39), 'Ascensión del Señor'], [add(E, 60), 'Corpus Christi'], [add(E, 68), 'Sagrado Corazón']].forEach(([d, n]) => H[iso(toMon(d))] = n);
    return (cache[y] = H);
  }
  function name(s) { s = String(s || '').slice(0, 10); const y = +s.slice(0, 4); return y ? (year(y)[s] || '') : ''; }
  function isSunday(s) { return new Date(String(s).slice(0, 10) + 'T12:00:00Z').getUTCDay() === 0; }
  function isOff(s) { return isSunday(s) || !!name(s); }
  function why(s) { return name(s) ? 'festivo (' + name(s) + ')' : isSunday(s) ? 'domingo' : ''; }
    return { isOff, name, why };
})();
function teacherSlotAdd(t, r) {
  const list = (r.slots || []).slice(0, 200); let n = 0;
  const exist = all('Disponibilidad').filter(s => s.teacherId === t.id);
  list.forEach(x => {
    const date = clean(x.date, 10), time = clean(x.time, 5);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || date < today() || FEST.isOff(date)) return;
    if (exist.some(s => s.date === date && s.time === time && s.status !== 'deleted')) return;
    insert('Disponibilidad', { id: uid('av_'), teacherId: t.id, date, time, duration: clean(x.duration || '60', 4), status: 'free', classId: '', created: now() }); n++;
  });
  return { ok: true, added: n };
}
function teacherSlotDel(t, r) {
  return lock(() => { const s = findRow('Disponibilidad', r.slotId); if (!s || s.teacherId !== t.id) return { ok: false, err: 'notfound' }; if (s.status !== 'free') return { ok: false, err: 'booked' }; patch('Disponibilidad', s, { status: 'deleted' }); return { ok: true }; });
}
// marcar clase como dictada / no asistió + asistencia (profe o admin)
function classMark(r, t) {
  const c = findRow('Clases', r.classId); if (!c) return { ok: false, err: 'notfound' };
  if (t && c.teacherId !== t.id) return { ok: false, err: 'auth' };
  const st = ['done', 'noshow', 'cancelled', 'scheduled'].indexOf(r.status) >= 0 ? r.status : 'done';
  patch('Clases', c, { status: st, attendance: r.attendance || {}, notes: clean(r.notes, 800) });
  if (st === 'cancelled' && c.slotId) { const sl = findRow('Disponibilidad', c.slotId); if (sl) patch('Disponibilidad', sl, { status: 'free', classId: '' }); }
  return { ok: true };
}

/* =====================================================================
   ADMINISTRACIÓN
   ===================================================================== */
function adminStats() {
  const st = all('Estudiantes'), t = today(), md = t.slice(5);
  const byPlan = { free: 0, membership: 0, premium: 0, expired: 0 };
  const expiring = [], birthdays = [];
  st.filter(s => s.status !== 'archivado').forEach(s => { const p = planState(s); if (p.expired) byPlan.expired++; else byPlan[p.eff]++;
    if (!p.expired && p.daysLeft !== null && p.daysLeft <= 7) expiring.push({ code: s.code, name: s.first + ' ' + s.last, plan: s.plan, planEnd: s.planEnd, daysLeft: p.daysLeft });
    if (s.birth && s.birth.slice(5, 7) === md.slice(0, 2)) birthdays.push({ code: s.code, name: s.first + ' ' + s.last, birth: s.birth, today: s.birth.slice(5) === md }); });
  const cls = all('Clases'); const m0 = t.slice(0, 7);
  const active7 = st.filter(s => s.lastSeen && s.lastSeen.slice(0, 10) >= addDays(t, -7)).length;
  return { ok: true, today: t, students: st.length, active7, byPlan, expiring: expiring.sort((a, b) => a.daysLeft - b.daysLeft),
    birthdays: birthdays.sort((a, b) => a.birth.slice(8).localeCompare(b.birth.slice(8))),
    revenue: byPlan.membership * CONFIG.PRICES.membership + byPlan.premium * CONFIG.PRICES.premium,
    enrollNew: all('Inscripciones').filter(x => x.status === 'nuevo').length, enrollTotal: all('Inscripciones').length,
    placementTotal: all('Placement').length, placementMonth: all('Placement').filter(x => x.date.slice(0, 7) === m0).length,
    recruitNew: all('Reclutamiento').filter(x => x.status === 'nuevo').length, recruitTotal: all('Reclutamiento').length,
    requestsPending: all('Solicitudes').filter(x => x.status === 'pendiente').length,
    notifUnread: matching('Notificaciones', 'to', 'admin').filter(x => x.to === 'admin' && !x.read).length,
    examsMonth: all('Examenes').filter(x => x.date.slice(0, 7) === m0).length,
    classesMonth: cls.filter(c => c.status === 'done' && c.date.slice(0, 7) === m0).length,
    classesUpcoming: cls.filter(c => c.status === 'scheduled' && c.date >= t).length,
    teachers: teachersFull().map(x => ({ id: x.id, name: x.name, taughtMonth: x.taughtMonth, taughtTotal: x.taughtTotal, freeSlots: x.freeSlots, active: x.active })) };
}
// listados paginados y con búsqueda en el servidor (sirven aunque haya miles de registros)
function adminList(r) {
  const table = r.table; if (!TABLES[table]) return { ok: false, err: 'table' };
  let rows = all(table);
  const q = String(r.q || '').trim().toLowerCase();
  if (q) rows = rows.filter(x => Object.keys(x).some(k => k !== 'progress' && k !== 'speakingAnswers' && k !== 'files' && String(x[k]).toLowerCase().indexOf(q) >= 0));
  const f = r.filter || {};
  Object.keys(f).forEach(k => { if (f[k] !== '' && f[k] !== undefined) rows = rows.filter(x => k === '_plan' ? planState(x).expired ? f[k] === 'expired' : planState(x).eff === f[k] : String(x[k]) === String(f[k])); });
  if (table !== 'Config' && table !== 'Disponibilidad') rows.reverse(); // lo más reciente primero
  if (table === 'Disponibilidad' || table === 'Clases') rows.sort((a, b) => (r.desc ? -1 : 1) * (a.date + a.time).localeCompare(b.date + b.time));
  const size = Math.min(200, +r.size || 30), page = Math.max(0, +r.page || 0), total = rows.length;
  rows = rows.slice(page * size, page * size + size);
  if (table === 'Estudiantes') { const cls = all('Clases'); const gr = all('Grupos'); rows = rows.map(s => Object.assign(s, { _state: planState(s), _attended: studentClasses(s.code, cls).filter(x => attended(x, s.code)).length, _group: (gr.find(g => g.id === s.groupId) || {}).name || '' })); }
  rows.forEach(x => delete x._r);
  return { ok: true, rows, total, page, size };
}
function adminGet(r) {
  const table = r.table; const row = findRow(table, r.id); if (!row) return { ok: false, err: 'notfound' };
  const res = { ok: true, row };
  if (table === 'Estudiantes') {
    const cls = all('Clases'); const teachers = all('Profesores'); const tn = id => (teachers.find(t => t.id === id) || {}).name || '';
    res.state = planState(row); res.credits = credits(row, cls);
    res.classes = studentClasses(row.code, cls).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).map(c => ({ id: c.id, type: c.type, date: c.date, time: c.time, teacher: tn(c.teacherId), status: c.status, attended: attended(c, row.code) }));
    res.placements = all('Placement').filter(p => upCode(p.code) === upCode(row.code)).reverse().map(p => ({ id: p.id, date: p.date, final: p.final, module: p.module, level: p.level }));
    res.plans = all('Planes').filter(p => upCode(p.code) === upCode(row.code)).reverse();
    res.requests = all('Solicitudes').filter(p => upCode(p.code) === upCode(row.code)).reverse();
    const d = readData(row); res.dataTs = d ? d.ts : null;
  }
  if (table === 'Profesores') { const t = teachersFull().find(x => x.id === row.id); res.stats = t; res.slots = all('Disponibilidad').filter(s => s.teacherId === row.id && s.date >= addDays(today(), -1) && s.status !== 'deleted'); res.classes = all('Clases').filter(c => c.teacherId === row.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 80); }
  if (table === 'Grupos') res.students = all('Estudiantes').filter(s => s.groupId === row.id).map(s => ({ code: s.code, name: s.first + ' ' + s.last, plan: planState(s).eff }));
  delete row._r; return res;
}
function genCode(first) {
  const base = String(first || 'MRA').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 8) || 'MRA';
  for (let i = 0; i < 50; i++) { const c = base + '-' + Math.floor(1000 + Math.random() * 9000); if (!findRow('Estudiantes', c)) return c; }
  return base + '-' + Date.now().toString().slice(-6);
}
function adminSave(r) {
  const table = r.table; if (['Estudiantes', 'Profesores', 'Grupos', 'Clases', 'Config', 'Inscripciones', 'Reclutamiento', 'Disponibilidad'].indexOf(table) < 0) return { ok: false, err: 'table' };
  const data = Object.assign({}, r.row || {}); delete data._r; delete data._state; delete data._attended; delete data._group;
  return lock(() => {
    const key = KEYCOL[table] || 'id';
    if (table === 'Config') { setConf(data.key, data.value); return { ok: true }; }
    let ex = data[key] ? findRow(table, data[key]) : null;
    if (ex) { delete data[key]; if (table === 'Estudiantes' && data.module !== undefined && String(data.module) !== String(ex.module)) { data.moduleSet = Date.now(); data.moduleBy = 'admin'; } patch(table, ex, Object.assign(data, table === 'Estudiantes' ? { updated: now() } : {})); delete ex._r; return { ok: true, row: ex }; }
    // nuevo registro
    if (table === 'Estudiantes') {
      data.code = data.code ? upCode(data.code) : genCode(data.first);
      if (findRow('Estudiantes', data.code)) return { ok: false, err: 'code_exists' };
      Object.assign(data, { plan: data.plan || 'free', status: data.status || 'activo', created: now(), updated: now() });
      if (data.module) { data.moduleSet = Date.now(); data.moduleBy = 'admin'; }
    } else if (table === 'Profesores') {
      data.id = uid('pf_'); data.code = upCode(data.code || ('PROFE-' + String(data.name || 'X').split(' ')[0].normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase()));
      if (all('Profesores').some(t => upCode(t.code) === data.code)) data.code += '-' + Math.floor(10 + Math.random() * 90);
      data.pin = data.pin || String(Math.floor(1000 + Math.random() * 9000)); data.active = data.active || 'sí'; data.created = now();
    } else { data.id = data.id || uid(table.slice(0, 2).toLowerCase() + '_'); data.created = data.created || now(); }
    if (table === 'Clases') { data.status = data.status || 'scheduled'; data.createdBy = 'admin'; }
    const row = insert(table, data); delete row._r;
    if (table === 'Profesores' && row.email) row.mailed = teacherWelcome(row);
    return { ok: true, row };
  });
}
// activar / renovar planes (el pago se recibe por transferencia o WhatsApp)
function adminPlan(r) {
  return lock(() => {
    const s = findRow('Estudiantes', upCode(r.code)); if (!s) return { ok: false, err: 'notfound' };
    const plan = r.plan; const months = Math.max(0, +r.months || 0); const t = today();
    if (['free', 'membership', 'premium'].indexOf(plan) < 0) return { ok: false, err: 'plan' };
    let start = s.planStart, end = s.planEnd;
    if (plan === 'free') { start = ''; end = ''; }
    else {
      const st = planState(s); const same = s.plan === plan && st.active && s.planEnd;
      if (!same) { start = t; end = addDays(addMonths(t, months || 1), -1); }      // nuevo plan o vencido: empieza hoy
      else { end = addMonths(addDays(s.planEnd, 1), months || 1); end = addDays(end, -1); } // renovación: suma meses
      if (r.end) end = clean(r.end, 10); // fecha manual
    }
    patch('Estudiantes', s, { plan, planStart: start, planEnd: end, status: 'activo', updated: now() });
    insert('Planes', { id: uid('pa_'), date: now(), code: s.code, name: s.first + ' ' + s.last, plan, months, start, end, amount: r.amount || (CONFIG.PRICES[plan] ? CONFIG.PRICES[plan] * (months || 1) : 0), note: clean(r.note, 300) });
    const names = { free: 'Acceso gratuito', membership: 'Membership', premium: 'Premium' };
    if (s.email && plan !== 'free' && r.notify !== false) mail(s.email, '🎉 Tu plan ' + names[plan] + ' está activo', '¡Tu plan ' + names[plan] + ' está activo!', `<p>Hola <b>${h(s.first)}</b>, ¡gracias por confiar en mrarrieta.com!</p>${box([['Plan', names[plan]], ['Vigente hasta', niceDate(end)], ['Tu código', s.code]])}${plan === 'premium' ? `<p>Con Premium tienes <b>${CONFIG.GROUP_PER_MONTH} clases grupales</b> y <b>${CONFIG.VIP_PER_MONTH} clases VIP</b> al mes, además del <b>Club de conversación y fonética</b>. Reserva tus clases VIP desde tu perfil.</p>` : '<p>Ya tienes toda tu ruta de aprendizaje desbloqueada: módulos, actividades, materiales y tu progreso guardado.</p>'}<p style="text-align:center"><a class="btn" href="${CONFIG.PLATFORM_URL}">Entrar a mi plataforma →</a></p>`, s.code, 'plan');
    delete s._r; return { ok: true, row: s, state: planState(s) };
  });
}
function adminStatus(r) { const t = ['Inscripciones', 'Reclutamiento', 'Estudiantes', 'Clases'].indexOf(r.table) >= 0 ? r.table : null; if (!t) return { ok: false }; const x = findRow(t, r.id); if (!x) return { ok: false, err: 'notfound' }; const ch = { status: clean(r.status, 30) }; if (r.notes !== undefined) ch.notes = clean(r.notes, 1500); patch(t, x, ch); return { ok: true }; }
function adminRequest(r) {
  return lock(() => {
    const q = findRow('Solicitudes', r.id); if (!q) return { ok: false, err: 'notfound' };
    const status = r.status === 'aprobada' ? 'aprobada' : 'rechazada';
    patch('Solicitudes', q, { status, note: clean(r.note, 600), resolved: now(), newGroup: r.groupId || '' });
    const s = findRow('Estudiantes', q.code); let gtxt = '';
    if (q.type === 'intento extra') {
      if (s && status === 'aprobada') { const ex = J(s.extras, {}); ex[q.examKey] = (+ex[q.examKey] || 0) + 1; patch('Estudiantes', s, { extras: ex }); }
      if (s) notify('S:' + upCode(s.code), 'intento', status === 'aprobada' ? '✅ Te habilitamos un intento extra' : 'Sobre tu solicitud de intento extra', status === 'aprobada' ? `Ya puedes presentar de nuevo el ${EXAMN[q.exam] || q.exam}. ¡Mucho éxito! 💪${r.note ? ' ' + clean(r.note, 300) : ''}` : `Por ahora no se aprobó tu intento adicional del ${EXAMN[q.exam] || q.exam}.${r.note ? ' ' + clean(r.note, 300) : ''}`, { exam: q.exam, examKey: q.examKey, approved: status === 'aprobada' });
      if (s && s.email) mail(s.email, status === 'aprobada' ? '✅ Intento extra habilitado — ' + (EXAMN[q.exam] || q.exam) : 'Respuesta a tu solicitud de intento extra', status === 'aprobada' ? 'Intento extra habilitado' : 'Sobre tu solicitud', `<p>Hola <b>${h(s.first)}</b>, ${status === 'aprobada' ? `te habilitamos un intento adicional del <b>${EXAMN[q.exam] || q.exam}</b>. Entra a tu plataforma cuando estés listo(a).` : `por ahora no pudimos habilitar un intento adicional del ${EXAMN[q.exam] || q.exam}.`}</p>${r.note ? '<p>' + h(r.note) + '</p>' : ''}`, q.code, 'intento');
      return { ok: true };
    }
    if (s && status === 'aprobada' && r.groupId) { const g = findRow('Grupos', r.groupId); patch('Estudiantes', s, { groupId: r.groupId }); gtxt = g ? g.name + ' · ' + g.days + ' ' + g.time : ''; }
    if (s) notify('S:' + upCode(s.code), 'horario', status === 'aprobada' ? '✅ Aprobamos tu cambio de horario' : 'Sobre tu solicitud de cambio de horario', status === 'aprobada' ? 'Tu solicitud fue aprobada.' + (gtxt ? ' Nuevo grupo: ' + gtxt : '') : 'Por ahora no pudimos aprobar tu solicitud.' + (r.note ? ' ' + clean(r.note, 300) : ''), {});
    if (s && s.email) mail(s.email, status === 'aprobada' ? '✅ Aprobamos tu cambio de horario' : 'Respuesta a tu solicitud de cambio de horario', status === 'aprobada' ? 'Cambio de horario aprobado' : 'Sobre tu solicitud de cambio', `<p>Hola <b>${h(s.first)}</b>,</p>${status === 'aprobada' ? `<p>Tu solicitud fue <b>aprobada</b>.${gtxt ? ' Tu nuevo grupo es: <b>' + h(gtxt) + '</b>.' : ''}</p>` : '<p>Por ahora no pudimos aprobar tu solicitud.</p>'}${r.note ? '<p>' + h(r.note) + '</p>' : ''}<p>Puedes ver tu horario en tu perfil de la plataforma.</p>`, q.code, 'solicitud');
    return { ok: true };
  });
}
function adminFile(r) { const f = DriveApp.getFileById(r.id); const b = f.getBlob(); if (b.getBytes().length > 15e6) return { ok: true, url: f.getUrl(), big: true }; return { ok: true, name: f.getName(), mime: b.getContentType(), b64: Utilities.base64Encode(b.getBytes()), url: f.getUrl() }; }
// programar las clases grupales del mes (una fila por sesión)
function adminSessions(r) {
  const g = findRow('Grupos', r.groupId); if (!g) return { ok: false, err: 'notfound' };
  const codes = all('Estudiantes').filter(s => s.groupId === g.id && planState(s).eff === 'premium').map(s => s.code);
  const ex = all('Clases').filter(c => c.groupId === g.id); let n = 0;
  (r.dates || []).slice(0, 31).forEach(d => { if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || FEST.isOff(d) || ex.some(c => c.date === d && c.status !== 'cancelled')) return;
    insert('Clases', { id: uid('cl_'), type: 'group', date: d, time: r.time || g.time, duration: g.duration || '60', teacherId: g.teacherId, groupId: g.id, students: codes, status: 'scheduled', attendance: {}, meet: g.meet, topic: clean(r.topic, 200), notes: '', slotId: '', created: now(), createdBy: 'admin' }); n++; });
  return { ok: true, added: n };
}
function adminSlot(r) {
  if (r.del) { const s = findRow('Disponibilidad', r.slotId); if (!s || s.status !== 'free') return { ok: false, err: 'booked' }; patch('Disponibilidad', s, { status: 'deleted' }); return { ok: true }; }
  const t = findRow('Profesores', r.teacherId); if (!t) return { ok: false, err: 'notfound' };
  return teacherSlotAdd(t, r);
}
// inscripción → estudiante con código (un clic)
function adminConvert(r) {
  const x = findRow('Inscripciones', r.id); if (!x) return { ok: false, err: 'notfound' };
  if (x.code) return { ok: true, code: x.code, existed: true };
  const res = adminSave({ table: 'Estudiantes', row: { first: x.first, last: x.last, email: x.email, whatsapp: x.whatsapp, birth: x.birth, plan: 'free', source: 'inscripción', notes: x.comments } });
  if (!res.ok) return res;
  patch('Inscripciones', x, { code: res.row.code, status: 'inscrito' });
  if (r.notify !== false && x.email) mail(x.email, '🔑 Tu código de acceso a mrarrieta.com', 'Tu código de acceso', `<p>Hola <b>${h(x.first)}</b>, ¡ya tienes acceso a tu plataforma!</p>${box([['Tu código', '<b style="font-size:20px">' + res.row.code + '</b>'], ['Plataforma', `<a href="${CONFIG.PLATFORM_URL}">${CONFIG.PLATFORM_URL}</a>`]])}<p>Entra, escribe tu código, toma tu <b>examen de clasificación</b> y descubre tu ruta de aprendizaje. Tus 2 primeros temas son gratis.</p>`, res.row.code, 'codigo');
  return { ok: true, code: res.row.code };
}


/* =====================================================================
   NOTIFICACIONES (admin · profe · estudiante)
   ===================================================================== */
function notify(to, type, title, body, data) { insert('Notificaciones', { id: uid('nt_'), date: now(), to, type, title: clean(title, 200), body: clean(body, 1500), data: data || {}, read: '' }); }
function notifsFor(to, n) { return matching('Notificaciones', 'to', to).filter(x => x.to === to).reverse().slice(0, n || 30).map(x => ({ id: x.id, date: x.date, type: x.type, title: x.title, body: x.body, data: J(x.data, {}), read: !!x.read })); }
function notifRead(r) {
  let to;
  if (r.key) { adminAuth(r); to = 'admin'; } else if (r.tcode) { to = 'T:' + teacherAuth(r).id; } else { to = 'S:' + upCode(studentAuth(r).code); }
  const ids = r.ids || []; matching('Notificaciones', 'to', to).forEach(x => { if (x.to === to && !x.read && (r.all || ids.indexOf(x.id) >= 0)) patch('Notificaciones', x, { read: now() }); });
  return { ok: true };
}
// profes del estudiante: el de su grupo + los de sus clases VIP recientes
function studentTeachers(s, classesAll) {
  const ids = []; const g = s.groupId ? findRow('Grupos', s.groupId) : null; if (g && g.teacherId) ids.push(g.teacherId);
  studentClasses(s.code, classesAll).filter(c => c.date >= addDays(today(), -90)).sort((a, b) => b.date.localeCompare(a.date)).forEach(c => { if (c.teacherId && ids.indexOf(c.teacherId) < 0) ids.push(c.teacherId); });
  return ids;
}
const EXAMN = { A1: 'Módulo 1 · A1', A2: 'Módulo 2 · A2', B2: 'Módulo 3 · B2', 'B2+': 'Módulo 4 · B2+', FINAL: 'Examen final del curso', placement: 'Examen de clasificación' };
// resultado de un examen → profe(s) y administración reciben una notificación en su plataforma
function examResult(r) {
  const s = studentAuth(r); const tids = studentTeachers(s); const name = (s.first + ' ' + s.last).trim();
  const ex = EXAMN[r.exam] || clean(r.exam, 40); const passed = r.passed === true || r.passed === 'sí';
  insert('Examenes', { id: uid('ex_'), date: now(), code: s.code, name, exam: clean(r.exam, 20), attempt: clean(r.attempt, 40), listening: r.listening, reading: r.reading, writing: r.writing, speaking: r.speaking, final: r.final, passed: passed ? 'sí' : 'no', teacherIds: tids });
  const body = `${name} presentó el ${ex} (${clean(r.attempt, 40)}): nota ${r.final}/10 — ${passed ? 'APROBÓ ✅' : 'no aprobó'}. Listening ${r.listening} · Reading ${r.reading} · Writing ${r.writing} · Speaking ${r.speaking}.`;
  const data = { code: s.code, exam: r.exam, final: r.final, passed };
  tids.forEach(t => notify('T:' + t, 'examen', '📝 Resultado de examen: ' + name, body, data));
  notify('admin', 'examen', '📝 ' + name + ' · ' + ex, body, data);
  return { ok: true };
}
// el estudiante pide un intento extra (solo cuando agotó sus intentos) → administración decide
function attemptRequest(r) {
  const s = studentAuth(r); const exam = clean(r.exam, 20), key = clean(r.examKey, 60);
  if (matching('Solicitudes', 'code', upCode(s.code)).some(q => q.type === 'intento extra' && q.examKey === key && q.status === 'pendiente')) return { ok: false, err: 'pending' };
  insert('Solicitudes', { id: uid('sq_'), date: now(), code: s.code, name: (s.first + ' ' + s.last).trim(), type: 'intento extra', currentGroup: '', preferred: 'Intento adicional · ' + (EXAMN[exam] || exam), reason: clean(r.reason, 600), status: 'pendiente', note: '', resolved: '', newGroup: '', exam, examKey: key });
  notify('admin', 'solicitud', '🔁 Solicitud de intento extra', `${s.first} ${s.last} (${s.code}) pide un intento adicional del ${EXAMN[exam] || exam}.${r.reason ? ' Motivo: ' + clean(r.reason, 300) : ''}`, { code: s.code, exam });
  return { ok: true };
}
// tareas: solo Premium → el profe recibe notificación, revisa y da feedback
function homeworkSave(r) {
  const s = studentAuth(r); if (planState(s).eff !== 'premium') return { ok: false, err: 'not_premium' };
  const tids = studentTeachers(s); const id = uid('hw_'); const name = (s.first + ' ' + s.last).trim();
  insert('Tareas', { id, date: now(), code: s.code, name, module: clean(r.module, 10), part: clean(r.part, 20), title: clean(r.title, 200), text: clean(r.text, 6000), score: clean(r.score, 20), teacherIds: tids, status: 'pendiente', feedback: '', feedbackBy: '', feedbackDate: '' });
  tids.forEach(t => notify('T:' + t, 'tarea', '✍️ Nueva tarea de ' + name, `${clean(r.title, 200)} · ${clean(r.module, 10)}. Revísala y déjale tu feedback.`, { id, code: s.code }));
  if (!tids.length) notify('admin', 'tarea', '✍️ Tarea sin profe asignado: ' + name, clean(r.title, 200), { id, code: s.code });
  return { ok: true, id, teachers: tids.length };
}
function homeworkFeedback(t, r) {
  const x = findRow('Tareas', r.id); if (!x) return { ok: false, err: 'notfound' };
  if (J(x.teacherIds, []).indexOf(t.id) < 0) return { ok: false, err: 'auth' };
  patch('Tareas', x, { feedback: clean(r.feedback, 3000), feedbackBy: t.name, feedbackDate: now(), status: 'revisada' });
  notify('S:' + upCode(x.code), 'feedback', '💬 Tu profe ' + t.name + ' revisó tu tarea', `${x.title}: ${clean(r.feedback, 600)}`, { id: x.id, part: x.part, module: x.module, feedback: clean(r.feedback, 3000), teacher: t.name });
  const s = findRow('Estudiantes', x.code);
  if (s && s.email) mail(s.email, '💬 Feedback de tu tarea — ' + x.title, 'Tu profe revisó tu tarea', `<p>Hola <b>${h(s.first)}</b>, ${h(t.name)} revisó tu tarea <b>${h(x.title)}</b>:</p><blockquote style="border-left:4px solid #E3242B;margin:10px 0;padding:6px 12px;background:#f4f6fa">${h(r.feedback)}</blockquote><p style="text-align:center"><a class="btn" href="${CONFIG.PLATFORM_URL}">Ver en mi plataforma →</a></p>`, s.code, 'feedback');
  return { ok: true };
}
/* =====================================================================
   EVALUACIÓN DOCENTE (al terminar el módulo, antes del examen final)
   Q1 ¿Te gusta cómo te enseña tu profe? · Q2 ¿Cómo calificas a tu profe? · Q3 ¿Sientes que aprendiste más?
   Respuestas 1–3 (3 = la mejor). El profe la recibe ANÓNIMA.
   ===================================================================== */
const EVALQ = [['¿Te gusta cómo tu profesor te está enseñando?', ['Sí, me encanta', 'Más o menos', 'No mucho']], ['¿Cómo calificas a tu profe?', ['Excelente', 'Bueno', 'Regular']], ['¿Sientes que has aprendido más en este módulo?', ['Sí, mucho más', 'Un poco', 'No mucho']]];
function evalSave(r) {
  const s = studentAuth(r); const st = planState(s);
  const tids = studentTeachers(s); const teacherId = clean(r.teacherId, 30) || tids[0] || '';
  const q = [r.q1, r.q2, r.q3].map(v => Math.max(1, Math.min(3, +v || 0)));
  const score = Math.round((q.reduce((a, b) => a + b, 0) / 3) * 100) / 100;
  insert('Evaluaciones', { id: uid('ev_'), date: now(), code: s.code, teacherId, module: clean(r.module, 10), q1: q[0], q2: q[1], q3: q[2], score, premium: st.eff === 'premium' ? 'sí' : 'no' });
  const txt = EVALQ.map((x, i) => `${x[0]} → ${x[1][3 - q[i]]}`).join(' · ');
  if (teacherId) notify('T:' + teacherId, 'evaluacion', '⭐ Nueva evaluación anónima (' + (EXAMN[r.module] || r.module) + ')', txt, { module: r.module, q, score });
  const t = teacherId ? findRow('Profesores', teacherId) : null;
  notify('admin', 'evaluacion', '⭐ Evaluación docente: ' + (t ? t.name : 'sin profe') + ' · ' + score + '/3', `${s.first} ${s.last} (${s.code}) · ${EXAMN[r.module] || r.module} · ${txt}`, { code: s.code, teacherId, q, score });
  return { ok: true };
}
// trimestres: Q1 ene–mar, Q2 abr–jun, Q3 jul–sep, Q4 oct–dic
function quarterOf(iso) { const y = iso.slice(0, 4), m = +iso.slice(5, 7); return y + '-Q' + Math.ceil(m / 3); }
function prevQuarter() { const t = today(); const y = +t.slice(0, 4), q = Math.ceil(+t.slice(5, 7) / 3); return q === 1 ? (y - 1) + '-Q4' : y + '-Q' + (q - 1); }
function ranking(quarter) {
  const ev = all('Evaluaciones').filter(e => e.premium === 'sí' && e.teacherId && quarterOf(e.date.slice(0, 10)) === quarter);
  const by = {}; ev.forEach(e => { (by[e.teacherId] = by[e.teacherId] || []).push(+e.score || 0); });
  const T = all('Profesores');
  return Object.keys(by).map(id => { const a = by[id]; const t = T.find(x => x.id === id) || {}; return { teacherId: id, name: t.name || id, evaluations: a.length, score: Math.round(a.reduce((x, y) => x + y, 0) / a.length * 100) / 100 }; })
    .sort((a, b) => b.score - a.score || b.evaluations - a.evaluations);
}
// mejor profe del trimestre (solo evaluaciones de estudiantes Premium) → reconocimiento a todos los profes + admin
function recognize(quarter, manual) {
  if (all('Reconocimientos').some(x => x.quarter === quarter)) return { ok: false, err: 'done' };
  const rk = ranking(quarter); if (!rk.length) return { ok: false, err: 'no_evals' };
  const w = rk[0];
  insert('Reconocimientos', { id: uid('rk_'), date: now(), quarter, teacherId: w.teacherId, teacherName: w.name, score: w.score, evaluations: w.evaluations, ranking: rk });
  const title = '🏆 Profe del trimestre ' + quarter + ': ' + w.name;
  const body = `¡Felicitaciones a ${w.name}! Fue elegido(a) el mejor profesor(a) del trimestre ${quarter} según las evaluaciones de los estudiantes Premium (${w.score}/3 · ${w.evaluations} evaluaciones). ¡Gracias a todo el equipo por su dedicación! 👏`;
  all('Profesores').filter(t => t.active !== 'no').forEach(t => { notify('T:' + t.id, 'reconocimiento', t.id === w.teacherId ? '🏆 ¡Eres el profe del trimestre!' : title, body, { quarter, teacherId: w.teacherId }); if (t.email) mail(t.email, title, t.id === w.teacherId ? '🏆 ¡Eres el profe del trimestre!' : 'Reconocimiento del trimestre', `<p>${h(body)}</p>`, '', 'reconocimiento'); });
  notify('admin', 'reconocimiento', title, body + (manual ? ' (anunciado manualmente)' : ''), { quarter, ranking: rk });
  mail(CONFIG.ADMIN_EMAIL, title, 'Reconocimiento del trimestre', `<p>${h(body)}</p>` + box(rk.map((x, i) => [(i + 1) + '. ' + x.name, x.score + '/3 · ' + x.evaluations + ' evaluaciones'])), '', 'reconocimiento');
  return { ok: true, winner: w, ranking: rk };
}
/* =====================================================================
   CLUBS (Premium): conversación y fonética por nivel
   Banda A = A1·A2 · Banda B = B2·B2+ (en la escuela: B1·B2). Horarios editables en Config.
   ===================================================================== */
function clubsFor(s, conf) {
  conf = conf || confAll(); const band = (+s.module || 1) >= 3 ? 'b' : 'a';
  const teachers = all('Profesores'); const tn = id => (teachers.find(t => t.id === id || upCode(t.code) === upCode(id)) || {}).name || id || '';
  return { band, start: conf.club_start || '2026-10-12', list: ['conv', 'fon'].map(k => ({ key: k, day: conf['club_' + k + '_' + band + '_day'] || '', time: conf['club_' + k + '_' + band + '_time'] || '', link: conf['club_' + k + '_' + band + '_link'] || '', teacher: tn(conf['club_' + k + '_' + band + '_teacher']) })) };
}
/* =====================================================================
   CORREOS
   ===================================================================== */
function h(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function waNum(raw) { let d = String(raw || '').replace(/\D/g, ''); if (d.length === 10) d = '57' + d; return d; }
function niceDate(iso) { if (!iso) return ''; const M = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']; const p = String(iso).slice(0, 10).split('-'); return (+p[2]) + ' ' + M[+p[1] - 1] + ' ' + p[0]; }
function box(rows) { return '<table style="width:100%;border-collapse:collapse;margin:14px 0;font-size:15px">' + rows.filter(r => r[1] !== undefined && r[1] !== '').map(r => `<tr><td style="padding:8px 10px;border:1px solid #dfe3ea;background:#f4f6fa;font-weight:700;color:#0B2A5B;width:38%">${r[0]}</td><td style="padding:8px 10px;border:1px solid #dfe3ea">${String(r[1]).indexOf('<') >= 0 ? r[1] : h(r[1])}</td></tr>`).join('') + '</table>'; }
function mail(to, subject, title, body, code, type) {
  if (!to) return false;
  const html = mailHtml(title, body);
  try { MailApp.sendEmail({ to, subject, htmlBody: html, name: 'mrarrieta.com' }); insert('Correos', { date: now(), type: type || '', to, code: code || '', subject }); return true; } catch (e) { return false; }
}
// correo para profes: EmailJS (si está configurado) y si falla, Gmail
function tmail(to, subject, title, body, code, type) {
  if (!to) return false; const E = CONFIG.EMAILJS || {};
  if (E.TEMPLATE) {
    try {
      const p = { service_id: E.SERVICE, template_id: E.TEMPLATE, user_id: E.PUBLIC_KEY, template_params: { to_email: to, subject, message_html: mailHtml(title, body) } };
      if (E.PRIVATE_KEY) p.accessToken = E.PRIVATE_KEY;
      const res = UrlFetchApp.fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'post', contentType: 'application/json', payload: JSON.stringify(p), muteHttpExceptions: true });
      if (res.getResponseCode() === 200) { insert('Correos', { date: now(), type: (type || '') + ' (emailjs)', to, code: code || '', subject }); return true; }
    } catch (e) { }
  }
  return mail(to, subject, title, body, code, type);
}
function mailHtml(title, body) {
  return `<div style="background:#f4f6fa;padding:20px 10px;font-family:Arial,Helvetica,sans-serif"><div style="max-width:560px;margin:0 auto;background:#fff;border:3px solid #0B2A5B;border-radius:16px;overflow:hidden">
    <div style="background:#0B2A5B;padding:18px 20px;text-align:center"><img src="${CONFIG.PLATFORM_URL}mra-brand.png" alt="mrarrieta.com" style="height:46px"></div><div style="height:6px;background:#E3242B"></div>
    <div style="padding:22px 22px 10px;color:#1a202c;line-height:1.55"><h1 style="font-size:22px;color:#0B2A5B;margin:0 0 12px">${title}</h1>${body}</div>
    <div style="padding:14px 22px 20px;font-size:12.5px;color:#4a5568;border-top:1px solid #e2e8f0">mrarrieta.com · ¡Aprende inglés HABLANDO! · WhatsApp <a href="https://wa.me/${CONFIG.WHATSAPP}">${CONFIG.WHATSAPP.replace(/^57/, '')}</a></div></div></div>`
    .replace(/class="btn"/g, 'style="display:inline-block;background:#E3242B;color:#fff;text-decoration:none;font-weight:800;padding:12px 22px;border-radius:12px;border:3px solid #0B2A5B"');
}

/* =====================================================================
   TAREA DIARIA (8:00 a. m.): cumpleaños + avisos de vencimiento
   ===================================================================== */
function daily() {
  const t = today(), md = t.slice(5), y = t.slice(0, 4);
  try { autoGroupSessions(); } catch (e) { }
  all('Profesores').forEach(p => { const w = J(p.weekly, null); if (w && p.active !== 'no') { try { regenWeekly(p, w); } catch (e) { } } }); // 📅 renueva la disponibilidad semanal
  if (['01-01', '04-01', '07-01', '10-01'].indexOf(md) >= 0) { try { recognize(prevQuarter(), false); } catch (e) { } } // 🏆 profe del trimestre
  const sent = all('Correos').filter(c => c.date.slice(0, 4) === y);
  all('Estudiantes').forEach(s => {
    if (s.status === 'archivado' || s.status === 'inactivo' || !s.email) return;
    // 🎂 cumpleaños (una vez al año)
    if (s.birth && s.birth.slice(5, 10) === md && !sent.some(c => c.type === 'cumple' && upCode(c.code) === upCode(s.code))) {
      mail(s.email, '🎂 Happy Birthday, ' + s.first + '! — mrarrieta.com', '🎉 Happy Birthday, ' + h(s.first) + '! 🎂',
        `<p style="font-size:17px"><b>Today is your special day!</b> Everyone at <b>mrarrieta.com</b> wishes you a wonderful year full of happiness, health and success. 🎈</p>
        <p style="font-size:16px">¡Hoy es tu día especial! Todo el equipo de mrarrieta.com te desea un año maravilloso, lleno de alegría, salud y muchos logros… ¡también en inglés! 🥳</p>
        <p style="font-size:16px"><i>“Another year older, another year wiser — and more fluent!”</i></p>
        <p style="text-align:center;font-size:44px;margin:8px 0">🎂🎁🎈</p>
        <p style="text-align:center"><a class="btn" href="${CONFIG.PLATFORM_URL}">Celebra en tu plataforma →</a></p><p>With love,<br><b>Mr. Arrieta & the mrarrieta.com team</b></p>`, s.code, 'cumple');
    }
    // ⏰ vencimiento del plan (3 días antes y el día que vence)
    const p = planState(s);
    if ((s.plan === 'membership' || s.plan === 'premium') && s.planEnd) {
      const d = p.daysLeft; const names = { membership: 'Membership', premium: 'Premium' };
      const key = 'venc-' + s.planEnd + '-' + d;
      if ((d === 3 || d === 0 || d === -1) && !sent.some(c => c.type === key && upCode(c.code) === upCode(s.code))) {
        const wa = `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent('¡Hola! Soy ' + s.first + ' ' + s.last + ' (código ' + s.code + ') y quiero renovar mi plan ' + names[s.plan] + ' 🚀')}`;
        mail(s.email, d >= 0 ? '⏰ Tu plan ' + names[s.plan] + ' vence ' + (d === 0 ? 'hoy' : 'en ' + d + ' días') : 'Tu plan ' + names[s.plan] + ' venció', d >= 0 ? 'Tu plan está por vencer' : 'Tu plan venció',
          `<p>Hola <b>${h(s.first)}</b>, ${d >= 0 ? `tu plan <b>${names[s.plan]}</b> vence el <b>${niceDate(s.planEnd)}</b>.` : `tu plan <b>${names[s.plan]}</b> venció el ${niceDate(s.planEnd)}. Tu progreso sigue guardado, pero el contenido completo quedó bloqueado.`}</p><p>Renuévalo para seguir avanzando en tu ruta de aprendizaje sin interrupciones.</p><p style="text-align:center"><a class="btn" href="${wa}">Renovar por WhatsApp →</a></p>`, s.code, key);
      }
    }
  });
}
