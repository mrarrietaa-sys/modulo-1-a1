/* =====================================================================
   EXAMEN DE CLASIFICACIÓN (Placement Test) — mismo examen y funciones del original
   45 preguntas (11 Listening · 11 Reading · 11 Writing · 12 Speaking), de fácil a difícil
   · Cronómetro de 45 minutos · 2 intentos (el 3.º con código del profe)
   · Progreso guardado · Correcto / incorrecto en cada pregunta
   · Módulo recomendado = el primer módulo con menos de 70 % en Listening+Reading+Writing
   · PDF, copiar resumen, correo al estudiante + copia a administración, panel (Sheets)
   · Al terminar, el perfil queda ubicado automáticamente en su módulo
   ===================================================================== */
(function () {
  const M = window.M1;
  const { C, $, $$, h, esc, sleep, sfx } = M;
  const P = window.MRAP;
  const EX = window.MRAPT;
  const CFG = Object.assign({
    EMAILJS_PUBLIC_KEY: "F1fEtbt3ocfrt5V3C", EMAILJS_SERVICE_ID: "service_dxc9gsh", EMAILJS_TEMPLATE_ID: "template_oridazp",
    SHEETS_WEBAPP_URL: "https://script.google.com/macros/s/AKfycbzFUJ_xanGR-L1A14l7VUU-QeZoLBCpT1xIBjXWQXrqtLxEbpIp8ppgBoyMV1YwBX_-VQ/exec",
    ADMIN_EMAIL: "mrarrietaa@gmail.com", TIME_MIN: 45, ATTEMPTS: 2,
  }, C.EXAM || {});
  const MASTERY = 0.70;
  const LIMIT = CFG.TIME_MIN * 60 * 1000;
  const KEY = 'mra_placement_v1';
  const ITEMS = []; EX.sections.forEach(sec => sec.items.forEach((it, idx) => ITEMS.push(Object.assign({}, it, { section: sec.key, label: sec.label, icon: sec.icon, idx }))));
  const N = ITEMS.length;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const COURSE = { vip: 'Curso VIP (1 a 1)', group: 'Cursos grupales', self: 'Estudiar por mi cuenta en la plataforma' };

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const store = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { } };
  let ST = Object.assign({ attempts: 0, extra: 0, used: [], prog: null }, load());
  const persist = () => store(ST);
  const maxAttempts = () => CFG.ATTEMPTS + (ST.extra || 0);

  let app, ctx, answers, cur, first, last, temail, wa, course, startedAt, timerIv = null, timedOut = false, fixMode = false, rec = null;
  const name = () => (first + ' ' + last).trim() || 'Student';

  function loadScript(src, test) { return new Promise(res => { if (test()) return res(true); const s = document.createElement('script'); s.src = src; s.onload = () => res(test()); s.onerror = () => res(false); document.head.appendChild(s); }); }
  const fmt = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
  const img = (src) => src ? `<div class="fx-photo"><img src="${esc(src)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('err')"></div>` : '';
  const norm = (t) => ' ' + String(t || '').toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ') + ' ';
  function rubric(item, text) {
    const w = String(text || '').trim().split(/\s+/).filter(Boolean);
    if (w.length < (item.minWords || 3)) return false;
    if (!item.keywordGroups || !item.keywordGroups.length) return true;
    const t = norm(text); return item.keywordGroups.every(g => g.some(k => t.includes(' ' + k + ' ') || t.includes(k)));
  }
  const spellOk = () => true;
  function clockSVG(hour, minute) {
    const cx = 100, cy = 100, r = 92; const pt = (a, l) => { const rad = (a - 90) * Math.PI / 180; return [cx + l * Math.cos(rad), cy + l * Math.sin(rad)]; };
    let ticks = ''; for (let i = 0; i < 12; i++) { const [x1, y1] = pt(i * 30, r - 6), [x2, y2] = pt(i * 30, r - (i % 3 ? 14 : 20)); ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#0B2A5B" stroke-width="${i % 3 ? 2 : 3.5}" stroke-linecap="round"/>`; }
    const nums = [[12, 100, 40], [3, 160, 102], [6, 100, 164], [9, 40, 102]].map(([n, x, y]) => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Poppins,sans-serif" font-weight="800" font-size="18" fill="#0B2A5B">${n}</text>`).join('');
    const [hx, hy] = pt(((hour % 12) + minute / 60) * 30, 46), [mx, my] = pt(minute * 6, 70);
    return `<div class="pt-clock"><svg viewBox="0 0 200 200" width="190" height="190"><circle cx="100" cy="100" r="92" fill="#fff" stroke="#0B2A5B" stroke-width="5"/>${ticks}${nums}<line x1="100" y1="100" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#0B2A5B" stroke-width="7" stroke-linecap="round"/><line x1="100" y1="100" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#E3242B" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="100" r="7" fill="#0B2A5B" stroke="#E3242B" stroke-width="2"/></svg></div>`;
  }
  function saveProg() { ST.prog = { first, last, temail, wa, course, cur, startedAt, answers: answers.map(a => a && a.url ? Object.assign({}, a, { url: null }) : a) }; persist(); }
  function shell(html) { stopRec(); app.innerHTML = `<div class="wrap fx">${html}</div>`; window.scrollTo(0, 0); }
  function top(extra = '') {
    return `<div class="fx-top"><span class="lbl">Placement test · Clasificación</span><span class="fx-chip">INTENTO ${Math.min(ST.attempts + 1, maxAttempts())}/${maxAttempts()}</span>${extra}<div class="grow"></div><button class="btn w sm" id="fx-exit">✕ Salir</button></div>`;
  }
  function wireExit() { const b = $('#fx-exit'); if (b) b.onclick = () => { stopTimer(); stopRec(); ctx.route('home'); }; }

  // ---------- inicio ----------
  async function run(appEl, context) {
    app = appEl; ctx = context; ST = Object.assign({ attempts: 0, extra: 0, used: [], prog: null }, load());
    answers = new Array(N).fill(null); cur = 0; fixMode = false; timedOut = false;
    const pr = P.get() || {};
    first = pr.first || (pr.name || '').split(' ')[0] || ''; last = pr.last || (pr.name || '').split(' ').slice(1).join(' ');
    temail = pr.email || ''; wa = pr.whatsapp || ''; course = pr.course || '';
    if (ST.attempts >= maxAttempts()) return locked();
    const p = ST.prog; const done = p && Array.isArray(p.answers) ? p.answers.filter(a => a && a.answered).length : 0;
    if (p && (done > 0 || p.startedAt)) return resume(p, done);
    welcome();
  }
  function welcome() {
    const PX = (u) => `https://images.pexels.com/photos/${u}?auto=compress&cs=tinysrgb&w=500`;
    const SK = [['Listening', '🎧', PX('6399/woman-girl-technology-music.jpg'), 11], ['Reading', '📖', PX('8553920/pexels-photo-8553920.jpeg'), 11], ['Writing', '✍️', PX('210661/pexels-photo-210661.jpeg'), 11], ['Speaking', '🎤', PX('8872482/pexels-photo-8872482.jpeg'), 12]];
    shell(`${top()}<div class="card center fx-welcome">
      <div class="fx-photos">${SK.map(([l, ic, u, n]) => `<div class="fx-pbox"><div class="fx-pimg"><img src="${u}" alt="${l}" loading="lazy" onerror="this.style.opacity=0"></div><div class="fx-pcap"><b>${n}</b> ${ic} ${l}</div></div>`).join('')}</div>
      <span class="lbl" style="margin-top:6px">✦ Examen de clasificación interactivo</span>
      <h1 style="font-size:clamp(26px,5.5vw,34px);margin:10px 0 4px">Placement Test</h1>
      <p style="font-weight:800;margin:0">Listening + Reading + Writing + Speaking</p>
      <p class="muted" style="margin:4px 0 12px">${N} preguntas — Descubre en qué módulo debes empezar en mrarrieta.com</p>
      <div class="fx-info">${M.mascot('fx-wmra', 'point')}<div>Vas a completar el examen de clasificación. Primero confirmaremos tus datos, luego verás las instrucciones y comenzarás con <b>Listening</b>. Las preguntas van de <b>más fáciles a más difíciles</b>, para saber exactamente en qué módulo debes comenzar.<br><span class="muted">⏱ ${CFG.TIME_MIN} minutos · ${CFG.ATTEMPTS} intentos ${ST.attempts ? `· Ya usaste <b>${ST.attempts}</b> de ${maxAttempts()}` : ''}</span></div></div>
      <button class="btn k lg" id="go">Continuar →</button></div>`);
    wireExit(); $('#go').onclick = studentInfo;
  }
  function resume(p, done) {
    shell(`${top()}<div class="card center">${M.mascot('mascot', 'watch')}<h2>💾 Tienes un examen en progreso</h2>
      <p class="muted">${esc((p.first || '') + ' ' + (p.last || ''))} — ${done} de ${N} preguntas respondidas.${p.startedAt ? ` Tiempo restante: <b>${fmt(LIMIT - (Date.now() - p.startedAt))}</b>` : ''}</p>
      <div class="row" style="justify-content:center"><button class="btn k lg" id="c">Continuar donde quedé</button><button class="btn w" id="r">Empezar de nuevo</button></div>
      <p class="muted" style="font-size:13px;margin-top:10px">Las grabaciones de Speaking no se pueden recuperar al recargar: tendrás que grabarlas otra vez.</p></div>`);
    wireExit();
    $('#c').onclick = () => { first = p.first || first; last = p.last || last; temail = p.temail || temail; wa = p.wa || wa; course = p.course || course;
      answers = (p.answers && p.answers.length === N) ? p.answers.map((a, i) => a && ITEMS[i].section === 'speaking' ? null : a) : new Array(N).fill(null);
      startedAt = p.startedAt || Date.now(); startTimer(); go(p.cur || 0, true); };
    $('#r').onclick = () => { if (p.startedAt) { ST.attempts++; } ST.prog = null; persist(); run(app, ctx); };
  }
  const saveProfile = () => { const pr = P.get() || {}; Object.assign(pr, { first, last, name: (first + ' ' + last).trim(), email: temail, whatsapp: wa, course }); P.save(pr); };
  function studentInfo() {
    shell(`${top()}<div class="card fx-form"><span class="lbl">Student information</span><h2>Tus datos</h2><p class="muted">Escribe tu nombre y apellido tal como quieres que aparezcan en tu reporte.</p>
      <label>Nombre</label><input class="inp" id="f" value="${esc(first)}" autocomplete="given-name"><label>Apellido</label><input class="inp" id="l" value="${esc(last)}" autocomplete="family-name">
      <div class="actionbar"><button class="btn k lg" id="go">Continuar →</button></div></div>`);
    wireExit();
    $('#go').onclick = () => { const f = $('#f').value.trim(), l = $('#l').value.trim(); if (!f) return $('#f').classList.add('wrong'); if (!l) return $('#l').classList.add('wrong');
      first = f; last = l; saveProfile(); studentEmail(); };
  }
  function studentEmail() {
    shell(`${top()}<div class="card fx-form"><span class="lbl">Your email</span><h2>Tu correo electrónico</h2><p class="muted">Ahí te llegará el resultado de tu examen de clasificación.</p>
      <input class="inp" id="e" type="email" inputmode="email" placeholder="tucorreo@gmail.com" value="${esc(temail)}">
      <p class="muted" style="font-size:13px">Además, una copia automática se envía a administración.</p>
      <div class="actionbar"><button class="btn w" id="b">← Atrás</button><button class="btn k lg" id="go">Continuar →</button></div></div>`);
    wireExit(); $('#b').onclick = studentInfo;
    $('#go').onclick = () => { const v = $('#e').value.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { $('#e').classList.add('wrong'); M.toast('Escribe un correo válido 📧'); return; }
      temail = v; confirmEmail(); };
  }
  function confirmEmail() {
    shell(`${top()}<div class="card center"><span class="lbl">Confirm your email</span><h2>¿Este correo es correcto?</h2><div class="fx-mail">${esc(temail)}</div>
      <div class="row" style="justify-content:center"><button class="btn w" id="ed">✏️ Corregir</button><button class="btn k lg" id="ok">Sí, continuar</button></div></div>`);
    wireExit(); $('#ed').onclick = studentEmail; $('#ok').onclick = () => { saveProfile(); contact(); };
  }
  function contact() {
    shell(`${top()}<div class="card fx-form"><span class="lbl">Contact</span><h2>Tu WhatsApp y tu interés</h2>
      <label>Número de WhatsApp</label><input class="inp" id="w" type="tel" inputmode="tel" placeholder="Ej: 300 123 4567" value="${esc(wa)}">
      <label>¿Qué te interesa?</label><div class="pt-course">${Object.entries(COURSE).map(([k, v]) => `<button class="opt ${course === k ? 'sel' : ''}" data-k="${k}">${k === 'vip' ? '👤' : k === 'group' ? '👥' : '💻'} ${esc(v)}</button>`).join('')}</div>
      <div class="actionbar"><button class="btn w" id="b">← Atrás</button><button class="btn k lg" id="go">Continuar →</button></div></div>`);
    wireExit(); $('#b').onclick = studentEmail;
    $$('.pt-course .opt').forEach(b => b.onclick = () => { $$('.pt-course .opt').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); course = b.dataset.k; });
    $('#go').onclick = () => { const v = $('#w').value.trim(); if (v.replace(/\D/g, '').length < 7) { $('#w').classList.add('wrong'); M.toast('Escribe tu WhatsApp 📱'); return; }
      if (!course) { $('.pt-course').classList.add('shake'); setTimeout(() => $('.pt-course').classList.remove('shake'), 400); M.toast('Elige una opción 👆'); return; }
      wa = v; saveProfile(); instructions(); };
  }
  function instructions() {
    shell(`${top()}<div class="card fx-form"><span class="lbl">Instrucciones generales</span><h2>Antes de empezar</h2><ul class="fx-ul">
      <li>El examen tiene <b>${N} preguntas</b> en 4 partes: Listening (11), Reading (11), Writing (11) y Speaking (12).</li>
      <li>Tienes un máximo de <b>${CFG.TIME_MIN} minutos</b>. El cronómetro aparece arriba; si llega a cero, el examen se envía solo con lo que hayas respondido.</li>
      <li>Las preguntas empiezan fáciles y se vuelven más difíciles — así sabremos exactamente en qué módulo debes comenzar.</li>
      <li>En cada pregunta verás de inmediato si tu respuesta es <b>correcta o incorrecta</b>.</li>
      <li>En Listening toca <b>🔊 Escuchar</b> para oír el audio en inglés americano. En Speaking toca <b>🎤</b>, habla y toca otra vez para detener; puedes grabar de nuevo.</li>
      <li>Debes responder todas las preguntas antes de enviar.</li>
      <li>Tienes <b>${CFG.ATTEMPTS} intentos</b>. Al finalizar verás tu <b>módulo recomendado</b>, un PDF descargable, y tu resultado se enviará a tu correo y a administración. <b>Tu perfil quedará ubicado automáticamente en tu módulo.</b></li>
      <li>Tu progreso se guarda solo: si se recarga la página, puedes continuar donde quedaste.</li></ul>
      <p class="muted" style="font-size:14px">🎤 Tu navegador te pedirá permiso para usar el micrófono en la sección de Speaking.</p>
      <div class="actionbar"><button class="btn k lg" id="go">🚀 Comenzar examen</button></div></div>`);
    wireExit();
    $('#go').onclick = async () => { await M.loadAudio(['pt']); answers = new Array(N).fill(null); startedAt = Date.now(); saveProg(); startTimer(); go(0, false); };
  }

  // ---------- cronómetro ----------
  function tick() { const el = $('#fx-timer'); const left = LIMIT - (Date.now() - startedAt); if (el) { el.textContent = '⏱ ' + fmt(left); el.classList.toggle('low', left <= 5 * 60 * 1000); } if (left <= 0) { timedOut = true; submit(); } }
  function startTimer() { stopTimer(); timerIv = setInterval(tick, 1000); }
  function stopTimer() { if (timerIv) clearInterval(timerIv); timerIv = null; }

  // ---------- preguntas ----------
  function go(i, fromResume) {
    if (i >= N) return review();
    const prev = ITEMS[cur]; cur = Math.max(0, i); const it = ITEMS[cur];
    if (!fromResume && it.idx === 0 && (!prev || prev.section !== it.section || i === 0) && !fixMode) return sectionIntro(it.section, () => item());
    item();
  }
  function sectionIntro(key, next) {
    const sec = EX.sections.find(s => s.key === key);
    shell(`${top(`<span class="fx-chip t" id="fx-timer"></span>`)}<div class="card center fx-sec"><div style="font-size:60px">${sec.icon}</div><h1>${sec.label.toUpperCase()}</h1><p class="muted" style="font-size:17px">${esc(sec.desc)}</p><button class="btn k lg" id="go">Continuar →</button></div>`);
    wireExit(); tick(); $('#go').onclick = next;
  }
  function pills(active) { return EX.sections.map(s => { const done = ITEMS.every((it, i) => it.section !== s.key || (answers[i] && answers[i].answered)); return `<span class="${s.key === active ? 'on' : done ? 'ok' : ''}">${s.icon} ${s.label}</span>`; }).join(''); }
  function item() {
    const it = ITEMS[cur]; const a = answers[cur] || (answers[cur] = { answered: false, correct: null, value: null });
    shell(`${top(`<span class="fx-chip t" id="fx-timer"></span>`)}
      <div class="fx-prog"><i style="width:${Math.round((cur + 1) / N * 100)}%"></i></div><div class="secbar fx-pills">${pills(it.section)}</div>
      <div class="card fx-item"><div class="hd"><span class="lbl">${it.icon} ${it.label} · ${esc(it.topic)}</span><span class="qcount">${cur + 1} / ${N}</span></div><div class="fx-body"></div><div class="fx-fb"></div>
      <div class="actionbar"><button class="btn w" id="pv" ${cur === 0 ? 'disabled' : ''}>← Anterior</button><button class="btn k lg" id="nx">${fixMode ? 'Siguiente pendiente →' : cur === N - 1 ? 'Ir a revisión final →' : 'Siguiente →'}</button></div></div>`);
    wireExit(); tick();
    $('#pv').onclick = () => { stopRec(); go(cur - 1, true); };
    $('#nx').onclick = () => { stopRec(); saveProg(); if (fixMode) { const n = answers.findIndex((x, i) => i > cur && !(x && x.answered)); if (n >= 0) { cur = n; item(); } else { fixMode = false; review(); } } else go(cur + 1, false); };
    const body = $('.fx-body'); const fb = $('.fx-fb');
    const feedback = (ok, wrong, neutral) => { fb.className = 'fx-fb show ' + (neutral ? 'neutral' : ok ? 'ok' : 'bad'); fb.innerHTML = neutral ? '✔ Respuesta guardada.' : ok ? '✅ ¡Correcto!' : `❌ Incorrecto. ${wrong || ''}`; };
    if (it.section === 'listening') renderMC(body, it, a, feedback, true);
    else if (it.section === 'reading') renderMC(body, it, a, feedback, false);
    else if (it.section === 'writing') renderW(body, it, a, feedback);
    else renderS(body, it, a, feedback);
  }
  function renderMC(body, it, a, feedback, listen) {
    const opts = it.type === 'tf' ? ['True', 'False'] : it.options; const ci = it.type === 'tf' ? (it.correct ? 0 : 1) : it.correct;
    body.innerHTML = `${it.clock ? clockSVG(it.clock.hour, it.clock.minute) : img(it.img)}${listen ? `<div class="center"><button class="btn k lg fx-listen" id="ls">🔊 Escuchar</button></div>` : `<div class="fx-pass">${it.passage.map(([w, l]) => `<div>${w ? `<b>${esc(w)}:</b> ` : ''}${esc(l)}</div>`).join('')}</div>`}
      <div class="fx-q">${esc(it.type === 'tf' ? it.statement : it.q)}</div><div class="opts fx-opts ${opts.length === 2 ? 'two' : ''}">${opts.map((o, i) => `<button class="opt" data-i="${i}"><span class="qs-l">${'ABCD'[i]}</span> ${esc(o)}</button>`).join('')}</div>`;
    if (listen) { const b = $('#ls', body); b.onclick = async () => { b.classList.add('playing'); b.textContent = '🔊 Reproduciendo…'; await M.play(it.au); b.classList.remove('playing'); b.textContent = '🔊 Escuchar otra vez'; }; if (!a.answered) setTimeout(() => b.click(), 400); }
    const btns = $$('.opt', body);
    const paint = () => btns.forEach((b, i) => { b.disabled = true; b.classList.add(i === ci ? 'right' : i === a.value ? 'wrong' : 'dim'); });
    if (a.answered) { paint(); feedback(a.correct, `La respuesta correcta es: <b>${esc(opts[ci])}</b>`); return; }
    btns.forEach((b, i) => b.onclick = () => { a.answered = true; a.value = i; a.correct = i === ci; paint(); sfx(a.correct ? 'ok' : 'bad'); feedback(a.correct, `La respuesta correcta es: <b>${esc(opts[ci])}</b>`); saveProg(); refreshPills(); });
  }
  function refreshPills() { const p = $('.fx-pills'); if (p) p.innerHTML = pills(ITEMS[cur].section); }
  function renderW(body, it, a, feedback) {
    if (it.type === 'blank') {
      body.innerHTML = `${img(it.img)}<div class="fx-lab">${esc(it.prompt)}</div><div class="fx-q">${esc(it.sentence).replace('___', '<span class="blank">&nbsp;&nbsp;&nbsp;&nbsp;</span>')}</div>
        <div class="fx-ans"><input class="inp" id="wi" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="escribe tu respuesta"><button class="btn k" id="wc">Comprobar ✓</button></div>`;
      const inp = $('#wi', body), chk = $('#wc', body);
      const show = () => { inp.value = a.value; inp.disabled = chk.disabled = true; inp.classList.add(a.correct ? 'right' : 'wrong'); feedback(a.correct, `La respuesta correcta es: <b>${esc(it.accept[0])}</b>`); };
      if (a.answered) return show();
      const go = () => { const v = inp.value.trim().toLowerCase().replace(/[.!?]$/, ''); if (!v) { inp.classList.add('wrong'); setTimeout(() => inp.classList.remove('wrong'), 400); return; }
        a.answered = true; a.value = v; a.correct = it.accept.includes(v); sfx(a.correct ? 'ok' : 'bad'); show(); saveProg(); refreshPills(); };
      chk.onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); }; setTimeout(() => inp.focus({ preventScroll: true }), 200);
    } else {
      body.innerHTML = `${img(it.img)}<div class="fx-lab">${esc(it.prompt)}</div><p class="muted">${esc(it.example || '')}</p>
        <textarea class="inp fx-ta" id="wo" rows="3" placeholder="escribe tu respuesta en inglés"></textarea><div class="actionbar" style="justify-content:flex-start"><button class="btn k" id="ws">Comprobar ✓</button></div>`;
      const ta = $('#wo', body), b = $('#ws', body);
      const show = () => { ta.value = a.value; ta.disabled = b.disabled = true; feedback(a.correct, it.special === 'spellName' ? `Deletrea tu nombre así: <b>${esc((first || 'JOHN').toUpperCase().split('').join('-'))}</b>` : 'Tu respuesta no cumple con lo que se pedía. Mira el ejemplo.'); };
      if (a.answered) return show();
      b.onclick = () => { const v = ta.value.trim(); if (!v) { ta.classList.add('wrong'); return; } a.answered = true; a.value = v; a.correct = it.special === 'spellName' ? spellOk(v) : rubric(it, v); sfx(a.correct ? 'ok' : 'bad'); show(); saveProg(); refreshPills(); };
    }
  }
  // ---------- Speaking: grabar + transcribir + calificar ----------
  function stopRec() { if (rec) { try { rec.cancel(); } catch (e) { } rec = null; } }
  function renderS(body, it, a, feedback) {
    body.innerHTML = `${img(it.img)}<div class="fx-task"><small>Task</small><div class="fx-q" style="margin:4px 0">${esc(it.task)}</div><div class="muted">${esc(it.es)}</div><button class="btn w sm" id="tl" style="margin-top:8px">🔊 Escuchar la instrucción</button></div>
      <div class="center"><button class="mic" id="mc">🎤</button><p class="fx-st" id="st">Toca el micrófono, habla y toca otra vez para detener.</p></div><div id="vr"></div>`;
    $('#tl', body).onclick = () => M.play(it.au);
    const mc = $('#mc', body), st = $('#st', body), vr = $('#vr', body);
    const result = () => {
      vr.innerHTML = `<div class="vres ${a.correct === null ? 'self' : a.correct ? 'ok' : 'bad'}"><div class="vres-t">${a.neutral ? '✔ Grabación guardada (tu navegador no puede evaluar la voz).' : a.correct ? '✅ ¡Muy bien! Respondiste correctamente.' : '❌ Todavía no. ' + (it.special === 'spellName' ? 'Deletrea tu nombre letra por letra.' : `Responde con al menos ${it.minWords} palabras e incluye lo que pide la tarea.`)}</div>
        ${a.value ? `<small class="muted">Te escuché: “${esc(a.value)}”</small>` : ''}<div class="row vres-b">${a.url ? '<button class="btn w sm" id="me">▶ Mi voz</button>' : ''}<button class="btn ${a.correct ? 'w' : 'k'} sm" id="ag">🔁 Grabar de nuevo</button></div></div>`;
      if (a.url) $('#me', vr).onclick = () => { const x = new Audio(a.url); x.play(); };
      $('#ag', vr).onclick = () => { a.answered = false; a.correct = null; a.value = null; a.url = null; vr.innerHTML = ''; mc.click(); refreshPills(); };
      if (a.neutral) feedback(true, '', true); else feedback(a.correct, '');
    };
    if (a.answered) result();
    mc.onclick = async () => {
      if (rec) { rec.stop(); return; }
      let stream = null, mr = null, chunks = [], transcript = '', sr = null, srOk = !!SR, cancelled = false;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); mr = new MediaRecorder(stream); mr.ondataavailable = e => e.data.size && chunks.push(e.data); mr.start(); }
      catch (e) { if (!SR) { M.toast('Permite el micrófono 🎤'); return; } }
      if (SR) { try { sr = new SR(); sr.lang = 'en-US'; sr.continuous = true; sr.interimResults = false; sr.onresult = e => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) transcript += ' ' + e.results[i][0].transcript; }; sr.onerror = e => { if (/not-allowed|audio-capture|service-not-allowed|network/.test(e.error)) srOk = false; }; sr.start(); } catch (e) { srOk = false; } }
      mc.classList.add('rec'); st.textContent = '🔴 Grabando… habla ahora. Toca 🎤 para detener.'; M.stop();
      const auto = setTimeout(() => rec && rec.stop(), 40000);
      rec = {
        cancel() { cancelled = true; clearTimeout(auto); try { sr && sr.abort(); } catch (e) { } try { mr && mr.state !== 'inactive' && mr.stop(); } catch (e) { } stream && stream.getTracks().forEach(t => t.stop()); },
        async stop() { clearTimeout(auto); rec = null; mc.classList.remove('rec'); st.textContent = '⏳ Procesando…';
          const pRec = new Promise(r => { if (!mr || mr.state === 'inactive') return r(); mr.onstop = r; mr.stop(); });
          const pSr = new Promise(r => { if (!sr) return r(); sr.onend = r; try { sr.stop(); } catch (e) { r(); } setTimeout(r, 3500); });
          await Promise.all([pRec, pSr]); stream && stream.getTracks().forEach(t => t.stop()); if (cancelled) return;
          a.url = chunks.length ? URL.createObjectURL(new Blob(chunks, { type: (mr && mr.mimeType) || 'audio/webm' })) : null;
          const tr = transcript.trim(); a.value = tr; a.answered = true;
          if (!srOk && !tr) { a.correct = true; a.neutral = true; }
          else { a.neutral = false; a.correct = it.special === 'spellName' ? (M.letterScorer((first || '').replace(/[^A-Za-z]/g, '') || 'NAME')([tr]).score >= 70) : rubric(it, tr); }
          sfx(a.correct ? 'ok' : 'bad'); st.textContent = 'Toca el micrófono para grabar de nuevo.'; result(); saveProg(); refreshPills(); },
      };
    };
  }

  // ---------- revisión final + envío ----------
  function review() {
    const miss = answers.filter(a => !(a && a.answered)).length;
    shell(`${top(`<span class="fx-chip t" id="fx-timer"></span>`)}<div class="card"><span class="lbl">Final review</span><h2>Revisión final</h2>
      <p class="muted">${miss ? `Te faltan <b>${miss}</b> pregunta(s) por responder antes de enviar.` : 'Respondiste todas las preguntas. Ya puedes enviar tu examen.'}</p>
      <div class="fx-rev">${ITEMS.map((it, i) => { const ok = answers[i] && answers[i].answered; return `<button class="${ok ? 'ok' : 'miss'}" data-i="${i}">${i + 1}. ${it.icon} ${esc(it.topic)} ${ok ? '✓' : '— pendiente'}</button>`; }).join('')}</div>
      <div class="actionbar"><button class="btn w" id="bk">← Volver al examen</button><button class="btn k lg" id="sb" ${miss ? 'disabled' : ''}>📨 Enviar examen</button></div></div>`);
    wireExit(); tick();
    $$('.fx-rev button').forEach(b => b.onclick = () => { const i = +b.dataset.i; fixMode = !(answers[i] && answers[i].answered); cur = i; item(); });
    $('#bk').onclick = () => { fixMode = false; cur = 0; item(); };
    $('#sb').onclick = () => { const m = M.modal(`<h3>¿Enviar tu examen?</h3><p class="muted">Después de enviarlo no podrás cambiar tus respuestas.</p><div class="row"><button class="btn k" id="y">Sí, enviar</button><button class="btn w" id="n">Revisar otra vez</button></div>`);
      $('#y', m).onclick = () => { m.remove(); submit(); }; $('#n', m).onclick = () => m.remove(); };
  }
  function scores() {
    const per = {}; EX.sections.forEach(s => { const idx = ITEMS.map((it, i) => i).filter(i => ITEMS[i].section === s.key); const c = idx.filter(i => answers[i] && answers[i].correct === true).length; per[s.key] = { c, t: idx.length, score: c / idx.length * 10 }; });
    const fin = Math.round((per.listening.score + per.reading.score + per.writing.score + per.speaking.score) / 4 * 10) / 10; return { per, fin };
  }
  // la señal de clasificación: dominio por módulo con Listening + Reading + Writing
  function mastery() {
    const mods = {}; [1, 2, 3, 4].forEach(m => { const idx = ITEMS.map((it, i) => i).filter(i => ITEMS[i].section !== 'speaking' && ITEMS[i].module === m); const c = idx.filter(i => answers[i] && answers[i].correct === true).length; mods[m] = { c, t: idx.length, pct: idx.length ? c / idx.length : 0 }; mods[m].ok = mods[m].pct >= MASTERY; });
    let rec = [1, 2, 3, 4].find(m => !mods[m].ok); const all = !rec; if (!rec) rec = 4;
    return { mods, rec, all };
  }
  const NAMES = { listening: 'Listening', reading: 'Reading', writing: 'Writing', speaking: 'Speaking' };
  function comment(per, ms) {
    const ks = Object.keys(per); const best = ks.reduce((x, y) => per[y].score > per[x].score ? y : x), worst = ks.reduce((x, y) => per[y].score < per[x].score ? y : x);
    const m = P.mod(ms.rec);
    const o = ms.all ? `¡Excelente trabajo! Dominaste los cuatro módulos del Placement Test. Te ubicamos en el ${m.name} (${m.es}) para perfeccionar tu inglés.`
      : ms.rec === 1 ? `¡Bienvenido(a)! Según tus resultados, vas a comenzar en el ${m.name} (${m.es}) para construir una base sólida.`
      : `¡Buen trabajo! Según tus resultados, vas a comenzar en el ${m.name} (${m.es}).`;
    return `${o} Tu punto más fuerte es ${NAMES[best]}.${best !== worst ? ` Sigue practicando ${NAMES[worst]} cuando empieces tu módulo.` : ''}`;
  }
  let last_ = null;
  function submit() {
    if (!startedAt && !timedOut) return; stopTimer(); stopRec();
    ST.attempts++; ST.prog = null; persist(); startedAt = null;
    const { per, fin } = scores(); const ms = mastery();
    last_ = { per, fin, ms, date: new Date(), name: name(), temail, wa, course, attempt: ST.attempts, attemptLabel: ST.attempts > CFG.ATTEMPTS ? 'Intento adicional' : `Intento ${ST.attempts} de ${CFG.ATTEMPTS}`, timedOut };
    P.setPlacement(ms.rec, { score: fin, mods: Object.fromEntries(Object.entries(ms.mods).map(([k, v]) => [k, Math.round(v.pct * 100)])), skills: Object.fromEntries(Object.entries(per).map(([k, v]) => [k, +v.score.toFixed(1)])), all: ms.all });
    ctx.after && ctx.after(last_);
    results(); notify(last_);
  }
  function results() {
    const r = last_; const m = P.mod(r.ms.rec); const left = maxAttempts() - ST.attempts; const trial = P.isTrial();
    const waMsg = encodeURIComponent(`Hola, soy ${r.name}. Acabo de hacer el Placement Test en mrarrieta.com y me ubicó en el ${m.name} (${m.es}). Me interesa: ${COURSE[r.course] || 'un curso'}. Quiero más información 😊`);
    shell(`${top()}<div class="card center fx-res"><div class="row" style="justify-content:center;align-items:center;gap:16px">${M.mascot('mascot bounce', 'celebrate')}
      <div><span class="lbl">Tu módulo recomendado</span><div class="pt-level">${esc(m.name.toUpperCase())}</div><div class="fx-band alto">${esc(m.es)} · ${esc(m.level)}</div></div></div>
      <p class="muted">${esc(r.name)} — ${esc(r.attemptLabel)}</p>
      <div class="pt-mods">${[1, 2, 3, 4].map(k => { const mm = P.mod(k), x = r.ms.mods[k]; return `<div class="${k === r.ms.rec ? 'rec' : x.ok ? 'ok' : ''}"><b>${esc(mm.name)}</b><small>${esc(mm.es)}</small><span>${Math.round(x.pct * 100)}%</span><em>${k === r.ms.rec ? '⭐ Tu módulo' : x.ok ? '✓ Dominado' : '—'}</em></div>`; }).join('')}</div>
      <div class="fx-bars">${Object.keys(r.per).map(k => `<div><span>${EX.sections.find(s => s.key === k).icon} ${NAMES[k]}</span><div class="bar"><i style="width:${r.per[k].score * 10}%"></i></div><b>${r.per[k].score.toFixed(1)}</b></div>`).join('')}</div>
      <div class="fx-comment">${r.timedOut ? `<b>⏱ Se acabó el tiempo (${CFG.TIME_MIN} minutos).</b> Tu examen se envió automáticamente con las respuestas que tenías.<br><br>` : ''}<b>Comentario:</b> ${esc(comment(r.per, r.ms))}</div>
      ${trial ? `<div class="pt-trial">🎁 <b>Clase de cortesía:</b> ya puedes vivir la experiencia con los <b>2 primeros temas</b> del ${esc((P.trialMod() || m).name)}.</div>` : ''}
      <div class="fx-notify"><div id="n1" class="pending">⏳ Guardando resultados…</div><div id="n2" class="pending">⏳ Enviando correo con tu resultado…</div><div id="n3" class="pending">⏳ Enviando copia a administración…</div></div>
      <div class="row" style="justify-content:center;margin-top:14px"><button class="btn k lg" id="prof">👤 Ir a mi perfil y empezar →</button>
        <button class="btn w" id="pdf">📄 Descargar reporte PDF</button><button class="btn w" id="cp">📋 Copiar resumen</button>
        <a class="btn" style="text-decoration:none;background:#25D366;color:#fff" target="_blank" rel="noopener" href="https://wa.me/${C.WHATSAPP}?text=${waMsg}">💬 ${trial ? 'Quiero inscribirme' : 'Escribir a mrarrieta.com'}</a>
        ${left > 0 ? `<button class="btn w" id="again">🔁 Intentar de nuevo (te queda${left > 1 ? 'n' : ''} ${left})</button>` : ''}</div></div>`);
    wireExit(); sfx('win'); M.confetti(3500);
    $('#prof').onclick = () => ctx.route('home'); $('#pdf').onclick = reportPDF; $('#cp').onclick = copySummary;
    if ($('#again')) $('#again').onclick = () => run(app, ctx);
  }
  function setN(id, ok, txt) { const e = $('#' + id); if (e) { e.className = ok === true ? 'ok' : ok === false ? 'err' : 'pending'; e.textContent = txt; } }
  const waLink = (raw) => { let d = String(raw || '').replace(/\D/g, ''); if (!d) return ''; if (d.length === 10) d = '57' + d; return 'https://wa.me/' + d; };
  async function notify(r) {
    const m = P.mod(r.ms.rec);
    const params = { subject: `Placement Test${r.attempt > 1 ? (r.attempt > CFG.ATTEMPTS ? ' – Additional Attempt' : ' – Attempt ' + r.attempt) : ''} – ${r.name} – Recommended: ${m.name} (${m.es})`,
      student_name: r.name, student_whatsapp: r.wa || '', student_whatsapp_link: waLink(r.wa), course_interest: COURSE[r.course] || '', module: 'Placement Test', level: m.es, recommended_module: m.name,
      result_label: 'Nivel recomendado', result_headline: m.name, result_detail: m.es, result_color: '#0B2A5B',
      attempt_label: r.attemptLabel, date: r.date.toLocaleDateString(), time: r.date.toLocaleTimeString(),
      listening_score: r.per.listening.score.toFixed(1), reading_score: r.per.reading.score.toFixed(1), writing_score: r.per.writing.score.toFixed(1), speaking_score: r.per.speaking.score.toFixed(1),
      final_score: r.fin.toFixed(1), performance: m.name + ' — ' + m.es, status: 'COMPLETADO', feedback: comment(r.per, r.ms),
      next_steps_display: 'block', next_steps_text: P.isTrial() ? 'Ya puedes vivir tu clase de cortesía en la plataforma con los 2 primeros temas de tu módulo. Para inscribirte, escríbenos por WhatsApp al 301 781 0841.' : 'Tu perfil en la plataforma ya quedó ubicado en tu módulo. Entra a mrarrieta.com con tu código y comienza tu primera clase.' };
    try { const q = new URLSearchParams({ action: 'submit', module: 'Placement Test', student_name: r.name, student_email: r.temail, student_whatsapp: r.wa || '', course_interest: COURSE[r.course] || '', attempt: r.attempt, attempt_state: r.attemptLabel, status: 'COMPLETADO', listening: params.listening_score, reading: params.reading_score, writing: params.writing_score, speaking: params.speaking_score, final_score: params.final_score, recommended_module: m.name, recommended_level: m.es, date: r.date.toISOString() });
      const res = await fetch(CFG.SHEETS_WEBAPP_URL + '?' + q.toString()); const d = await res.json().catch(() => null);
      const good = res.ok && !(d && d.ok === false); setN('n1', good, good ? '✓ Resultados guardados en el panel de administración.' : '✗ No se pudieron guardar en el panel de administración.'); }
    catch (e) { setN('n1', false, '✗ No se pudieron guardar en el panel (sin conexión).'); }
    const ok = await loadScript('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js', () => !!window.emailjs);
    if (ok) { try { emailjs.init({ publicKey: CFG.EMAILJS_PUBLIC_KEY }); } catch (e) { } }
    const send = async (to) => { if (!ok) return false; try { await emailjs.send(CFG.EMAILJS_SERVICE_ID, CFG.EMAILJS_TEMPLATE_ID, Object.assign({ to_email: to }, params)); return true; } catch (e) { return false; } };
    const s1 = await send(r.temail); setN('n2', s1, s1 ? `✓ Correo enviado a ${r.temail}.` : '✗ No se pudo enviar el correo. Usa “Copiar resumen”.');
    const s2 = await send(CFG.ADMIN_EMAIL); setN('n3', s2, s2 ? '✓ Copia enviada a administración.' : '✗ No se pudo enviar la copia a administración.');
  }
  function summaryText(r) { const m = P.mod(r.ms.rec); return `📋 Placement Test · mrarrieta.com\n👤 ${r.name}\n📅 ${r.date.toLocaleString()}\n🔁 ${r.attemptLabel}\n⭐ Módulo recomendado: ${m.name} — ${m.es}\n${[1, 2, 3, 4].map(k => `   ${P.mod(k).name} (${P.mod(k).es}): ${Math.round(r.ms.mods[k].pct * 100)}%`).join('\n')}\n🎧 Listening: ${r.per.listening.score.toFixed(1)}\n📖 Reading: ${r.per.reading.score.toFixed(1)}\n✍️ Writing: ${r.per.writing.score.toFixed(1)}\n🎤 Speaking: ${r.per.speaking.score.toFixed(1)}\n💬 ${comment(r.per, r.ms)}`; }
  async function copySummary() { const t = summaryText(last_); try { await navigator.clipboard.writeText(t); M.toast('✓ Resumen copiado'); } catch (e) { const ta = h(`<textarea style="position:fixed;opacity:0">${esc(t)}</textarea>`); document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); M.toast('✓ Resumen copiado'); } }
  const jspdf = () => loadScript((document.querySelector('script[src*="placement.js"]').getAttribute('src') || '').replace(/placement\.js.*$/, '') + 'jspdf.min.js', () => !!window.jspdf).then(ok => ok || loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', () => !!window.jspdf));
  function logoData(src) { return new Promise(res => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; c.getContext('2d').drawImage(i, 0, 0); try { res(c.toDataURL('image/png')); } catch (e) { res(null); } }; i.onerror = () => res(null); i.src = src || 'mra-logo-cert.png'; }); }
  async function reportPDF() {
    if (!(await jspdf())) return M.toast('No se pudo cargar el generador de PDF. Revisa tu conexión.');
    const r = last_; const m = P.mod(r.ms.rec); const { jsPDF } = window.jspdf; const d = new jsPDF({ unit: 'pt', format: 'a4' });
    d.setFillColor(11, 42, 91); d.rect(0, 0, 595, 90, 'F'); d.setFillColor(227, 36, 43); d.rect(0, 90, 595, 6, 'F');
    const logo = await logoData(); if (logo) d.addImage(logo, 'PNG', 455, 14, 110, 64);
    d.setTextColor(255, 255, 255); d.setFont('helvetica', 'bold'); d.setFontSize(18); d.text('Reporte del Examen de Clasificación', 40, 44);
    d.setFontSize(11); d.setFont('helvetica', 'normal'); d.text('Placement Test — mrarrieta.com', 40, 66);
    let y = 130; d.setTextColor(17, 17, 17); d.setFont('helvetica', 'bold'); d.setFontSize(13); d.text('Estudiante: ' + r.name, 40, y); y += 22;
    d.setFont('helvetica', 'normal'); d.setFontSize(11);
    [`Fecha: ${r.date.toLocaleDateString()}   Hora: ${r.date.toLocaleTimeString()}`, 'Intento: ' + r.attemptLabel, 'Correo: ' + (r.temail || '—'), 'WhatsApp: ' + (r.wa || '—')].forEach(t => { d.text(t, 40, y); y += 18; }); y += 12;
    d.setFont('helvetica', 'bold'); d.setFontSize(15); d.text(`Módulo recomendado: ${m.name} — ${m.es}`, 40, y); y += 26;
    d.setFontSize(12); d.text('Dominio por módulo (Listening + Reading + Writing)', 40, y); y += 20; d.setFont('helvetica', 'normal'); d.setFontSize(11);
    [1, 2, 3, 4].forEach(k => { const x = r.ms.mods[k]; d.text(`${P.mod(k).name} (${P.mod(k).es}): ${Math.round(x.pct * 100)}%  (${x.c}/${x.t})${x.ok ? '  — dominado' : ''}`, 50, y); y += 18; }); y += 12;
    d.setFont('helvetica', 'bold'); d.setFontSize(12); d.text('Resultados por habilidad (referencia)', 40, y); y += 20; d.setFont('helvetica', 'normal'); d.setFontSize(11);
    Object.keys(r.per).forEach(k => { d.text(`${NAMES[k]}: ${r.per[k].score.toFixed(1)} / 10.0  (${r.per[k].c}/${r.per[k].t})`, 50, y); y += 18; }); y += 14;
    d.setFont('helvetica', 'bold'); d.setFontSize(12); d.text('Comentario', 40, y); y += 18; d.setFont('helvetica', 'normal'); d.setFontSize(11);
    const w = d.splitTextToSize(comment(r.per, r.ms), 515); d.text(w, 40, y); y += w.length * 14 + 20;
    d.setDrawColor(150); d.line(40, y, 555, y); y += 18; d.setFontSize(9); d.setTextColor(120); d.text('mrarrieta.com — ¡Aprende inglés HABLANDO!', 40, y);
    d.save('Reporte_Examen_Clasificacion_' + r.name.replace(/\s+/g, '_') + '.pdf');
  }
  function locked() {
    stopTimer();
    const msg = encodeURIComponent(`Hola 👋 Soy ${name()}. Usé mis ${CFG.ATTEMPTS} intentos del examen de clasificación y quiero solicitar una oportunidad adicional.`);
    shell(`${top()}<div class="card center fx-form">${M.mascot('mascot', 'watch')}<h2>🔒 Sin intentos disponibles</h2>
      <p class="muted">Ya usaste tus ${maxAttempts()} intentos del examen de clasificación. Para un intento adicional, <b>pide un código a administración</b>.</p>
      <a class="btn" style="text-decoration:none;background:#25D366;color:#fff" target="_blank" rel="noopener" href="https://wa.me/${C.WHATSAPP}?text=${msg}">💬 Solicitar otra oportunidad</a>
      <label style="margin-top:16px">Código</label><input class="inp" id="code" placeholder="Ej: EXAMEN-LAURA" style="text-transform:uppercase">
      <div class="actionbar" style="justify-content:center"><button class="btn w" id="hm">👤 Mi perfil</button><button class="btn k lg" id="ok">Desbloquear intento</button></div></div>`);
    wireExit(); $('#hm').onclick = () => ctx.route('home');
    $('#ok').onclick = () => { const v = $('#code').value.trim(); const hsh = M.codeHash('EXAM:' + v.toUpperCase()); const list = (C.EXAM_RETRY_CODES || []).map(x => x.hash || x);
      if (!v || !list.includes(hsh)) { $('#code').classList.add('wrong'); M.toast('Código incorrecto 🙏'); return; }
      if (ST.used.includes(hsh)) { M.toast('Ese código ya se usó en este dispositivo.'); return; }
      ST.used.push(hsh); ST.extra = (ST.extra || 0) + 1; ST.prog = null; persist(); sfx('win'); M.toast('✓ Intento adicional desbloqueado'); run(app, ctx); };
  }
  const status = () => { const s = load(); return { attempts: s.attempts || 0, max: CFG.ATTEMPTS + (s.extra || 0), inProgress: !!(s.prog && s.prog.startedAt) }; };
  window.MRAPLACE = { run, status };
})();
