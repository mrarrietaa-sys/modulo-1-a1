/* =====================================================================
   CORE — utilidades, estado (progreso), audio, voz, UI común
   ===================================================================== */
(function () {
  const D = window.M1DATA, C = window.M1CONFIG;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (a, n) => shuffle(a).slice(0, n);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const today = () => new Date().toISOString().slice(0, 10);

  /* ---------- hash for access codes (same one admin.html uses) ---------- */
  function codeHash(code) {
    const s = 'mra-m1|' + String(code).trim().toUpperCase();
    let h1 = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h1 ^= s.charCodeAt(i); h1 = Math.imul(h1, 0x01000193) >>> 0; }
    let h2 = 5381;
    for (let i = 0; i < s.length; i++) { h2 = (Math.imul(h2, 33) + s.charCodeAt(i)) >>> 0; }
    return 'h' + h1.toString(36) + h2.toString(36).slice(0, 3);
  }

  /* ---------- state (local, cloud-ready: one JSON object) ---------- */
  const KEY = 'mra_m1_progress_v1';
  const fresh = () => ({ v: 1, name: '', created: Date.now(), xp: 0, streak: { last: '', n: 0 }, parts: {}, skills: { listening: [0, 0], reading: [0, 0], speaking: [0, 0], writing: [0, 0] }, weak: {}, unlocked: [], all: false, final: null, hw: {}, last: null, sound: true });
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
  function touchStreak() {
    const t = today(); if (S.streak.last === t) return;
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    S.streak.n = (S.streak.last === y) ? S.streak.n + 1 : 1; S.streak.last = t; save();
  }
  function addSkill(skill, c, t) { if (!skill || !S.skills[skill]) return; S.skills[skill][0] += c; S.skills[skill][1] += t; }
  function addWeak(w, au) { if (!w) return; const k = w; S.weak[k] = S.weak[k] || { n: 0, au }; S.weak[k].n++; if (au) S.weak[k].au = au; }
  function okWeak(w) { if (S.weak[w]) { S.weak[w].n--; if (S.weak[w].n <= 0) delete S.weak[w]; } }
  function skillPct(k) { const [c, t] = S.skills[k]; return t ? Math.round(c / t * 100) : 0; }

  /* ---------- access ---------- */
  // ACCESO (código pagado) + PROGRESO (los temas se abren en orden)
  const review = () => !!(C.UNLOCK_ALL || S.review);
  const partDone = (id) => !!(S.parts[id] && S.parts[id].done);
  function hasAccess(n) { return review() || S.all || (C.FREE_TOPICS || []).includes(n) || S.unlocked.includes(n); }
  function progressOpen(n) { if (review() || n <= 1) return true; const prev = D.topics.find(t => t.n === n - 1); return !prev || prev.parts.every(p => partDone(p.id)); }
  function lockReason(n) { if (review()) return null; if (!progressOpen(n)) return 'progress'; if (!hasAccess(n)) return 'access'; return null; }
  function isUnlocked(topicN) { return !lockReason(topicN); }
  const doneCount = () => D.topics.reduce((a, t) => a + t.parts.filter(p => partDone(p.id)).length, 0);
  const totalParts = () => D.topics.reduce((a, t) => a + t.parts.length, 0);
  function finalUnlocked() { return review() || doneCount() === totalParts(); }
  function redeem(code) {
    const hh = codeHash(code);
    if ((C.REVIEW_CODES || []).includes(hh)) { S.review = true; save(); return { topics: 'all', review: true }; }
    const hit = (C.ACCESS_CODES || []).find(c => c.hash === hh);
    if (!hit) return false;
    if (hit.topics === 'all') S.all = true;
    else S.unlocked = [...new Set([...S.unlocked, ...hit.topics])];
    save(); return hit;
  }

  /* ---------- helpers on content ---------- */
  const allParts = () => D.topics.flatMap(t => t.parts.map(p => Object.assign(p, { _t: t })));
  const partById = (id) => allParts().find(p => p.id === id);
  function prevPart(p) { const a = allParts(); const i = a.findIndex(x => x.id === p.id); return i > 0 ? a[i - 1] : null; }
  function nextPart(p) { const a = allParts(); const i = a.findIndex(x => x.id === p.id); return a[i + 1] || null; }
  function partStars(id) { return (S.parts[id] && S.parts[id].stars) || 0; }
  function overallPct() { const a = allParts(); return Math.round(a.filter(p => S.parts[p.id] && S.parts[p.id].done).length / a.length * 100); }

  /* ---------- images ---------- */
  function imgURL(src, w = 640, hgt = 480) {
    if (!src) return '';
    if (src.startsWith('u:')) return `https://images.unsplash.com/${src.slice(2)}?w=${w}&h=${hgt}&fit=crop&crop=entropy&q=82&auto=format`;
    if (src.startsWith('flag:')) return `https://flagcdn.com/w1280/${src.slice(5)}.png`;
    return '';
  }
  function photo(src, opts = {}) {
    const badge = opts.badge ? `<span class="badge">${esc(opts.badge)}</span>` : '';
    if (src && src.startsWith('#')) {
      const t = src.slice(1); const fs = t.length <= 2 ? 'clamp(54px,12vw,96px)' : t.length <= 3 ? 'clamp(40px,9vw,72px)' : 'clamp(22px,5vw,38px)';
      return `<div class="ph ${opts.cls || ''}"><div class="tc ${opts.dark ? 'dark' : ''}" style="font-size:${fs}">${esc(t)}</div>${badge}</div>`;
    }
    const isFlag = src && src.startsWith('flag:');
    // alta resolución en celulares (pantallas retina): el navegador elige 640, 960 o 1280 px
    const set = isFlag ? '' : ` srcset="${imgURL(src, 640, 480)} 640w, ${imgURL(src, 960, 720)} 960w, ${imgURL(src, 1280, 960)} 1280w" sizes="(max-width:600px) 92vw, 460px"`;
    return `<div class="ph ${isFlag ? 'flag' : ''} ${opts.cls || ''}"><img loading="lazy" decoding="async" alt="${esc(opts.alt || '')}" src="${imgURL(src, 960, 720)}"${set} onerror="this.style.opacity=0">${badge}</div>`;
  }

  /* ---------- audio (natural neural voices pre-generated as MP3) ---------- */
  let cur = null, curBtn = null, curEnd = null; const ext = new Set();
  // botón global "Detener audio" (aparece cuando suena cualquier audio)
  let pill = null;
  function audioUI() {
        const on = !!cur || [...ext].some(a => !a.paused && !a.ended) || !!(window.speechSynthesis && speechSynthesis.speaking);
    if (pill) pill.classList.toggle('on', on);
  }
  function halt() {
    if (cur) { cur.pause(); cur = null; }
    if (curBtn) { curBtn.classList.remove('playing'); curBtn = null; }
    if (curEnd) { const e = curEnd; curEnd = null; e(); }
    ext.forEach(a => { a.pause(); a.dispatchEvent(new Event('ended')); }); ext.clear();
    if (window.speechSynthesis) speechSynthesis.cancel();
    audioUI();
  }
  // stop(): detiene TODO el audio y avisa a las secuencias ("Escuchar todo", diálogos, lecturas)
  function stop() { halt(); window.dispatchEvent(new Event('m1-audio-stop')); }
  // botón rojo flotante "Detener" que aparece solo mientras suena una secuencia larga y su botón original ya no se ve en pantalla
  function floatStop(btn) {
    let pill = document.getElementById('stop-float');
    if (!pill) { pill = document.createElement('button'); pill.id = 'stop-float'; pill.type = 'button'; pill.innerHTML = '⏹ Detener audio'; document.body.appendChild(pill); }
    pill.onclick = () => stop();
    let io = null; try { io = new IntersectionObserver(([en]) => pill.classList.toggle('on', !en.isIntersecting && btn.isConnected), { rootMargin: '-70px 0px 0px 0px' }); io.observe(btn); } catch (e) { }
    let off = false; const hide = () => { if (off) return; off = true; if (io) io.disconnect(); pill.classList.remove('on'); window.removeEventListener('m1-audio-stop', hide); };
    window.addEventListener('m1-audio-stop', hide);
    return hide;
  }
  function trackAudio(a) { ext.add(a); ['play', 'playing', 'pause'].forEach(ev => a.addEventListener(ev, audioUI)); a.addEventListener('ended', () => { ext.delete(a); audioUI(); }); audioUI(); return a; }
  function play(au, opts = {}) {
    halt();
    return new Promise(res => {
      if (!au) return res();
      const a = new Audio(audioSrc(au));
      a.playbackRate = opts.rate || 1; a.preservesPitch = true;
      cur = a; if (opts.btn) { curBtn = opts.btn; opts.btn.classList.add('playing'); }
      let done = false;
      const end = () => { if (done) return; done = true; if (opts.btn) opts.btn.classList.remove('playing'); if (cur === a) cur = null; if (curEnd === end) curEnd = null; audioUI(); res(); };
      curEnd = end;
      a.onended = end; a.onerror = end;
      a.play().then(audioUI).catch(end);
    });
  }
  // audio is packed in a few files (js/audio/*.js) so the folder is easy to upload to GitHub
  function loadAudio(groups) {
    window.__audLoaded = window.__audLoaded || {};
    return Promise.all(groups.filter(g => !window.__audLoaded[g]).map(g => new Promise(res => {
      // works both with folders (js/audio/t1.js) and with all files in one folder (t1.js)
      const base = (document.querySelector('script[src*="core.js"]').getAttribute('src') || '').replace(/core\.js(\?.*)?$/, '');
      const tryLoad = (paths) => { if (!paths.length) return res(); const sc = document.createElement('script'); sc.src = paths[0]; sc.onload = res; sc.onerror = () => { sc.remove(); tryLoad(paths.slice(1)); }; document.head.appendChild(sc); };
      tryLoad([base + 'audio/' + g + '.js', base + g + '.js']);
    })));
  }
  async function playSeq(list, gap = 250) { for (const au of list) { await play(au); await sleep(gap); } }
  // little UI sound effects (WebAudio, no files)
  let actx = null;
  function sfx(type) {
    if (!S.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = { ok: [[660, 0], [880, .09]], bad: [[220, 0], [180, .12]], tap: [[520, 0]], win: [[523, 0], [659, .12], [784, .24], [1046, .36]], flip: [[400, 0]] }[type] || [[440, 0]];
      notes.forEach(([f, t]) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type === 'bad' ? 'square' : 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(.0001, actx.currentTime + t); g.gain.exponentialRampToValueAtTime(type === 'bad' ? .06 : .14, actx.currentTime + t + .02);
        g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + t + (type === 'win' ? .35 : .18));
        o.connect(g).connect(actx.destination); o.start(actx.currentTime + t); o.stop(actx.currentTime + t + .4);
      });
    } catch (e) { }
  }
  function praise() { const k = Object.keys(D.praise); play(D.praise[k[Math.floor(Math.random() * k.length)]]); }
  // voz de ánimo cuando la respuesta no es correcta ("Try again.", "Almost! Listen again."…)
  function encourage() { const R = D.retry || {}; const k = Object.keys(R); if (k.length) play(R[k[Math.floor(Math.random() * k.length)]]); }

  /* ---------- speech recognition ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canSR = !!SR;
  function listen(timeoutMs = 7000) {
    return new Promise((res) => {
      if (!SR) return res({ error: 'nosupport', alts: [] });
      const r = new SR(); r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
      let done = false; const fin = (o) => { if (done) return; done = true; try { r.stop(); } catch (e) { } res(o); };
      r.onresult = (e) => { const alts = []; for (const res_ of e.results) for (let i = 0; i < res_.length; i++) alts.push(res_[i].transcript); fin({ alts }); };
      r.onerror = (e) => fin({ error: e.error, alts: [] });
      r.onend = () => fin({ alts: [] });
      try { r.start(); } catch (e) { fin({ error: 'start', alts: [] }); }
      setTimeout(() => fin({ alts: [], error: 'timeout' }), timeoutMs);
    });
  }
  /* ---------- voice recording (MediaRecorder) ---------- */
  async function recordVoice(ms = 4000, onTick) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream); const chunks = [];
    rec.ondataavailable = e => chunks.push(e.data);
    const p = new Promise(r => rec.onstop = r);
    rec.start(); const t0 = Date.now();
    const iv = setInterval(() => onTick && onTick((Date.now() - t0) / ms), 100);
    await sleep(ms); rec.stop(); await p; clearInterval(iv);
    stream.getTracks().forEach(t => t.stop());
    return URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
  }

  /* ---------- text comparison ---------- */
  const CONTR = { "i'm": 'i am', "you're": 'you are', "he's": 'he is', "she's": 'she is', "it's": 'it is', "we're": 'we are', "they're": 'they are', "what's": 'what is', "that's": 'that is', "there's": 'there is', "isn't": 'is not', "aren't": 'are not', "don't": 'do not', "doesn't": 'does not', "i'll": 'i will', "can't": 'can not', "where's": 'where is', "how's": 'how is', "let's": 'let us' };
  const NUMW = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100 };
  function norm(s, expand = true) {
    s = String(s).toLowerCase().replace(/[’`´]/g, "'").replace(/[^a-z0-9'\s-]/g, ' ').replace(/-/g, ' ');
    if (expand) s = s.split(/\s+/).map(w => CONTR[w] || w).join(' ');
    return s.replace(/\s+/g, ' ').trim();
  }
  function words(s) { return norm(s).split(' ').filter(Boolean).map(w => (w in NUMW ? String(NUMW[w]) : w)); }
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) { const curr = [i]; for (let j = 1; j <= n; j++) curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = curr; }
    return prev[n];
  }
  // speaking score: % of target words found (order-tolerant), best over alternatives
  function speechScore(target, alts) {
    const tw = words(target); let best = { score: 0, heard: '', hit: [] };
    for (const alt of alts) {
      const aw = words(alt); const pool = aw.slice(); const hit = tw.map(w => { const i = pool.findIndex(x => x === w || (w.length > 3 && lev(x, w) <= 1)); if (i >= 0) { pool.splice(i, 1); return true; } return false; });
      const sc = Math.round(hit.filter(Boolean).length / tw.length * 100);
      if (sc > best.score || !best.heard) best = { score: sc, heard: alt, hit };
    }
    return best;
  }

  /* ---------- grabar + evaluar al mismo tiempo (para TODAS las grabaciones) ---------- */
  // devuelve { url, alts, score }  (score = null si el navegador no puede evaluar)
  async function recordScore(target, ms, onTick, scorer) {
    let rec = null, stream = null; const chunks = [];
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); rec = new MediaRecorder(stream); rec.ondataavailable = e => chunks.push(e.data); rec.start(); }
    catch (e) { if (!SR) throw e; }
    const t0 = Date.now(); const iv = setInterval(() => onTick && onTick(Math.min(1, (Date.now() - t0) / ms)), 100);
    let r = { alts: [] };
    if (SR) { r = await listen(ms); if (Date.now() - t0 < 1200 && !r.alts.length) await sleep(Math.max(0, ms - (Date.now() - t0))); }
    else await sleep(ms);
    await sleep(250); clearInterval(iv);
    let url = null;
    if (rec) { const p = new Promise(x => rec.onstop = x); try { rec.stop(); } catch (e) { } await p; stream.getTracks().forEach(t => t.stop()); url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })); }
    let score = null, heard = '';
    if (r.alts.length) { if (scorer) { const s = scorer(r.alts); score = s.score; heard = s.heard; } else { const s = speechScore(target, r.alts); score = s.score; heard = s.heard; } }
    else if (SR && r.error !== 'audio-capture' && r.error !== 'service-not-allowed' && r.error !== 'start') { score = 0; }
    return { url, alts: r.alts, score, heard, error: r.error };
  }
  // deletreo: convierte lo que dijo el estudiante (ej. "jay oh h n") en letras y lo compara
  const LETTER_WORDS = { a: 'a', ay: 'a', hey: 'a', eh: 'a', b: 'b', be: 'b', bee: 'b', c: 'c', see: 'c', sea: 'c', si: 'c', d: 'd', dee: 'd', de: 'd', e: 'e', ee: 'e', f: 'f', ef: 'f', eff: 'f', g: 'g', gee: 'g', ji: 'g', h: 'h', age: 'h', aitch: 'h', etch: 'h', i: 'i', eye: 'i', aye: 'i', j: 'j', jay: 'j', k: 'k', kay: 'k', okay: 'k', ok: 'k', l: 'l', el: 'l', elle: 'l', ell: 'l', m: 'm', em: 'm', n: 'n', en: 'n', and: 'n', o: 'o', oh: 'o', owe: 'o', p: 'p', pee: 'p', pea: 'p', q: 'q', cue: 'q', queue: 'q', r: 'r', are: 'r', our: 'r', ar: 'r', s: 's', es: 's', ess: 's', t: 't', tea: 't', tee: 't', u: 'u', you: 'u', v: 'v', vee: 'v', w: 'w', x: 'x', ex: 'x', y: 'y', why: 'y', z: 'z', zee: 'z', zed: 'z' };
  function letterScorer(word) {
    const W = word.toLowerCase().replace(/[^a-z]/g, '');
    return (alts) => { let best = { score: 0, heard: alts[0] || '' };
      for (const alt of alts) {
        const t = alt.toLowerCase().replace(/double\s*(u|you)/g, ' w ').replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
        const asLetters = t.map(x => LETTER_WORDS[x] || (x.length === 1 ? x : x)).join('');
        const cand = [asLetters, t.join('')];
        for (const c of cand) { const d = lev(c, W); const sc = Math.max(0, Math.round((1 - d / Math.max(W.length, 1)) * 100)); if (sc > best.score) best = { score: sc, heard: alt }; }
      }
      return best; };
  }
  // tarjeta de resultado de voz: SIEMPRE dice si estuvo bien o mal y deja intentar otra vez
  function voiceResult(box, { score, heard, url, model, onRetry, pass = 70 }) {
    box.innerHTML = '';
    const me = url ? new Audio(url) : null;
    const ok = score != null && score >= pass, mid = score != null && score >= 45 && !ok;
    const card = h(`<div class="vres ${score == null ? 'self' : ok ? 'ok' : mid ? 'mid' : 'bad'}">
      ${score == null ? `<b>🎧 Escucha tu voz y el modelo. ¿Sonó parecido?</b>` :
        `<div class="vres-t">${ok ? '✅ ¡Muy bien! Lo dijiste correctamente.' : mid ? '🟡 ¡Casi! Escucha el modelo y repite despacio.' : '❌ No sonó bien todavía. Escucha el modelo y vuelve a intentarlo.'}</div>
         <div class="meter"><div class="bar"><i style="width:${score}%;background:${ok ? 'var(--ok)' : mid ? '#d4a017' : 'var(--bad)'}"></i></div><b>${score}%</b></div>
         ${heard ? `<small class="muted">Te escuché: “${esc(heard)}”</small>` : ''}`}
      <div class="row vres-b">${me ? '<button class="btn w sm" data-a="me">▶ Mi voz</button>' : ''}${model ? '<button class="btn sm" data-a="mo">▶ Modelo</button>' : ''}
        ${score == null ? '<button class="btn k sm" data-a="y">👍 Sí, sonó igual</button><button class="btn w sm" data-a="r">🔁 No, intentar otra vez</button>' : `<button class="btn ${ok ? 'w' : 'k'} sm" data-a="r">🔁 Intentar otra vez</button>`}</div></div>`);
    box.appendChild(card);
    const q = (a) => card.querySelector(`[data-a="${a}"]`);
    if (q('me')) q('me').onclick = () => { stop(); me.currentTime = 0; me.play(); };
    if (q('mo')) q('mo').onclick = () => model();
    q('r').onclick = () => onRetry && onRetry();
    if (q('y')) q('y').onclick = () => { card.className = 'vres ok'; card.querySelector('b').textContent = '✅ ¡Muy bien! Sigue practicando así.'; q('y').remove(); sfx('ok'); box.dispatchEvent(new CustomEvent('selfok')); };
    sfx(score == null ? 'tap' : ok || mid ? 'ok' : 'bad'); if (ok) praise(); else if (score != null) setTimeout(encourage, 250);
    return ok;
  }

  /* ---------- burbujas flotantes (diccionario, chat): arrastrables; se quitan soltándolas en la ✕ del centro ---------- */
  let dropX = null;
  function dropZone(show) {
    if (!dropX) { dropX = h('<div id="drop-x"><span>✕</span><small>Suelta aquí para quitar</small></div>'); document.body.appendChild(dropX); }
    dropX.classList.toggle('on', show);
  }
  function overDrop(x, y) { if (!dropX) return false; const r = dropX.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; return Math.hypot(x - cx, y - cy) < 70; }
  function floatBubble({ id, img, label, posKey, hiddenKey, onOpen, onHide, cls = '' }) {
    if (document.getElementById(id)) return document.getElementById(id);
    const b = h(`<button id="${id}" class="fbub ${cls}" title="${esc(label)} (puedes arrastrarlo)"><img src="${img}" alt=""><span>${esc(label)}</span><i class="fbadge hidden"></i></button>`);
    document.body.appendChild(b);
    const place = () => { const p = S[posKey]; if (!p) { b.style.left = ''; b.style.top = ''; b.style.bottom = ''; return; }
      const x = Math.min(Math.max(4, p.x * innerWidth), innerWidth - b.offsetWidth - 4), y = Math.min(Math.max(4, p.y * innerHeight), innerHeight - b.offsetHeight - 4);
      b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.bottom = 'auto'; };
    place(); addEventListener('resize', place);
    let sx, sy, ox, oy, moved = false, down = false;
    b.addEventListener('pointerdown', e => { down = true; moved = false; sx = e.clientX; sy = e.clientY; const r = b.getBoundingClientRect(); ox = r.left; oy = r.top; try { b.setPointerCapture(e.pointerId); } catch (x) { } });
    b.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (!moved && Math.hypot(dx, dy) < 8) return;
      if (!moved) dropZone(true); moved = true; b.classList.add('drag');
      const x = Math.min(Math.max(4, ox + dx), innerWidth - b.offsetWidth - 4), y = Math.min(Math.max(4, oy + dy), innerHeight - b.offsetHeight - 4);
      b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.bottom = 'auto'; dropX.classList.toggle('hot', overDrop(e.clientX, e.clientY)); });
    const up = (e) => { if (!down) return; down = false; b.classList.remove('drag');
      if (moved) { const hide = e && overDrop(e.clientX, e.clientY); dropZone(false); dropX.classList.remove('hot');
        if (hide) { S[posKey] = null; place(); setBubbleHidden(hiddenKey, true); onHide && onHide(true); return; }
        const r = b.getBoundingClientRect(); S[posKey] = { x: r.left / innerWidth, y: r.top / innerHeight }; save(); } };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', () => up(null));
    b.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; return; } onOpen(); });
    b.classList.toggle('hidden', !!S[hiddenKey]);
    return b;
  }
  function setBubbleHidden(key, v) {
    S[key] = !!v; save();
    const map = { dictHidden: '#dict-fab', chatHidden: '#chat-fab' }; const el = $(map[key]); if (el) el.classList.toggle('hidden', !!v);
    window.dispatchEvent(new Event('m1-dict-toggle'));
    toast(v ? `Listo. Lo abres con el botón ${key === 'dictHidden' ? '🔎' : '💬'} de arriba` : 'Botón visible de nuevo 👍');
  }

  /* ---------- UI: feedback sheet, toast, modal, confetti, xp ---------- */
  function sheet({ ok, title, msg, tip, btn = 'Continuar', neutral }) {
    return new Promise(res => {
      let el = $('#sheet'); if (el) el.remove();
      const cls = neutral ? 'neu' : ok ? 'ok' : 'no';
      const ic = mascot('sheet-mra', neutral ? 'point' : ok ? ['wink', 'thumbs', 'celebrate', 'smile'][Math.floor(Math.random() * 4)] : (Math.random() < .5 ? 'think' : 'shrug'));
      el = h(`<div id="sheet" class="sheet ${cls}"><div class="in"><div class="ic">${ic}</div><div class="tx"><h3>${title}</h3>${msg ? `<p>${msg}</p>` : ''}${tip ? `<div class="tipline">💡 ${tip}</div>` : ''}</div><button class="btn ${ok || neutral ? 'k' : 'w'} lg">${btn} →</button></div></div>`);
      document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('show'));
      const go = () => { document.removeEventListener('keydown', kd); el.classList.remove('show'); setTimeout(() => el.remove(), 250); res(); };
      const kd = (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
      setTimeout(() => document.addEventListener('keydown', kd), 300);
      $('button', el).onclick = go; $('button', el).focus({ preventScroll: true });
    });
  }
  const GOOD = ['¡Excelente!', '¡Muy bien!', '¡Perfecto!', '¡Genial!', '¡Así se hace!', '¡Bacano!', '¡Lo lograste!', '¡Súper!'];
  const BAD = ['¡Casi!', 'No te preocupes', 'Sigue intentando', '¡Uy, por poquito!'];
  const good = () => GOOD[Math.floor(Math.random() * GOOD.length)];
  const bad = () => BAD[Math.floor(Math.random() * BAD.length)];
  function toast(msg) { let t = $('#toast'); if (!t) { t = h('<div id="toast" class="toast"></div>'); document.body.appendChild(t); } t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2200); }
  function modal(html) {
    const m = h(`<div class="modal"><div class="card">${html}</div></div>`); document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) m.remove(); }); return m;
  }
  function xpFly(n, x, y) {
    const e = h(`<div class="xpfly">+${n} XP</div>`); e.style.left = (x || innerWidth / 2 - 40) + 'px'; e.style.top = (y || innerHeight / 2) + 'px';
    document.body.appendChild(e); setTimeout(() => e.remove(), 1200);
  }
  function confetti(ms = 2500) {
    const cv = h('<canvas id="confetti"></canvas>'); document.body.appendChild(cv); const ctx = cv.getContext('2d');
    cv.width = innerWidth; cv.height = innerHeight;
    const cols = ['#E3242B', '#0B2A5B', '#ffffff', '#1D5FD1', '#E3242B'];
    const P = Array.from({ length: 160 }, () => ({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * .5, r: 4 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)], vx: -2 + Math.random() * 4, vy: 2 + Math.random() * 4, a: Math.random() * 6, va: -.2 + Math.random() * .4 }));
    const t0 = performance.now();
    (function fr(t) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      P.forEach(p => { p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.strokeRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); });
      if (t - t0 < ms) requestAnimationFrame(fr); else cv.remove();
    })(t0);
  }

  /* ---------- Mr. Arrieta: personaje guía con varias expresiones ---------- */
  const MOODS = { happy: 'welcome', welcome: 'welcome', smile: 'smile', thumbs: 'thumbs', wink: 'wink', wow: 'wow', think: 'think', book: 'idea', point: 'point', present: 'present', pointside: 'pointside', celebrate: 'celebrate', shrug: 'shrug', idea: 'idea', watch: 'watch' };
  function mascot(cls = 'mascot bounce', mood = 'thumbs') {
    const m = MOODS[mood] || 'thumbs';
    return `<img class="${cls} mra mra-${m}" src="mra-${m}.webp" alt="Mr. Arrieta" draggable="false">`;
  }
  function audioSrc(au) { return window.AUD && window.AUD[au] ? 'data:audio/mpeg;base64,' + window.AUD[au] : 'audio/' + au + '.mp3'; }

  window.M1 = { D, C, S, $, $$, h, esc, shuffle, sample, sleep, save, touchStreak, addSkill, addWeak, okWeak, skillPct, isUnlocked, finalUnlocked, hasAccess, progressOpen, lockReason, review, doneCount, totalParts, redeem, codeHash,
    allParts, partById, trackAudio, audioUI, floatStop, recordScore, letterScorer, voiceResult, floatBubble, setBubbleHidden, prevPart, nextPart, partStars, overallPct, imgURL, photo, play, playSeq, loadAudio, stop, sfx, praise, encourage, canSR, listen, recordVoice,
    norm, words, lev, speechScore, sheet, good, bad, toast, modal, xpFly, confetti, mascot, audioSrc };
})();
