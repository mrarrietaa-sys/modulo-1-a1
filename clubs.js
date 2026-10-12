/* =====================================================================
   CLUBS PREMIUM — Club de Conversación ("Studio 6") + Club de Fonética
   mrarrieta.com · window.MRCLUB
   - MRCLUB.render(el, opts)  → vista del ESTUDIANTE (kit, temporada, pasaporte)
   - MRCLUB.guide(el, opts)   → vista del PROFESOR del club (guía completa)
   - MRCLUB.weekOf(start)     → número de sesión (1..24) de hoy
   Datos: window.MRCLUBDATA.conv / .fon (js/clubdata_conv.js, js/clubdata_fon.js)
   Audio: window.AUD (js/audio/clubconv.js …) o audio/<id>.mp3
   ===================================================================== */
(function () {
  'use strict';
  const ME = document.currentScript && document.currentScript.getAttribute('src') || 'js/clubs.js';
  const BASE = ME.replace(/clubs\.js(\?.*)?$/, '');
  const TZ = -5;                    // hora Colombia (UTC-5, sin horario de verano)
  const H = 3600e3, DAY = 864e5, WEEK = 7 * DAY, LEN = 60 * 60e3;   // sesión de 60 min
  const DEFAULT_START = '2026-10-12';
  const DOW = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };
  const DAYN = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MON = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DEF = { a: { fon: ['Lunes', '18:00'], conv: ['Miércoles', '18:00'] }, b: { fon: ['Lunes', '19:00'], conv: ['Miércoles', '19:00'] } };
  const BAND = { a: 'A1·A2', b: 'B2·B2+' };
  const META = {
    conv: { icon: '🎙️', name: 'Club de Conversación', what: 'Practica en voz alta lo que aprendes en tus clases, en formato talk show.', ep: 'Episodio', pack: 'clubconv' },
    fon: { icon: '👄', name: 'Club de Fonética', what: 'Entrena tu oído y tu boca: pronuncia como un americano, sonido por sonido.', ep: 'Sesión', pack: 'clubfon' },
  };
  const KIND = {
    icebreaker: ['🎬', 'Cold Open'], hotseat: ['🔥', 'Hot Seat'], roleplay: ['🎭', 'Plot Twist'], storydice: ['🎲', 'Story Dice'],
    debate: ['🛋️', 'Couch Debate'], gamechat: ['🎯', 'Game Show'], reflect: ['🌙', 'Closing'],
  };
  const LEVELS = [[0, '🌱 Rookie'], [6, '⭐ Regular'], [12, '🌟 Star'], [18, '👑 Legend']];

  /* ---------------- utilidades ---------------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const data = key => (window.MRCLUBDATA || {})[key] || null;
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  function startMs(start) {   // medianoche (hora Colombia) del día de inicio, en ms UTC
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(start || DEFAULT_START) || /^(\d{4})-(\d{2})-(\d{2})/.exec(DEFAULT_START);
    return Date.UTC(+m[1], m[2] - 1, +m[3]) - TZ * H;
  }
  function info(start, now) {
    now = now || Date.now(); const s0 = startMs(start);
    const diff = Math.floor((now - s0) / DAY);
    if (diff < 0) return { n: 1, season: 1, before: true, s0, weekStart: s0 };
    const w = Math.floor(diff / 7);
    return { n: (w % 24) + 1, season: Math.floor(w / 24) + 1, before: false, s0, weekStart: s0 + w * WEEK };
  }
  function weekOf(start) { return info(start).n; }
  function parseTime(t) { const m = /(\d{1,2}):(\d{2})/.exec(t || '18:00') || [0, 18, 0]; return (+m[1]) * H + (+m[2]) * 60e3; }
  function dowOf(ms) { return new Date(ms + TZ * H).getUTCDay(); }
  // inicio de la sesión de una semana dada (weekStart = medianoche Colombia del primer día de esa semana del club)
  function sessionAt(weekStart, club) {
    const d = DOW[norm(club.day)]; const off = d == null ? 0 : (d - dowOf(weekStart) + 7) % 7;
    return weekStart + off * DAY + parseTime(club.time);
  }
  function nextSession(club, now) {
    now = now || Date.now(); const I = info(club.start, now);
    let t = sessionAt(I.weekStart, club);
    while (t + LEN <= now) t += WEEK;
    return { t, live: now >= t && now < t + LEN };
  }
  function fmtDate(ms, withDow = true) { const d = new Date(ms + TZ * H); return (withDow ? DAYN[d.getUTCDay()] + ' ' : '') + d.getUTCDate() + ' de ' + MON[d.getUTCMonth()]; }
  function fmtTime(t) { const ms = parseTime(t); let h = Math.floor(ms / H), m = Math.round(ms % H / 60e3); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + ':' + String(m).padStart(2, '0') + ' ' + ap; }
  function fmtLeft(ms) {
    const m = Math.max(1, Math.round(ms / 60e3)), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), mm = m % 60;
    return d ? d + ' d ' + h + ' h' : h ? h + ' h ' + mm + ' min' : mm + ' min';
  }
  function clubCfg(opts, key) {
    const band = opts.band === 'b' ? 'b' : 'a';
    const c = (opts.clubs || []).find(x => x && x.key === key) || {};
    return { key, day: c.day || DEF[band][key][0], time: c.time || DEF[band][key][1], link: c.link || '', teacher: c.teacher || '', start: c.start || DEFAULT_START };
  }
  function lsKey(key, band) { return 'mra_club_' + key + '_' + band; }
  function load(key, band) { try { const o = JSON.parse(localStorage.getItem(lsKey(key, band)) || 'null'); if (o && typeof o === 'object') { o.stamps = o.stamps || {}; return o; } } catch (e) { } return { stamps: {} }; }
  function store(key, band, o) { try { localStorage.setItem(lsKey(key, band), JSON.stringify(o)); } catch (e) { } }
  function level(n) { let l = LEVELS[0][1]; LEVELS.forEach(([k, v]) => { if (n >= k) l = v; }); return l; }
  function kindOf(k) { return KIND[k] || ['✨', String(k || 'Actividad').replace(/^\w/, c => c.toUpperCase())]; }

  function toast(msg) {
    let t = document.getElementById('cl-toast');
    if (!t) { t = document.createElement('div'); t.id = 'cl-toast'; t.className = 'cl-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600);
  }

  /* ---------------- audio ---------------- */
  const packs = {};
  function loadPack(name) {
    if (packs[name]) return packs[name];
    return packs[name] = new Promise(res => { const tryP = (paths) => { if (!paths.length) return res(); const s = document.createElement('script'); s.src = paths[0]; s.onload = res; s.onerror = () => { s.remove(); tryP(paths.slice(1)); }; document.head.appendChild(s); }; tryP([BASE + 'audio/' + name + '.js', BASE + name + '.js']); });
  }
  function ensureAudio(key) {
    const d = data(key); if (!d) return;
    const any = ((d.a || d.b || {}).sessions || [])[0]; const au = any && any.kit && any.kit[0] && any.kit[0].au;
    if (au && !(window.AUD && window.AUD[au])) loadPack(META[key].pack);
  }
  let cur = null, curBtn = null;
  function srcOf(au) { if (window.M1 && M1.audioSrc) return M1.audioSrc(au); return window.AUD && AUD[au] ? 'data:audio/mpeg;base64,' + AUD[au] : 'audio/' + au + '.mp3'; }
  function stopAudio() { if (cur) { cur.pause(); cur = null; } if (curBtn) { curBtn.classList.remove('playing'); curBtn = null; } if (window.speechSynthesis) speechSynthesis.cancel(); }
  function play(au, btn) {
    if (!au) return Promise.resolve();
    if (window.M1 && M1.play) return M1.play(au, { btn });
    stopAudio();
    return new Promise(res => {
      const a = new Audio(srcOf(au)); cur = a; if (btn) { curBtn = btn; btn.classList.add('playing'); }
      const end = () => { if (btn) btn.classList.remove('playing'); if (cur === a) cur = null; res(); };
      a.onended = end; a.onerror = end; a.play().catch(end);
    });
  }
  function say(text) {   // voz del navegador (respaldo)
    return new Promise(res => {
      if (!window.speechSynthesis) return res();
      const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.95;
      const v = speechSynthesis.getVoices().find(v => /en[-_]US/i.test(v.lang)); if (v) u.voice = v;
      u.onend = u.onerror = res; speechSynthesis.cancel(); speechSynthesis.speak(u); setTimeout(res, 4000);
    });
  }
  function voice(kind) {
    const V = (window.MRCLUBDATA || {}).voice || {}; const T = { great: 'Great job!', almost: 'Almost! Try again.', again: "Let's try again." };
    if (V[kind] && window.AUD && AUD[V[kind]]) return play(V[kind]);
    return say(T[kind]);
  }

  /* ---------------- 🎤 repetir: grabar + reconocer + comparar ---------------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const NUM = { zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10', twelve: '12', twenty: '20', thirty: '30', fifty: '50', hundred: '100' };
  const CON = { "i'm": 'i am', "you're": 'you are', "it's": 'it is', "that's": 'that is', "don't": 'do not', "can't": 'can not', "i'd": 'i would', "i'll": 'i will', "let's": 'let us', "what's": 'what is', "there's": 'there is', "we're": 'we are', "isn't": 'is not', "didn't": 'did not', "won't": 'will not', "i've": 'i have', "you've": 'you have', "he's": 'he is', "she's": 'she is', "they're": 'they are' };
  function words(s) { return String(s).toLowerCase().replace(/[’`´]/g, "'").replace(/[^a-z0-9'\s]/g, ' ').split(/\s+/).filter(Boolean).flatMap(w => (CON[w] || w).split(' ')).map(w => NUM[w] || w.replace(/'/g, '')); }
  function lev(a, b) { const m = a.length, n = b.length; if (!m || !n) return m || n; let p = Array.from({ length: n + 1 }, (_, i) => i); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
  function score(target, alts) {
    const tw = words(target); let best = { pct: 0, heard: '', hit: [] };
    (alts || []).forEach(alt => {
      const pool = words(alt); const hit = tw.map(w => { const i = pool.findIndex(x => x === w || (w.length > 3 && lev(x, w) <= 1)); if (i >= 0) { pool.splice(i, 1); return true; } return false; });
      const pct = tw.length ? Math.round(hit.filter(Boolean).length / tw.length * 100) : 0;
      if (pct > best.pct || !best.heard) best = { pct, heard: alt, hit };
    });
    return best;
  }
  function listen(ms) {
    return new Promise(res => {
      const r = new SR(); r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
      let done = false; const fin = o => { if (done) return; done = true; try { r.stop(); } catch (e) { } res(o); };
      r.onresult = e => { const alts = []; for (const x of e.results) for (let i = 0; i < x.length; i++) alts.push(x[i].transcript); fin({ alts }); };
      r.onerror = e => fin({ alts: [], error: e.error }); r.onend = () => fin({ alts: [] });
      try { r.start(); } catch (e) { fin({ alts: [], error: 'start' }); }
      setTimeout(() => fin({ alts: [], error: 'timeout' }), ms);
    });
  }
  let busy = false;
  async function practice(text, btn, box) {
    if (busy) return; busy = true; stopAudio();
    const ms = Math.min(9000, 2600 + words(text).length * 420);
    let stream = null, rec = null; const chunks = [];
    try { if ((typeof SR !== 'undefined' && SR) && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) throw 0; // en celular el micrófono no se puede compartir: se prioriza el reconocimiento de voz
      stream = await navigator.mediaDevices.getUserMedia({ audio: true }); rec = new MediaRecorder(stream); rec.ondataavailable = e => e.data && e.data.size && chunks.push(e.data); rec.start(); }
    catch (e) { if (!SR) { box.innerHTML = '<div class="cl-fb bad">🎙️ No pudimos usar tu micrófono. Revisa el permiso del navegador e inténtalo otra vez.</div>'; busy = false; return; } }
    btn.classList.add('rec'); btn.innerHTML = '<span class="cl-dot"></span> Habla ahora…';
    box.innerHTML = '<div class="cl-fb">🎙️ Di en voz alta: <b>' + esc(text) + '</b><div class="cl-bar"><i style="animation-duration:' + ms + 'ms"></i></div></div>';
    let r = { alts: [] }; const t0 = Date.now();
    if (SR) { r = await listen(ms); if (Date.now() - t0 < 1500 && !r.alts.length) await sleep(Math.max(0, ms - (Date.now() - t0))); }
    else await sleep(ms);
    await sleep(200);
    let url = null;
    if (rec) { const p = new Promise(x => rec.onstop = x); try { rec.stop(); } catch (e) { } await p; stream.getTracks().forEach(t => t.stop()); if (chunks.length) url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })); }
    btn.classList.remove('rec'); btn.innerHTML = '🎤 Repetir';
    const mine = url ? '<button type="button" class="btn sm w cl-mine">🔁 Escuchar mi voz</button>' : '';
    if (SR && !['not-allowed', 'service-not-allowed', 'start', 'network', 'audio-capture', 'language-not-supported'].includes(r.error)) {
      const sc = score(text, r.alts); const tw = text.split(/\s+/);
      let cls, msg, v;
      if (sc.pct >= 80) { cls = 'ok'; msg = '🎉 Great job! ¡Excelente pronunciación!'; v = 'great'; }
      else if (sc.pct >= 50) { cls = 'mid'; msg = '💪 Almost! ¡Casi! Escucha otra vez y repite.'; v = 'almost'; }
      else { cls = 'bad'; msg = sc.heard ? '🔁 Try again. Escucha el audio y repite despacio.' : '🤔 No te escuché bien. Acércate al micrófono e inténtalo otra vez.'; v = 'again'; }
      const hw = words(sc.heard || '');
      const ok = w => words(w).every(x => hw.some(y => y === x || (x.length > 3 && lev(x, y) <= 1)));
      const marked = sc.heard ? tw.map(w => '<span class="' + (ok(w) ? 'hit' : 'miss') + '">' + esc(w) + '</span>').join(' ') : '';
      box.innerHTML = '<div class="cl-fb ' + cls + '"><b>' + msg + '</b>' + (sc.heard ? '<div class="cl-heard">Escuché: “' + esc(sc.heard) + '” · ' + sc.pct + '%</div><div class="cl-marked">' + marked + '</div>' : '') + (mine ? '<div class="row">' + mine + '</div>' : '') + '</div>';
      voice(v);
    } else {
      box.innerHTML = '<div class="cl-fb mid"><b>🎧 Compara tu voz con el audio original.</b><div class="cl-heard">Tu navegador no puede evaluar la pronunciación, pero sí puedes escucharte.</div><div class="row">' + mine + '</div></div>';
      if (url) new Audio(url).play().catch(() => { });
    }
    const mb = box.querySelector('.cl-mine'); if (mb && url) mb.onclick = () => { stopAudio(); new Audio(url).play().catch(() => { }); };
    busy = false;
  }

  /* ---------------- piezas de interfaz ---------------- */
  function phrase(it, opt = {}) {
    return '<div class="cl-ph' + (opt.big ? ' big' : '') + '"><div class="cl-ph-t"><b>' + esc(it.en) + '</b><span>' + esc(it.es) + '</span></div>' +
      '<div class="cl-ph-b"><button type="button" class="cl-play" data-au="' + esc(it.au || '') + '" aria-label="Escuchar">▶</button>' +
      (opt.rec ? '<button type="button" class="btn sm w cl-rec" data-say="' + esc(it.en) + '">🎤 Repetir</button>' : '') + '</div>' +
      (opt.rec ? '<div class="cl-fbbox"></div>' : '') + '</div>';
  }
  function blockHTML(b, i, teacherView) {
    const [ic, lab] = kindOf(b.kind);
    return '<li class="cl-blk cl-kd-' + esc(b.kind) + '"><div class="cl-blk-h"><span class="cl-kind">' + ic + ' ' + esc(lab) + '</span><span class="cl-min">⏱ ' + (+b.mins || 0) + ' min</span></div>' +
      '<h4>' + esc(b.title) + '</h4><div class="cl-es">' + esc(b.es) + '</div>' +
      '<p class="cl-ins">' + esc(b.ins) + '</p>' +
      ((b.items || []).length ? '<div class="cl-items">' + b.items.map(it => phrase(it)).join('') + '</div>' : '') + '</li>';
  }
  function bind(root) {
    root.addEventListener('click', e => {
      const p = e.target.closest('.cl-play'); if (p && root.contains(p)) { e.preventDefault(); if (p.classList.contains('playing')) { stopAudio(); if (window.M1 && M1.stop) M1.stop(); return; } play(p.dataset.au, p); return; }
      const r = e.target.closest('.cl-rec'); if (r && root.contains(r)) { e.preventDefault(); practice(r.dataset.say, r, r.closest('.cl-ph').querySelector('.cl-fbbox')); return; }
    });
  }
  let timer = null;
  function tick(root) {
    clearInterval(timer);
    const upd = () => {
      if (!root.isConnected) { clearInterval(timer); return; }
      root.querySelectorAll('[data-cd]').forEach(n => {
        const c = JSON.parse(n.dataset.cd); const ns = nextSession(c);
        n.classList.toggle('live', ns.live);
        n.innerHTML = ns.live ? '<span class="cl-dot"></span> ¡EN VIVO AHORA! Entra ya' : '⏳ Próxima sesión en <b>' + fmtLeft(ns.t - Date.now()) + '</b> · ' + fmtDate(ns.t);
      });
    };
    upd(); timer = setInterval(upd, 30e3);
  }
  function enterBtn(c, big) {
    return c.link ? '<a class="btn ' + (big ? 'lg ' : '') + 'cl-enter" href="' + esc(c.link) + '" target="_blank" rel="noopener">🚪 Entrar al club</a>'
      : '<div class="cl-nolink">🔗 El enlace aparecerá aquí antes de la sesión.</div>';
  }
  function cdAttr(c) { return esc(JSON.stringify({ day: c.day, time: c.time, start: c.start })); }

  /* =================== VISTA DEL ESTUDIANTE =================== */
  function render(el, opts) {
    opts = opts || {}; const band = opts.band === 'b' ? 'b' : 'a';
    const S = { el, opts, band, view: 'hub', key: null, tab: 'ep', sel: null };
    el.innerHTML = ''; const root = document.createElement('div'); root.className = 'cl-root'; el.appendChild(root); bind(root);
    S.root = root;
    if (!opts.premium) { showcase(S); return S; }
    hub(S); return S;
  }

  function hub(S) {
    const { root, opts, band } = S; S.view = 'hub'; stopAudio();
    const cards = ['conv', 'fon'].map(key => {
      const d = data(key), m = META[key], c = clubCfg(opts, key), I = info(c.start), st = load(key, band);
      const s = d && d[band] && d[band].sessions ? d[band].sessions[I.n - 1] : null;
      const nst = Object.keys(st.stamps).length;
      return '<article class="cl-card cl-c-' + key + '">' +
        '<div class="cl-card-top"><span class="cl-ic">' + m.icon + '</span><div><div class="cl-cname">' + esc(m.name) + '</div><div class="cl-brand">' + esc(d ? d.brand : 'Próximamente') + '</div></div></div>' +
        '<p class="cl-what">' + esc(m.what) + '</p>' +
        '<div class="cl-when">📅 <b>' + esc(c.day) + ' · ' + fmtTime(c.time) + '</b> <span>(hora Colombia)</span>' + (c.teacher ? '<br>👩‍🏫 Profe: <b>' + esc(c.teacher) + '</b>' : '') + '</div>' +
        '<div class="cl-count" data-cd="' + cdAttr(c) + '"></div>' +
        (s ? '<button type="button" class="cl-tease" data-open="' + key + '"><span class="cl-tease-l">ESTA SEMANA · ' + m.ep.toUpperCase() + ' ' + s.n + ' DE 24</span><span class="cl-tease-t">' + esc(s.emoji) + ' ' + esc(s.title) + '</span><span class="cl-tease-s">' + esc(s.es) + '</span></button>'
          : '<div class="cl-soon">🛠️ Próximamente: estamos preparando la temporada de este club.</div>') +
        '<div class="cl-acts">' + enterBtn(c) + (d ? '<button type="button" class="btn w" data-open="' + key + '">🎧 Abrir mi kit</button>' : '') + '</div>' +
        '<div class="cl-mini">🎟️ Pasaporte: <b>' + nst + '</b> sello' + (nst === 1 ? '' : 's') + ' · ' + level(nst) + '</div>' +
        '</article>';
    }).join('');
    root.innerHTML =
      (opts.back ? '<button type="button" class="btn sm w cl-back" data-back>← Volver</button>' : '') +
      '<header class="cl-hero"><span class="cl-onair"><span class="cl-dot"></span> ON AIR</span>' +
      '<h1>Tus clubs en vivo</h1><p>Hola' + (opts.name ? ', <b>' + esc(opts.name) + '</b>' : '') + ' 👋 Aquí no hay clase: hay <b>show</b>. Cada semana te espera una sesión en vivo diferente con el profe del club. Tu banda: <span class="cl-band">' + BAND[band] + '</span></p></header>' +
      '<div class="cl-grid">' + cards + '</div>' +
      '<section class="cl-how"><h3>¿Cómo se vive un club?</h3><ol>' +
      '<li><b>🎧 Antes:</b> abre tu kit y escucha las frases del episodio. Repítelas con 🎤.</li>' +
      '<li><b>🚪 Durante:</b> entra a la videollamada a la hora del club. ¡Cámara y micrófono listos!</li>' +
      '<li><b>🏆 Después:</b> haz el reto de la semana y marca tu sello en el pasaporte.</li></ol></section>';
    root.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { S.key = b.dataset.open; S.sel = null; S.tab = 'ep'; club(S); });
    const bk = root.querySelector('[data-back]'); if (bk) bk.onclick = () => { stopAudio(); opts.back(); };
    tick(root);
  }

  function club(S) {
    const { root, opts, band, key } = S; S.view = 'club'; stopAudio(); ensureAudio(key);
    const d = data(key), m = META[key], c = clubCfg(opts, key), I = info(c.start), B = d[band];
    if (!B || !B.sessions || !B.sessions.length) { hub(S); return; }
    const sel = S.sel || I.n; const s = B.sessions[sel - 1];
    const tabs = [['ep', '📺 ' + m.ep], ['kit', '🎧 Kit'], ['map', '🗺️ Temporada'], ['pass', '🎟️ Pasaporte']];
    root.innerHTML =
      '<button type="button" class="btn sm w cl-back" data-hub>← Mis clubs</button>' +
      '<header class="cl-stage cl-c-' + key + '"><div class="cl-stage-in">' +
      '<span class="cl-onair"><span class="cl-dot"></span> ' + (key === 'conv' ? 'LIVE SHOW' : 'LIVE LAB') + '</span>' +
      '<h1>' + esc(d.brand) + '</h1><p class="cl-tag">' + esc(d.tagline && d.tagline.es || '') + '</p>' +
      '<div class="cl-season">' + esc(B.season ? B.season.en : '') + ' · Banda ' + BAND[band] + (I.season > 1 ? ' · vuelta ' + I.season : '') + '</div>' +
      '<div class="cl-when inv">📅 <b>' + esc(c.day) + ' · ' + fmtTime(c.time) + '</b> (hora Colombia)' + (c.teacher ? ' · Profe ' + esc(c.teacher) : '') + '</div>' +
      '<div class="cl-count" data-cd="' + cdAttr(c) + '"></div>' + enterBtn(c, true) +
      (I.before ? '<div class="cl-before">🚀 La temporada empieza el ' + fmtDate(I.s0) + '. ¡Ve calentando con el kit del episodio 1!</div>' : '') +
      '</div></header>' +
      '<nav class="cl-tabs" role="tablist">' + tabs.map(([k, l]) => '<button type="button" role="tab" class="cl-tab' + (S.tab === k ? ' on' : '') + '" data-tab="' + k + '">' + l + '</button>').join('') + '</nav>' +
      '<div class="cl-pane"></div>';
    root.querySelector('[data-hub]').onclick = () => hub(S);
    root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { S.tab = b.dataset.tab; club(S); const t = root.querySelector('.cl-tabs'); if (t && t.getBoundingClientRect().top < 0) t.scrollIntoView({ block: 'start' }); });
    const pane = root.querySelector('.cl-pane');
    if (S.tab === 'ep') paneEp(S, pane, B, s, I, c);
    else if (S.tab === 'kit') paneKit(S, pane, s, I);
    else if (S.tab === 'map') paneMap(S, pane, B, I, c);
    else panePass(S, pane, B, I, c);
    tick(root);
  }

  function unitOf(B, s) { return (B.units || []).find(u => u.n === s.unit) || { n: s.unit, title: '', es: '', emoji: '' }; }
  function stampBox(S, s, I, c) {
    const st = load(S.key, S.band); const has = st.stamps[s.n];
    if (has) return '<div class="cl-stampok"><span class="cl-stamp on sm">' + esc(s.emoji) + '</span><div><b>¡Sello guardado!</b><br>Asististe el ' + esc(has) + '. 🎉</div></div>';
    const sessT = sessionAt(I.weekStart, c), open = !I.before && Date.now() >= sessT;
    return '<div class="cl-stampbox"><button type="button" class="btn lg block ok" data-stamp ' + (open ? '' : 'disabled') + '>Asistí a esta sesión ✅</button>' +
      '<div class="cl-sub">' + (open ? 'Toca el botón cuando termines la sesión en vivo y gana tu sello en el pasaporte.' : 'Se activa cuando empiece la sesión: ' + fmtDate(sessT) + ', ' + fmtTime(c.time) + '.') + '</div></div>';
  }
  function paneEp(S, pane, B, s, I, c) {
    const m = META[S.key], u = unitOf(B, s), isNow = s.n === I.n, mins = s.blocks.reduce((a, b) => a + (+b.mins || 0), 0);
    pane.innerHTML =
      (!isNow ? '<div class="cl-review">⏪ Estás repasando un ' + m.ep.toLowerCase() + ' anterior. <button type="button" class="btn sm k" data-now>Ir a esta semana</button></div>' : '') +
      '<section class="cl-ep">' +
      '<div class="cl-ep-k">' + (isNow ? '<span class="cl-now">ESTA SEMANA</span>' : '') + m.ep + ' ' + s.n + ' de 24 · Unidad ' + u.n + ': ' + esc(u.title) + ' ' + esc(u.emoji) + '</div>' +
      '<div class="cl-ep-h"><span class="cl-ep-emo">' + esc(s.emoji) + '</span><div><h2>' + esc(s.title) + '</h2><div class="cl-es">' + esc(s.es) + '</div></div></div>' +
      '<div class="cl-mission"><div class="cl-lbl">🎯 Misión de hoy</div><b>' + esc(s.mission.en) + '</b><span>' + esc(s.mission.es) + '</span></div>' +
      '<div class="cl-goal"><div class="cl-lbl">🏁 Al final podrás…</div><span>' + esc(s.goal.es) + '</span><i>' + esc(s.goal.en) + '</i></div>' +
      '</section>' +
      '<section class="cl-sec"><div class="cl-sec-h"><h3>🎬 Así será el show</h3><span class="pill y">' + mins + ' min · ' + s.blocks.length + ' estaciones</span></div>' +
      '<p class="muted cl-help">Cada estación es un juego diferente. Toca ▶ para escuchar las frases que vas a usar.</p>' +
      '<ol class="cl-run">' + s.blocks.map((b, i) => blockHTML(b, i)).join('') + '</ol></section>' +
      '<button type="button" class="cl-kitcta" data-gokit><span>🎧</span><div><b>Practica tu kit: ' + s.kit.length + ' frases clave</b><br>Escúchalas y repítelas con el micrófono antes del show.</div><span>→</span></button>' +
      '<section class="cl-chal"><div class="cl-lbl">🏆 Reto de la semana</div><b>' + esc(s.challenge.en) + '</b><span>' + esc(s.challenge.es) + '</span></section>' +
      (isNow ? stampBox(S, s, I, c) : '');
    const nb = pane.querySelector('[data-now]'); if (nb) nb.onclick = () => { S.sel = null; club(S); };
    pane.querySelector('[data-gokit]').onclick = () => { S.tab = 'kit'; club(S); };
    const sb = pane.querySelector('[data-stamp]');
    if (sb) sb.onclick = () => {
      const st = load(S.key, S.band); st.stamps[s.n] = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' });
      store(S.key, S.band, st); toast('🎟️ ¡Sello ganado! ' + s.emoji + ' ' + s.title); club(S);
      const box = S.root.querySelector('.cl-stampok'); if (box) { box.classList.add('pop'); box.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      if (window.M1 && M1.confetti) try { M1.confetti(); } catch (e) { }
    };
  }
  function paneKit(S, pane, s, I) {
    const m = META[S.key];
    pane.innerHTML = '<section class="cl-sec"><div class="cl-sec-h"><h3>🎧 Kit · ' + m.ep + ' ' + s.n + ': ' + esc(s.title) + '</h3></div>' +
      '<p class="muted cl-help">1) Toca ▶ para escuchar. 2) Toca 🎤 y repite en voz alta: te diremos qué tal sonó. Practica antes y después del show.</p>' +
      '<div class="row cl-kitbar"><button type="button" class="btn k" data-all>▶ Escuchar todo</button>' + (s.n !== I.n ? '<button type="button" class="btn sm w" data-now>Kit de esta semana</button>' : '') + '</div>' +
      '<div class="cl-kit">' + s.kit.map(it => phrase(it, { rec: true, big: true })).join('') + '</div></section>' +
      '<section class="cl-chal"><div class="cl-lbl">🏆 Reto de la semana</div><b>' + esc(s.challenge.en) + '</b><span>' + esc(s.challenge.es) + '</span></section>';
    const nb = pane.querySelector('[data-now]'); if (nb) nb.onclick = () => { S.sel = null; club(S); };
    const all = pane.querySelector('[data-all]'); let on = false;
    all.onclick = async () => {
      if (on) { on = false; stopAudio(); if (window.M1 && M1.stop) M1.stop(); all.textContent = '▶ Escuchar todo'; return; }
      on = true; all.textContent = '⏹ Detener';
      const btns = [...pane.querySelectorAll('.cl-kit .cl-play')];
      for (const b of btns) { if (!on || !b.isConnected) break; b.closest('.cl-ph').classList.add('hl'); await play(b.dataset.au, b); b.closest('.cl-ph').classList.remove('hl'); await sleep(450); }
      on = false; if (all.isConnected) all.textContent = '▶ Escuchar todo';
    };
  }
  function paneMap(S, pane, B, I, c) {
    const st = load(S.key, S.band), m = META[S.key];
    const units = (B.units && B.units.length ? B.units : [...new Set(B.sessions.map(s => s.unit))].map(n => ({ n, title: 'Unit ' + n, es: '', emoji: '' })));
    pane.innerHTML = '<section class="cl-sec"><div class="cl-sec-h"><h3>🗺️ Mapa de la temporada</h3><span class="pill y">' + B.sessions.length + ' ' + m.ep.toLowerCase() + 's · 6 meses</span></div>' +
      '<p class="muted cl-help">Los ' + m.ep.toLowerCase() + 's pasados se pueden repasar. Los próximos se abren cada semana 🔒.</p>' +
      units.map(u => '<div class="cl-unit"><div class="cl-unit-h"><span>' + esc(u.emoji) + '</span><div><b>Unidad ' + u.n + ': ' + esc(u.title) + '</b><small>' + esc(u.es) + '</small></div></div><div class="cl-eps">' +
        B.sessions.filter(s => s.unit === u.n).map(s => {
          const state = I.before ? (s.n === 1 ? 'now' : 'lock') : s.n < I.n ? 'past' : s.n === I.n ? 'now' : 'lock';
          const stamped = st.stamps[s.n];
          const when = state === 'lock' ? fmtDate(sessionAt(I.s0 + ((I.season - 1) * 24 + s.n - 1) * WEEK, c), false) : '';
          return '<button type="button" class="cl-epx ' + state + (stamped ? ' stamped' : '') + '" data-ep="' + s.n + '" data-when="' + esc(when) + '">' +
            '<span class="cl-epx-n">' + s.n + '</span><span class="cl-epx-e">' + (state === 'lock' ? '🔒' : esc(s.emoji)) + '</span>' +
            '<span class="cl-epx-t">' + esc(s.title) + '</span><span class="cl-epx-s">' + (state === 'now' ? '● Esta semana' : state === 'lock' ? 'Se abre el ' + esc(when) : stamped ? '🎟️ Asististe' : 'Repasar') + '</span></button>';
        }).join('') + '</div></div>').join('') + '</section>';
    pane.querySelectorAll('[data-ep]').forEach(b => b.onclick = () => {
      if (b.classList.contains('lock')) { toast('🔒 Este ' + m.ep.toLowerCase() + ' se abre el ' + b.dataset.when + '. ¡Paciencia!'); return; }
      S.sel = +b.dataset.ep === I.n ? null : +b.dataset.ep; S.tab = 'ep'; club(S); S.root.scrollIntoView({ block: 'start' });
    });
  }
  function panePass(S, pane, B, I, c) {
    const st = load(S.key, S.band), n = Object.keys(st.stamps).length, m = META[S.key], d = data(S.key);
    const next = LEVELS.find(([k]) => k > n);
    pane.innerHTML = '<section class="cl-pass"><div class="cl-pass-cover"><div class="cl-pass-k">PASSPORT · ' + esc(d.brand) + '</div>' +
      '<div class="cl-pass-name">' + esc(S.opts.name || 'Miembro del club') + '</div><div class="cl-pass-lv">' + level(n) + '</div>' +
      '<div class="cl-pass-n"><b>' + n + '</b>/24 sellos</div>' +
      '<div class="cl-meter"><i style="width:' + Math.round(n / 24 * 100) + '%"></i></div>' +
      '<div class="cl-sub inv">' + (next ? 'Te faltan ' + (next[0] - n) + ' sello' + (next[0] - n === 1 ? '' : 's') + ' para ' + next[1] + '.' : '¡Leyenda del club! Completaste la temporada. 👑') + '</div></div>' +
      '<div class="cl-stamps">' + B.sessions.map(s => {
        const on = st.stamps[s.n];
        return '<div class="cl-slot' + (on ? ' on' : '') + (s.n === I.n ? ' cur' : '') + '" title="' + esc(s.title) + '"><span class="cl-stamp' + (on ? ' on' : '') + '">' + (on ? esc(s.emoji) : s.n) + '</span><small>' + (on ? esc(on) : esc(s.title)) + '</small></div>';
      }).join('') + '</div>' +
      '<p class="muted cl-help">Gana un sello por cada sesión en vivo a la que asistas: toca "Asistí a esta sesión ✅" en el ' + m.ep.toLowerCase() + ' de la semana. Tus sellos se guardan en tu perfil.</p></section>' +
      stampBox(S, B.sessions[I.n - 1], I, c);
    const sb = pane.querySelector('[data-stamp]');
    if (sb) sb.onclick = () => { const s = B.sessions[I.n - 1]; const o = load(S.key, S.band); o.stamps[s.n] = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' }); store(S.key, S.band, o); toast('🎟️ ¡Sello ganado! ' + s.emoji + ' ' + s.title); club(S); };
  }

  /* ---------------- vitrina (sin Premium) ---------------- */
  function showcase(S) {
    const { root, opts, band } = S;
    const wa = txt => (typeof opts.waLink === 'function' ? opts.waLink(txt) : 'https://wa.me/573017810841?text=' + encodeURIComponent(txt));
    const posters = ['conv', 'fon'].map(key => {
      const d = data(key), m = META[key], c = clubCfg(opts, key);
      const ss = d && d[band] ? d[band].sessions.slice(0, 4) : [];
      return '<article class="cl-poster cl-c-' + key + '"><div class="cl-poster-top"><span class="cl-ic">' + m.icon + '</span><div><div class="cl-cname">' + esc(m.name) + '</div><div class="cl-brand">' + esc(d ? d.brand : 'Próximamente') + '</div></div></div>' +
        '<p class="cl-what">' + esc(m.what) + '</p><div class="cl-when">📅 ' + esc(c.day) + ' · ' + fmtTime(c.time) + ' (hora Colombia)</div>' +
        (ss.length ? '<ul class="cl-peek">' + ss.map((s, i) => '<li class="' + (i > 1 ? 'blur' : '') + '">' + esc(s.emoji) + ' ' + esc(s.title) + '</li>').join('') + '<li class="cl-peek-more">🔒 +' + (d[band].sessions.length - 4) + ' más en la temporada</li></ul>' : '<div class="cl-soon">🛠️ Temporada en preparación.</div>') +
        '</article>';
    }).join('');
    root.innerHTML =
      (opts.back ? '<button type="button" class="btn sm w cl-back" data-back>← Volver</button>' : '') +
      '<header class="cl-hero lock"><span class="cl-onair lock">🔒 EXCLUSIVO PREMIUM</span><h1>Clubs en vivo: inglés en modo show</h1>' +
      '<p>Dos espacios en vivo cada semana, <b>diferentes a tus clases</b>: talk show, juegos, retos, sellos y premios de temporada. Banda ' + BAND[band] + '.</p></header>' +
      '<div class="cl-grid">' + posters + '</div>' +
      '<section class="cl-plan"><h3>💎 Plan Premium · $349.000/mes</h3><ul>' +
      '<li>✅ Toda la plataforma (todos los módulos)</li><li>✅ 4 clases grupales al mes + 2 clases VIP</li>' +
      '<li>✅ Club de Conversación en vivo cada semana</li><li>✅ Club de Fonética en vivo cada semana</li>' +
      '<li>✅ Kit con audio, retos semanales y pasaporte de sellos</li></ul>' +
      '<a class="btn lg block cl-wa" target="_blank" rel="noopener" href="' + esc(wa('Hola, quiero el plan Premium para entrar al Club de Conversación y al Club de Fonética 🎙️')) + '">💬 Quiero Premium</a>' +
      '<div class="cl-sub">Te respondemos por WhatsApp y activamos tu plan.</div></section>';
    const bk = root.querySelector('[data-back]'); if (bk) bk.onclick = () => opts.back();
  }

  /* =================== VISTA DEL PROFESOR =================== */
  function guide(el, opts) {
    opts = opts || {}; const key = opts.key === 'fon' ? 'fon' : 'conv', band = opts.band === 'b' ? 'b' : 'a';
    const d = data(key), m = META[key];
    el.innerHTML = ''; const root = document.createElement('div'); root.className = 'cl-root cl-guide'; el.appendChild(root); bind(root);
    if (!d || !d[band] || !d[band].sessions) { root.innerHTML = '<div class="cl-soon big">🛠️ ' + esc(m.name) + ': la temporada estará disponible próximamente.</div>'; return; }
    const B = d[band], I = info(opts.start);
    const units = B.units || [];
    root.innerHTML =
      '<header class="cl-stage cl-c-' + key + '"><div class="cl-stage-in"><span class="cl-onair">🎬 GUÍA DEL PROFESOR</span><h1>' + esc(d.brand) + '</h1>' +
      '<p class="cl-tag">' + esc(m.name) + ' · Banda ' + BAND[band] + ' · ' + esc(B.season ? B.season.es : '') + '</p>' +
      '<div class="cl-season">Esta semana: ' + m.ep + ' ' + I.n + ' de 24' + (I.before ? ' (la temporada empieza el ' + fmtDate(I.s0) + ')' : '') + '</div>' +
      '<div class="row"><button type="button" class="btn sm w" data-goto>⬇ Ir a esta semana</button><button type="button" class="btn sm w" data-print>🖨️ Imprimir</button><button type="button" class="btn sm w" data-openall>Abrir todo</button></div></div></header>' +
      '<section class="cl-how"><h3>Formato del show (60 min)</h3><p class="muted">Cada sesión es un "episodio" con estaciones cortas y dinámicas. Nada de tablero ni explicaciones largas: el profe es <b>presentador</b>, los estudiantes son los <b>invitados</b>. Usa salas pequeñas, cronómetro visible, marcador de puntos y giros sorpresa.</p>' +
      '<div class="cl-legend">' + Object.keys(KIND).map(k => '<span class="cl-kind">' + KIND[k][0] + ' ' + KIND[k][1] + '</span>').join('') + '</div></section>' +
      (units.length ? units : [{ n: 0 }]).map(u => '<section class="cl-gunit">' + (u.n ? '<h3 class="cl-gunit-h">' + esc(u.emoji) + ' Unidad ' + u.n + ': ' + esc(u.title) + ' <small>' + esc(u.es) + '</small></h3>' : '') +
        B.sessions.filter(s => !u.n || s.unit === u.n).map(s => {
          const mins = s.blocks.reduce((a, b) => a + (+b.mins || 0), 0), now = s.n === I.n;
          return '<details class="cl-gs' + (now ? ' now' : '') + '" id="cl-gs-' + s.n + '"' + (now ? ' open' : '') + '><summary><span class="cl-gs-n">' + s.n + '</span><span class="cl-gs-t"><b>' + esc(s.emoji) + ' ' + esc(s.title) + '</b><small>' + esc(s.es) + ' · ' + mins + ' min</small></span>' + (now ? '<span class="cl-now">ESTA SEMANA</span>' : '') + '</summary>' +
            '<div class="cl-gs-b"><div class="cl-mission"><div class="cl-lbl">🎯 Misión</div><b>' + esc(s.mission.en) + '</b><span>' + esc(s.mission.es) + '</span></div>' +
            '<div class="cl-goal"><div class="cl-lbl">🏁 Objetivo</div><span>' + esc(s.goal.es) + '</span><i>' + esc(s.goal.en) + '</i></div>' +
            '<h4 class="cl-gh">👣 Paso a paso</h4><ol class="cl-steps">' + (s.teacher || []).map(t => '<li>' + esc(t) + '</li>').join('') + '</ol>' +
            '<h4 class="cl-gh">🎬 Escaleta y frases</h4><ol class="cl-run">' + s.blocks.map((b, i) => blockHTML(b, i, true)).join('') + '</ol>' +
            '<h4 class="cl-gh">🎧 Kit del estudiante</h4><div class="cl-items">' + s.kit.map(it => phrase(it)).join('') + '</div>' +
            '<div class="cl-chal"><div class="cl-lbl">🏆 Reto de la semana</div><b>' + esc(s.challenge.en) + '</b><span>' + esc(s.challenge.es) + '</span></div></div></details>';
        }).join('') + '</section>').join('');
    ensureAudio(key);
    root.querySelector('[data-goto]').onclick = () => { const x = root.querySelector('#cl-gs-' + I.n); if (x) { x.open = true; x.scrollIntoView({ block: 'start', behavior: 'smooth' }); } };
    root.querySelector('[data-print]').onclick = () => { root.querySelectorAll('details').forEach(x => x.open = true); setTimeout(() => window.print(), 100); };
    const oa = root.querySelector('[data-openall]'); oa.onclick = () => { const all = [...root.querySelectorAll('details')]; const open = !all.every(x => x.open); all.forEach(x => x.open = open); oa.textContent = open ? 'Cerrar todo' : 'Abrir todo'; };
  }

  window.MRCLUB = { render, guide, weekOf, nextSession, info, version: 1 };
})();
