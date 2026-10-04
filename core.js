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
  function isUnlocked(topicN) {
    if (S.all) return true;
    if ((C.FREE_TOPICS || []).includes(topicN)) return true;
    return S.unlocked.includes(topicN);
  }
  function finalUnlocked() { return S.all || D.topics.every(t => isUnlocked(t.n)); }
  function redeem(code) {
    const hh = codeHash(code);
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
    if (src.startsWith('u:')) return `https://images.unsplash.com/${src.slice(2)}?w=${w}&h=${hgt}&fit=crop&crop=entropy&q=80&auto=format`;
    if (src.startsWith('flag:')) return `https://flagcdn.com/w640/${src.slice(5)}.png`;
    return '';
  }
  function photo(src, opts = {}) {
    const badge = opts.badge ? `<span class="badge">${esc(opts.badge)}</span>` : '';
    if (src && src.startsWith('#')) {
      const t = src.slice(1); const fs = t.length <= 2 ? 'clamp(54px,12vw,96px)' : t.length <= 3 ? 'clamp(40px,9vw,72px)' : 'clamp(22px,5vw,38px)';
      return `<div class="ph ${opts.cls || ''}"><div class="tc ${opts.dark ? 'dark' : ''}" style="font-size:${fs}">${esc(t)}</div>${badge}</div>`;
    }
    const isFlag = src && src.startsWith('flag:');
    return `<div class="ph ${isFlag ? 'flag' : ''} ${opts.cls || ''}"><img loading="lazy" alt="${esc(opts.alt || '')}" src="${imgURL(src)}" onerror="this.style.opacity=0">${badge}</div>`;
  }

  /* ---------- audio (natural neural voices pre-generated as MP3) ---------- */
  let cur = null, curBtn = null;
  function stop() { if (cur) { cur.pause(); cur = null; } if (curBtn) { curBtn.classList.remove('playing'); curBtn = null; } if (window.speechSynthesis) speechSynthesis.cancel(); }
  function play(au, opts = {}) {
    stop();
    return new Promise(res => {
      if (!au) return res();
      const a = new Audio(audioSrc(au));
      a.playbackRate = opts.rate || 1; a.preservesPitch = true;
      cur = a; if (opts.btn) { curBtn = opts.btn; opts.btn.classList.add('playing'); }
      const end = () => { if (opts.btn) opts.btn.classList.remove('playing'); if (cur === a) cur = null; res(); };
      a.onended = end; a.onerror = end;
      a.play().catch(end);
    });
  }
  // audio is packed in a few files (js/audio/*.js) so the folder is easy to upload to GitHub
  function loadAudio(groups) {
    window.__audLoaded = window.__audLoaded || {};
    return Promise.all(groups.filter(g => !window.__audLoaded[g]).map(g => new Promise(res => {
      // works both with folders (js/audio/t1.js) and with all files in one folder (t1.js)
      const base = (document.querySelector('script[src$="core.js"]').getAttribute('src') || '').replace(/core\.js$/, '');
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

  /* ---------- UI: feedback sheet, toast, modal, confetti, xp ---------- */
  function sheet({ ok, title, msg, tip, btn = 'Continuar', neutral }) {
    return new Promise(res => {
      let el = $('#sheet'); if (el) el.remove();
      const cls = neutral ? 'neu' : ok ? 'ok' : 'no';
      const ic = mascot('sheet-mra', neutral ? 'point' : ok ? (Math.random() < .5 ? 'wink' : 'smile') : 'think');
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
    const cols = ['#FFD43B', '#111111', '#ffffff', '#16A34A', '#E11D48'];
    const P = Array.from({ length: 160 }, () => ({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * .5, r: 4 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)], vx: -2 + Math.random() * 4, vy: 2 + Math.random() * 4, a: Math.random() * 6, va: -.2 + Math.random() * .4 }));
    const t0 = performance.now();
    (function fr(t) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      P.forEach(p => { p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.strokeRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); });
      if (t - t0 < ms) requestAnimationFrame(fr); else cv.remove();
    })(t0);
  }

  /* ---------- Mr. Arrieta: personaje guía con varias expresiones ---------- */
  const MOODS = { happy: 'smile', smile: 'smile', thumbs: 'thumbs', wink: 'wink', wow: 'wow', think: 'think', book: 'book', point: 'point', present: 'present' };
  function mascot(cls = 'mascot bounce', mood = 'thumbs') {
    const m = MOODS[mood] || 'thumbs';
    return `<img class="${cls} mra mra-${m}" src="mra-${m}.webp" alt="Mr. Arrieta" draggable="false">`;
  }
  function audioSrc(au) { return window.AUD && window.AUD[au] ? 'data:audio/mpeg;base64,' + window.AUD[au] : 'audio/' + au + '.mp3'; }

  window.M1 = { D, C, S, $, $$, h, esc, shuffle, sample, sleep, save, touchStreak, addSkill, addWeak, okWeak, skillPct, isUnlocked, finalUnlocked, redeem, codeHash,
    allParts, partById, prevPart, nextPart, partStars, overallPct, imgURL, photo, play, playSeq, loadAudio, stop, sfx, praise, canSR, listen, recordVoice,
    norm, words, lev, speechScore, sheet, good, bad, toast, modal, xpFly, confetti, mascot, audioSrc };
})();
