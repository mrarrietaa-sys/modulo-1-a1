/* =====================================================================
   JUEGOS ÚNICOS POR CLASE (v22) — cada clase tiene su propia dinámica
   t1p1 clockGreet · t1p2 chatReply · t2p1 simonLetters · t2p2 plateGame
   t3p1 passport · t3p2 airport · t4p1 bingo · t4p2 colorMix
   t5p1 slotBe · t5p2 whackAn · t6p1 riddleJob · t6p2 elevator
   t7p1 familyTree · t7p2 animalSounds · t8p1 restaurant · t8p2 market
   t9p1 dayFlip · t9p2 specialDates · t10p1 weatherTV · t10p2 suitcase
   t11p1 flashlight · t11p2 housePlan · t12p1 pluralMachine · t12p2 magicMirror
   t13p1 nearFar · t13p2 theseRush · t14p1 countRoom · t14p2 memoryRoom
   ===================================================================== */
(function () {
  const M = window.M1, A = window.M1A;
  const { $, $$, h, esc, shuffle, sample, sleep, play, stop, sfx, sheet, photo } = M;
  const { head, result } = A;
  const G = () => window.M1G3 || {};
  const V = (p, en) => (p.vocab || []).find(v => v.en.toLowerCase() === String(en).toLowerCase());
  const PV = (id) => (M.partById(id) || {}).vocab || [];
  const live = (stage) => stage.isConnected;

  function waitBtn(body, txt = 'Continuar →') {
    return new Promise(res => { const bar = h(`<div class="actionbar g3-next"><button class="btn k lg">${txt}</button></div>`); body.appendChild(bar); bar.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); $('button', bar).onclick = () => { stop(); bar.remove(); res(); }; });
  }
  // opciones de texto: devuelve true/false y marca la correcta
  async function ask(parent, labels, correct, cls = '') {
    const wrap = h(`<div class="opts g3-opts ${cls}"></div>`);
    const btns = labels.map(l => { const b = h(`<button class="opt">${l}</button>`); wrap.appendChild(b); return b; });
    parent.appendChild(wrap);
    const i = await new Promise(r => btns.forEach((b, k) => b.onclick = () => r(k)));
    btns.forEach(b => b.disabled = true); btns[correct].classList.add('right'); if (i !== correct) btns[i].classList.add('wrong');
    return i === correct;
  }
  // opciones con foto SIEMPRE con la palabra debajo
  const imgCard = (v, extra = '') => `<button class="opt imgopt ${extra}">${photo(v.img)}<span class="imglbl">${esc(v.en)}</span></button>`;
  async function askImg(parent, items, correct) {
    const wrap = h(`<div class="opts g3-opts g3-img"></div>`);
    const btns = items.map(v => { const b = h(imgCard(v)); wrap.appendChild(b); return b; });
    parent.appendChild(wrap);
    const i = await new Promise(r => btns.forEach((b, k) => b.onclick = () => r(k)));
    btns.forEach(b => b.disabled = true); btns[correct].classList.add('right'); if (i !== correct) btns[i].classList.add('wrong');
    return i === correct;
  }
  // retroalimentación: dice si está bien o mal, muestra inglés = español y suena el audio
  async function say(body, ok, en, es, au) {
    const fb = h(`<div class="g3-fb ${ok ? 'ok' : 'no'}">${ok ? '✅ ¡Correcto!' : '❌ ¡Casi! La respuesta es:'} <b>${esc(en)}</b>${es ? `<span>${esc(es)}</span>` : ''}</div>`);
    body.appendChild(fb); fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    sfx(ok ? 'ok' : 'bad'); await sleep(300);
    if (au) await play(au);
    if (ok) { if (Math.random() < .35) M.praise(); await sleep(800); }
    else await waitBtn(body);
  }
  async function finish(c, t, skill, missed, title, good, okMsg) {
    if (t && c >= t - 1) { M.confetti(1300); sfx('win'); }
    await sheet({ ok: c >= t / 2, title: `${title}: ${c} de ${t}`, msg: c >= t - 1 ? okMsg : good || 'Repasa las palabras y vuelve a intentarlo. ¡Tú puedes! 💪' });
    return result(c, t, skill, missed);
  }
  const rep = (au, label = '🔊 Escuchar') => { const b = h(`<button class="btn w sm g3-rep">${label}</button>`); b.onclick = () => { sfx('tap'); play(au); }; return b; };

  /* ====== t1p1 — EL RELOJ DE LOS SALUDOS ====== */
  async function clockGreet(stage, p) {
    const R = shuffle([
      { t: '7:30', ap: 'a.m.', per: 'morning', es: 'Llegas a la oficina a las 7:30 de la mañana.', a: 'Good morning', o: ['Good night', 'Good evening'] },
      { t: '2:00', ap: 'p.m.', per: 'afternoon', es: 'Saludas a tu profe a las 2:00 de la tarde.', a: 'Good afternoon', o: ['Good morning', 'Good night'] },
      { t: '7:00', ap: 'p.m.', per: 'evening', es: 'Llegas a un restaurante a las 7:00 de la noche.', a: 'Good evening', o: ['Good night', 'Good afternoon'] },
      { t: '10:30', ap: 'p.m.', per: 'night', es: 'Te vas a dormir a las 10:30 de la noche.', a: 'Good night', o: ['Good evening', 'Good morning'] },
      { t: '5:00', ap: 'p.m.', per: 'afternoon', es: 'Te despides de un compañero y lo ves mañana.', a: 'See you tomorrow', o: ['Good afternoon', 'Hello'] },
    ]);
    let c = 0; const missed = [];
    const ic = { morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙' };
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const v = V(p, r.a) || {};
      const body = head(stage, { lbl: 'Game', title: '⏰ El reloj de los saludos', ins: 'Mira la hora y la situación. Elige el <b>saludo o despedida</b> correcto.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g3-sky ${r.per}"><div class="g3-ic">${ic[r.per]}</div><div class="g3-time">${r.t}<small>${r.ap}</small></div><p>${esc(r.es)}</p></div>`));
      const labels = shuffle([r.a, ...r.o]);
      const ok = await ask(body, labels.map(esc), labels.indexOf(r.a));
      if (ok) c++; else missed.push(v);
      await say(body, ok, r.a, v.es, v.au);
    }
    return finish(c, R.length, 'reading', missed, '⏰ Saludos', '', '¡Ya sabes saludar a cualquier hora! 🕐');
  }

  /* ====== t1p2 — CHAT EXPRESS ====== */
  async function chatReply(stage, p) {
    const R = G().chat || []; let c = 0; const missed = [];
    const body = head(stage, { lbl: 'Game', title: '💬 Chat express', ins: 'Te llegan mensajes en inglés. Escucha 🔊 y elige la <b>respuesta correcta</b> para seguir la conversación.' });
    const ph = h(`<div class="g3-phone"><div class="g3-ph-top">👩🏻 <b>Laura</b> <small>en línea</small></div><div class="g3-msgs"></div></div>`); body.appendChild(ph);
    const msgs = $('.g3-msgs', ph); const zone = h(`<div></div>`); body.appendChild(zone);
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; zone.innerHTML = '';
      const typing = h(`<div class="g3-msg in typing">• • •</div>`); msgs.appendChild(typing); msgs.scrollTop = 1e5; await sleep(700); typing.remove();
      const m = h(`<div class="g3-msg in">${esc(r.m)}<small>${esc(r.mes)}</small></div>`); msgs.appendChild(m); msgs.scrollTop = 1e5;
      play(r.mau); zone.appendChild(rep(r.mau, '🔊 Escuchar el mensaje'));
      const labels = shuffle([r.a, ...r.o]);
      const ok = await ask(zone, labels.map(esc), labels.indexOf(r.a));
      msgs.appendChild(h(`<div class="g3-msg out ${ok ? '' : 'fix'}">${esc(r.a)} ${ok ? '✓✓' : '✏️'}</div>`)); msgs.scrollTop = 1e5;
      if (ok) c++; else missed.push({ en: r.a, au: r.aau });
      await say(zone, ok, r.a, '', r.aau);
    }
    return finish(c, R.length, 'listening', missed, '💬 Respuestas', '', '¡Chateas en inglés como un pro! 📱');
  }

  /* ====== t2p1 — SIMÓN DICE LETRAS ====== */
  async function simonLetters(stage, p) {
    const L = (p.vocab || []).filter(v => v.au); const lens = [2, 2, 3, 3, 4]; let c = 0; const missed = [];
    for (let k = 0; k < lens.length && live(stage); k++) {
      const seq = sample(L, lens[k]);
      const body = head(stage, { lbl: 'Game', title: '🟥 Simón dice letras', ins: 'Escucha las letras <b>en orden</b> y luego tócalas en el mismo orden.', count: `${k + 1} / ${lens.length}` });
      const show = h(`<div class="g3-seq">${seq.map(() => '<i>?</i>').join('')}</div>`); body.appendChild(show);
      const pad = h(`<div class="g3-pad">${L.map(v => `<button>${esc(v.en)}</button>`).join('')}</div>`); body.appendChild(pad);
      const btns = $$('button', pad); btns.forEach(b => b.disabled = true);
      const st = h(`<p class="center g3-st">🎧 Escucha…</p>`); body.appendChild(st);
      const playSeq = async () => { btns.forEach(b => b.disabled = true); for (const v of seq) { if (!live(stage)) return; const b = btns[L.indexOf(v)]; b.classList.add('lit'); await play(v.au); b.classList.remove('lit'); await sleep(250); } btns.forEach(b => b.disabled = false); st.textContent = '👆 Ahora toca las letras en orden'; };
      await sleep(400); await playSeq();
      const r = rep(null, '🔊 Repetir'); r.onclick = () => { st.textContent = '🎧 Escucha…'; playSeq(); }; body.appendChild(h(`<div class="center"></div>`)).appendChild(r);
      const ok = await new Promise(res => { let i = 0; btns.forEach((b, j) => b.onclick = () => { const v = L[j]; play(v.au);
        if (v === seq[i]) { $$('i', show)[i].textContent = v.en; $$('i', show)[i].className = 'ok'; i++; sfx('tap'); if (i === seq.length) res(true); }
        else { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); res(false); } }); });
      btns.forEach(b => b.disabled = true); r.disabled = true;
      seq.forEach((v, i) => { $$('i', show)[i].textContent = v.en; });
      if (ok) c++; else missed.push(...seq);
      await say(body, ok, seq.map(v => v.en).join(' – '), '', null);
    }
    return finish(c, lens.length, 'listening', missed, '🟥 Secuencias', '', '¡Memoria y oído de campeón! 🧠');
  }

  /* ====== t2p2 — LA PLACA DEL CARRO ====== */
  async function plateGame(stage, p) {
    const L = (p.vocab || []).filter(v => v.au && /^[A-Z]$/.test(v.en)); const R = 4; let c = 0; const missed = [];
    for (let k = 0; k < R && live(stage); k++) {
      const seq = sample(L, 3); const num = String(100 + Math.floor(Math.random() * 899));
      const body = head(stage, { lbl: 'Game', title: '🚗 La placa del carro', ins: 'Un policía te dicta las <b>letras de una placa</b>. Escucha y escribe las 3 letras.', count: `${k + 1} / ${R}` });
      const plate = h(`<div class="g3-plate"><small>COLOMBIA</small><div><b id="pl">? ? ?</b> ${num}</div><small>BOGOTÁ D.C.</small></div>`); body.appendChild(plate);
      const sayIt = async () => { for (const v of seq) { if (!live(stage)) return; await play(v.au); await sleep(350); } };
      const tools = h(`<div class="row" style="justify-content:center;gap:10px;margin:8px 0"></div>`); const r = rep(null, '🔊 Escuchar otra vez'); r.onclick = sayIt; tools.appendChild(r);
      const hb = h(`<button class="btn w sm">💡 Pista</button>`); tools.appendChild(hb); body.appendChild(tools);
      const hint = h(`<p class="hintline center"></p>`); body.appendChild(hint);
      const inp = h(`<div class="g3-inwrap"><input class="inp g3-in" maxlength="3" placeholder="Ej: NPZ" autocomplete="off" autocapitalize="characters"></div>`); body.appendChild(inp);
      hb.onclick = () => { hint.textContent = `💡 La primera letra es ${seq[0].en}`; };
      setTimeout(sayIt, 350);
      const ok = await new Promise(res => { const bar = h(`<div class="actionbar"><button class="btn k lg">Comprobar ✓</button></div>`); body.appendChild(bar); const i = $('input', inp);
        const go = () => { const v = i.value.toUpperCase().replace(/[^A-Z]/g, ''); if (v.length < 3) { M.toast('Escribe las 3 letras ✍️'); return; } bar.remove(); i.disabled = true; res(v === seq.map(x => x.en).join('')); };
        $('button', bar).onclick = go; i.onkeydown = e => { if (e.key === 'Enter') go(); }; });
      $('#pl', plate).textContent = seq.map(x => x.en).join(' ');
      if (ok) c++; else missed.push(...seq);
      await say(body, ok, seq.map(x => x.en).join(' – '), '', null);
    }
    return finish(c, R, 'listening', missed, '🚗 Placas', '', '¡Entiendes el deletreo perfectamente! 🚓');
  }

  /* ====== t3p1 — MI PASAPORTE ====== */
  async function passport(stage, p) {
    const flags = PV('t3p2'); const P = (p.vocab || []).map((v, i) => ({ v, flag: (flags[i] || {}).img })).filter(x => x.flag);
    const R = sample(P, Math.min(6, P.length)); let c = 0; const missed = []; const stamps = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const it = R[k];
      const body = head(stage, { lbl: 'Game', title: '🛂 Mi pasaporte', ins: 'Mira la bandera y elige el <b>país</b>. Cada respuesta correcta pone un sello en tu pasaporte.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g3-pass"><div class="g3-pass-h">PASSPORT · PASAPORTE</div><div class="g3-stamps">${stamps.map(s => `<span>${esc(s)}</span>`).join('') || '<em>Sin sellos todavía ✈️</em>'}</div></div>`));
      body.appendChild(h(`<div class="g3-flag">${photo(it.flag)}</div>`));
      const opts = shuffle([it, ...sample(P.filter(x => x !== it), 2)]);
      const ok = await ask(body, opts.map(o => esc(o.v.en)), opts.indexOf(it));
      if (ok) { c++; stamps.push(it.v.en); } else missed.push(it.v);
      await say(body, ok, it.v.en, it.v.es, it.v.au);
    }
    return finish(c, R.length, 'reading', missed, '🛂 Sellos', '', '¡Tu pasaporte está lleno! 🌍');
  }

  /* ====== t3p2 — EN EL AEROPUERTO ====== */
  async function airport(stage, p) {
    const cs = PV('t3p1'); const P = (p.vocab || []).map((v, i) => ({ v, c: cs[i] })).filter(x => x.c);
    const R = sample(P, Math.min(5, P.length)); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const it = R[k];
      const body = head(stage, { lbl: 'Game', title: '✈️ En el aeropuerto', ins: 'El oficial de migración te pregunta de dónde eres. Mira tu tarjeta y responde con la <b>nacionalidad</b>.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g3-desk"><div class="g3-officer">👮🏽‍♂️<div class="bubble">Where are you from?<small>¿De dónde eres?</small></div></div><div class="g3-card"><div class="g3-mini">${photo(it.v.img)}</div><div><small>TARJETA DE VIAJERO</small><b>Soy de ${esc(it.c.es)}</b></div></div></div>`));
      play(G().where);
      const other = sample(P.filter(x => x !== it), 1)[0];
      const labels = shuffle([`I'm ${it.v.en}.`, `I'm ${other.v.en}.`, `I'm ${it.c.en.replace(/^The /, 'the ')}.`]);
      const ok = await ask(body, labels.map(esc), labels.indexOf(`I'm ${it.v.en}.`));
      if (ok) c++; else missed.push(it.v);
      await say(body, ok, `I'm ${it.v.en}.`, `Soy ${it.v.es}.`, it.v.au);
    }
    return finish(c, R.length, 'speaking', missed, '✈️ Migración', '', '¡Pasaste migración sin problemas! 🛃');
  }

  /* ====== t4p1 — BINGO DE NÚMEROS ====== */
  async function bingo(stage, p) {
    const P = (p.vocab || []).filter(v => v.au); const card = sample(P, 9); const calls = shuffle(card.slice()); let c = 0; const missed = []; const marked = new Set(); let bingoed = false;
    const body = head(stage, { lbl: 'Game', title: '🎱 ¡Bingo!', ins: 'Escucha el número 🔊 y márcalo en tu cartón. ¡Completa una línea para gritar <b>BINGO</b>!' });
    const st = h(`<div class="g3-call">🔊 <b id="bn">—</b><span id="bc"></span></div>`); body.appendChild(st);
    const grid = h(`<div class="g3-bingo">${card.map(v => `<button><b>${esc(v.en)}</b><small></small></button>`).join('')}</div>`); body.appendChild(grid);
    const cells = $$('button', grid); const rp = rep(null, '🔊 Repetir número'); body.appendChild(h(`<div class="center"></div>`)).appendChild(rp);
    const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (let k = 0; k < calls.length && live(stage); k++) {
      const it = calls[k]; $('#bn', st).textContent = `Número ${k + 1} de 9`; $('#bc', st).textContent = '';
      rp.onclick = () => play(it.au); await sleep(300); play(it.au);
      let first = true;
      await new Promise(res => cells.forEach((b, j) => b.onclick = () => { if (marked.has(j)) return;
        if (card[j] === it) { marked.add(j); b.classList.add('on'); $('small', b).textContent = it.es; sfx('ok'); play(it.au); if (first) c++; else missed.push(it); res(); }
        else { first = false; sfx('bad'); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); } }));
      if (!bingoed && lines.some(l => l.every(x => marked.has(x)))) { bingoed = true; M.confetti(1200); sfx('win'); const bb = h(`<div class="g3-bingo-yell">🎉 BINGO! 🎉</div>`); body.appendChild(bb); setTimeout(() => bb.remove(), 1500); }
      await sleep(700);
    }
    return finish(c, calls.length, 'listening', missed, '🎱 Números al primer intento', '', '¡Cartón lleno! Tus oídos ya entienden los números 👂');
  }

  /* ====== t4p2 — MEZCLA DE COLORES ====== */
  async function colorMix(stage, p) {
    const CSS = { red: '#E3242B', blue: '#1D5FD1', yellow: '#FACC15', green: '#16A34A', orange: '#F97316', purple: '#7C3AED', pink: '#F472B6', brown: '#8B5A2B', black: '#111', white: '#fff', gray: '#9CA3AF' };
    const MIX = [['red', 'yellow', 'orange'], ['blue', 'yellow', 'green'], ['red', 'blue', 'purple'], ['red', 'white', 'pink'], ['black', 'white', 'gray'], ['orange', 'black', 'brown']].filter(m => m.every(x => V(p, x)));
    const R = shuffle(MIX).slice(0, 5); let c = 0; const missed = [];
    const dot = (n) => `<i class="g3-dot" style="background:${CSS[n]}"></i>`;
    for (let k = 0; k < R.length && live(stage); k++) {
      const [a, b, r] = R[k]; const v = V(p, r);
      const body = head(stage, { lbl: 'Game', title: '🎨 Mezcla de colores', ins: '¿Qué color sale al mezclar? Elige el <b>nombre del color</b> en inglés.', count: `${k + 1} / ${R.length}` });
      const mix = h(`<div class="g3-mix"><div class="g3-pot" style="--c:${CSS[a]}"><span>${a}</span></div><b>+</b><div class="g3-pot" style="--c:${CSS[b]}"><span>${b}</span></div><b>=</b><div class="g3-pot q" style="--c:#fff"><span>?</span></div></div>`); body.appendChild(mix);
      const opts = shuffle([r, ...sample(Object.keys(CSS).filter(x => x !== r && x !== a && x !== b && V(p, x)), 2)]);
      const ok = await ask(body, opts.map(o => `${dot(o)} ${o}`), opts.indexOf(r));
      const q = $('.g3-pot.q', mix); q.style.setProperty('--c', CSS[r]); q.classList.add('fill'); $('span', q).textContent = r;
      if (ok) c++; else missed.push(v);
      await say(body, ok, `${a} + ${b} = ${r}`, `${(V(p, a) || {}).es} + ${(V(p, b) || {}).es} = ${v.es}`, v.au);
    }
    return finish(c, R.length, 'reading', missed, '🎨 Mezclas', '', '¡Eres todo un artista! 🖌️');
  }

  /* ====== t5p1 — TRAGAMONEDAS DEL VERBO TO BE ====== */
  async function slotBe(stage, p) {
    const R = sample(G().slot || [], 6); const PR = ['I', 'You', 'He', 'She', 'It', 'We', 'They']; let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🎰 La tragamonedas', ins: 'Jala la palanca. Cuando salga el pronombre, elige <b>am, is</b> o <b>are</b>.', count: `${k + 1} / ${R.length}` });
      const sl = h(`<div class="g3-slot"><div class="g3-reel"><b>?</b></div><div class="g3-reel v"><b>___</b></div><div class="g3-reel r"><b>${esc(r.rest)}</b></div></div>`); body.appendChild(sl);
      const go = h(`<div class="center"><button class="btn lg">🎰 ¡Jalar la palanca!</button></div>`); body.appendChild(go);
      await new Promise(res => $('button', go).onclick = res); go.remove();
      const reel = $('.g3-reel b', sl); sl.classList.add('spin');
      for (let s = 0; s < 14; s++) { reel.textContent = PR[s % 7]; sfx('tap'); await sleep(60 + s * 9); }
      reel.textContent = r.p; sl.classList.remove('spin'); sfx('win');
      body.appendChild(h(`<p class="center muted" style="margin:4px 0 0"><i>${esc(r.es)}</i></p>`));
      const opts = ['am', 'is', 'are'];
      const ok = await ask(body, opts, opts.indexOf(r.v), 'g3-three');
      $('.g3-reel.v b', sl).textContent = r.v;
      if (ok) c++; else missed.push({ en: `${r.p} ${r.v} ${r.rest}`, au: r.au });
      await say(body, ok, `${r.p} ${r.v} ${r.rest}`, r.es, r.au);
    }
    return finish(c, R.length, 'writing', missed, '🎰 Jackpots', '', '¡Jackpot! Dominas el verbo To Be 💰');
  }

  /* ====== t5p2 — GOLPEA AL TOPO (A / AN) ====== */
  async function whackAn(stage, p) {
    const W = G().whack || { a: [], an: [] }; const DUR = 22000; let hit = 0, wrong = 0, shown = 0; const anSeen = new Set(); const missed = [];
    const body = head(stage, { lbl: 'Game', title: '🔨 Golpea al topo', ins: 'Golpea <b>solo</b> los topos con palabras que usan <b>AN</b> (empiezan con sonido de vocal: an <b>a</b>pple, an <b>e</b>gg). ¡Cuidado con los de <b>A</b>!' });
    const hud = h(`<div class="cw-hud"><span>⏱️ <b id="wt">22</b>s</span><span>✅ <b id="wh">0</b></span><span>❌ <b id="ww">0</b></span></div>`); body.appendChild(hud);
    const field = h(`<div class="g3-holes">${Array.from({ length: 9 }, () => '<div class="g3-hole"><button class="g3-mole"></button></div>').join('')}</div>`); body.appendChild(field);
    const go = h(`<div class="center"><button class="btn k lg">🔨 ¡Empezar!</button></div>`); body.appendChild(go);
    await new Promise(r => $('button', go).onclick = r); go.remove();
    const moles = $$('.g3-mole', field); const t0 = Date.now();
    await new Promise(done => {
      const spawn = () => {
        if (!live(stage)) return done(); const left = DUR - (Date.now() - t0); $('#wt', hud).textContent = Math.max(0, Math.ceil(left / 1000));
        if (left <= 0) return done();
        const free = moles.filter(m => !m.classList.contains('up')); if (free.length) {
          const m = sample(free, 1)[0]; const isAn = Math.random() < .45; const w = sample(isAn ? W.an : W.a, 1)[0];
          m.textContent = w; m.dataset.an = isAn ? 1 : ''; m.classList.add('up'); if (isAn) { shown++; anSeen.add(w); }
          m.onclick = () => { if (!m.classList.contains('up')) return; m.classList.remove('up');
            if (m.dataset.an) { hit++; sfx('ok'); m.parentNode.classList.add('bonk'); $('#wh', hud).textContent = hit; }
            else { wrong++; sfx('bad'); missed.push({ en: `a ${w}` }); M.toast(`❌ Es “a ${w}”`); $('#ww', hud).textContent = wrong; }
            setTimeout(() => m.parentNode.classList.remove('bonk'), 300); };
          setTimeout(() => m.classList.remove('up'), 1500);
        }
        setTimeout(spawn, 800);
      }; spawn();
    });
    moles.forEach(m => { m.classList.remove('up'); m.onclick = null; });
    const t = Math.max(1, shown + wrong); const c = Math.min(hit, t);
    body.appendChild(h(`<div class="g3-fb ok">📝 Palabras con <b>AN</b>: ${[...anSeen].map(w => `an ${esc(w)}`).join(', ')}</div>`));
    if (c >= t * .7) { M.confetti(1200); sfx('win'); }
    await sheet({ ok: c >= t / 2, title: `🔨 Golpeaste ${hit} topos con AN`, msg: `Errores: ${wrong}. Recuerda: <b>an</b> antes de sonido de vocal (an apple), <b>a</b> antes de consonante (a book).` });
    return result(c, t, 'reading', missed);
  }

  /* ====== t6p1 — ¿QUIÉN SOY? (adivinanzas de profesiones) ====== */
  async function riddleJob(stage, p) {
    const R = sample((G().riddle || []).filter(r => V(p, r.job)), 5); let c = 0, clues = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const v = V(p, r.job); let n = 1;
      const body = head(stage, { lbl: 'Game', title: '🕵️ ¿Quién soy?', ins: 'Lee y escucha las pistas. Adivina la <b>profesión</b>. ¡Con menos pistas, mejor detective!', count: `${k + 1} / ${R.length}` });
      const box = h(`<div class="g3-clues"></div>`); body.appendChild(box);
      const addClue = () => { const cl = r.clues[n - 1]; box.appendChild(h(`<div class="g3-clue"><b>🔎 ${n}.</b> ${esc(cl.en)}<small>${esc(cl.es)}</small></div>`)); play(cl.au); };
      addClue();
      const more = h(`<div class="center"><button class="btn w sm">🔎 Otra pista</button></div>`); body.appendChild(more);
      $('button', more).onclick = () => { if (n < 3) { n++; addClue(); } if (n >= 3) more.remove(); };
      const opts = shuffle([v, ...sample((p.vocab || []).filter(x => x !== v && (G().riddle || []).some(q => q.job === x.en)), 3)]);
      const ok = await askImg(body, opts, opts.indexOf(v)); more.remove();
      if (ok) { c++; clues += n; } else missed.push(v);
      await say(body, ok, `I'm a ${v.en}!`, v.es, v.au);
    }
    return finish(c, R.length, 'reading', missed, '🕵️ Adivinaste', '', `¡Gran detective! Usaste ${clues} pistas 🔍`);
  }

  /* ====== t6p2 — EL ELEVADOR ====== */
  async function elevator(stage, p) {
    const R = sample((G().elev || []).filter(e => V(p, e.place)), 6); let c = 0; const missed = [];
    const em = { school: '🏫', hospital: '🏥', restaurant: '🍽️', farm: '🚜', airport: '✈️', 'fire station': '🚒', office: '🏢' };
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const v = V(p, r.place);
      const body = head(stage, { lbl: 'Game', title: '🛗 El elevador', ins: 'Completa la frase con el <b>lugar de trabajo</b>. Si aciertas, el elevador sube un piso. ¡Llega a la terraza!', count: `Piso ${k + 1} / ${R.length}` });
      const bld = h(`<div class="g3-bld">${R.map((x, i) => `<div class="g3-floor ${i < k ? 'done' : i === k ? 'cur' : ''}"><span>${i + 1}</span>${i < k ? em[x.place] + ' ' + esc(x.place) : i === k ? '🛗' : ''}</div>`).reverse().join('')}</div>`); body.appendChild(bld);
      body.appendChild(h(`<div class="g3-sent">${esc(r.pre)}<u>______</u>.<small>${esc(r.es)}</small></div>`));
      const opts = shuffle([r.place, ...sample(R.concat(G().elev || []).map(x => x.place).filter((x, i, a) => x !== r.place && a.indexOf(x) === i), 2)]);
      const ok = await ask(body, opts.map(o => `${em[o] || ''} ${esc(o)}`), opts.indexOf(r.place));
      if (ok) c++; else missed.push({ en: r.full, au: r.au });
      await say(body, ok, r.full, r.es, r.au);
    }
    return finish(c, R.length, 'writing', missed, '🛗 Pisos', '', '¡Llegaste a la terraza! 🏙️');
  }

  /* ====== t7p1 — EL ÁRBOL GENEALÓGICO ====== */
  async function familyTree(stage, p) {
    const F = G().tree || []; const by = Object.fromEntries(F.map(x => [x.name, x])); const R = sample(F, 6); let c = 0; const missed = []; const known = new Set();
    const rows = [['Joe', 'Rose'], ['Mike', 'Sara'], ['Ben', 'TOM', 'Emma'], ['Lily'], ['Leo', 'Mia']];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🌳 La familia de Tom', ins: 'Tú eres <b>Tom</b>. Mira la persona marcada y elige qué es de Tom.', count: `${k + 1} / ${R.length}` });
      const node = (n) => n === 'TOM' ? `<div class="g3-node me">🧑🏻<b>Tom</b><small>YOU</small></div>` : `<div class="g3-node ${n === r.name ? 'hl' : ''}">${by[n].e}<b>${n}</b><small>${known.has(n) ? by[n].rel : ''}</small></div>`;
      body.appendChild(h(`<div class="g3-tree">${rows.map((row, i) => `<div class="g3-trow ${i === 3 ? 'wife' : ''}">${row.map(node).join('')}</div>`).join('')}</div>`));
      body.appendChild(h(`<div class="g3-sent">${esc(r.name)} is Tom's <u>______</u>.<small>¿Qué es ${esc(r.name)} de Tom?</small></div>`));
      const opts = shuffle([r.rel, ...sample(F.filter(x => x.rel !== r.rel).map(x => x.rel), 2)]);
      const ok = await ask(body, opts, opts.indexOf(r.rel), 'g3-three');
      known.add(r.name); if (ok) c++; else missed.push({ en: `${r.name} is Tom's ${r.rel}.`, au: r.au });
      await say(body, ok, `${r.name} is Tom's ${r.rel}.`, `${r.name} es ${r.es} de Tom.`, r.au);
    }
    return finish(c, R.length, 'reading', missed, '🌳 Familiares', '', '¡Conoces a toda la familia! 👨‍👩‍👧‍👦');
  }

  /* ====== t7p2 — ¿QUÉ ANIMAL HACE ESTE SONIDO? ====== */
  async function animalSounds(stage, p) {
    const R = sample((G().sound || []).filter(s => V(p, s.an)), 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const v = V(p, r.an);
      const body = head(stage, { lbl: 'Game', title: '🐾 ¿Quién hace este sonido?', ins: 'En inglés los animales “hablan” diferente 😄. Escucha el sonido y elige el <b>animal</b>.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g3-snd"><div class="bubble">“${esc(r.snd)}”</div></div>`)).appendChild(rep(r.au, '🔊 Escuchar sonido'));
      play(r.au);
      const pool = R.concat(G().sound || []).map(x => V(p, x.an)).filter((x, i, a) => x && x !== v && a.indexOf(x) === i);
      const opts = shuffle([v, ...sample(pool, 2)]);
      const ok = await askImg(body, opts, opts.indexOf(v));
      if (ok) c++; else missed.push(v);
      await say(body, ok, `A ${v.en} says “${r.snd}”`, `${v.es} — en español: ${r.es}`, v.au);
    }
    return finish(c, R.length, 'listening', missed, '🐾 Animales', '', '¡Ya hablas el idioma de los animales! 🐶');
  }

  /* ====== t8p1 — EL RESTAURANTE ====== */
  async function restaurant(stage, p) {
    const R = sample((G().order || []).filter(o => o.items.every(x => V(p, x))), 4); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const want = r.items.map(x => V(p, x));
      const body = head(stage, { lbl: 'Game', title: '🍽️ ¡Eres el mesero!', ins: 'Escucha el pedido del cliente 🔊 y toca los <b>2 platos</b> que pidió. Luego toca “Servir”.', count: `Mesa ${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g3-officer">🧔🏽<div class="bubble">🔊 “${esc(r.en)}”<small>${esc(r.es)}</small></div></div>`)).appendChild(rep(r.au, '🔊 Escuchar pedido'));
      play(r.au);
      const menu = shuffle([...want, ...sample((p.vocab || []).filter(x => !want.includes(x)), 4)]);
      const wrap = h(`<div class="opts g3-opts g3-img g3-menu">${menu.map(v => imgCard(v)).join('')}</div>`); body.appendChild(wrap);
      const tray = h(`<div class="g3-tray">🍽️ Bandeja: <b>vacía</b></div>`); body.appendChild(tray);
      const btns = $$('.opt', wrap); const sel = new Set();
      const bar = h(`<div class="actionbar"><button class="btn k lg" disabled>🛎️ Servir</button></div>`); body.appendChild(bar);
      btns.forEach((b, i) => b.onclick = () => { if (sel.has(i)) { sel.delete(i); b.classList.remove('sel'); } else if (sel.size < 2) { sel.add(i); b.classList.add('sel'); sfx('tap'); }
        $('b', tray).textContent = sel.size ? [...sel].map(j => menu[j].en).join(' + ') : 'vacía'; $('button', bar).disabled = sel.size !== 2; });
      await new Promise(res => $('button', bar).onclick = res); bar.remove(); btns.forEach(b => b.disabled = true);
      const ok = [...sel].every(j => want.includes(menu[j]));
      btns.forEach((b, i) => { if (want.includes(menu[i])) b.classList.add('right'); else if (sel.has(i)) b.classList.add('wrong'); });
      if (ok) c++; else missed.push(...want);
      await say(body, ok, r.en, r.es, r.au);
    }
    return finish(c, R.length, 'listening', missed, '🍽️ Pedidos perfectos', '', '¡Mejor mesero del mes! 🏅');
  }

  /* ====== t8p2 — EL SUPERMERCADO ====== */
  async function market(stage, p) {
    const P = (p.vocab || []).filter(v => v.img); let c = 0, wrong = 0; const missed = []; const ROUNDS = 2;
    for (let k = 0; k < ROUNDS && live(stage); k++) {
      const list = sample(P, 3);
      const body = head(stage, { lbl: 'Game', title: '🛒 En el supermercado', ins: 'Lee la <b>lista de compras</b> (en español) y toca esos productos en inglés para meterlos al carrito.', count: `${k + 1} / ${ROUNDS}` });
      const ls = h(`<div class="g3-list"><b>📝 Lista de compras</b>${list.map(v => `<span data-en="${esc(v.en)}">☐ ${esc(v.es)}</span>`).join('')}</div>`); body.appendChild(ls);
      const shelf = shuffle([...list, ...sample(P.filter(x => !list.includes(x)), 5)]);
      const wrap = h(`<div class="opts g3-opts g3-img g3-menu">${shelf.map(v => imgCard(v)).join('')}</div>`); body.appendChild(wrap);
      const cart = h(`<div class="g3-tray">🛒 Carrito: <b>vacío</b></div>`); body.appendChild(cart); const got = [];
      await new Promise(res => $$('.opt', wrap).forEach((b, i) => b.onclick = () => { const v = shelf[i];
        if (list.includes(v) && !got.includes(v)) { got.push(v); c++; b.classList.add('right'); b.disabled = true; sfx('ok'); play(v.au); $(`[data-en="${CSS.escape(v.en)}"]`, ls).textContent = `☑ ${v.es} = ${v.en}`; $(`[data-en="${CSS.escape(v.en)}"]`, ls).classList.add('ok'); $('b', cart).textContent = got.map(x => x.en).join(', '); if (got.length === 3) setTimeout(res, 900); }
        else if (!list.includes(v)) { wrong++; sfx('bad'); b.classList.add('wrong'); M.toast(`❌ ${v.en} = ${v.es}`); setTimeout(() => b.classList.remove('wrong'), 600); } }));
      await say(body, true, list.map(v => v.en).join(', '), list.map(v => v.es).join(', '), null);
    }
    const t = ROUNDS * 3 + wrong;
    return finish(c, t, 'reading', missed, '🛒 Productos', '', '¡Compraste todo sin errores! 🧾');
  }

  /* ====== t9p1 — EL CALENDARIO (ayer y mañana) ====== */
  async function dayFlip(stage, p) {
    const R = sample(G().days || [], 5); const D = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']; let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const v = V(p, r.a) || {};
      const body = head(stage, { lbl: 'Game', title: '📅 Ayer, hoy y mañana', ins: 'Escucha y lee. ¿Qué día es <b>mañana</b> (tomorrow) o qué día fue <b>ayer</b> (yesterday)?', count: `${k + 1} / ${R.length}` });
      const cal = h(`<div class="g3-cal"><div class="g3-cal-top">TODAY · HOY</div><div class="g3-cal-d">${esc(r.today)}</div></div>`); body.appendChild(cal);
      body.appendChild(h(`<div class="g3-sent">${esc(r.q.split('. ')[1])}<small>${esc(r.es)}</small></div>`)).appendChild(rep(r.au));
      play(r.au);
      const opts = shuffle([r.a, ...sample(D.filter(d => d !== r.a && d !== r.today), 2)]);
      const ok = await ask(body, opts, opts.indexOf(r.a), 'g3-three');
      cal.classList.add('flip'); setTimeout(() => { $('.g3-cal-top', cal).textContent = r.w === 'tomorrow' ? 'TOMORROW · MAÑANA' : 'YESTERDAY · AYER'; $('.g3-cal-d', cal).textContent = r.a; }, 250);
      if (ok) c++; else missed.push(v);
      await say(body, ok, r.a, v.es, v.au);
    }
    return finish(c, R.length, 'listening', missed, '📅 Días', '', '¡Dominas los días de la semana! 🗓️');
  }

  /* ====== t9p2 — FECHAS ESPECIALES ====== */
  async function specialDates(stage, p) {
    const R = sample((G().dates || []).filter(d => V(p, d.m)), 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const v = V(p, r.m);
      const body = head(stage, { lbl: 'Game', title: '🎉 Fechas especiales', ins: '¿En qué <b>mes</b> es esta celebración? Escucha la pregunta y elige.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g3-cal big"><div class="g3-cal-top">${r.e}</div><div class="g3-cal-d sm">${esc(r.d)}</div><small>${esc(r.es)}</small></div>`));
      body.appendChild(h(`<div class="g3-sent">When is ${esc(r.d)}?<small>¿Cuándo es ${esc(r.es)}?</small></div>`)).appendChild(rep(r.au));
      play(r.au);
      const opts = shuffle([r.m, ...sample((p.vocab || []).map(x => x.en).filter(x => x !== r.m), 2)]);
      const ok = await ask(body, opts, opts.indexOf(r.m), 'g3-three');
      if (ok) c++; else missed.push(v);
      await say(body, ok, `It's in ${r.m}.`, `Es en ${v.es}.`, r.aau);
    }
    return finish(c, R.length, 'listening', missed, '🎉 Fechas', '', '¡Te sabes todas las fechas! 🎂');
  }

  /* ====== t10p1 — EL PRONÓSTICO EN TV ====== */
  async function weatherTV(stage, p) {
    const W = (G().wx || { cities: [], w: [] }); const ws = W.w.filter(x => V(p, x.w)); const cities = sample(W.cities, 5);
    const asg = cities.map(cy => ({ cy, w: sample(ws, 1)[0] })); let c = 0; const missed = []; const known = new Set();
    for (let k = 0; k < asg.length && live(stage); k++) {
      const r = asg[k]; const v = V(p, r.w.w);
      const body = head(stage, { lbl: 'Game', title: '📺 El pronóstico del tiempo', ins: 'Eres presentador(a) del clima. Mira el mapa y responde: <b>What\'s the weather like in…?</b>', count: `${k + 1} / ${asg.length}` });
      body.appendChild(h(`<div class="g3-tv"><div class="g3-tv-h">🔴 LIVE · WEATHER FORECAST</div><div class="g3-tv-grid">${asg.map((x, i) => `<div class="${i === k ? 'hl' : ''}"><span>${x.w.e}</span><b>${esc(x.cy.c)}</b><small>${known.has(i) ? x.w.w : ''}</small></div>`).join('')}</div></div>`));
      body.appendChild(h(`<div class="g3-sent">What's the weather like in ${esc(r.cy.c)}?<small>¿Cómo está el clima en ${esc(r.cy.c)}?</small></div>`)).appendChild(rep(r.cy.au));
      play(r.cy.au);
      const opts = shuffle([r.w, ...sample(ws.filter(x => x !== r.w), 2)]);
      const ok = await ask(body, opts.map(o => `It's ${o.w}.`), opts.indexOf(r.w), 'g3-three');
      known.add(k); if (ok) c++; else missed.push(v);
      await say(body, ok, `It's ${r.w.w} in ${r.cy.c}.`, `Está ${r.w.es} en ${r.cy.c}.`, r.w.au);
    }
    return finish(c, asg.length, 'speaking', missed, '📺 Pronósticos', '', '¡Listo(a) para el noticiero! 🎙️');
  }

  /* ====== t10p2 — HAZ LA MALETA ====== */
  async function suitcase(stage, p) {
    const R = (G().trip || []).filter(t => t.set.every(x => V(p, x))); let c = 0, t = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const want = r.set.map(x => V(p, x)); const others = R.filter(x => x !== r).flatMap(x => x.set.map(y => V(p, y)));
      const body = head(stage, { lbl: 'Game', title: '🧳 Haz la maleta', ins: 'Mira el destino y toca las <b>3 prendas</b> correctas para empacar.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g3-trip"><span>${r.e}</span><div><b>${esc(r.t)}</b><small>${esc(r.es)}</small></div></div>`)).appendChild(rep(r.au));
      play(r.au);
      const cl = shuffle([...want, ...sample(others, 3)]);
      const wrap = h(`<div class="opts g3-opts g3-img g3-menu">${cl.map(v => imgCard(v)).join('')}</div>`); body.appendChild(wrap);
      const bag = h(`<div class="g3-tray">🧳 Maleta: <b>vacía</b></div>`); body.appendChild(bag);
      const btns = $$('.opt', wrap); const sel = new Set(); const bar = h(`<div class="actionbar"><button class="btn k lg" disabled>🔒 Cerrar maleta</button></div>`); body.appendChild(bar);
      btns.forEach((b, i) => b.onclick = () => { if (sel.has(i)) { sel.delete(i); b.classList.remove('sel'); } else if (sel.size < 3) { sel.add(i); b.classList.add('sel'); sfx('tap'); play(cl[i].au); }
        $('b', bag).textContent = sel.size ? [...sel].map(j => cl[j].en).join(', ') : 'vacía'; $('button', bar).disabled = sel.size !== 3; });
      await new Promise(res => $('button', bar).onclick = res); bar.remove(); btns.forEach(b => b.disabled = true);
      const good = [...sel].filter(j => want.includes(cl[j])).length; c += good; t += 3;
      btns.forEach((b, i) => { if (want.includes(cl[i])) b.classList.add('right'); else if (sel.has(i)) b.classList.add('wrong'); });
      want.forEach(v => { if (![...sel].some(j => cl[j] === v)) missed.push(v); });
      await say(body, good === 3, want.map(v => v.en).join(', '), want.map(v => v.es).join(', '), null);
    }
    return finish(c, t, 'reading', missed, '🧳 Prendas correctas', '', '¡Maletas perfectas! ✈️');
  }

  /* ====== t11p1 — LA LINTERNA ====== */
  async function flashlight(stage, p) {
    const P = (p.vocab || []).filter(v => v.img); const items = sample(P, Math.min(8, P.length)); const targets = sample(items, 5); let c = 0; const missed = [];
    const body = head(stage, { lbl: 'Game', title: '🔦 La linterna', ins: '¡Se fue la luz! Mueve la linterna (el dedo o el mouse) por el escritorio y toca el <b>útil escolar</b> que te piden.' });
    const ask_ = h(`<div class="g3-call">🔎 Encuentra: <b id="fl">—</b></div>`); body.appendChild(ask_);
    const cells = shuffle(Array.from({ length: 12 }, (_, i) => i)).slice(0, items.length);
    const board = h(`<div class="g3-desk2">${items.map((v, i) => { const cx = cells[i] % 4, cy = Math.floor(cells[i] / 4); return `<button class="g3-it" style="left:${4 + cx * 24 + Math.random() * 3}%;top:${4 + cy * 32 + Math.random() * 3}%">${photo(v.img)}<span>${esc(v.en)}</span></button>`; }).join('')}<div class="g3-dark"></div></div>`); body.appendChild(board);
    const move = (e) => { const r = board.getBoundingClientRect(); board.style.setProperty('--x', (e.clientX - r.left) + 'px'); board.style.setProperty('--y', (e.clientY - r.top) + 'px'); };
    board.addEventListener('pointermove', move); board.addEventListener('pointerdown', move);
    const rp = rep(null, '🔊 Repetir'); body.appendChild(h(`<div class="center"></div>`)).appendChild(rp);
    const its = $$('.g3-it', board);
    for (let k = 0; k < targets.length && live(stage); k++) {
      const v = targets[k]; $('#fl', ask_).innerHTML = `${esc(v.es)} <small>(${k + 1}/${targets.length})</small>`; rp.onclick = () => play(v.au); play(v.au);
      let first = true;
      await new Promise(res => its.forEach((b, i) => b.onclick = () => { if (b.classList.contains('found')) return;
        if (items[i] === v) { b.classList.add('found'); sfx('ok'); play(v.au); M.toast(`✅ ${v.es} = ${v.en}`); if (first) c++; else missed.push(v); res(); }
        else { first = false; sfx('bad'); b.classList.add('shake'); M.toast(`❌ Eso es: ${items[i].en} (${items[i].es})`); setTimeout(() => b.classList.remove('shake'), 400); } }));
      await sleep(900);
    }
    board.classList.add('lights'); await sleep(600);
    return finish(c, targets.length, 'reading', missed, '🔦 Encontrados al primer intento', '', '¡Ojos de búho! 🦉');
  }

  /* ====== t11p2 — EL PLANO DE LA CASA ====== */
  async function housePlan(stage, p) {
    const em = { 'living room': '🛋️', bedroom: '🛏️', kitchen: '🍳', bathroom: '🚿', 'dining room': '🍽️', garage: '🚗', garden: '🌷' };
    const H = (G().house || []).filter(x => V(p, x.room)); const rooms = H.map(x => x.room); const R = sample(H, 5); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const v = V(p, r.room);
      const body = head(stage, { lbl: 'Game', title: '🏠 El plano de la casa', ins: 'Escucha lo que quiere hacer la persona y toca la <b>parte de la casa</b> a donde debe ir.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g3-sent">🧍 “${esc(r.en)}”<small>${esc(r.es)}</small></div>`)).appendChild(rep(r.au));
      play(r.au);
      const plan = h(`<div class="g3-plan">${rooms.map(rm => `<button class="g3-room"><span>${em[rm]}</span><b>${esc(rm)}</b></button>`).join('')}</div>`); body.appendChild(plan);
      const btns = $$('button', plan);
      const i = await new Promise(res => btns.forEach((b, j) => b.onclick = () => res(j)));
      const ok = rooms[i] === r.room; btns.forEach(b => b.disabled = true); btns[rooms.indexOf(r.room)].classList.add('right'); if (!ok) btns[i].classList.add('wrong');
      $('span', btns[rooms.indexOf(r.room)]).textContent = '🧍';
      if (ok) c++; else missed.push(v);
      await say(body, ok, `${r.en} → the ${r.room}`, `${r.es} → ${v.es}`, v.au);
    }
    return finish(c, R.length, 'listening', missed, '🏠 Habitaciones', '', '¡Conoces la casa de memoria! 🗝️');
  }

  /* ====== t12p1 — LA MÁQUINA DE PLURALES ====== */
  async function pluralMachine(stage, p) {
    const P = (p.vocab || []).filter(v => v.sg); const R = sample(P, Math.min(6, P.length)); let c = 0; const missed = [];
    const rule = (v) => v.en === v.sg + 's' ? '+ s' : v.en === v.sg + 'es' ? '+ es' : 'y → ies';
    for (let k = 0; k < R.length && live(stage); k++) {
      const v = R[k]; const ru = rule(v);
      const body = head(stage, { lbl: 'Game', title: '🏭 La máquina de plurales', ins: 'Mete la palabra a la máquina: elige la <b>terminación correcta</b> del plural.', count: `${k + 1} / ${R.length}` });
      const mc = h(`<div class="g3-mach"><div class="g3-word">${esc(v.sg)}</div><div class="g3-box">⚙️<small>PLURAL<br>MACHINE</small></div><div class="g3-word out">?</div></div>`); body.appendChild(mc);
      const opts = ['+ s', '+ es', 'y → ies'];
      const ok = await ask(body, opts, opts.indexOf(ru), 'g3-three');
      mc.classList.add('run'); await sleep(700); $('.g3-word.out', mc).textContent = v.en; mc.classList.remove('run');
      if (ok) c++; else missed.push(v);
      await say(body, ok, `${v.sg} → ${v.en}`, v.es, v.au);
    }
    return finish(c, R.length, 'writing', missed, '🏭 Plurales', '', '¡La máquina funciona perfecto contigo! ⚙️');
  }

  /* ====== t12p2 — EL ESPEJO MÁGICO (plurales irregulares) ====== */
  async function magicMirror(stage, p) {
    const BAD = { man: ['mans', 'mens'], woman: ['womans', 'womens'], child: ['childs', 'childrens'], person: ['persones', 'peoples'], foot: ['foots', 'feets'], tooth: ['tooths', 'teeths'], mouse: ['mouses', 'mices'], fish: ['fishs', 'fishies'], sheep: ['sheeps', 'sheepies'], knife: ['knifes', 'knifs'] };
    const P = (p.vocab || []).filter(v => v.sg && BAD[v.sg]); const R = sample(P, Math.min(6, P.length)); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const v = R[k];
      const body = head(stage, { lbl: 'Game', title: '🪞 El espejo mágico', ins: 'El espejo convierte <b>uno</b> en <b>muchos</b>. Elige el plural correcto (¡son irregulares!).', count: `${k + 1} / ${R.length}` });
      const mr = h(`<div class="g3-mirror"><div class="g3-word">one<br><b>${esc(v.sg)}</b></div><div class="g3-glass">✨<b>?</b>✨</div></div>`); body.appendChild(mr);
      const opts = shuffle([v.en, ...BAD[v.sg]]);
      const ok = await ask(body, opts.map(esc), opts.indexOf(v.en), 'g3-three');
      $('.g3-glass b', mr).textContent = v.en; mr.classList.add('shine');
      if (ok) c++; else missed.push(v);
      await say(body, ok, `one ${v.sg} → two ${v.en}`, v.es, v.au);
    }
    return finish(c, R.length, 'writing', missed, '🪞 Plurales irregulares', '', '¡Magia pura! ✨');
  }

  /* ====== t13p1 — CERCA O LEJOS (this / that) ====== */
  async function nearFar(stage, p) {
    const T = sample(G().tt || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < T.length && live(stage); k++) {
      const r = T[k]; const near = Math.random() < .5; const ans = `${near ? 'This' : 'That'} is a ${r.w}.`;
      const body = head(stage, { lbl: 'Game', title: '👉 ¿Cerca o lejos?', ins: '¿El objeto está <b>cerca</b> de la persona (this) o <b>lejos</b> (that)? Elige la frase correcta.', count: `${k + 1} / ${T.length}` });
      body.appendChild(h(`<div class="g3-scene"><div class="g3-hill"></div><div class="g3-man">🧍🏻‍♂️</div><div class="g3-obj ${near ? 'near' : 'far'}">${r.e}<small>${esc(r.w)}</small></div><span class="g3-tag ${near ? 'near' : 'far'}">${near ? '🤚 cerca' : '👉 lejos'}</span></div>`));
      const opts = [`This is a ${r.w}.`, `That is a ${r.w}.`];
      const ok = await ask(body, opts.map(esc), near ? 0 : 1, 'g3-two');
      if (ok) c++; else missed.push({ en: ans, au: near ? r.this : r.that });
      await say(body, ok, ans, `${near ? 'Este/esta' : 'Ese/esa / aquel'} es un(a) ${r.es}.`, near ? r.this : r.that);
    }
    return finish(c, T.length, 'reading', missed, '👉 This / That', '', '¡Ya sabes cuándo usar this y that! 🎯');
  }

  /* ====== t13p2 — CONTRARRELOJ THESE / THOSE ====== */
  async function theseRush(stage, p) {
    const P = G().tth || []; const DUR = 25000; let c = 0, t = 0; const missed = [];
    const body = head(stage, { lbl: 'Game', title: '⚡ Contrarreloj: These or Those', ins: 'Tienes <b>25 segundos</b>. Si las cosas están <b>cerca</b> 🤚 toca <b>THESE</b>; si están <b>lejos</b> 👉 toca <b>THOSE</b>.' });
    const hud = h(`<div class="cw-hud"><span>⏱️ <b id="rt">25</b>s</span><span>✅ <b id="rc">0</b></span><span>Total <b id="rn">0</b></span></div>`); body.appendChild(hud);
    const sc = h(`<div class="g3-scene rush"><div class="g3-hill"></div><div class="g3-man">🧍🏻‍♀️</div><div class="g3-obj"></div></div>`); body.appendChild(sc);
    const bt = h(`<div class="g3-two-big"><button class="btn lg" disabled>🤚 THESE</button><button class="btn k lg" disabled>👉 THOSE</button></div>`); body.appendChild(bt);
    const go = h(`<div class="center"><button class="btn k lg">⚡ ¡Empezar!</button></div>`); body.insertBefore(go, bt);
    await new Promise(r => $('button', go).onclick = r); go.remove();
    const [bTh, bTo] = $$('button', bt); bTh.disabled = bTo.disabled = false; const t0 = Date.now(); let cur;
    const nextItem = () => { cur = { it: sample(P, 1)[0], near: Math.random() < .5 }; const o = $('.g3-obj', sc); o.className = 'g3-obj pop ' + (cur.near ? 'near' : 'far'); o.innerHTML = `${cur.it.e}${cur.it.e}${cur.it.e}<small>${esc(cur.it.w)}</small>`; };
    nextItem();
    const tick = setInterval(() => { $('#rt', hud).textContent = Math.max(0, Math.ceil((DUR - (Date.now() - t0)) / 1000)); }, 250);
    await new Promise(done => {
      const answer = (near) => { if (Date.now() - t0 > DUR || !live(stage)) return done(); t++; $('#rn', hud).textContent = t;
        if (near === cur.near) { c++; sfx('ok'); $('#rc', hud).textContent = c; } else { sfx('bad'); missed.push({ en: `${cur.near ? 'These' : 'Those'} are ${cur.it.w}.` }); M.toast(`❌ ${cur.near ? 'These' : 'Those'} are ${cur.it.w}.`); }
        nextItem(); };
      bTh.onclick = () => answer(true); bTo.onclick = () => answer(false);
      setTimeout(done, DUR);
    });
    clearInterval(tick); bTh.disabled = bTo.disabled = true; $('#rt', hud).textContent = 0;
    if (!t) t = 1;
    if (c >= 8 && c >= t * .8) { M.confetti(1300); sfx('win'); }
    await sheet({ ok: c >= t / 2, title: `⚡ ${c} correctas de ${t}`, msg: '🤚 <b>These</b> = estos/estas (cerca) · 👉 <b>Those</b> = esos/esas (lejos)' });
    return result(c, t, 'reading', missed);
  }

  /* ====== t14p1 — CUENTA LAS COSAS ====== */
  async function countRoom(stage, p) {
    const C = G().count || []; const NUM = ['', 'one', 'two', 'three', 'four']; const R = sample(C, 5); let c = 0; const missed = [];
    const sent = (o, n) => n === 1 ? `There is one ${o.sg}.` : `There are ${NUM[n]} ${o.pl}.`;
    for (let k = 0; k < R.length && live(stage); k++) {
      const o = R[k]; const n = 1 + Math.floor(Math.random() * 4); const others = sample(C.filter(x => x !== o), 2).map(x => ({ x, n: 1 + Math.floor(Math.random() * 3) }));
      const body = head(stage, { lbl: 'Game', title: '🔢 Cuenta las cosas', ins: `Mira el cuarto y cuenta. ¿Cuántos(as) <b>${esc(/[aeiouáéíóú]$/.test(o.es) ? o.es + 's' : o.es + 'es')}</b> hay? Elige la frase correcta.`, count: `${k + 1} / ${R.length}` });
      const things = shuffle([...Array(n).fill(o.e), ...others.flatMap(z => Array(z.n).fill(z.x.e))]);
      body.appendChild(h(`<div class="g3-room2">${things.map(e => `<span style="transform:rotate(${(Math.random() * 16 - 8).toFixed(0)}deg)">${e}</span>`).join('')}</div>`));
      const right = sent(o, n); const n2 = n === 1 ? 2 : n - 1;
      const trap = n === 1 ? `There are one ${o.sg}.` : `There is ${NUM[n]} ${o.pl}.`;
      const opts = shuffle([right, sent(o, n2 === n ? 3 : n2), trap]);
      const ok = await ask(body, opts.map(esc), opts.indexOf(right));
      if (ok) c++; else missed.push({ en: right, au: o.au[n] });
      await say(body, ok, right, `Hay ${n === 1 ? 'un(a) ' + o.es : n + ' ' + (/[aeiouáéíóú]$/.test(o.es) ? o.es + 's' : o.es + 'es')}.`, o.au[n]);
    }
    return finish(c, R.length, 'reading', missed, '🔢 Conteos', '', '¡There is y There are dominados! 🏡');
  }

  /* ====== t14p2 — EL CUARTO DE LA MEMORIA ====== */
  async function memoryRoom(stage, p) {
    const MM = G().mem || { sg: [], pl: [], ans: {} }; const ROUNDS = 4; let c = 0; const missed = [];
    const ANS = ['Yes, there is.', "No, there isn't.", 'Yes, there are.', "No, there aren't."];
    for (let k = 0; k < ROUNDS && live(stage); k++) {
      const sgIn = sample(MM.sg, 2), plIn = sample(MM.pl, 2);
      const isPl = Math.random() < .5; const present = Math.random() < .5;
      const q = isPl ? (present ? sample(plIn, 1)[0] : sample(MM.pl.filter(x => !plIn.includes(x)), 1)[0]) : (present ? sample(sgIn, 1)[0] : sample(MM.sg.filter(x => !sgIn.includes(x)), 1)[0]);
      const ans = isPl ? (present ? ANS[2] : ANS[3]) : (present ? ANS[0] : ANS[1]);
      const body = head(stage, { lbl: 'Game', title: '🧠 El cuarto de la memoria', ins: 'Mira el cuarto por <b>6 segundos</b> y memoriza qué hay. Luego responde la pregunta.', count: `${k + 1} / ${ROUNDS}` });
      const things = shuffle([...sgIn.map(x => x.e), ...plIn.flatMap(x => [x.e, x.e, x.e])]);
      const room = h(`<div class="g3-room2 mem">${things.map(e => `<span>${e}</span>`).join('')}<div class="g3-curtain">🙈<b>¿Qué había?</b></div><div class="g3-count">6</div></div>`); body.appendChild(room);
      for (let s = 6; s > 0 && live(stage); s--) { $('.g3-count', room).textContent = s; await sleep(1000); }
      room.classList.add('hide'); $('.g3-count', room).remove();
      body.appendChild(h(`<div class="g3-sent">${isPl ? `Are there any ${esc(q.w)}?` : `Is there a ${esc(q.w)}?`}<small>¿Hay ${isPl ? '' : 'un(a) '}${esc(q.es)}?</small></div>`)).appendChild(rep(q.au));
      play(q.au);
      const ok = await ask(body, ANS.map(esc), ANS.indexOf(ans));
      room.classList.remove('hide');
      if (ok) c++; else missed.push({ en: ans, au: MM.ans[ans] });
      await say(body, ok, ans, present ? 'Sí, hay.' : 'No, no hay.', MM.ans[ans]);
    }
    return finish(c, ROUNDS, 'listening', missed, '🧠 Memoria', '', '¡Memoria de elefante! 🐘');
  }

  Object.assign(window.M1A, { clockGreet, chatReply, simonLetters, plateGame, passport, airport, bingo, colorMix, slotBe, whackAn, riddleJob, elevator, familyTree, animalSounds,
    restaurant, market, dayFlip, specialDates, weatherTV, suitcase, flashlight, housePlan, pluralMachine, magicMirror, nearFar, theseRush, countRoom, memoryRoom });
})();
