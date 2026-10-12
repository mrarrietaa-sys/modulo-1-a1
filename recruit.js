/* =====================================================================
   PROCESO DE SELECCIÓN DE PROFESORES (Recruitment Process) — mrarrieta.com
   1) Bienvenida · 2) Datos + hoja de vida · 3) Teacher Placement Test
   (banco del examen final del curso: Listening, Reading, Writing, Speaking,
   A1 → C1, 60 minutos) · 4) Envío a la nube (fila + CV + audios) ·
   5) Resultados por habilidad + APROBADO / NO APROBADO.
   · Sin retroalimentación por pregunta (es un proceso de selección).
   · Nunca se muestra nivel ni módulo al candidato.
   · Progreso guardado (localStorage) + archivos (IndexedDB) para continuar
     si recarga. Un solo intento por dispositivo.
   · Sin nube: resultados igual + envío por WhatsApp.
   ===================================================================== */
(function () {
  const M = window.M1, C = window.M1CONFIG || {}, EX = window.M1EXAM, CLOUD = window.MRAC || { on: false };
  const { $, $$, esc } = M;
  const KEY = 'mra_recruit_v1', LIMIT = 60 * 60 * 1000, PASS_FINAL = 7.0, PASS_SKILL = 6.0, CV_MAX = 5 * 1024 * 1024;
  const ADMIN_EMAIL = 'mrarrietaa@gmail.com';
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const NAMES = { listening: 'Listening', reading: 'Reading', writing: 'Writing', speaking: 'Speaking' };
  const ICONS = { listening: '🎧', reading: '📖', writing: '✍️', speaking: '🎤' };
  const ITEMS = []; EX.sections.forEach(sec => sec.items.forEach((it, idx) => ITEMS.push(Object.assign({}, it, { section: sec.key, idx, n: idx + 1 }))));
  const N = ITEMS.length;
  const SPK = ITEMS.map((it, i) => i).filter(i => ITEMS[i].section === 'speaking');
  const EXPERIENCE = ['Menos de 1 año', '1 a 2 años', '3 a 5 años', '6 a 10 años', 'Más de 10 años'];
  const LEVELS = ['A1', 'A2', 'B2', 'B2+/C1'];
  const AVAIL = ['Mañana', 'Tarde', 'Noche', 'Fines de semana'];
  const STEPS = ['Bienvenida', 'Tus datos', 'Prueba de inglés', 'Envío', 'Resultados'];
  const app = document.getElementById('app');

  // ---------- estado ----------
  const fresh = () => ({ v: 1, stage: 'welcome', form: { levels: [], availability: [] }, cur: 0, startedAt: null, answers: [], result: null, send: null });
  let ST = (() => { try { return Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return fresh(); } })();
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } };
  if (!Array.isArray(ST.answers) || ST.answers.length !== N) ST.answers = new Array(N).fill(null);
  const MEM = {}; // archivos en memoria: cv, a<i>

  // ---------- archivos en IndexedDB (CV y audios sobreviven a una recarga) ----------
  const IDB = (() => {
    let p = null;
    const open = () => p || (p = new Promise(res => { try { const r = indexedDB.open('mra_recruit', 1); r.onupgradeneeded = () => r.result.createObjectStore('f'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch (e) { res(null); } }));
    const tx = (mode, fn) => open().then(db => new Promise(res => { if (!db) return res(null); try { const t = db.transaction('f', mode); const q = fn(t.objectStore('f')); t.oncomplete = () => res(q && 'result' in q ? q.result : true); t.onerror = t.onabort = () => res(null); } catch (e) { res(null); } }));
    return { put: (k, v) => tx('readwrite', s => s.put(v, k)), get: (k) => tx('readonly', s => s.get(k)), del: (k) => tx('readwrite', s => s.delete(k)), clear: () => tx('readwrite', s => s.clear()) };
  })();
  const putFile = (k, v) => { MEM[k] = v; return IDB.put(k, v); };
  const getFile = async (k) => MEM[k] || (MEM[k] = await IDB.get(k)) || null;
  const delFile = (k) => { delete MEM[k]; return IDB.del(k); };

  // ---------- utilidades ----------
  const fmt = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
  const norm = (t) => ' ' + String(t || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ') + ' ';
  const cleanBlank = (v) => String(v || '').toLowerCase().replace(/[’‘]/g, "'").trim().replace(/\s+/g, ' ').replace(/[.!?,;]+$/, '');
  function rubric(item, text) {
    const w = String(text || '').trim().split(/\s+/).filter(Boolean);
    if (w.length < (item.minWords || 3)) return false;
    if (!item.keywordGroups || !item.keywordGroups.length) return true;
    const t = norm(text); return item.keywordGroups.every(g => g.some(k => t.includes(' ' + k + ' ') || t.includes(k)));
  }
  const img = (src) => src ? `<div class="fx-photo"><img src="${esc(src)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('err')"></div>` : '';
  const answered = (i) => !!(ST.answers[i] && ST.answers[i].answered);
  const firstName = () => String(ST.form.name || '').trim().split(/\s+/)[0] || '';
  const kb = (b) => b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1024 / 1024).toFixed(1) + ' MB';
  const extOf = (n) => (String(n || '').toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';
  const CV_MIME = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  function cvError(f) {
    if (!f) return 'Adjunta tu hoja de vida (PDF, DOC o DOCX).';
    if (!CV_MIME[extOf(f.name)]) return 'Formato no válido. Sube tu hoja de vida en PDF, DOC o DOCX.';
    if (f.size > CV_MAX) return `El archivo pesa ${kb(f.size)}. El máximo es 5 MB.`;
    if (!f.size) return 'El archivo está vacío. Elige otro.';
    return '';
  }
  const audioExt = (mime) => /mp4|m4a|aac/.test(mime || '') ? 'm4a' : /ogg/.test(mime || '') ? 'ogg' : 'webm';
  function waLink(text) { return `https://wa.me/${C.WHATSAPP || '573017810841'}?text=${encodeURIComponent(text)}`; }
  let timerIv = null, rec = null, leaving = false;
  window.addEventListener('beforeunload', (e) => { if (leaving) { e.preventDefault(); e.returnValue = ''; } });

  function stepper(step) {
    return `<ol class="rc-steps" aria-label="Pasos del proceso">${STEPS.map((s, i) => `<li class="${i === step ? 'on' : i < step ? 'ok' : ''}"><b>${i < step ? '✓' : i + 1}</b><span>${s}</span></li>`).join('')}</ol>`;
  }
  function shell(step, html) { stopRec(); app.innerHTML = `<div class="wrap rc">${stepper(step)}${html}</div>`; window.scrollTo(0, 0); }

  // ---------- 1) bienvenida ----------
  function welcome() {
    shell(0, `<div class="card rc-hero">
      <div class="rc-hero-top">${M.mascot('rc-mascot', 'welcome')}<div><span class="lbl">Trabaja con nosotros</span>
        <h1 class="rc-h1">Proceso de selección de profesores</h1>
        <p class="muted rc-lead">¡Gracias por tu interés en enseñar con nosotros! Buscamos <b>profesionales bilingües</b> capaces de enseñar de una forma distinta, cercana y dinámica, que ayuden a adultos hispanohablantes a <b>aprender inglés HABLANDO</b>.</p></div></div>
      <div class="rc-grid3">
        <div class="rc-box"><span>1</span><b>Tus datos y hoja de vida</b><small>≈ 5 minutos</small></div>
        <div class="rc-box"><span>2</span><b>Prueba de inglés</b><small>${N} preguntas · Listening, Reading, Writing y Speaking · 60 minutos</small></div>
        <div class="rc-box"><span>3</span><b>Resultados al instante</b><small>Si apruebas, te escribimos por WhatsApp para la entrevista</small></div>
      </div>
      <h3 class="rc-h3">Antes de empezar, ten listo:</h3>
      <ul class="rc-need">
        <li>🎤 <b>Micrófono</b> (la sección de Speaking se graba) y, si puedes, audífonos.</li>
        <li>📄 Tu <b>hoja de vida</b> en PDF, DOC o DOCX (máximo 5 MB).</li>
        <li>⏱ Unos <b>60 minutos</b> sin interrupciones, en un lugar tranquilo y con buena conexión.</li>
        <li>🔁 Tienes <b>un solo intento</b>. Si se recarga la página, tu avance se guarda y puedes continuar.</li>
      </ul>
      <div class="actionbar"><button class="btn k lg" id="go">Empezar →</button></div></div>`);
    $('#go').onclick = () => { ST.stage = 'form'; persist(); form(); };
  }

  // ---------- 2) datos ----------
  async function form() {
    const f = ST.form; const cv = await getFile('cv');
    const chk = (name, list, sel) => list.map(v => `<label class="rc-chk"><input type="checkbox" name="${name}" value="${esc(v)}" ${sel && sel.indexOf(v) >= 0 ? 'checked' : ''}><span>${esc(v)}</span></label>`).join('');
    shell(1, `<div class="card rc-form">
      <span class="lbl">Paso 2 de 5</span><h2 class="rc-h2">Tus datos</h2><p class="muted">Todos los campos son obligatorios.</p>
      <div class="rc-cols">
        <div class="rc-f"><label for="rc-name">Nombre completo</label><input class="inp" id="rc-name" autocomplete="name" value="${esc(f.name || '')}" placeholder="Nombre y apellido"><small class="rc-err" data-for="name"></small></div>
        <div class="rc-f"><label for="rc-email">Correo electrónico</label><input class="inp" id="rc-email" type="email" inputmode="email" autocomplete="email" value="${esc(f.email || '')}" placeholder="tucorreo@ejemplo.com"><small class="rc-err" data-for="email"></small></div>
        <div class="rc-f"><label for="rc-wa">WhatsApp (con indicativo)</label><input class="inp" id="rc-wa" type="tel" inputmode="tel" autocomplete="tel" value="${esc(f.whatsapp || '')}" placeholder="+1 305 555 0123"><small class="rc-err" data-for="whatsapp"></small></div>
        <div class="rc-f"><label for="rc-city">Ciudad y país</label><input class="inp" id="rc-city" autocomplete="address-level2" value="${esc(f.city || '')}" placeholder="Ej: Miami, Estados Unidos"><small class="rc-err" data-for="city"></small></div>
      </div>
      <div class="rc-f"><label for="rc-exp">Años de experiencia enseñando inglés</label><select class="inp" id="rc-exp"><option value="">Selecciona…</option>${EXPERIENCE.map(v => `<option ${f.experience === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select><small class="rc-err" data-for="experience"></small></div>
      <div class="rc-f"><span class="rc-lab">Disponibilidad horaria</span><div id="rc-wg"></div><small class="rc-err" data-for="availability"></small></div>
      <div class="rc-f"><label for="rc-about">Cuéntanos sobre ti</label><textarea class="inp" id="rc-about" rows="4" maxlength="1500" placeholder="Tu formación, experiencia, certificaciones (TKT, CELTA, TESOL…) y por qué te gustaría enseñar con nosotros.">${esc(f.about || '')}</textarea><small class="rc-err" data-for="about"></small></div>
      <div class="rc-f"><span class="rc-lab">Hoja de vida</span>
        <label class="rc-file" for="rc-cv"><input type="file" id="rc-cv" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"><span class="rc-file-ic">📄</span><span class="rc-file-t" id="rc-cvname">${cv ? `<b>${esc(cv.name)}</b> · ${kb(cv.size)} <em>(toca para cambiarla)</em>` : '<b>Toca para adjuntar tu hoja de vida</b><br><em>PDF, DOC o DOCX · máximo 5 MB</em>'}</span></label>
        <small class="rc-err" data-for="cv"></small></div>
      <label class="rc-consent"><input type="checkbox" id="rc-ok" ${f.consent ? 'checked' : ''}><span>Autorizo a <b>mrarrieta.com</b> el tratamiento de mis datos personales y de mi hoja de vida, conforme a la <b>Ley 1581 de 2012</b> (Colombia), con el fin de gestionar este proceso de selección y contactarme.</span></label>
      <small class="rc-err" data-for="consent"></small>
      <div class="actionbar"><button class="btn w" id="bk">← Atrás</button><button class="btn k lg" id="go">Continuar a la prueba →</button></div></div>`);
    const WG = window.MRWG ? MRWG.render($('#rc-wg'), f.weekly || {}, { onChange: () => { setTimeout(() => { try { keep(); setErr('availability', ''); } catch (e) { } }, 0); } }) : null;
    let cvFile = cv;
    const read = () => ({ name: $('#rc-name').value.trim().replace(/\s+/g, ' '), email: $('#rc-email').value.trim(), whatsapp: $('#rc-wa').value.trim(), city: $('#rc-city').value.trim(), experience: $('#rc-exp').value,
      levels: [], weekly: WG ? WG.get() : (f.weekly || {}), availability: WG ? (MRWG.summary(WG.get()) ? [MRWG.summary(WG.get())] : []) : (f.availability || []), about: $('#rc-about').value.trim(), consent: $('#rc-ok').checked });
    const keep = () => { ST.form = Object.assign(ST.form, read()); persist(); };
    $$('.rc-form input:not([type=file]), .rc-form select, .rc-form textarea').forEach(el => el.addEventListener('change', keep));
    const setErr = (k, msg) => { const e = $(`.rc-err[data-for="${k}"]`); if (e) e.textContent = msg || ''; const map = { name: '#rc-name', email: '#rc-email', whatsapp: '#rc-wa', city: '#rc-city', experience: '#rc-exp', about: '#rc-about' }; if (map[k]) $(map[k]).classList.toggle('rc-bad', !!msg); };
    const FIELD = { 'rc-name': 'name', 'rc-email': 'email', 'rc-wa': 'whatsapp', 'rc-city': 'city', 'rc-exp': 'experience', 'rc-about': 'about', 'rc-ok': 'consent' };
    $$('.rc-form input, .rc-form select, .rc-form textarea').forEach(el => el.addEventListener('input', () => { const k = FIELD[el.id] || ''; if (k) setErr(k, ''); }));
    $('#rc-cv').onchange = (e) => { const file = e.target.files && e.target.files[0]; if (!file) return; const er = cvError(file); setErr('cv', er);
      if (er) { e.target.value = ''; return; }
      cvFile = { blob: file, name: file.name, size: file.size, type: file.type || CV_MIME[extOf(file.name)] }; putFile('cv', cvFile);
      $('#rc-cvname').innerHTML = `<b>${esc(file.name)}</b> · ${kb(file.size)} <em>(toca para cambiarla)</em>`; };
    $('#bk').onclick = () => { keep(); ST.stage = 'welcome'; persist(); welcome(); };
    $('#go').onclick = () => {
      const d = read(); const errs = {};
      if (d.name.split(' ').filter(Boolean).length < 2) errs.name = 'Escribe tu nombre y tu apellido.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) errs.email = 'Escribe un correo válido (ej: nombre@gmail.com).';
      const digits = d.whatsapp.replace(/\D/g, ''); if (digits.length < 7 || digits.length > 15) errs.whatsapp = 'Escribe un número de WhatsApp válido, con indicativo de país.';
      if (d.city.length < 3) errs.city = 'Escribe tu ciudad y país.';
      if (!d.experience) errs.experience = 'Selecciona tus años de experiencia.';
      if (!d.availability.length) errs.availability = 'Marca en la tabla al menos una hora disponible.';
      if (d.about.length < 30) errs.about = 'Cuéntanos un poco más (mínimo 30 caracteres).';
      const ce = cvError(cvFile); if (ce) errs.cv = ce;
      if (!d.consent) errs.consent = 'Debes autorizar el tratamiento de datos para continuar.';
      ['name', 'email', 'whatsapp', 'city', 'experience', 'levels', 'availability', 'about', 'cv', 'consent'].forEach(k => setErr(k, errs[k]));
      ST.form = Object.assign(ST.form, d, cvFile ? { cvName: cvFile.name } : {}); persist();
      const firstBad = Object.keys(errs)[0];
      if (firstBad) { M.toast('Revisa los campos marcados en rojo'); const el = $(`.rc-err[data-for="${firstBad}"]`); if (el) el.closest('.rc-f, .rc-err').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      instructions();
    };
  }

  // ---------- instrucciones ----------
  function instructions() {
    shell(2, `<div class="card rc-form"><span class="lbl">Teacher Placement Test</span><h2 class="rc-h2">Instrucciones de la prueba</h2>
      <div class="rc-sk">${EX.sections.map(s => `<div><b>${s.items.length}</b>${s.icon} ${s.label}</div>`).join('')}</div>
      <ul class="fx-ul">
        <li>La prueba tiene <b>${N} preguntas</b> de dificultad progresiva, en 4 partes: Listening, Reading, Writing y Speaking.</li>
        <li>Tienes <b>60 minutos</b>. El cronómetro aparece arriba; si llega a cero, la prueba se envía sola con lo que hayas respondido.</li>
        <li>No verás si cada respuesta es correcta: responde y avanza. Puedes volver a preguntas anteriores antes de enviar.</li>
        <li>En <b>Listening</b> toca 🔊 Escuchar (puedes repetir). En <b>Speaking</b> toca 🎤, habla en inglés y toca de nuevo para detener.</li>
        <li>Al final verás tus puntajes por habilidad y si continúas a la entrevista.</li>
      </ul>
      <div class="rc-mic" id="mcbox"><div><b>🎤 Prueba tu micrófono</b><br><small class="muted" id="mcst">Te pediremos permiso para usarlo en la sección de Speaking.</small></div><button class="btn w sm" id="mct">Permitir micrófono</button></div>
      <div class="actionbar"><button class="btn w" id="bk">← Mis datos</button><button class="btn k lg" id="go">🚀 Comenzar prueba</button></div></div>`);
    $('#mct').onclick = async () => { const st = $('#mcst'); try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach(t => t.stop()); st.textContent = '✅ Micrófono listo.'; $('#mcbox').classList.add('ok'); } catch (e) { st.textContent = '⚠️ No pudimos acceder al micrófono. Revisa los permisos del navegador (ícono 🔒 junto a la dirección).'; $('#mcbox').classList.add('bad'); } };
    $('#bk').onclick = form;
    $('#go').onclick = async () => { const b = $('#go'); b.disabled = true; b.textContent = '⏳ Cargando audios…'; await M.loadAudio(['examF']);
      ST.stage = 'test'; ST.startedAt = Date.now(); ST.cur = 0; ST.answers = new Array(N).fill(null); persist(); startTimer(); go(0, false); };
  }

  // ---------- cronómetro ----------
  const left = () => LIMIT - (Date.now() - (ST.startedAt || Date.now()));
  function tick() { const el = $('#rc-timer'); const l = left(); if (el) { el.textContent = '⏱ ' + fmt(l); el.classList.toggle('low', l <= 5 * 60 * 1000); } if (l <= 0 && ST.stage === 'test') { M.toast('⏱ Se acabó el tiempo. Enviando tu prueba…'); submit(true); } }
  function startTimer() { stopTimer(); timerIv = setInterval(tick, 1000); }
  function stopTimer() { if (timerIv) clearInterval(timerIv); timerIv = null; }

  // ---------- 3) prueba ----------
  function head() { return `<div class="rc-top"><span class="fx-chip t" id="rc-timer">⏱ ${fmt(left())}</span><span class="rc-who">${esc(firstName())}</span></div>`; }
  function pills(active) { return EX.sections.map(s => { const done = ITEMS.every((it, i) => it.section !== s.key || answered(i)); return `<span class="${s.key === active ? 'on' : done ? 'ok' : ''}">${s.icon} ${s.label}</span>`; }).join(''); }
  function go(i, back) {
    if (i >= N) return review();
    const prev = ITEMS[ST.cur]; ST.cur = Math.max(0, i); persist(); const it = ITEMS[ST.cur];
    if (!back && it.idx === 0 && (i === 0 || (prev && prev.section !== it.section))) return sectionIntro(it.section);
    item();
  }
  function sectionIntro(key) {
    const sec = EX.sections.find(s => s.key === key);
    shell(2, `${head()}<div class="card center fx-sec"><div style="font-size:56px">${sec.icon}</div><h1>${sec.label.toUpperCase()}</h1><p class="muted rc-desc">${esc(sec.desc).replace(/Puedes grabar de nuevo\./, 'Puedes grabar de nuevo antes de avanzar.')}</p><p class="muted" style="font-size:14px">${sec.items.length} preguntas</p><button class="btn k lg" id="go">Continuar →</button></div>`);
    tick(); $('#go').onclick = item;
  }
  function item() {
    const i = ST.cur, it = ITEMS[i]; const a = ST.answers[i] || (ST.answers[i] = { answered: false, value: null, correct: false });
    shell(2, `${head()}<div class="fx-prog"><i style="width:${Math.round((i + 1) / N * 100)}%"></i></div><div class="secbar fx-pills">${pills(it.section)}</div>
      <div class="card fx-item rc-item"><div class="hd rc-hd"><span class="lbl">${ICONS[it.section]} ${NAMES[it.section]}</span><span class="qcount">${i + 1} / ${N}</span></div><div class="rc-body"></div>
      <div class="actionbar"><button class="btn w" id="pv" ${i === 0 ? 'disabled' : ''}>← Anterior</button><button class="btn k lg" id="nx">${i === N - 1 ? 'Revisar y enviar →' : 'Siguiente →'}</button></div></div>`);
    tick();
    const body = $('.rc-body');
    $('#pv').onclick = () => { stopRec(); M.stop(); persist(); go(i - 1, true); };
    $('#nx').onclick = () => { if (rec) { M.toast('Primero detén la grabación 🎤'); return; } M.stop(); commitText(); persist(); go(i + 1, false); };
    if (it.section === 'listening' || it.section === 'reading') renderMC(body, it, a);
    else if (it.section === 'writing') renderW(body, it, a);
    else renderS(body, it, a, i);
  }
  let commitText = () => { };
  function renderMC(body, it, a) {
    commitText = () => { };
    const listen = it.section === 'listening';
    const opts = it.type === 'tf' ? ['True', 'False'] : it.options; const ci = it.type === 'tf' ? (it.correct ? 0 : 1) : it.correct;
    body.innerHTML = `${img(it.img)}${listen ? `<div class="center"><button class="btn k lg fx-listen" id="ls">🔊 Escuchar</button></div>` : `<div class="fx-pass">${(it.passage || []).map(([w, l]) => `<div>${w ? `<b>${esc(w)}:</b> ` : ''}${esc(l)}</div>`).join('')}</div>`}
      <div class="fx-q">${esc(it.type === 'tf' ? it.statement : it.q)}</div>${it.type === 'tf' ? '<p class="muted center rc-tf">¿Verdadero (True) o falso (False)?</p>' : ''}
      <div class="opts fx-opts ${opts.length === 2 ? 'two' : ''}">${opts.map((o, k) => `<button class="opt ${a.answered && a.value === k ? 'rc-sel' : ''}" data-i="${k}"><span class="qs-l">${'ABCD'[k]}</span> ${esc(o)}</button>`).join('')}</div>`;
    if (listen) { const b = $('#ls', body); b.onclick = async () => { b.classList.add('playing'); b.textContent = '🔊 Reproduciendo…'; await M.play(it.au); if (!b.isConnected) return; b.classList.remove('playing'); b.textContent = '🔊 Escuchar otra vez'; }; if (!a.answered) setTimeout(() => b.isConnected && b.click(), 400); }
    $$('.opt', body).forEach((b, k) => b.onclick = () => { a.answered = true; a.value = k; a.correct = k === ci; $$('.opt', body).forEach(x => x.classList.toggle('rc-sel', x === b)); persist(); refreshPills(); });
  }
  function refreshPills() { const p = $('.fx-pills'); if (p) p.innerHTML = pills(ITEMS[ST.cur].section); }
  function renderW(body, it, a) {
    if (it.type === 'blank') {
      body.innerHTML = `${img(it.img)}<div class="fx-lab">${esc(it.prompt)}</div><div class="fx-q">${esc(it.sentence).replace('___', '<span class="blank">&nbsp;&nbsp;&nbsp;&nbsp;</span>')}</div>
        <div class="rc-ans"><input class="inp" id="wi" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="escribe tu respuesta" value="${esc(a.value || '')}"></div><p class="muted center rc-hint">Escribe solo la palabra o palabras que faltan.</p>`;
      const inp = $('#wi', body);
      commitText = () => { const v = cleanBlank(inp.value); a.answered = !!v; a.value = v || null; a.correct = !!v && it.accept.map(cleanBlank).includes(v); };
      inp.oninput = () => { commitText(); persist(); refreshPills(); };
      inp.onkeydown = e => { if (e.key === 'Enter') $('#nx').click(); };
      setTimeout(() => inp.isConnected && inp.focus({ preventScroll: true }), 200);
    } else {
      body.innerHTML = `${img(it.img)}<div class="fx-lab rc-left">${esc(it.prompt)}</div>${it.example ? `<p class="muted rc-ex">${esc(it.example)}</p>` : ''}
        <textarea class="inp fx-ta rc-ta" id="wo" rows="5" placeholder="Escribe tu respuesta en inglés">${esc(a.value || '')}</textarea><p class="muted rc-wc" id="wc"></p>`;
      const ta = $('#wo', body), wc = $('#wc', body);
      const count = () => { const n = ta.value.trim().split(/\s+/).filter(Boolean).length; wc.textContent = `${n} palabra${n === 1 ? '' : 's'}${it.minWords ? ` · mínimo ${it.minWords}` : ''}`; };
      commitText = () => { const v = ta.value.trim(); a.answered = !!v; a.value = v || null; a.correct = !!v && rubric(it, v); };
      ta.oninput = () => { count(); commitText(); persist(); refreshPills(); }; count();
    }
  }

  // ---------- Speaking: grabar (+ transcribir si el navegador puede) ----------
  function stopRec() { if (rec) { try { rec.cancel(); } catch (e) { } rec = null; } }
  function pickMime() { if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return ''; return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(t => { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } }) || ''; }
  async function renderS(body, it, a, i) {
    commitText = () => { };
    body.innerHTML = `${img(it.img)}<div class="fx-task"><small>Task</small><div class="fx-q" style="margin:4px 0">${esc(it.task)}</div><div class="muted">${esc(it.es)}</div>${it.minWords ? `<div class="rc-min">Habla al menos ${it.minWords} palabras.</div>` : ''}<button class="btn w sm" id="tl" style="margin-top:8px">🔊 Escuchar la instrucción</button></div>
      <div class="center"><button class="mic" id="mc" aria-label="Grabar">🎤</button><p class="fx-st" id="st">Toca el micrófono, habla en inglés y toca otra vez para detener.</p></div><div id="vr"></div>`;
    $('#tl', body).onclick = () => M.play(it.au);
    const mc = $('#mc', body), st = $('#st', body), vr = $('#vr', body);
    const blobOf = async () => { const f = await getFile('a' + i); return f && f.blob; };
    const result = async () => {
      if (!a.answered) { vr.innerHTML = ''; return; }
      const has = a.hasAudio && await blobOf();
      vr.innerHTML = `<div class="vres self rc-saved"><div class="vres-t">${a.skipped ? '⏭ Pregunta omitida (sin grabación).' : '✔ Respuesta grabada.'}</div>
        ${a.value ? `<small class="muted">Transcripción: “${esc(a.value)}”</small>` : ''}<div class="row vres-b">${has ? '<button class="btn w sm" id="me">▶ Escuchar mi grabación</button>' : ''}<button class="btn w sm" id="ag">🔁 ${a.skipped ? 'Intentar grabar' : 'Grabar de nuevo'}</button></div></div>`;
      if (has) $('#me', vr).onclick = async () => { const b = await blobOf(); if (!b) return; const u = URL.createObjectURL(b); const x = new Audio(u); x.onended = () => URL.revokeObjectURL(u); x.play().catch(() => { }); };
      $('#ag', vr).onclick = () => { vr.innerHTML = ''; mc.click(); };
    };
    const micFail = (msg) => {
      st.textContent = '';
      vr.innerHTML = `<div class="vres bad rc-saved"><div class="vres-t">⚠️ ${msg}</div><small>Revisa los permisos del micrófono en tu navegador (ícono 🔒 junto a la dirección) y vuelve a intentarlo. Si no es posible, puedes omitir esta pregunta (contará como no respondida).</small>
        <div class="row vres-b"><button class="btn k sm" id="rt">🔁 Intentar de nuevo</button><button class="btn w sm" id="sk">Omitir y continuar →</button></div></div>`;
      $('#rt', vr).onclick = () => { vr.innerHTML = ''; mc.click(); };
      $('#sk', vr).onclick = () => { Object.assign(a, { answered: true, skipped: true, hasAudio: false, value: '', correct: false, neutral: false }); delFile('a' + i); persist(); refreshPills(); $('#nx').click(); };
    };
    result();
    mc.onclick = async () => {
      if (rec) { rec.stop(); return; }
      let stream = null, mr = null, chunks = [], transcript = '', sr = null, srOk = !!SR, cancelled = false;
      const mime = pickMime();
      try { if (!navigator.mediaDevices || !window.MediaRecorder) throw new Error('nomr'); stream = await navigator.mediaDevices.getUserMedia({ audio: true }); mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream); mr.ondataavailable = e => e.data && e.data.size && chunks.push(e.data); mr.start(1000); }
      catch (e) { stream && stream.getTracks().forEach(t => t.stop()); return micFail(!window.MediaRecorder ? 'Tu navegador no permite grabar audio. Usa Chrome, Edge o Safari actualizados.' : 'No pudimos acceder a tu micrófono.'); }
      if (!mc.isConnected) { stream.getTracks().forEach(t => t.stop()); return; }
      if (SR) { try { sr = new SR(); sr.lang = 'en-US'; sr.continuous = true; sr.interimResults = false; sr.onresult = e => { for (let k = e.resultIndex; k < e.results.length; k++) if (e.results[k].isFinal) transcript += ' ' + e.results[k][0].transcript; }; sr.onerror = e => { if (/not-allowed|audio-capture|service-not-allowed|network|language-not-supported/.test(e.error)) srOk = false; }; sr.start(); } catch (e) { srOk = false; } }
      M.stop(); mc.classList.add('rec'); vr.innerHTML = '';
      const t0 = Date.now(); const upd = () => { st.textContent = `🔴 Grabando… ${fmt(Date.now() - t0)} · toca 🎤 para detener`; }; upd(); const iv = setInterval(upd, 500);
      const auto = setTimeout(() => rec && rec.stop(), 120000);
      rec = {
        cancel() { cancelled = true; clearTimeout(auto); clearInterval(iv); try { sr && sr.abort(); } catch (e) { } try { mr && mr.state !== 'inactive' && mr.stop(); } catch (e) { } stream && stream.getTracks().forEach(t => t.stop()); },
        async stop() {
          clearTimeout(auto); clearInterval(iv); rec = null; mc.classList.remove('rec'); st.textContent = '⏳ Guardando tu grabación…'; mc.disabled = true;
          const pRec = new Promise(r => { if (!mr || mr.state === 'inactive') return r(); mr.onstop = r; try { mr.stop(); } catch (e) { r(); } });
          const pSr = new Promise(r => { if (!sr) return r(); sr.onend = r; try { sr.stop(); } catch (e) { r(); } setTimeout(r, 3500); });
          await Promise.all([pRec, pSr]); stream && stream.getTracks().forEach(t => t.stop()); mc.disabled = false; if (cancelled) return;
          const type = (mr && mr.mimeType) || mime || 'audio/webm';
          const blob = chunks.length ? new Blob(chunks, { type }) : null;
          if (!blob || blob.size < 500) { st.textContent = 'Toca el micrófono para grabar.'; return micFail('La grabación quedó vacía.'); }
          await putFile('a' + i, { blob, type, size: blob.size });
          const tr = transcript.trim();
          Object.assign(a, { answered: true, skipped: false, hasAudio: true, value: tr, mime: type });
          if (!tr && !srOk) { a.correct = true; a.neutral = true; } // sin reconocimiento de voz: pendiente de revisión, no penaliza
          else { a.neutral = false; a.correct = rubric(it, tr); }
          st.textContent = 'Si quieres, puedes grabar de nuevo. Luego toca “Siguiente”.'; persist(); refreshPills(); result();
        },
      };
    };
  }

  // ---------- revisión final ----------
  async function review() {
    commitText(); persist();
    const miss = ITEMS.map((it, i) => i).filter(i => !answered(i));
    const cv = await getFile('cv');
    shell(2, `${head()}<div class="card rc-form"><span class="lbl">Revisión final</span><h2 class="rc-h2">¿Listo para enviar?</h2>
      <p class="muted">${miss.length ? `Tienes <b>${miss.length}</b> pregunta(s) sin responder. Puedes responderlas ahora; si envías así, contarán como incorrectas.` : '¡Respondiste todas las preguntas! Ya puedes enviar tu prueba.'}</p>
      <div class="fx-rev rc-rev">${ITEMS.map((it, i) => `<button class="${answered(i) ? 'ok' : 'miss'}" data-i="${i}">${i + 1}. ${ICONS[it.section]} ${NAMES[it.section]} ${answered(i) ? (ST.answers[i].skipped ? '— omitida' : '✓') : '— pendiente'}</button>`).join('')}</div>
      ${cv ? '' : `<div class="rc-mic bad"><div><b>📄 Vuelve a adjuntar tu hoja de vida</b><br><small>Se perdió al recargar la página.</small><small class="rc-err" id="cverr"></small></div><label class="btn w sm" for="rc-cv2">Adjuntar<input type="file" id="rc-cv2" class="hidden" accept=".pdf,.doc,.docx"></label></div>`}
      <div class="actionbar"><button class="btn w" id="bk">← Volver a la prueba</button><button class="btn k lg" id="sb">📨 Enviar prueba</button></div></div>`);
    tick();
    $$('.rc-rev button').forEach(b => b.onclick = () => { ST.cur = +b.dataset.i; persist(); item(); });
    $('#bk').onclick = () => { ST.cur = miss.length ? miss[0] : 0; persist(); item(); };
    const c2 = $('#rc-cv2'); if (c2) c2.onchange = async () => { const f = c2.files[0]; const er = cvError(f); $('#cverr').textContent = er ? ' ' + er : ''; if (er) return; await putFile('cv', { blob: f, name: f.name, size: f.size, type: f.type || CV_MIME[extOf(f.name)] }); ST.form.cvName = f.name; persist(); review(); };
    $('#sb').onclick = () => {
      const m = M.modal(`<h3>¿Enviar tu prueba?</h3><p class="muted">${miss.length ? `Tienes ${miss.length} pregunta(s) sin responder. ` : ''}Después de enviarla no podrás cambiar tus respuestas.</p><div class="row"><button class="btn k" id="y">Sí, enviar</button><button class="btn w" id="n">Revisar otra vez</button></div>`);
      $('#y', m).onclick = () => { m.remove(); submit(false); }; $('#n', m).onclick = () => m.remove();
    };
  }

  // ---------- 4) envío ----------
  function computeResult(timedOut) {
    const per = {}; let pending = 0;
    EX.sections.forEach(s => { const idx = ITEMS.map((it, i) => i).filter(i => ITEMS[i].section === s.key); const c = idx.filter(i => ST.answers[i] && ST.answers[i].answered && ST.answers[i].correct === true).length; per[s.key] = Math.round(c / idx.length * 100) / 10; });
    SPK.forEach(i => { const a = ST.answers[i]; if (a && a.neutral) pending++; });
    const fin = Math.round((per.listening + per.reading + per.writing + per.speaking) / 4 * 10) / 10;
    const passed = fin >= PASS_FINAL && Object.keys(per).every(k => per[k] >= PASS_SKILL);
    return { per, fin, passed, pending, timedOut: !!timedOut, date: new Date().toISOString() };
  }
  function submit(timedOut) {
    if (ST.stage !== 'test') return;
    stopTimer(); stopRec(); M.stop(); try { commitText(); } catch (e) { }
    $$('.modal').forEach(m => m.remove());
    ST.result = computeResult(timedOut); ST.stage = 'sending'; ST.send = ST.send || { id: '', cv: '', audios: {}, done: false }; persist();
    sendAll();
  }
  function payload() {
    const f = ST.form, r = ST.result;
    return { name: f.name, email: f.email, whatsapp: f.whatsapp, city: f.city, experience: f.experience, levels: (f.levels || []).join(', '), availability: (f.availability || []).join(', '), weekly: JSON.stringify(f.weekly || {}), about: f.about,
      listening: r.per.listening, reading: r.per.reading, writing: r.per.writing, speaking: r.per.speaking, final: r.fin, passed: r.passed,
      speakingAnswers: SPK.map((i, k) => { const a = ST.answers[i] || {}; return { i: k + 1, task: ITEMS[i].task, transcript: a.skipped ? '(omitida — sin grabación)' : !a.answered ? '(sin responder)' : a.value || (a.neutral ? '(sin transcripción — escuchar audio · pendiente de revisión)' : '(sin transcripción)') }; }) };
  }
  async function withRetry(fn) { let r = await fn(); if (!r || !r.ok) { await new Promise(res => setTimeout(res, 1500)); r = await fn(); } return r || { ok: false }; }
  async function sendAll() {
    if (!CLOUD.on) { ST.send = Object.assign(ST.send || {}, { offline: true }); ST.stage = 'done'; persist(); return results(); }
    const S = ST.send; leaving = true;
    const audios = SPK.map((i, k) => ({ i, n: k + 1 })).filter(x => ST.answers[x.i] && ST.answers[x.i].hasAudio);
    const total = 2 + audios.length; let doneN = 0;
    shell(3, `<div class="card center rc-send">${M.mascot('rc-mascot', 'watch')}<h2 class="rc-h2">Enviando tu postulación…</h2><p class="muted">No cierres esta página. Puede tardar un par de minutos según tu conexión.</p>
      <div class="rc-bar"><i id="pb"></i></div><p class="rc-ptxt" id="pt">Guardando tus datos…</p></div>`);
    const prog = (txt) => { const pb = $('#pb'), pt = $('#pt'); if (pb) pb.style.width = Math.round(doneN / total * 100) + '%'; if (pt) pt.textContent = txt; };
    if (!S.id) {
      prog('Guardando tus datos y resultados…');
      const r = await withRetry(() => CLOUD.call('recruit', payload()));
      if (!r.ok || !r.id) { leaving = false; return sendError(r.err); }
      S.id = r.id; persist();
    }
    doneN++;
    if (S.cv !== 'ok') {
      prog('Subiendo tu hoja de vida…');
      const cv = await getFile('cv');
      if (!cv || !cv.blob) S.cv = 'missing';
      else { const blob = cv.blob.type ? cv.blob : new Blob([cv.blob], { type: cv.type || CV_MIME[extOf(cv.name)] }); const r = await withRetry(() => CLOUD.upload('cv', S.id, blob, { name: cv.name })); S.cv = r.ok ? 'ok' : 'fail'; }
      persist();
    }
    doneN++;
    S.audios = S.audios || {};
    for (let k = 0; k < audios.length; k++) {
      const { i, n } = audios[k];
      if (S.audios[n] !== 'ok') {
        prog(`Subiendo audio ${k + 1} de ${audios.length}…`);
        const f = await getFile('a' + i); const a = ST.answers[i];
        if (!f || !f.blob) S.audios[n] = 'missing';
        else { const r = await withRetry(() => CLOUD.upload('recruit', S.id, f.blob, { name: 'speaking_' + n + '.' + audioExt(f.type), i: n, label: ITEMS[i].task, transcript: a.value || '' })); S.audios[n] = r.ok ? 'ok' : 'fail'; }
        persist();
      }
      doneN++;
    }
    prog('Finalizando…');
    if (!S.done) { const r = await withRetry(() => CLOUD.call('recruitDone', { id: S.id })); S.done = true; S.doneOk = !!r.ok; }
    const allOk = S.cv === 'ok' && audios.every(x => S.audios[x.n] === 'ok');
    S.allOk = allOk; ST.stage = 'done'; persist(); leaving = false;
    if (allOk) IDB.clear();
    results();
  }
  function sendError(err) {
    shell(3, `<div class="card center rc-send">${M.mascot('rc-mascot', 'shrug')}<h2 class="rc-h2">No pudimos enviar tu postulación</h2>
      <p class="muted">${err === 'network' ? 'Parece que hay un problema de conexión.' : 'Ocurrió un error al guardar.'} Tus respuestas están guardadas en este dispositivo: puedes intentarlo de nuevo.</p>
      <div class="row" style="justify-content:center"><button class="btn k lg" id="rt">🔁 Reintentar envío</button><button class="btn w" id="vr">Ver mis resultados</button></div></div>`);
    $('#rt').onclick = sendAll;
    $('#vr').onclick = () => { ST.send.offline = true; ST.stage = 'done'; persist(); results(); };
  }

  // ---------- 5) resultados ----------
  const statusTxt = (r) => r.passed ? 'APROBADO' : 'NO APROBADO';
  function summaryText() {
    const f = ST.form, r = ST.result;
    return `👩‍🏫 Proceso de selección de profesores — mrarrieta.com\n👤 ${f.name}\n📧 ${f.email}\n📱 ${f.whatsapp}\n📍 ${f.city}\n🧑‍🏫 Experiencia: ${f.experience}\n🕒 Disponibilidad: ${(f.availability || []).join(', ')}\n📅 ${new Date(r.date).toLocaleString('es-CO')}\n\n🎧 Listening: ${r.per.listening.toFixed(1)}\n📖 Reading: ${r.per.reading.toFixed(1)}\n✍️ Writing: ${r.per.writing.toFixed(1)}\n🎤 Speaking: ${r.per.speaking.toFixed(1)}${r.pending ? ' (pendiente de revisión)' : ''}\n\n✅ Resultado: ${statusTxt(r)}`;
  }
  async function results() {
    const r = ST.result, f = ST.form, S = ST.send || {};
    if (!r) { ST = fresh(); persist(); return welcome(); }
    const offline = !!S.offline;
    const nAud = SPK.filter(i => ST.answers[i] && ST.answers[i].hasAudio).length;
    const okAud = Object.keys(S.audios || {}).filter(k => S.audios[k] === 'ok').length;
    const cvOk = S.cv === 'ok', audOk = okAud >= nAud;
    const needWa = offline || !cvOk || !audOk;
    const msg = r.passed ? `¡Felicitaciones, ${esc(firstName())}! Superaste la prueba de inglés. <b>Te contactaremos por WhatsApp para la entrevista.</b>` : `Gracias, ${esc(firstName())}, por tu tiempo y por tu interés en enseñar con nosotros. En esta ocasión no alcanzaste el puntaje requerido para continuar. Guardaremos tus datos y te deseamos muchos éxitos.`;
    const waText = summaryText() + (offline || !cvOk ? '\n\n📄 Envío mi hoja de vida por este medio.' : '');
    shell(4, `<div class="card center rc-res">
      <div class="rc-res-top">${M.mascot('rc-mascot', r.passed ? 'celebrate' : 'smile')}<div><span class="lbl">Resultados</span><h2 class="rc-h2">${esc(f.name || '')}</h2>
        <div class="rc-badge ${r.passed ? 'ok' : 'no'}">${r.passed ? 'APROBADO ✅' : 'NO APROBADO'}</div></div></div>
      <p class="rc-msg">${msg}</p>
      <div class="fx-bars rc-bars">${Object.keys(NAMES).map(k => `<div><span>${ICONS[k]} ${NAMES[k]}</span><div class="bar"><i style="width:${r.per[k] * 10}%"></i></div><b>${r.per[k].toFixed(1)}</b></div>`).join('')}</div>
      <p class="muted rc-small">Puntajes de 0 a 10.${r.pending ? ' Tus grabaciones de Speaking serán escuchadas por nuestro equipo (pendientes de revisión).' : ''}${r.timedOut ? ' ⏱ Se acabó el tiempo y la prueba se envió automáticamente.' : ''}</p>
      <div class="rc-st">
        ${offline ? `<div class="err">⚠️ No pudimos conectarnos con nuestro sistema. Envíanos tu resumen por WhatsApp y tu <b>hoja de vida</b> por WhatsApp o al correo <b>${ADMIN_EMAIL}</b>.</div>` : `
          <div class="ok">✓ Datos y resultados recibidos.</div>
          <div class="${cvOk ? 'ok' : 'err'}">${cvOk ? '✓ Hoja de vida recibida.' : `✗ No pudimos subir tu hoja de vida. Envíala por WhatsApp o al correo <b>${ADMIN_EMAIL}</b>.`}</div>
          ${nAud ? `<div class="${audOk ? 'ok' : 'err'}">${audOk ? `✓ Grabaciones recibidas (${okAud} de ${nAud}).` : `✗ Recibimos ${okAud} de ${nAud} grabaciones.`}</div>` : ''}`}
      </div>
      <div class="row rc-btns">
        <button class="btn k" id="pdf">📄 Descargar PDF</button><button class="btn w" id="cp">📋 Copiar resumen</button>
        ${needWa ? `<a class="btn rc-wa" target="_blank" rel="noopener" href="${waLink(waText)}">💬 Enviar por WhatsApp</a>` : ''}
        ${!offline && S.id && (!cvOk || !audOk) ? '<button class="btn w" id="rt">🔁 Reintentar archivos pendientes</button>' : ''}
      </div>
      <p class="muted rc-small">Solo se permite un intento por dispositivo. Si tienes preguntas, escríbenos por WhatsApp.</p></div>`);
    $('#pdf').onclick = reportPDF; $('#cp').onclick = copySummary;
    const rt = $('#rt'); if (rt) rt.onclick = () => { if (S.cv !== 'ok') S.cv = ''; Object.keys(S.audios || {}).forEach(k => { if (S.audios[k] !== 'ok') delete S.audios[k]; }); ST.stage = 'sending'; persist(); sendAll(); };
    if (r.passed && !results.shown) { results.shown = true; try { M.confetti(3000); } catch (e) { } }
  }
  async function copySummary() {
    const t = summaryText();
    try { await navigator.clipboard.writeText(t); M.toast('✓ Resumen copiado'); }
    catch (e) { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); M.toast('✓ Resumen copiado'); } catch (er) { M.toast('No se pudo copiar'); } ta.remove(); }
  }
  function loadScript(src, test) { return new Promise(res => { if (test()) return res(true); const s = document.createElement('script'); s.src = src; s.onload = () => res(test()); s.onerror = () => res(false); document.head.appendChild(s); }); }
  function logoData(src) { return new Promise(res => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; c.getContext('2d').drawImage(i, 0, 0); try { res(c.toDataURL('image/png')); } catch (e) { res(null); } }; i.onerror = () => res(null); i.src = src; }); }
  async function reportPDF() {
    const jbase = (document.querySelector('script[src*="recruit.js"]').getAttribute('src') || '').replace(/recruit\.js.*$/, '');
    if (!(await loadScript(jbase + 'jspdf.min.js', () => !!window.jspdf) || await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', () => !!window.jspdf))) return M.toast('No se pudo cargar el generador de PDF. Revisa tu conexión.');
    const r = ST.result, f = ST.form; const { jsPDF } = window.jspdf; const d = new jsPDF({ unit: 'pt', format: 'a4' });
    d.setFillColor(11, 42, 91); d.rect(0, 0, 595, 90, 'F'); d.setFillColor(227, 36, 43); d.rect(0, 90, 595, 6, 'F');
    const logo = await logoData('mra-logo-cert.png'); if (logo) d.addImage(logo, 'PNG', 455, 14, 110, 64);
    d.setTextColor(255, 255, 255); d.setFont('helvetica', 'bold'); d.setFontSize(17); d.text('Proceso de selección de profesores', 40, 44);
    d.setFont('helvetica', 'normal'); d.setFontSize(11); d.text('Teacher Placement Test — mrarrieta.com', 40, 66);
    let y = 130; d.setTextColor(17, 17, 17); d.setFont('helvetica', 'bold'); d.setFontSize(13); d.text('Candidato(a): ' + (f.name || ''), 40, y); y += 22;
    d.setFont('helvetica', 'normal'); d.setFontSize(11);
    const dt = new Date(r.date);
    [`Correo: ${f.email || ''}`, `WhatsApp: ${f.whatsapp || ''}`, `Ciudad: ${f.city || ''}`, `Fecha: ${dt.toLocaleDateString('es-CO')}   Hora: ${dt.toLocaleTimeString('es-CO')}`].forEach(t => { d.text(t, 40, y); y += 18; }); y += 14;
    d.setFont('helvetica', 'bold'); d.setFontSize(13); d.text('Resultados por habilidad (0 a 10)', 40, y); y += 22; d.setFont('helvetica', 'normal'); d.setFontSize(12);
    Object.keys(NAMES).forEach(k => { d.text(`${NAMES[k]}:`, 50, y); d.text(r.per[k].toFixed(1) + ' / 10' + (k === 'speaking' && r.pending ? '  (pendiente de revisión)' : ''), 160, y);
      d.setDrawColor(11, 42, 91); d.rect(330, y - 9, 200, 10); d.setFillColor(227, 36, 43); d.rect(330, y - 9, 2 * r.per[k] * 10, 10, 'F'); y += 22; }); y += 10;
    d.setFont('helvetica', 'bold'); d.setFontSize(16); if (r.passed) d.setTextColor(21, 128, 61); else d.setTextColor(185, 28, 28);
    d.text('Estado: ' + statusTxt(r), 40, y); y += 24; d.setTextColor(17, 17, 17); d.setFont('helvetica', 'normal'); d.setFontSize(11);
    const msg = r.passed ? '¡Felicitaciones! Superaste la prueba de inglés. Te contactaremos por WhatsApp para la entrevista.' : 'Gracias por tu tiempo y por tu interés en enseñar con nosotros. En esta ocasión no alcanzaste el puntaje requerido para continuar.';
    const w = d.splitTextToSize(msg, 515); d.text(w, 40, y); y += w.length * 14 + 24;
    d.setDrawColor(150); d.line(40, y, 555, y); y += 18; d.setFontSize(9); d.setTextColor(120); d.text('mrarrieta.com — ¡Aprende inglés HABLANDO!', 40, y);
    d.save('Proceso_de_seleccion_' + String(f.name || 'candidato').replace(/\s+/g, '_') + '.pdf');
  }

  // ---------- reanudar ----------
  async function resumeTest() {
    if (left() <= 0) { app.innerHTML = '<div class="wrap rc"><div class="card center">⏳ Se acabó el tiempo. Enviando tu prueba…</div></div>'; return submit(true); }
    // grabaciones que no sobrevivieron a la recarga → se piden otra vez
    const lost = [];
    for (const i of SPK) { const a = ST.answers[i]; if (a && a.hasAudio && !(await getFile('a' + i))) { ST.answers[i] = null; lost.push(i); } }
    persist();
    const done = ST.answers.filter(a => a && a.answered).length;
    shell(2, `${head()}<div class="card center rc-form">${M.mascot('rc-mascot', 'watch')}<h2 class="rc-h2">Tienes una prueba en progreso</h2>
      <p class="muted">${done} de ${N} preguntas respondidas · Tiempo restante: <b>${fmt(left())}</b>. El cronómetro siguió corriendo.</p>
      ${lost.length ? `<p class="rc-warn">⚠️ ${lost.length} grabación(es) de Speaking se perdieron al recargar la página. Tendrás que grabarlas otra vez (preguntas ${lost.map(i => i + 1).join(', ')}).</p>` : ''}
      <button class="btn k lg" id="c">Continuar donde quedé →</button></div>`);
    tick(); startTimer();
    $('#c').onclick = async () => { const b = $('#c'); b.disabled = true; b.textContent = '⏳ Cargando…'; await M.loadAudio(['examF']); item(); };
  }

  function start() {
    if (ST.stage === 'done') return results();
    if (ST.stage === 'sending') return sendAll();
    if (ST.stage === 'test' && ST.startedAt) return resumeTest();
    if (ST.stage === 'form') return form();
    welcome();
  }
  window.MRARECRUIT = { state: () => ST };
  start();
})();
