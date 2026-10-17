/* =====================================================================
   ZONA DE JUEGOS (arcade) — juegos para aprender inglés jugando
   · Contenido por nivel (A1 · A2 · B2 · B2+) desde js/arcadedata.js
   · Puntaje total, récords, medallas y racha en localStorage 'mra_arcade_v1'
   · Efectos con WebAudio; voces naturales (audio/arcade*.js)
   · Acceso gratuito: 2 juegos abiertos; el resto con Membership o Premium
   ===================================================================== */
(function () {
  'use strict';
  const M = window.M1, P = window.MRAP, AD = window.ARCADE_DATA;
  if (!P || !P.get() || (P.isExpired && P.isExpired())) { location.replace('index.html'); return; }
  const { $, $$, h, esc, shuffle, sample } = M;
  const app = $('#app');

  /* ---------------- estado ---------------- */
  const KEY = 'mra_arcade_v1';
  const fresh = () => ({ v: 1, sound: true, total: 0, games: 0, best: {}, plays: {}, medals: {}, days: { last: '', n: 0 } });
  let S; try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
  const LEVELS = [
    { id: 'A1', es: 'Elemental', grp: 'arcade_a1' }, { id: 'A2', es: 'Básico', grp: 'arcade_a2' },
    { id: 'B2', es: 'Intermedio alto', grp: 'arcade_b2' }, { id: 'B2+', es: 'Avanzado', grp: 'arcade_b2p' }];
  function myLevel() {
    try { const a = P.assigned && P.assigned(); if (a && a.id) return a.id; const p = P.get(); const m = p && p.module && P.mod(+p.module); if (m) return m.id; } catch (e) { }
    return 'A1';
  }
  const MINE = LEVELS.some(l => l.id === myLevel()) ? myLevel() : 'A1';
  let LV = MINE;
  const lvl = () => LEVELS.find(l => l.id === LV);
  const L = () => AD.levels[LV];
  const trial = !!(P.isTrial && P.isTrial());
  const nick = () => { const p = P.get() || {}; return (p.look && p.look.nick) || p.first || ''; };
  const fmt = (n) => Math.round(n).toLocaleString('es-CO');
  const todayISO = () => P.todayISO ? P.todayISO() : new Date().toISOString().slice(0, 10);
  const loadLevelAudio = (id) => M.loadAudio(['arcade_c', LEVELS.find(l => l.id === (id || LV)).grp]);

  /* ---------------- sonido: efectos WebAudio + voces ---------------- */
  let ac = null;
  function actx() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (ac && ac.state === 'suspended') ac.resume().catch(() => { }); return ac; }
  function tone(f, t0, dur, type = 'triangle', vol = .12, f2) {
    const a = actx(); if (!a) return; const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0;
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
  }
  function noise(t0, dur, vol = .07, freq = 1200) {
    const a = actx(); if (!a) return; const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
    s.connect(f).connect(g).connect(a.destination); s.start(a.currentTime + t0);
  }
  const FX = {
    tap: () => tone(620, 0, .07, 'triangle', .07),
    ok: () => { tone(660, 0, .1); tone(990, .08, .16); },
    bad: () => tone(210, 0, .2, 'square', .045, 130),
    pop: () => tone(880, 0, .09, 'sine', .14, 320),
    combo: (n) => { const b = 520 + Math.min(n || 0, 20) * 25; tone(b, 0, .08); tone(b * 1.25, .07, .08); tone(b * 1.5, .14, .16); },
    win: () => [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * .11, .32, 'triangle', .13)),
    lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, i * .17, .3, 'sawtooth', .045)),
    tick: () => tone(1250, 0, .03, 'square', .03),
    coin: () => { tone(988, 0, .08, 'square', .05); tone(1319, .07, .22, 'square', .05); },
    whoosh: () => noise(0, .28, .08, 900),
    level: () => [440, 554, 659, 880].forEach((f, i) => tone(f, i * .07, .16, 'triangle', .11)),
    boom: () => { noise(0, .5, .14, 300); tone(140, 0, .45, 'sine', .16, 40); },
    flip: () => tone(420, 0, .06, 'sine', .08, 640),
    go: () => tone(880, 0, .35, 'square', .06),
    count: () => tone(440, 0, .18, 'square', .05),
  };
  function fx(n, a) { if (!S.sound) return; try { FX[n] && FX[n](a); } catch (e) { } }
  function voice(line) {
    if (!S.sound) return; const k = AD.voice[line]; if (!k) return;
    try { const a = new Audio(M.audioSrc(k)); a.volume = .95; a.play().catch(() => { }); } catch (e) { }
  }
  const say = (au, opts) => M.play(au, opts);
  const buzz = (ms) => { try { if (S.sound && navigator.vibrate) navigator.vibrate(ms); } catch (e) { } };

  /* ---------------- catálogo de juegos ---------------- */
  const GAMES = [
    { id: 'rain', icon: '🌧️', name: 'Lluvia de palabras', en: 'Word Rain', c: 'b', tag: 'Reflejos', desc: 'Atrapa la palabra en inglés que cae del cielo antes de que toque el piso.' },
    { id: 'memory', icon: '🧠', name: 'Memoria sonora', en: 'Sound Memory', c: 'r', tag: 'Memoria', desc: 'Une cada sonido con su foto. ¡Escucha bien y recuerda dónde está!' },
    { id: 'race', icon: '🏎️', name: 'Gran carrera', en: 'Grand Race', c: 'k', tag: 'Velocidad', desc: 'Responde rápido para acelerar tu carro y ganarle al rival.' },
    { id: 'wheel', icon: '🎡', name: 'Rueda de la fortuna', en: 'Wheel of Phrases', c: 'w', tag: 'Frases', desc: 'Gira la rueda, adivina letras y descubre la frase escondida.' },
    { id: 'mole', icon: '🔨', name: 'Atrapa lo que oyes', en: 'Whack-a-Word', c: 'r', tag: 'Escucha', desc: 'Escucha la palabra y golpea el letrero correcto cuando salga del hueco.' },
    { id: 'tower', icon: '🧱', name: 'Torre de oraciones', en: 'Sentence Tower', c: 'b', tag: 'Gramática', desc: 'Toca los bloques en orden para armar la oración antes de que la torre llegue arriba.' },
    { id: 'quiz', icon: '💰', name: '¿Quién quiere ser bilingüe?', en: 'Quiz Show', c: 'k', tag: 'Concurso', desc: '10 preguntas, 4 comodines y una escalera de puntos. ¿Llegas a la cima?' },
    { id: 'voice', icon: '🚀', name: 'Cohete de voz', en: 'Voice Rocket', c: 'w', tag: 'Pronunciación', desc: 'Di cada palabra en voz alta para darle combustible a tu cohete.' },
    { id: 'echo', icon: '🕵️', name: 'Detective de sonidos', en: 'Sound Detective', c: 'r', tag: 'Escucha', desc: 'Escucha la oración y descubre cuál de las tres versiones es la que oíste.' },
    { id: 'swipe', icon: '👉', name: 'Desliza y traduce', en: 'Swipe & Translate', c: 'b', tag: 'Contrarreloj', desc: '¿La traducción es correcta? Desliza a la derecha (sí) o a la izquierda (no).' },
  ];
  const FREE = ['rain', 'memory'];
  const locked = (g) => trial && !FREE.includes(g.id);
  const dayIdx = () => Math.floor(new Date(todayISO() + 'T12:00:00').getTime() / 864e5);
  const featured = () => { const pool = trial ? GAMES.filter(g => FREE.includes(g.id)) : GAMES; return pool[dayIdx() % pool.length].id; };

  const MEDALS = [
    { id: 'first', icon: '🎮', name: 'Primer juego', d: 'Termina tu primera partida' },
    { id: 'ten', icon: '🔟', name: 'Jugador fiel', d: 'Juega 10 partidas' },
    { id: 'combo10', icon: '🔥', name: 'En llamas', d: 'Logra un combo de 10' },
    { id: 'k1', icon: '⭐', name: '1.000 puntos', d: 'Suma 1.000 puntos en total' },
    { id: 'k10', icon: '💎', name: '10.000 puntos', d: 'Suma 10.000 puntos en total' },
    { id: 'record', icon: '🏆', name: 'Rompe récords', d: 'Supera uno de tus récords' },
    { id: 'perfect', icon: '💯', name: 'Partida perfecta', d: '8 aciertos o más sin errores' },
    { id: 'racer', icon: '🏁', name: 'Piloto veloz', d: 'Gana la Gran carrera' },
    { id: 'millionaire', icon: '💰', name: '¡Bilingüe!', d: 'Responde las 10 del concurso' },
    { id: 'rocket', icon: '🚀', name: 'En órbita', d: 'Lanza el Cohete de voz' },
    { id: 'streak3', icon: '📅', name: 'Racha de 3 días', d: 'Juega 3 días seguidos' },
    { id: 'explorer', icon: '🌈', name: 'Explorador', d: trial ? 'Juega los juegos abiertos' : 'Juega los 10 juegos' },
  ];

  /* ---------------- encabezado ---------------- */
  function topbar() {
    const tb = $('#topbar');
    tb.innerHTML = `<a class="brand" href="index.html" title="Mi perfil"><span class="logo-pill"><img class="logo" src="mra-brand.png" alt="mrarrieta.com"></span></a>
      <div class="sp"></div><a class="ar-back" href="index.html">← Mi perfil</a>
      <span class="tb-tag ar-hide-s">ZONA DE JUEGOS</span>
      <span class="pill y ar-tpts" title="Puntos de la Zona de juegos">🪙 <b id="ar-total">${fmt(S.total)}</b></span>
      <button class="iconbtn" id="ar-snd" title="Sonido" aria-label="Sonido">${S.sound ? '🔊' : '🔇'}</button>`;
    $('#ar-snd', tb).onclick = () => {
      S.sound = !S.sound; save(); topbar();
      if (S.sound) fx('ok');
      M.toast(S.sound ? 'Efectos de sonido activados 🔊' : 'Efectos en silencio 🔇 (los audios de las palabras siguen sonando)');
    };
  }
  const setTotal = () => { const e = $('#ar-total'); if (e) e.textContent = fmt(S.total); };

  /* ---------------- sala de juegos ---------------- */
  let current = null; // sesión de juego activa
  function lobby() {
    if (current) { current.kill(); current = null; }
    M.stop(); topbar(); window.scrollTo(0, 0);
    const feat = featured();
    const earned = MEDALS.filter(m => S.medals[m.id]).length;
    const best = (g) => S.best[g.id + '|' + LV] || 0;
    app.innerHTML = `<div class="wrap ar-wrap">
      <section class="ar-hero card">
        <div class="ar-hero-tx">
          <span class="lbl r">🎮 Zona de juegos</span>
          <h1>¡A jugar${nick() ? ', ' + esc(nick()) : ''}!</h1>
          <p class="muted">Let's play! · Aprende inglés jugando: suma puntos, rompe récords y gana medallas.</p>
          <div class="ar-stats">
            <div class="ar-stat"><b>${fmt(S.total)}</b><small>🪙 puntos</small></div>
            <div class="ar-stat"><b>${S.games}</b><small>🎯 partidas</small></div>
            <div class="ar-stat"><b>${earned}/${MEDALS.length}</b><small>🏅 medallas</small></div>
            <div class="ar-stat"><b>${S.days.last && streakAlive() ? S.days.n : 0}</b><small>🔥 días seguidos</small></div>
          </div>
        </div>
        <img class="ar-hero-mra" src="mra-celebrate.webp" alt="Mr. Arrieta" draggable="false">
        <i class="ar-spark s1">✦</i><i class="ar-spark s2">★</i><i class="ar-spark s3">✦</i>
      </section>
      <section class="ar-lvbar">
        <div class="ar-lvhead"><b>Nivel de los juegos</b><small class="muted">Se abre en tu nivel. Puedes cambiarlo cuando quieras.</small></div>
        <div class="ar-lvs" role="tablist">${LEVELS.map(l => `<button class="ar-lv ${l.id === LV ? 'on' : ''}" data-lv="${l.id}" role="tab" aria-selected="${l.id === LV}"><b>${l.id}</b><small>${l.es}</small>${l.id === MINE ? '<i>Tu nivel</i>' : ''}</button>`).join('')}</div>
      </section>
      ${trial ? `<div class="ar-trial"><span>🟢</span><div><b>Acceso gratuito:</b> tienes 2 juegos abiertos. Los demás se abren con <b>Plataforma</b> o <b>Premium</b>.</div></div>` : ''}
      <section class="ar-grid">${GAMES.map((g, i) => `<article class="ar-gc c-${g.c} ${locked(g) ? 'lock' : ''}" data-g="${g.id}" style="--d:${i * 55}ms">
          ${g.id === feat && !locked(g) ? '<span class="ar-feat">⚡ Juego del día · puntos x2</span>' : ''}
          <div class="ar-gc-top"><span class="ar-gc-ic">${g.icon}</span><span class="ar-gc-tag">${g.tag}</span></div>
          <h3>${g.name}</h3><p class="ar-gc-en">${g.en}</p><p class="ar-gc-d">${g.desc}</p>
          <div class="ar-gc-ft"><span>🏆 ${best(g) ? fmt(best(g)) : '—'}</span>${locked(g) ? '<span class="ar-gc-lk">🔒 Plataforma o Premium</span>' : '<button class="btn k ar-play">Jugar ▶</button>'}</div>
        </article>`).join('')}</section>
      <section class="card ar-medals"><h2>🏅 Mis medallas</h2><p class="muted">Gana medallas jugando. ¡Colecciónalas todas!</p>
        <div class="ar-mgrid">${MEDALS.map(m => `<div class="ar-md ${S.medals[m.id] ? 'on' : ''}" title="${esc(m.d)}"><span>${S.medals[m.id] ? m.icon : '🔒'}</span><b>${m.name}</b><small>${m.d}</small></div>`).join('')}</div>
      </section>
    </div>`;
    $$('.ar-lv', app).forEach(b => b.onclick = () => { LV = b.dataset.lv; fx('tap'); loadLevelAudio(); lobby(); M.toast(`Nivel ${LV} · ${lvl().es}`); });
    $$('.ar-gc', app).forEach(c => c.onclick = () => {
      const g = GAMES.find(x => x.id === c.dataset.g);
      if (locked(g)) return lockModal(g);
      fx('tap'); intro(g);
    });
    loadLevelAudio();
  }
  function streakAlive() { const y = new Date(new Date(todayISO() + 'T12:00:00').getTime() - 864e5).toISOString().slice(0, 10); return S.days.last === todayISO() || S.days.last === y; }
  function lockModal(g) {
    fx('bad');
    M.modal(`<div class="ar-lockm"><div class="ar-lockic">🔒</div><h3>${g.icon} ${esc(g.name)}</h3>
      <p>Este juego se abre con el plan <b>Plataforma</b> o <b>Premium</b>.</p>
      <p class="muted">Con tu acceso gratuito puedes jugar <b>Lluvia de palabras</b> y <b>Memoria sonora</b>.</p>
      <div class="ar-row"><a class="btn k" href="index.html">Ver planes en mi perfil</a></div></div>`, { x: true });
  }

  /* ---------------- intro + cuenta regresiva ---------------- */
  const HOW = {
    rain: ['Arriba ves una palabra en español.', 'Toca la burbuja con la palabra en inglés correcta.', 'Si toca el piso o tocas otra, pierdes una vida ❤️.'],
    memory: ['Voltea dos cartas a la vez.', 'Une cada carta 🔊 (sonido) con la foto de esa palabra.', 'Menos movimientos y menos tiempo = más puntos.'],
    race: ['Escucha y lee la palabra en inglés.', 'Toca su significado en español lo más rápido que puedas.', 'Cada acierto acelera tu carro 🏎️. ¡Llega antes que el rival!'],
    wheel: ['Gira la rueda para ganar puntos por letra.', 'Elige una letra: si está en la frase, ganas puntos por cada una.', 'Cuidado con 💥 Bancarrota. Toca «Resolver» cuando sepas la frase.'],
    mole: ['Escucha la palabra 🔊.', 'Golpea el letrero correcto cuando salga del hueco.', 'Sé rápido: los letreros se esconden.'],
    tower: ['Lee la traducción en español.', 'Toca los bloques en el orden correcto de la oración en inglés.', 'Un error o el tiempo hacen crecer la torre. ¡Que no llegue arriba!'],
    quiz: ['10 preguntas que valen cada vez más.', 'Comodines: 50:50, Público, Escuchar y Cambiar (uno de cada uno).', 'Si fallas, el concurso termina y te llevas lo que ganaste.'],
    voice: ['Mira la foto y escucha el modelo 🔊.', 'Toca 🎤 y di la palabra en voz alta.', 'Si no tienes micrófono, juegas en modo escucha.'],
    echo: ['Escucha la oración 🔊.', 'Elige cuál de las tres versiones escuchaste.', 'Puedes repetir el audio 2 veces (vale menos puntos).'],
    swipe: ['Lee la palabra en inglés y su traducción.', '¿Es correcta? → desliza a la derecha o toca ✓. ¿Incorrecta? ← desliza o toca ✗.', 'Un error te quita 3 segundos ⏱️.'],
  };
  function intro(g) {
    if (current) { current.kill(); current = null; }
    M.stop(); window.scrollTo(0, 0);
    const best = S.best[g.id + '|' + LV] || 0;
    app.innerHTML = `<div class="wrap ar-wrap"><div class="card ar-intro c-${g.c}">
      <button class="btn w sm ar-x" id="ar-exit">← Sala de juegos</button>
      <div class="ar-intro-ic">${g.icon}</div><h1>${g.name}</h1><p class="ar-gc-en">${g.en} · Nivel ${LV}</p>
      <ol class="ar-how">${HOW[g.id].map(x => `<li>${x}</li>`).join('')}</ol>
      ${best ? `<p class="ar-rec">🏆 Tu récord en ${LV}: <b>${fmt(best)}</b></p>` : '<p class="ar-rec">🏆 ¡Aún no tienes récord en este nivel!</p>'}
      <button class="btn lg ar-go" id="ar-start">¡Jugar! ▶</button>
      <p class="muted ar-loading hidden" id="ar-ld">Cargando audios…</p></div></div>`;
    $('#ar-exit').onclick = lobby;
    $('#ar-start').onclick = async () => {
      actx(); $('#ar-start').disabled = true; $('#ar-ld').classList.remove('hidden');
      await loadLevelAudio(); start(g);
    };
  }
  async function countdown(stage) {
    const ov = h('<div class="ar-cd"><b>3</b></div>'); stage.appendChild(ov); const b = $('b', ov);
    voice('Ready? Go!');
    for (const n of ['3', '2', '1']) { b.textContent = n; b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); fx('count'); await M.sleep(560); }
    b.textContent = '¡YA!'; b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); fx('go'); await M.sleep(420); ov.remove();
  }

  /* ---------------- sesión de juego (motor común) ---------------- */
  function session(g, stage, hud) {
    let resolveDone; const done = new Promise(r => resolveDone = r);
    const G = { g, stage, score: 0, combo: 0, maxCombo: 0, ok: 0, bad: 0, lives: 0, maxLives: 0, alive: true, timers: new Set(), raf: 0, cheat: null, extra: {}, done };
    G.after = (ms, fn) => { const t = setTimeout(() => { G.timers.delete(t); if (G.alive) fn(); }, ms); G.timers.add(t); return t; };
    G.every = (ms, fn) => { const t = setInterval(() => { if (G.alive) fn(); }, ms); G.timers.add(t); return t; };
    G.clear = (t) => { clearTimeout(t); clearInterval(t); G.timers.delete(t); };
    G.wait = (ms) => new Promise(r => G.after(ms, r));
    G.loop = (fn) => { let last = performance.now(); const f = (t) => { if (!G.alive) return; const dt = Math.min(.05, (t - last) / 1000); last = t; if (fn(dt) !== false) G.raf = requestAnimationFrame(f); }; G.raf = requestAnimationFrame(f); };
    G.mult = () => Math.min(5, 1 + Math.floor(G.combo / 4));
    G.hit = (at, base = 10, o = {}) => {
      G.combo++; G.ok++; G.maxCombo = Math.max(G.maxCombo, G.combo);
      const pts = Math.round(base * (o.noMult ? 1 : G.mult())); G.score += pts;
      pop('+' + pts, at, 'ok'); fx(o.sfx || 'ok');
      if (G.combo >= 4 && G.combo % 4 === 0) { fx('combo', G.combo); comboBurst(G.combo); voice(G.combo >= 12 ? "You're on fire!" : 'Combo!'); }
      G.hud(true); return pts;
    };
    G.add = (pts, at) => { G.score += pts; if (pts) pop((pts > 0 ? '+' : '') + pts, at, 'ok'); G.hud(true); };
    G.miss = (at, o = {}) => {
      G.combo = 0; G.bad++; fx('bad'); buzz(70); if (at) pop(o.txt || '✗', at, 'bad');
      stage.classList.remove('ar-shake'); void stage.offsetWidth; stage.classList.add('ar-shake');
      if (o.life !== false && G.maxLives) { G.lives--; G.hud(); if (G.lives <= 0) { G.after(450, () => G.end({ win: false })); return true; } }
      G.hud(); return false;
    };
    G.setLives = (n) => { G.lives = G.maxLives = n; G.hud(); };
    G.timer = null;
    G.countdown = (sec, onEnd) => {
      G.timer = { left: sec, total: sec }; G.hud();
      let lastTick = Math.ceil(sec);
      G.loop((dt) => {
        if (!G.timer || G.paused) return; G.timer.left -= dt;
        const c = Math.ceil(G.timer.left); if (c <= 5 && c < lastTick && c > 0) fx('tick'); lastTick = c;
        if (G.timer.left <= 0) { G.timer.left = 0; G.hudTimer(); voice("Time's up!"); onEnd(); return false; }
        G.hudTimer();
      });
    };
    G.hudTimer = () => { const t = G.timer; if (!t) return; const bar = $('.ar-tbar i', hud), lb = $('.ar-tlbl', hud); if (bar) { bar.style.width = Math.max(0, Math.min(100, t.left / t.total * 100)) + '%'; bar.classList.toggle('low', t.left <= 5); } if (lb) lb.textContent = Math.ceil(t.left) + 's'; };
    G.hud = (bump) => {
      hud.innerHTML = `<div class="ar-hscore ${bump ? 'bump' : ''}"><small>Puntos</small><b>${fmt(G.score)}</b></div>
        <div class="ar-hcombo ${G.combo >= 2 ? 'on' : ''}">🔥 <b>${G.combo}</b><small>combo</small>${G.mult() > 1 ? `<i>x${G.mult()}</i>` : ''}</div>
        ${G.maxLives ? `<div class="ar-hlives" aria-label="Vidas">${Array.from({ length: G.maxLives }, (_, i) => `<span class="${i < G.lives ? '' : 'off'}">${i < G.lives ? '❤️' : '🤍'}</span>`).join('')}</div>` : ''}
        ${G.timer ? `<div class="ar-htime"><div class="ar-tbar"><i></i></div><span class="ar-tlbl"></span></div>` : ''}
        ${G.extra.html ? `<div class="ar-hx">${G.extra.html}</div>` : ''}`;
      G.hudTimer();
    };
    G.end = (res = {}) => { if (!G.alive) return; G.alive = false; G.kill(true); resolveDone(Object.assign({ win: false }, res)); };
    G.kill = (keep) => {
      G.alive = false; G.timers.forEach(t => { clearTimeout(t); clearInterval(t); }); G.timers.clear(); cancelAnimationFrame(G.raf);
      if (!keep) M.stop(); if (G.onKill) try { G.onKill(); } catch (e) { }
    };
    G.hud();
    return G;
  }
  // texto flotante (+puntos / ✗)
  function pop(txt, at, cls) {
    let x = innerWidth / 2, y = innerHeight / 2;
    if (at && at.getBoundingClientRect) { const r = at.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; } else if (at && at.x != null) { x = at.x; y = at.y; }
    const e = h(`<div class="ar-pop ${cls || ''}">${esc(txt)}</div>`);
    e.style.left = Math.max(30, Math.min(innerWidth - 30, x)) + 'px'; e.style.top = y + 'px'; document.body.appendChild(e); setTimeout(() => e.remove(), 900);
  }
  function burst(at, n = 14) {
    let x = innerWidth / 2, y = innerHeight / 2; if (at && at.getBoundingClientRect) { const r = at.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
    const cols = ['#E3242B', '#0B2A5B', '#1D5FD1', '#ffffff', '#FFD6D8'];
    for (let i = 0; i < n; i++) {
      const p = h('<i class="ar-pt"></i>'); const a = Math.PI * 2 * i / n + Math.random() * .4, d = 40 + Math.random() * 50;
      p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.background = cols[i % cols.length];
      p.style.setProperty('--dx', Math.cos(a) * d + 'px'); p.style.setProperty('--dy', Math.sin(a) * d + 'px');
      document.body.appendChild(p); setTimeout(() => p.remove(), 700);
    }
  }
  function comboBurst(n) {
    const e = h(`<div class="ar-combo">🔥 COMBO x${n}!</div>`); document.body.appendChild(e); setTimeout(() => e.remove(), 1100);
  }

  /* ---------------- ejecutar un juego ---------------- */
  async function start(g) {
    window.scrollTo(0, 0);
    app.innerHTML = `<div class="ar-game c-${g.c}" data-game="${g.id}">
      <div class="ar-gbar"><button class="btn w sm" id="ar-quit" aria-label="Salir">✕</button><div class="ar-gname"><span>${g.icon}</span><b>${g.name}</b><small>${LV}</small></div></div>
      <div class="ar-hud" id="ar-hud"></div>
      <div class="ar-stage" id="ar-stage"></div></div>`;
    const stage = $('#ar-stage'), hud = $('#ar-hud');
    const G = session(g, stage, hud); current = G;
    $('#ar-quit').onclick = () => { fx('tap'); const m = M.modal(`<div class="ar-lockm"><div class="ar-lockic">⏸️</div><h3>¿Salir del juego?</h3><p class="muted">Perderás los puntos de esta partida.</p><div class="ar-row"><button class="btn w" data-a="no">Seguir jugando</button><button class="btn k" data-a="yes">Salir</button></div></div>`);
      G.paused = true;
      $$('button', m).forEach(b => b.onclick = () => { m.remove(); G.paused = false; if (b.dataset.a === 'yes') { G.kill(); current = null; lobby(); } }); };
    await countdown(stage);
    if (!G.alive) return;
    try { RUN[g.id](G, stage, L()); } catch (e) { console.error(e); G.end({ win: false }); }
    const res = await G.done;
    if (current !== G) return;
    current = null; results(g, G, res);
  }

  /* ---------------- resultados, récords y medallas ---------------- */
  function award(id, list) { if (!S.medals[id]) { S.medals[id] = todayISO(); list.push(MEDALS.find(m => m.id === id)); } }
  function results(g, G, res) {
    M.stop();
    const isFeat = g.id === featured();
    const base = Math.max(0, Math.round(G.score)), score = isFeat ? base * 2 : base;
    const key = g.id + '|' + LV, prev = S.best[key] || 0, record = score > prev && score > 0;
    if (record) S.best[key] = score;
    S.total += score; S.games++; S.plays[g.id] = (S.plays[g.id] || 0) + 1;
    // racha de días jugando
    const t = todayISO(); if (S.days.last !== t) { S.days.n = streakAlive() ? S.days.n + 1 : 1; S.days.last = t; }
    const newM = [];
    award('first', newM);
    if (S.games >= 10) award('ten', newM);
    if (G.maxCombo >= 10) award('combo10', newM);
    if (S.total >= 1000) award('k1', newM);
    if (S.total >= 10000) award('k10', newM);
    if (record && prev > 0) award('record', newM);
    if (G.bad === 0 && G.ok >= 8) award('perfect', newM);
    if (g.id === 'race' && res.win) award('racer', newM);
    if (g.id === 'quiz' && res.win) award('millionaire', newM);
    if (g.id === 'voice' && res.win) award('rocket', newM);
    if (S.days.n >= 3) award('streak3', newM);
    if ((trial ? FREE : GAMES.map(x => x.id)).every(id => S.plays[id])) award('explorer', newM);
    save(); setTotal();
    const good = res.win || record || G.ok >= 5;
    if (good) { M.confetti(record ? 3200 : 2000); fx('win'); } else fx('lose');
    setTimeout(() => voice(record ? 'New record!' : res.win ? 'You win!' : 'Game over!'), 300);
    const mood = record ? 'celebrate' : res.win ? 'wow' : good ? 'thumbs' : 'smile';
    const title = record ? '¡Nuevo récord! 🏆' : res.win ? (res.title || '¡Ganaste! 🎉') : (res.title || (G.ok >= 5 ? '¡Muy bien jugado! 👏' : '¡Buen intento! 💪'));
    const ov = h(`<div class="ar-res"><div class="card ar-res-card ${record ? 'rec' : ''}">
      <img class="ar-res-mra" src="mra-${mood}.webp" alt="Mr. Arrieta" draggable="false">
      <h2>${title}</h2>${res.msg ? `<p class="muted">${res.msg}</p>` : ''}
      <div class="ar-res-score"><small>Puntos</small><b data-n="${score}">0</b>${isFeat ? '<i>⚡ x2 juego del día</i>' : ''}</div>
      <div class="ar-res-row"><span>✅ <b>${G.ok}</b> aciertos</span><span>❌ <b>${G.bad}</b> errores</span><span>🔥 <b>${G.maxCombo}</b> combo máx.</span></div>
      <p class="ar-res-best">🏆 Récord ${LV}: <b>${fmt(S.best[key] || 0)}</b>${record && prev ? ` <small>(antes ${fmt(prev)})</small>` : ''}</p>
      ${newM.length ? `<div class="ar-res-m"><b>¡Nueva medalla!</b><div>${newM.map((m, i) => `<span style="--d:${300 + i * 200}ms" title="${esc(m.d)}">${m.icon} ${m.name}</span>`).join('')}</div></div>` : ''}
      <div class="ar-row"><button class="btn w" id="ar-lobby">🎮 Sala de juegos</button><button class="btn k" id="ar-again">🔁 Jugar otra vez</button></div></div></div>`);
    app.appendChild(ov);
    // contador animado del puntaje
    const b = $('.ar-res-score b', ov); const t0 = performance.now();
    (function f(t) { const k = Math.min(1, (t - t0) / 900); b.textContent = fmt(score * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
    $('#ar-lobby', ov).onclick = lobby;
    $('#ar-again', ov).onclick = () => { fx('tap'); start(g); };
  }

  /* ---------------- utilidades de contenido ---------------- */
  const photo = (img, w = 480, hh = 360) => img ? `<img class="ar-ph" loading="lazy" alt="" src="${M.imgURL(img, w, hh)}" onerror="this.style.visibility='hidden'">` : '';
  const others = (pool, item, n, key = 'en') => sample(pool.filter(x => x[key].toLowerCase() !== item[key].toLowerCase()), n);
  const deck = (arr) => { let d = []; return () => { if (!d.length) d = shuffle(arr); return d.pop(); }; };
  const center = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  /* =================================================================
     1) LLUVIA DE PALABRAS — reflejos
     ================================================================= */
  function rain(G, st, D) {
    G.setLives(3);
    const WAVES = 18; let wave = 0, speed = 62, bubbles = [], target = null;
    const next = deck(D.w);
    st.innerHTML = `<div class="ar-rain"><div class="ar-rain-q"><div class="ar-rain-ph"></div><div><small>Atrapa en inglés:</small><b id="rq"></b></div></div><div class="ar-rain-sky" id="sky"><div class="ar-rain-floor"></div></div></div>`;
    const sky = $('#sky', st);
    function newWave() {
      if (!G.alive) return;
      if (wave >= WAVES) { G.add(150, sky); return G.end({ win: true, title: '¡Ronda completada! 🌈', msg: 'Atrapaste todas las palabras de la lluvia.' }); }
      wave++; if (wave % 5 === 0) { speed += 14; fx('level'); voice('Level up!'); pop('⬆️ ¡Más rápido!', sky, 'ok'); }
      target = next(); const opts = shuffle([target, ...others(D.w, target, 2)]);
      $('#rq', st).textContent = target.es; $('.ar-rain-ph', st).innerHTML = photo(target.img, 160, 120);
      const W = sky.clientWidth, lane = W / 3; const lanes = shuffle([0, 1, 2]);
      bubbles.forEach(b => b.el.remove());
      bubbles = opts.map((o, i) => {
        const el = h(`<button class="ar-bub" type="button">${esc(o.en)}</button>`); el.style.maxWidth = (lane - 10) + 'px'; sky.appendChild(el);
        const bw = Math.min(el.offsetWidth, lane - 10); const x = lanes[i] * lane + (lane - bw) / 2;
        const b = { el, o, x, y: -60 - i * 70 - Math.random() * 40, ok: o === target, dead: false };
        el.style.left = x + 'px'; el.style.transform = `translateY(${b.y}px)`;
        el.addEventListener('pointerdown', (e) => { e.preventDefault(); tapB(b); });
        return b;
      });
      G.cheat = () => { const b = bubbles.find(x => x.ok && !x.dead && x.y > -20); return b ? b.el : null; };
    }
    function tapB(b) {
      if (b.dead || !G.alive) return;
      if (b.ok) {
        b.dead = true; burst(b.el); G.hit(b.el, 10 + Math.max(0, Math.round((sky.clientHeight - b.y) / 40)), { sfx: 'pop' }); say(b.o.au);
        b.el.classList.add('ar-popped'); bubbles.forEach(x => { if (x !== b) { x.dead = true; x.el.classList.add('ar-fade'); } });
        G.after(380, newWave);
      } else {
        b.dead = true; b.el.classList.add('ar-wrong'); if (!G.miss(b.el)) { /* sigue la ola */ }
      }
    }
    G.loop((dt) => {
      if (G.paused) return;
      const floor = sky.clientHeight - 14;
      for (const b of bubbles) {
        if (b.dead) continue; b.y += speed * dt; b.el.style.transform = `translateY(${b.y}px)`;
        if (b.y + b.el.offsetHeight >= floor) {
          b.dead = true; b.el.classList.add('ar-fade');
          if (b.ok) { G.miss(b.el, { txt: '💧 ¡Se cayó!' }); $('#rq', st).textContent = target.es + ' = ' + target.en; G.after(700, () => G.alive && newWave()); }
        }
      }
    });
    newWave();
  }

  /* =================================================================
     2) MEMORIA SONORA — sonido ↔ foto
     ================================================================= */
  function memory(G, st, D) {
    const pairs = sample(D.w, 6); const cards = shuffle(pairs.flatMap((w, i) => [{ k: i, w, snd: true }, { k: i, w, snd: false }]));
    let open = [], lock = false, moves = 0, matched = 0; const t0 = performance.now();
    G.extra.html = '👆 <b id="mv">0</b> mov.'; G.hud();
    st.innerHTML = `<div class="ar-mem">${cards.map((c, i) => `<button class="ar-card" data-i="${i}" type="button"><span class="ar-cin"><span class="ar-cb">?</span><span class="ar-cf ${c.snd ? 'snd' : ''}">${c.snd ? '<span class="ar-snd">🔊</span><small>Escucha</small>' : `${photo(c.w.img, 320, 240)}<b>${esc(c.w.en)}</b>`}</span></span></button>`).join('')}</div>`;
    const els = $$('.ar-card', st);
    const setMv = () => { const e = $('#mv'); if (e) e.textContent = moves; };
    els.forEach((el, i) => el.onclick = () => {
      const c = cards[i]; if (lock || c.done || open.includes(i)) { if (c.snd && open.includes(i)) say(c.w.au); return; }
      el.classList.add('up'); fx('flip'); if (c.snd) say(c.w.au); open.push(i);
      if (open.length === 2) {
        moves++; setMv(); const [a, b] = open.map(j => cards[j]);
        if (a.k === b.k) {
          a.done = b.done = true; const ea = els[open[0]], eb = els[open[1]]; open = [];
          G.after(250, () => { ea.classList.add('ok'); eb.classList.add('ok'); burst(eb, 10); G.hit(eb, 20); if (!c.snd) say(c.w.au); });
          matched++;
          if (matched === pairs.length) G.after(900, () => { const secs = (performance.now() - t0) / 1000; const bonus = Math.max(0, Math.round(300 - secs * 3 - Math.max(0, moves - 6) * 10)); G.add(bonus); G.end({ win: true, title: '¡Memoria de elefante! 🐘', msg: `Lo lograste en ${moves} movimientos y ${Math.round(secs)} segundos. Bono: +${bonus}` }); });
        } else {
          lock = true; const pair = open.slice(); open = [];
          G.after(850, () => { pair.forEach(j => els[j].classList.remove('up')); G.combo = 0; G.hud(); fx('bad'); lock = false; });
        }
      }
    });
    G.cheat = () => {
      if (lock) return null; const o = open[0];
      if (o != null) { const j = cards.findIndex((c, x) => x !== o && !c.done && c.k === cards[o].k); return els[j]; }
      const j = cards.findIndex(c => !c.done); return j >= 0 ? els[j] : null;
    };
  }

  /* =================================================================
     3) GRAN CARRERA — significado rápido vs. rival
     ================================================================= */
  function race(G, st, D) {
    const rivalV = { A1: 2.1, A2: 2.3, B2: 2.5, 'B2+': 2.6 }[LV] || 2.2;
    let me = 0, rival = 0, qT = 0, cur = null, busy = false, stall = 0; const next = deck(D.w);
    st.innerHTML = `<div class="ar-race"><div class="ar-track">
        <div class="ar-lane me"><span class="ar-car" id="car-me">🏎️</span><small>Tú</small></div>
        <div class="ar-lane riv"><span class="ar-car" id="car-riv">🚙</span><small>Rival</small></div><div class="ar-finish"></div></div>
      <div class="ar-rq card"><div class="ar-rq-ph" id="rph"></div><div class="ar-rq-w"><button class="ar-say" id="rsay" aria-label="Escuchar">🔊</button><b id="rw"></b></div></div>
      <div class="ar-ropts" id="ropts"></div></div>`;
    const carMe = $('#car-me', st), carRiv = $('#car-riv', st);
    const place = () => { carMe.style.left = `calc(${me}% * .86)`; carRiv.style.left = `calc(${rival}% * .86)`; };
    function ask() {
      if (!G.alive) return; cur = next(); busy = false; qT = performance.now();
      $('#rph', st).innerHTML = photo(cur.img, 320, 240); $('#rw', st).textContent = cur.en; say(cur.au);
      const opts = shuffle([cur, ...others(D.w, cur, 2, 'es')]);
      $('#ropts', st).innerHTML = opts.map((o, i) => `<button class="btn w ar-opt" data-i="${i}">${esc(o.es)}</button>`).join('');
      $$('.ar-opt', st).forEach((b, i) => b.onclick = () => answer(b, opts[i] === cur));
      G.cheat = () => busy ? null : $$('.ar-opt', st)[opts.indexOf(cur)];
    }
    function answer(b, ok) {
      if (busy || !G.alive) return; busy = true;
      if (ok) {
        const fast = performance.now() - qT < 2600; b.classList.add('ok');
        me = Math.min(100, me + (fast ? 15 : 11)); carMe.classList.remove('turbo'); void carMe.offsetWidth; carMe.classList.add('turbo');
        G.hit(b, fast ? 20 : 12); if (fast) pop('🔥 TURBO', carMe, 'ok'); fx('whoosh');
      } else {
        b.classList.add('bad'); $$('.ar-opt', st).find(x => x.textContent === cur.es)?.classList.add('ok');
        G.miss(b); stall = 1.2; carMe.classList.remove('spin'); void carMe.offsetWidth; carMe.classList.add('spin');
      }
      place();
      if (me >= 100) { G.after(500, () => { G.add(200, carMe); G.end({ win: true, title: '¡Ganaste la carrera! 🏁', msg: 'Llegaste primero a la meta.' }); }); return; }
      G.after(ok ? 450 : 1100, ask);
    }
    $('#rsay', st).onclick = () => cur && say(cur.au);
    G.loop((dt) => {
      if (G.paused) return; if (stall > 0) stall -= dt;
      rival = Math.min(100, rival + rivalV * dt); place();
      if (rival >= 100 && me < 100) { G.end({ win: false, title: '¡El rival llegó primero! 🚙', msg: '¡Casi! Juega otra vez y responde más rápido.' }); return false; }
    });
    place(); ask();
  }

  /* =================================================================
     4) RUEDA DE LA FORTUNA — letras de una frase
     ================================================================= */
  function wheel(G, st, D) {
    G.setLives(5);
    const VALS = [20, 60, 100, 'BANCARROTA', 40, 150, 30, 80];
    const COLS = ['#E3242B', '#0B2A5B', '#1D5FD1', '#111111', '#E3242B', '#0B2A5B', '#1D5FD1', '#FFFFFF'];
    const cands = shuffle([...D.s.filter(s => s.en.length <= 26 && Math.max(...s.en.split(' ').map(w => w.length)) <= 11),
      ...D.w.filter(w => w.en.split(' ').length >= 2 && w.en.length <= 22)]);
    const pool = cands.length >= 3 ? cands : shuffle(D.w);
    const ROUNDS = 3; let round = 0, phrase = null, shown = new Set(), used = new Set(), bank = 0, value = 0, phase = 'spin', rot = 0;
    const wedges = VALS.map((v, i) => {
      const a0 = (i * 45 - 90) * Math.PI / 180, a1 = ((i + 1) * 45 - 90) * Math.PI / 180, r = 100;
      const x0 = 110 + r * Math.cos(a0), y0 = 110 + r * Math.sin(a0), x1 = 110 + r * Math.cos(a1), y1 = 110 + r * Math.sin(a1);
      const am = ((i + .5) * 45 - 90), tx = 110 + 64 * Math.cos(am * Math.PI / 180), ty = 110 + 64 * Math.sin(am * Math.PI / 180);
      const fg = COLS[i] === '#FFFFFF' ? '#0B2A5B' : '#fff';
      return `<path d="M110 110 L${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${COLS[i]}" stroke="#0B2A5B" stroke-width="3"/>
        <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" fill="${fg}" font-family="Poppins,sans-serif" font-weight="800" font-size="${v === 'BANCARROTA' ? 20 : 17}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${am + 90} ${tx.toFixed(1)} ${ty.toFixed(1)})">${v === 'BANCARROTA' ? '💥' : v}</text>`;
    }).join('');
    st.innerHTML = `<div class="ar-wheel">
      <div class="ar-wtop"><div class="ar-wwrap"><div class="ar-wptr">▼</div><svg viewBox="0 0 220 220" class="ar-wsvg" id="wsvg"><g id="wg">${wedges}<circle cx="110" cy="110" r="16" fill="#fff" stroke="#0B2A5B" stroke-width="4"/></g></svg></div>
        <div class="ar-wside"><div class="ar-wround" id="wround"></div><div class="ar-wbank"><small>Puntos de la ronda</small><b id="wbank">0</b></div><div class="ar-wval" id="wval">Gira la rueda 🎡</div></div></div>
      <div class="ar-wclue" id="wclue"></div><div class="ar-board" id="board"></div>
      <div class="ar-wbtns"><button class="btn lg" id="wspin">🎡 Girar</button><button class="btn k" id="wsolve">💡 Resolver</button></div>
      <div class="ar-keys" id="keys"></div><div id="wsolvebox"></div></div>`;
    const letters = (s) => [...new Set(s.toUpperCase().replace(/[^A-Z]/g, ''))];
    function renderBoard(reveal) {
      $('#board', st).innerHTML = phrase.en.split(' ').map(w => `<span class="ar-bw">${[...w].map(ch => { const up = ch.toUpperCase(); const isL = /[A-Z]/.test(up); const on = !isL || shown.has(up) || reveal; return `<span class="ar-tile ${isL ? '' : 'p'} ${on ? 'on' : ''}">${on ? esc(ch.toUpperCase()) : ''}</span>`; }).join('')}</span>`).join('');
    }
    function renderKeys() {
      $('#keys', st).innerHTML = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(k => `<button class="ar-key ${used.has(k) ? (phrase.en.toUpperCase().includes(k) ? 'hit' : 'miss') : ''}" data-k="${k}" ${used.has(k) || phase !== 'letter' ? 'disabled' : ''}>${k}</button>`).join('');
      $$('.ar-key', st).forEach(b => b.onclick = () => guess(b.dataset.k, b));
      $('#wspin', st).disabled = phase !== 'spin'; $('#wsolve', st).disabled = phase === 'spinning' || phase === 'done';
    }
    function newRound() {
      if (!G.alive) return;
      if (round >= ROUNDS) return G.end({ win: true, title: '¡Rueda completada! 🎡', msg: 'Descubriste las 3 frases.' });
      round++; phrase = pool[(round - 1) % pool.length]; shown = new Set(); used = new Set(); bank = 0; phase = 'spin';
      $('#wround', st).textContent = `Frase ${round} de ${ROUNDS}`; $('#wbank', st).textContent = '0'; $('#wval', st).textContent = 'Gira la rueda 🎡';
      $('#wclue', st).innerHTML = `🇪🇸 Pista: <b>${esc(phrase.es)}</b>`; $('#wsolvebox', st).innerHTML = '';
      renderBoard(); renderKeys(); if (round === 1) voice('Spin the wheel!');
    }
    function spin() {
      if (phase !== 'spin' || !G.alive) return; phase = 'spinning'; renderKeys(); fx('whoosh');
      const extra = 1440 + Math.floor(Math.random() * 360); rot += extra;
      const g = $('#wg', st); g.style.transition = 'transform 2.6s cubic-bezier(.17,.67,.21,1)'; g.style.transform = `rotate(${rot}deg)`;
      let k = 0; const ticks = [80, 90, 100, 110, 130, 150, 170, 200, 240, 280, 330, 390]; let acc = 0; ticks.forEach(t => { acc += t; G.after(acc, () => fx('tick')); k++; });
      G.after(2700, () => {
        const ang = ((360 - (rot % 360)) % 360); const idx = Math.floor(ang / 45) % 8; const v = VALS[idx];
        if (v === 'BANCARROTA') {
          bank = 0; $('#wbank', st).textContent = '0'; $('#wval', st).innerHTML = '💥 <b>¡Bancarrota!</b>'; fx('lose'); voice('Bankrupt!'); G.combo = 0; G.hud();
          phase = 'spin'; renderKeys();
        } else { value = v; phase = 'letter'; $('#wval', st).innerHTML = `Vale <b>${v}</b> por letra · elige una letra 👇`; fx('coin'); renderKeys(); }
      });
    }
    function guess(k, btn) {
      if (phase !== 'letter' || used.has(k) || !G.alive) return; used.add(k);
      const n = (phrase.en.toUpperCase().match(new RegExp(k, 'g')) || []).length;
      if (n) {
        shown.add(k); bank += value * n; $('#wbank', st).textContent = fmt(bank); renderBoard();
        for (let i = 0; i < n; i++) G.after(i * 110, () => fx('coin'));
        G.combo++; G.ok++; G.maxCombo = Math.max(G.maxCombo, G.combo); G.hud(); pop(`+${value * n}`, btn, 'ok');
        $$('.ar-tile.on', st).forEach(t => { if (t.textContent === k) { t.classList.remove('flip'); void t.offsetWidth; t.classList.add('flip'); } });
        if (letters(phrase.en).every(x => shown.has(x))) return solved(0);
      } else { $('#wval', st).textContent = `No hay «${k}» 😬`; if (G.miss(btn)) { phase = 'done'; renderKeys(); return; } }
      phase = 'spin'; renderKeys();
    }
    function solveBox() {
      if (phase === 'spinning' || phase === 'done') return;
      const opts = shuffle([phrase, ...others(pool, phrase, 2)]);
      $('#wsolvebox', st).innerHTML = `<div class="ar-wsolve card"><b>¿Cuál es la frase?</b>${opts.map((o, i) => `<button class="btn w block ar-sopt" data-i="${i}">${esc(o.en)}</button>`).join('')}<button class="btn sm w" id="wsx">Cancelar</button></div>`;
      $$('.ar-sopt', st).forEach((b, i) => b.onclick = () => {
        if (opts[i] === phrase) { const hidden = letters(phrase.en).filter(x => !shown.has(x)).length; solved(60 + hidden * 12); }
        else { b.classList.add('bad'); b.disabled = true; if (G.miss(b)) { phase = 'done'; renderKeys(); } }
      });
      $('#wsx', st).onclick = () => { $('#wsolvebox', st).innerHTML = ''; };
    }
    function solved(bonus) {
      phase = 'done'; renderKeys(); renderBoard(true); $('#wsolvebox', st).innerHTML = '';
      bank += bonus; $('#wbank', st).textContent = fmt(bank); burst($('#board', st), 18); fx('win');
      G.ok++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo); G.add(bank, $('#board', st));
      $('#wval', st).innerHTML = `✅ <b>¡Resuelta!</b>${bonus ? ' +' + bonus + ' bono' : ''}`;
      say(phrase.au).then(() => G.after(700, newRound));
    }
    $('#wspin', st).onclick = spin; $('#wsolve', st).onclick = solveBox;
    G.cheat = () => {
      if (phase === 'spin') { if (letters(phrase.en).filter(x => !shown.has(x)).length <= 2 || round >= 2) return $('.ar-sopt', st) ? [...$$('.ar-sopt', st)].find(b => b.textContent === phrase.en) : $('#wsolve', st); return $('#wspin', st); }
      if (phase === 'letter') { const k = letters(phrase.en).find(x => !used.has(x)); return k ? $(`.ar-key[data-k="${k}"]`, st) : null; }
      return null;
    };
    newRound();
  }

  /* =================================================================
     5) ATRAPA LO QUE OYES — golpea el topo
     ================================================================= */
  function mole(G, st, D) {
    const TARGETS = 14; let n = 0, target = null, upMs = 2600, ups = [], cycle = 0; const next = deck(D.w);
    st.innerHTML = `<div class="ar-mole"><div class="ar-mq"><button class="btn k" id="mrep">🔊 Escuchar otra vez</button><span id="mcount"></span></div>
      <div class="ar-holes">${Array.from({ length: 9 }, (_, i) => `<div class="ar-hole" data-h="${i}"><button class="ar-sign" type="button"><span></span></button><i class="ar-dirt"></i></div>`).join('')}</div></div>`;
    const holes = $$('.ar-hole', st);
    holes.forEach((ho, i) => $('.ar-sign', ho).addEventListener('pointerdown', (e) => { e.preventDefault(); whack(i); }));
    G.countdown(55, () => G.end({ win: n >= 8, title: n >= 8 ? '¡Gran puntería! 🔨' : undefined, msg: `Atrapaste ${G.ok} palabras.` }));
    function hideAll() { holes.forEach(ho => ho.classList.remove('up', 'hit', 'no')); ups = []; }
    function show() {
      if (!G.alive) return; hideAll(); cycle++;
      const opts = shuffle([target, ...others(D.w, target, 2)]); const hs = sample([...Array(9).keys()], 3);
      ups = hs.map((hi, i) => ({ hi, o: opts[i] }));
      ups.forEach(u => { const ho = holes[u.hi]; $('.ar-sign span', ho).textContent = u.o.en; G.after(Math.random() * 180, () => ho.classList.add('up')); });
      if (cycle % 2 === 1) say(target.au);
      const my = cycle; G.after(upMs, () => { if (my === cycle) show(); });
    }
    function newTarget() {
      if (!G.alive) return;
      if (n >= TARGETS) { G.add(Math.round(G.timer.left * 5)); return G.end({ win: true, title: '¡Gran puntería! 🔨', msg: `Atrapaste ${G.ok} palabras. Bono por tiempo.` }); }
      n++; $('#mcount', st).textContent = `Palabra ${n} de ${TARGETS}`; target = next(); cycle = 0; upMs = Math.max(1700, upMs - 60); show();
    }
    function whack(i) {
      if (!G.alive) return; const u = ups.find(x => x.hi === i); const ho = holes[i]; if (!u || !ho.classList.contains('up') || ho.classList.contains('hit')) return;
      if (u.o === target) { ho.classList.add('hit'); burst(ho, 12); fx('boom'); G.hit(ho, 15); cycle++; G.after(420, newTarget); }
      else { ho.classList.add('no'); G.miss(ho, { life: false }); }
    }
    $('#mrep', st).onclick = () => target && say(target.au);
    G.cheat = () => { const u = ups.find(x => x.o === target); return u && holes[u.hi].classList.contains('up') && !holes[u.hi].classList.contains('hit') ? $('.ar-sign', holes[u.hi]) : null; };
    voice('Listen carefully.'); G.after(900, newTarget);
  }

  /* =================================================================
     6) TORRE DE ORACIONES — bloques en orden (estilo Tetris)
     ================================================================= */
  function tower(G, st, D) {
    const SENT = 6, ROWH = 34; let done = 0, sent = null, idx = 0, blocks = [], junk = 0, speed = 34, junkT = 0;
    const next = deck(D.s.filter(s => s.en.split(' ').length <= 8));
    st.innerHTML = `<div class="ar-tower"><div class="ar-tq"><small id="tcount"></small><b id="tes"></b></div>
      <div class="ar-well" id="well"><div class="ar-junk" id="junk"></div><div class="ar-wlimit"></div></div>
      <div class="ar-tbar2" id="tbar"></div></div>`;
    const well = $('#well', st), junkEl = $('#junk', st), bar = $('#tbar', st);
    const maxJunk = () => Math.floor(well.clientHeight / ROWH) - 2;
    function addJunk(why) {
      junk++; junkEl.style.height = junk * ROWH + 'px'; fx('boom'); pop(why || '🧱 +1', junkEl, 'bad');
      blocks.forEach(b => { if (b.landed && !b.taken) b.y -= ROWH; });
      if (junk >= maxJunk()) { G.end({ win: false, title: '¡La torre llegó arriba! 🧱', msg: `Armaste ${done} oraciones.` }); }
    }
    function newSentence() {
      if (!G.alive) return;
      if (done >= SENT) return G.end({ win: true, title: '¡Torre dominada! 🏗️', msg: 'Armaste todas las oraciones.' });
      sent = next(); idx = 0; junkT = 0; blocks.forEach(b => b.el.remove()); blocks = []; bar.innerHTML = '<span class="ar-tph">Toca los bloques en orden…</span>';
      $('#tcount', st).textContent = `Oración ${done + 1} de ${SENT}`; $('#tes', st).textContent = '🇪🇸 ' + sent.es;
      const toks = sent.en.split(' '); const W = well.clientWidth;
      shuffle(toks.map((t, i) => ({ t, i }))).forEach((o, k) => {
        const el = h(`<button class="ar-blk" type="button">${esc(o.t)}</button>`); well.appendChild(el);
        const bw = Math.min(el.offsetWidth, W - 8); const x = 4 + Math.random() * Math.max(0, W - bw - 8);
        const b = { el, t: o.t, x, y: -44 - k * 30, w: bw, hgt: el.offsetHeight, landed: false, taken: false };
        el.style.left = x + 'px'; el.style.transform = `translateY(${b.y}px)`; el.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(b); });
        blocks.push(b);
      });
      G.cheat = () => { const want = sent.en.split(' ')[idx]; const b = blocks.find(x => !x.taken && x.t === want && x.y > -10); return b ? b.el : null; };
    }
    function tap(b) {
      if (b.taken || !G.alive) return; const want = sent.en.split(' ')[idx];
      if (b.t === want) {
        b.taken = true; idx++; fx('pop'); G.hit(b.el, 8);
        const ph = $('.ar-tph', bar); if (ph) ph.remove(); bar.appendChild(h(`<span class="ar-tw">${esc(b.t)}</span>`));
        b.el.classList.add('ar-fly'); G.after(300, () => b.el.remove());
        if (idx >= sent.en.split(' ').length) {
          done++; bar.classList.add('ok'); burst(bar, 16); fx('win'); G.add(40, bar); say(sent.au);
          if (junk > 0) { junk--; junkEl.style.height = junk * ROWH + 'px'; pop('🧹 −1 fila', junkEl, 'ok'); }
          speed += 5; G.after(1300, () => { bar.classList.remove('ok'); newSentence(); });
        }
      } else { b.el.classList.remove('ar-no'); void b.el.offsetWidth; b.el.classList.add('ar-no'); G.miss(b.el, { life: false }); addJunk('🧱 ¡Error! +1 fila'); }
    }
    G.loop((dt) => {
      if (G.paused) return;
      junkT += dt; if (junkT > 14) { junkT = 0; addJunk('⏱️ +1 fila'); if (!G.alive) return false; }
      const floor = well.clientHeight - junk * ROWH;
      const live = blocks.filter(b => !b.taken).sort((a, b) => b.y - a.y);
      for (const b of live) {
        if (b.landed) continue;
        // los bloques chocan entre sí (también mientras caen) para que nunca se monten uno sobre otro
        let stop = floor, solid = true; for (const o of live) if (o !== b && o.y > b.y && o.x < b.x + b.w + 2 && b.x < o.x + o.w + 2 && o.y < stop) { stop = o.y; solid = o.landed; }
        b.y += (b.y < 0 ? Math.max(90, speed) : speed) * dt;
        if (b.y + b.hgt + 2 >= stop) { b.y = stop - b.hgt - 2; if (solid) { b.landed = true; b.el.classList.add('land'); } }
      }
      for (const b of live) { if (b.landed) { let stop = floor; for (const o of live) if (o !== b && o.landed && o.y > b.y && o.x < b.x + b.w && b.x < o.x + o.w) stop = Math.min(stop, o.y); if (b.y + b.hgt < stop - 3) { b.landed = false; b.el.classList.remove("land"); } } b.el.style.transform = `translateY(${b.y}px)`; }
      if (live.some(b => b.landed && b.y < 0)) { G.end({ win: false, title: '¡La torre llegó arriba! 🧱', msg: `Armaste ${done} oraciones.` }); return false; }
    });
    newSentence();
  }

  /* =================================================================
     7) ¿QUIÉN QUIERE SER BILINGÜE? — concurso con comodines
     ================================================================= */
  function quiz(G, st, D) {
    const LADDER = [10, 20, 30, 50, 100, 150, 200, 300, 500, 1000];
    const fills = shuffle(D.f), words = shuffle(D.w);
    const allAns = [...new Set(D.f.map(f => f.a))];
    let fi = 0, wi = 0, q = 0, cur = null, busy = false; const used = {};
    function make(kind) {
      if (kind === 'f' && fi < fills.length) {
        const f = fills[fi++]; const extra = sample(allAns.filter(a => a.toLowerCase() !== f.a.toLowerCase() && !f.o.map(x => x.toLowerCase()).includes(a.toLowerCase())), 1);
        const opts = shuffle([...new Set([f.a, ...f.o, ...extra])].slice(0, 4));
        return { q: `Completa: <span class="ar-qs">${esc(f.s).replace('___', '<u>_____</u>')}</span>`, opts, a: f.a, au: f.au, h: f.h };
      }
      const w = words[wi++ % words.length]; const opts = shuffle([w.en, ...others(D.w, w, 3).map(x => x.en)]);
      return { q: `¿Cómo se dice <b>«${esc(w.es)}»</b> en inglés?`, opts, a: w.en, au: w.au, img: w.img };
    }
    st.innerHTML = `<div class="ar-quiz"><div class="ar-ladder" id="ladder">${LADDER.map((v, i) => `<span data-i="${i}"><i>${i + 1}</i>${fmt(v)}</span>`).join('')}</div>
      <div class="ar-qmain"><div class="ar-lifes" id="lifes">
        <button class="ar-life" data-l="half" title="Quita dos respuestas incorrectas">50:50</button>
        <button class="ar-life" data-l="aud" title="Pregúntale al público">👥 Público</button>
        <button class="ar-life" data-l="ear" title="Escucha la respuesta">🔊 Escuchar</button>
        <button class="ar-life" data-l="swap" title="Cambia la pregunta">🔄 Cambiar</button></div>
        <div class="ar-qcard card" id="qcard"></div><div class="ar-qopts" id="qopts"></div><div id="qaud"></div></div></div>`;
    function ladder() { $$('#ladder span', st).forEach((s, i) => { s.classList.toggle('on', i === q); s.classList.toggle('done', i < q); }); }
    function show(replace) {
      if (!G.alive) return; busy = false;
      cur = make(q % 3 === 2 ? 'w' : 'f'); ladder(); $('#qaud', st).innerHTML = '';
      $('#qcard', st).innerHTML = `<small>Pregunta ${q + 1} de 10 · vale ${fmt(LADDER[q])} puntos</small><p>${cur.q}</p>${cur.h ? `<small class="muted">💡 ${esc(cur.h)}</small>` : ''}`;
      $('#qopts', st).innerHTML = cur.opts.map((o, i) => `<button class="ar-qo" data-i="${i}"><i>${'ABCD'[i]}</i><span>${esc(o)}</span></button>`).join('');
      $$('.ar-qo', st).forEach((b, i) => b.onclick = () => pick(b, cur.opts[i]));
      $$('.ar-life', st).forEach(b => { b.disabled = !!used[b.dataset.l]; b.classList.toggle('used', !!used[b.dataset.l]); });
      if (!replace) { $('#qcard', st).classList.remove('ar-in'); void st.offsetWidth; $('#qcard', st).classList.add('ar-in'); }
      G.cheat = () => busy ? null : $$('.ar-qo', st).find(b => $('span', b).textContent === cur.a && !b.disabled);
    }
    function pick(b, val) {
      if (busy || !G.alive) return; busy = true; b.classList.add('sel'); fx('tap');
      if (q >= 5) voice('Final answer?');
      G.after(q >= 5 ? 1300 : 700, () => {
        const ok = val === cur.a; const right = $$('.ar-qo', st).find(x => $('span', x).textContent === cur.a);
        right.classList.add('ok'); M.play(cur.au);
        if (ok) {
          G.hit(b, LADDER[q], { noMult: true }); q++;
          if (q >= LADDER.length) { G.after(900, () => { G.add(500); G.end({ win: true, title: '¡Eres bilingüe! 💰', msg: 'Respondiste las 10 preguntas. +500 de bono.' }); }); return; }
          if (q === 5) { pop('🎉 ¡Mitad del camino!', $('#qcard', st), 'ok'); fx('level'); }
          G.after(1300, () => show());
        } else {
          b.classList.add('bad'); G.miss(b, { life: false });
          G.after(1700, () => G.end({ win: false, title: q >= 5 ? '¡Gran concurso! 🎤' : '¡Fin del concurso! 🎤', msg: `Llegaste a la pregunta ${q + 1}. La respuesta era «${esc(cur.a)}».` }));
        }
      });
    }
    $$('.ar-life', st).forEach(b => b.onclick = () => {
      const l = b.dataset.l; if (used[l] || busy) return; used[l] = true; b.disabled = true; b.classList.add('used'); fx('level');
      if (l === 'half') { shuffle($$('.ar-qo', st).filter(x => $('span', x).textContent !== cur.a)).slice(0, 2).forEach(x => { x.disabled = true; x.classList.add('gone'); }); }
      else if (l === 'aud') {
        const live = $$('.ar-qo', st).filter(x => !x.disabled); const right = 48 + Math.floor(Math.random() * 30);
        const isR = (x) => $('span', x).textContent === cur.a; const wrong = live.filter(x => !isR(x));
        const raw = wrong.map(() => Math.random() + .2); const sum = raw.reduce((a, b) => a + b, 0) || 1;
        const wv = raw.map(r => Math.floor(r / sum * (100 - right))); if (wv.length) wv[0] += 100 - right - wv.reduce((a, b) => a + b, 0);
        let wi2 = 0; const vals = live.map(x => isR(x) ? right : wv[wi2++]);
        $('#qaud', st).innerHTML = `<div class="ar-aud card"><b>👥 El público votó:</b>${live.map((x, i) => `<div class="ar-audr"><i>${$('i', x).textContent}</i><span><em style="width:${vals[i]}%"></em></span><b>${vals[i]}%</b></div>`).join('')}</div>`;
      }
      else if (l === 'ear') { M.play(cur.au); M.toast('🔊 Escucha con atención: el audio dice la respuesta correcta.'); }
      else if (l === 'swap') show(true);
    });
    show();
  }

  /* =================================================================
     8) COHETE DE VOZ — pronunciación (micrófono o modo escucha)
     ================================================================= */
  function voiceGame(G, st, D) {
    const N = 6; const items = sample(D.w.filter(w => w.en.split(' ').length <= 3), N);
    let i = 0, tries = 0, mic = M.canSR, busy = false;
    st.innerHTML = `<div class="ar-voice"><div class="ar-sky2"><div class="ar-stages">${items.map((_, k) => `<i data-k="${k}"></i>`).join('')}</div><span class="ar-rocket" id="rocket">🚀</span><div class="ar-pad"></div></div>
      <div class="ar-vmain"><div class="card ar-vcard" id="vcard"></div><div id="vres"></div><button class="ar-link" id="vmode"></button></div></div>`;
    const rocket = $('#rocket', st);
    const fly = () => { rocket.style.bottom = `calc(${i / N * 78}% + 8px)`; $$('.ar-stages i', st).forEach((e, k) => e.classList.toggle('on', k < i)); };
    function modeBtn() { const b = $('#vmode', st); b.classList.toggle('hidden', !M.canSR); b.textContent = mic ? '🙈 Jugar sin micrófono (modo escucha)' : '🎤 Usar el micrófono'; }
    function render() {
      if (!G.alive) return; busy = false; tries = 0; const w = items[i]; $('#vres', st).innerHTML = ''; modeBtn();
      if (mic) {
        $('#vcard', st).innerHTML = `<small>Palabra ${i + 1} de ${N} · <b>Say it!</b></small>${photo(w.img)}<b class="ar-vw">${esc(w.en)}</b><small class="muted">${esc(w.es)}</small>
          <div class="ar-row"><button class="btn w" id="vmodel">🔊 Escuchar</button><button class="btn lg ar-mic" id="vmic">🎤 Decirlo</button></div>`;
        $('#vmodel', st).onclick = () => say(w.au); $('#vmic', st).onclick = talk; say(w.au);
        G.cheat = () => busy ? null : $('#vmic', st);
      } else {
        const opts = shuffle([w, ...others(D.w, w, 2)]); let sel = -1;
        $('#vcard', st).innerHTML = `<small>Palabra ${i + 1} de ${N} · modo escucha</small>${photo(w.img)}<b class="ar-vw">${esc(w.en)}</b>
          <p class="muted">¿Cuál audio dice <b>${esc(w.en)}</b>? Toca para escuchar y elige.</p>
          <div class="ar-vopts">${opts.map((o, k) => `<button class="btn w ar-vo" data-k="${k}">🔊 ${'ABC'[k]}</button>`).join('')}</div>
          <button class="btn k lg" id="vok" disabled>✅ Es este</button>`;
        $$('.ar-vo', st).forEach((b, k) => b.onclick = () => { sel = k; $$('.ar-vo', st).forEach(x => x.classList.toggle('sel', x === b)); $('#vok', st).disabled = false; say(opts[k].au); });
        $('#vok', st).onclick = () => { if (busy || sel < 0) return; judge(opts[sel] === w ? 100 : 0, ''); };
        G.cheat = () => { if (busy) return null; const k = opts.indexOf(w); return sel === k ? $('#vok', st) : $$('.ar-vo', st)[k]; };
      }
    }
    async function talk() {
      if (busy || !G.alive) return; busy = true; const w = items[i]; M.stop();
      const b = $('#vmic', st); b.classList.add('rec'); b.textContent = '🎙️ Te escucho…';
      const r = await M.listen(5000); if (!G.alive) return;
      b.classList.remove('rec'); b.textContent = '🎤 Decirlo';
      if (!r.alts.length && ['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'nosupport', 'start'].includes(r.error)) {
        mic = false; M.toast('No pudimos usar el micrófono: jugamos en modo escucha 🎧'); return render();
      }
      if (!r.alts.length) { busy = false; $('#vres', st).innerHTML = `<div class="ar-vr mid">🤔 No te escuché. Toca 🎤 y habla un poco más fuerte.</div>`; fx('bad'); M.encourage(); return; }
      const s = M.speechScore(w.en, r.alts); judge(s.score, s.heard);
    }
    function judge(score, heard) {
      busy = true; tries++; const w = items[i]; const ok = score >= 70;
      if (ok) {
        const pts = tries === 1 ? 30 : tries === 2 ? 20 : 10; G.hit($('#vcard', st), pts); M.praise(); i++; fly(); burst(rocket, 12); fx('whoosh');
        $('#vres', st).innerHTML = `<div class="ar-vr ok">✅ ¡Muy bien! ${mic ? 'Lo dijiste correctamente.' : 'Ese es el audio correcto.'}${heard ? ` <small>Te escuché: “${esc(heard)}”</small>` : ''}</div>`;
        if (i >= N) { G.after(1300, () => { rocket.classList.add('launch'); fx('boom'); G.after(1500, () => { G.add(150); G.end({ win: true, title: '¡Cohete en órbita! 🚀', msg: 'Pronunciaste todas las palabras.' }); }); }); return; }
        G.after(1500, render);
      } else {
        G.miss($('#vcard', st), { life: false }); setTimeout(() => M.encourage(), 200);
        $('#vres', st).innerHTML = `<div class="ar-vr bad">❌ ${mic ? 'No sonó bien todavía.' : 'Ese no es.'} Escucha el modelo y vuelve a intentarlo.${heard ? ` <small>Te escuché: “${esc(heard)}”</small>` : ''}
          <div class="ar-row"><button class="btn w sm" id="vm2">🔊 Modelo</button><button class="btn k sm" id="vre">🔁 Intentar otra vez</button>${tries >= 2 ? '<button class="btn w sm" id="vskip">Saltar ⏭️</button>' : ''}</div></div>`;
        $('#vm2', st).onclick = () => say(w.au);
        $('#vre', st).onclick = () => { busy = false; $('#vres', st).innerHTML = ''; if (mic) talk(); else { $$('.ar-vo', st).forEach(x => x.classList.remove('sel')); $('#vok', st).disabled = true; } };
        if ($('#vskip', st)) $('#vskip', st).onclick = () => { i++; fly(); if (i >= N) { G.end({ win: false, title: '¡Buen vuelo! 🚀', msg: 'Sigue practicando la pronunciación.' }); return; } render(); };
        G.cheat = () => $('#vre', st);
      }
    }
    $('#vmode', st).onclick = () => { mic = !mic; render(); };
    fly(); render();
  }

  /* =================================================================
     9) DETECTIVE DE SONIDOS — ¿qué oración escuchaste?
     ================================================================= */
  function echo(G, st, D) {
    G.setLives(3);
    const ROUNDS = 10; const items = shuffle(D.f); let r = 0, cur = null, reps = 0, busy = false;
    st.innerHTML = `<div class="ar-echo"><div class="card ar-ecard"><small id="ecount"></small><button class="ar-ebig" id="eplay" aria-label="Escuchar"><span>🕵️</span><b>🔊 Escuchar</b></button><button class="btn w sm" id="erep">🔁 Repetir (<b id="ereps">2</b>)</button></div><div class="ar-eopts" id="eopts"></div></div>`;
    function round() {
      if (!G.alive) return;
      if (r >= ROUNDS) return G.end({ win: true, title: '¡Caso resuelto! 🕵️', msg: 'Tienes oído de detective.' });
      cur = items[r % items.length]; r++; reps = 0; busy = false;
      $('#ecount', st).textContent = `Caso ${r} de ${ROUNDS}`; $('#ereps', st).textContent = '2'; $('#erep', st).disabled = false;
      const opts = shuffle([...new Set([cur.a, ...cur.o])].slice(0, 3).map(x => cur.s.replace('___', x)));
      const right = cur.s.replace('___', cur.a);
      $('#eopts', st).innerHTML = opts.map((o, i) => `<button class="ar-eo" data-i="${i}">${esc(o)}</button>`).join('');
      $$('.ar-eo', st).forEach((b, i) => b.onclick = () => {
        if (busy || !G.alive) return; busy = true;
        if (opts[i] === right) { b.classList.add('ok'); burst(b, 10); G.hit(b, Math.max(8, 20 - reps * 5)); G.after(900, round); }
        else { b.classList.add('bad'); $$('.ar-eo', st)[opts.indexOf(right)].classList.add('ok'); if (!G.miss(b)) G.after(1600, round); say(cur.au); }
      });
      G.cheat = () => busy ? null : $$('.ar-eo', st)[opts.indexOf(right)];
      play(true);
    }
    function play(first) { const b = $('#eplay', st); b.classList.add('on'); say(cur.au).then(() => b.classList.remove('on')); if (!first) return; }
    $('#eplay', st).onclick = () => play(true);
    $('#erep', st).onclick = () => { if (reps >= 2) return; reps++; $('#ereps', st).textContent = 2 - reps; if (reps >= 2) $('#erep', st).disabled = true; play(); };
    round();
  }

  /* =================================================================
     10) DESLIZA Y TRADUCE — contrarreloj de verdadero/falso
     ================================================================= */
  function swipe(G, st, D) {
    const pool = [...D.w, ...D.s.filter(s => s.en.length <= 46)]; const next = deck(pool); let card = null, busy = false, n = 0; const MAXC = 40;
    st.innerHTML = `<div class="ar-swipe"><div class="ar-sdeck" id="sdeck"></div>
      <div class="ar-sbtns"><button class="ar-sb no" id="sno" aria-label="Incorrecta">✗<small>No</small></button><button class="ar-sb yes" id="syes" aria-label="Correcta">✓<small>Sí</small></button></div>
      <p class="muted ar-shint">← Desliza la tarjeta o toca los botones →</p></div>`;
    const deckEl = $('#sdeck', st);
    G.countdown(45, () => G.end({ win: G.ok >= 15, title: G.ok >= 15 ? '¡Traductor relámpago! ⚡' : undefined, msg: `Respondiste ${G.ok + G.bad} tarjetas.` }));
    function deal() {
      if (!G.alive) return;
      if (n >= MAXC) return G.end({ win: true, title: '¡Mazo completo! ⚡', msg: 'Respondiste todas las tarjetas.' });
      n++; const it = next(); const truth = Math.random() < .5; const es = truth ? it.es : others(pool, it, 1, 'es')[0].es;
      card = { it, truth, el: h(`<div class="ar-scard"><small>¿Es correcta la traducción?</small><b class="${it.en.length > 22 ? 'long' : ''}">${esc(it.en)}</b><span class="ar-seq">=</span><p>${esc(es)}</p><i class="ar-stamp y">SÍ ✓</i><i class="ar-stamp n">NO ✗</i></div>`) };
      deckEl.innerHTML = ''; deckEl.appendChild(card.el); busy = false; drag(card.el);
    }
    function decide(yes) {
      if (busy || !card || !G.alive) return; busy = true; const c = card; const ok = yes === c.truth;
      c.el.classList.add(yes ? 'out-r' : 'out-l'); fx('whoosh');
      if (ok) G.hit(yes ? $('#syes', st) : $('#sno', st), 10);
      else { G.miss(c.el, { life: false, txt: '−3s' }); if (G.timer) G.timer.left = Math.max(0, G.timer.left - 3); }
      if (!c.truth || ok) { /* nada */ }
      G.after(280, deal);
    }
    function drag(el) {
      let x0 = null, dx = 0;
      el.addEventListener('pointerdown', e => { x0 = e.clientX; dx = 0; el.style.transition = 'none'; try { el.setPointerCapture(e.pointerId); } catch (x) { } });
      el.addEventListener('pointermove', e => { if (x0 == null) return; dx = e.clientX - x0; el.style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`; el.classList.toggle('lean-r', dx > 40); el.classList.toggle('lean-l', dx < -40); });
      const up = () => { if (x0 == null) return; x0 = null; el.style.transition = ''; if (Math.abs(dx) > 80) { el.style.transform = ''; decide(dx > 0); } else { el.style.transform = ''; el.classList.remove('lean-r', 'lean-l'); } };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    }
    $('#syes', st).onclick = () => decide(true); $('#sno', st).onclick = () => decide(false);
    G.cheat = () => busy || !card ? null : (card.truth ? $('#syes', st) : $('#sno', st));
    deal();
  }

  const RUN = { rain, memory, race, wheel, mole, tower, quiz, voice: voiceGame, echo, swipe };

  // gancho para pruebas automáticas (no afecta a los estudiantes)
  window.ARCADE = { GAMES, get S() { return S; }, get current() { return current; }, get level() { return LV; }, lobby, intro: (id) => intro(GAMES.find(g => g.id === id)), start: (id) => start(GAMES.find(g => g.id === id)) };

  topbar(); lobby();
})();
