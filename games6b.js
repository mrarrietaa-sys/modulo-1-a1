/* =====================================================================
   JUEGOS ÚNICOS DEL MÓDULO 4 (B2+) — temas 8 a 14
   t8p1 tagPingPong · t8p2 tagPitchDetective · t9p1 reportedGossipChain · t9p2 reportingVerbCourtroom
   t10p1 politeConciergeDesk · t10p2 whetherEscapeLock · t11p1 passiveNewsroomTicker · t11p2 passiveFactoryConveyor
   t12p1 causativeServiceCity · t12p2 causativeInsuranceClaim · t13p1 futureTimelineRadar · t13p2 deadlineKanbanSprint
   t14p1 milestoneOdometerRoll · t14p2 perfectContinuousRailSwitch
   ===================================================================== */
(function () {
  const M = window.M1, A = window.M1A;
  const { $, $$, h, esc, shuffle, sample, sleep, play, stop, sfx, sheet } = M;
  const { head, result } = A;
  const G = () => window.M1G6B || {};
  const live = (stage) => stage.isConnected;

  function waitBtn(body, txt = 'Continuar →') {
    return new Promise(res => { const bar = h(`<div class="actionbar g3-next"><button class="btn k lg">${txt}</button></div>`); body.appendChild(bar); bar.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); $('button', bar).onclick = () => { stop(); bar.remove(); res(); }; });
  }
  async function ask(parent, labels, correct, cls = '') {
    const wrap = h(`<div class="opts g3-opts ${cls}"></div>`);
    const btns = labels.map(l => { const b = h(`<button class="opt">${l}</button>`); wrap.appendChild(b); return b; });
    parent.appendChild(wrap);
    const i = await new Promise(r => btns.forEach((b, k) => b.onclick = () => r(k)));
    btns.forEach(b => b.disabled = true); btns[correct].classList.add('right'); if (i !== correct) btns[i].classList.add('wrong');
    return i === correct;
  }
  const pick = (parent, a, o, cls = 'g6b-col') => { const opts = shuffle([a, ...o]); return ask(parent, opts.map(esc), opts.indexOf(a), cls); };
  async function say(body, ok, en, es, au) {
    const fb = h(`<div class="g3-fb ${ok ? 'ok' : 'no'}">${ok ? '✅ ¡Correcto!' : '❌ ¡Casi! La respuesta es:'} <b>${esc(en)}</b>${es ? `<span>${es}</span>` : ''}</div>`);
    body.appendChild(fb); fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    sfx(ok ? 'ok' : 'bad'); await sleep(300);
    if (au) await play(au);
    if (ok) { if (Math.random() < .35) M.praise(); await sleep(800); }
    else await waitBtn(body);
  }
  async function finish(c, t, skill, missed, title, okMsg) {
    if (t && c >= t - 1) { M.confetti(1300); sfx('win'); }
    await sheet({ ok: c >= t / 2, title: `${title}: ${c} de ${t}`, msg: c >= t - 1 ? okMsg : 'Repasa la explicación y vuelve a intentarlo. ¡Tú puedes! 💪' });
    return result(c, t, skill, missed);
  }
  const rep = (au, label = '🔊 Escuchar') => { const b = h(`<button class="btn w sm g3-rep">${label}</button>`); b.onclick = () => { sfx('tap'); play(au); }; return b; };
  const center = (body, el) => { const d = h(`<div class="center"></div>`); d.appendChild(el); body.appendChild(d); return el; };

  /* ====== t8p1 — PING-PONG DE COLETILLAS ====== */
  async function tagPingPong(stage, p) {
    const R = sample(G().pong || [], 7); let c = 0, cpu = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🏓 Ping-pong de coletillas', ins: 'El robot te lanza una oración. <b>Devuélvela</b> con la coletilla correcta antes de que se acabe el tiempo ⏱️.', count: `${k + 1} / ${R.length}` });
      const tbl = h(`<div class="g6b-pong">
        <div class="g6b-score"><span>🧑 You <b>${c}</b></span><span class="g6b-vs">VS</span><span><b>${cpu}</b> CPU 🤖</span></div>
        <div class="g6b-table"><div class="g6b-net"></div><div class="g6b-paddle l">🤖</div><div class="g6b-paddle r">🏓</div><div class="g6b-ball"></div></div>
        <div class="g6b-serve">“${esc(r.s)}, <u>______</u>”<small>${esc(r.es)}</small></div>
        <div class="g6b-timer"><i></i></div></div>`);
      body.appendChild(tbl);
      const ball = $('.g6b-ball', tbl); setTimeout(() => ball.classList.add('go'), 60);
      const opts = shuffle([r.a, ...r.o]);
      const wrap = h(`<div class="opts g3-opts g3-three g6b-pongopts">${opts.map(o => `<button class="opt">${esc(o)}</button>`).join('')}</div>`); body.appendChild(wrap);
      const btns = $$('button', wrap); const TL = 10000; const bar = $('.g6b-timer i', tbl); bar.style.animationDuration = TL + 'ms';
      const i = await new Promise(res => { const to = setTimeout(() => res(-1), TL); btns.forEach((b, j) => b.onclick = () => { clearTimeout(to); res(j); }); });
      bar.style.animationPlayState = 'paused';
      const ci = opts.indexOf(r.a); btns.forEach(b => b.disabled = true); btns[ci].classList.add('right'); if (i >= 0 && i !== ci) btns[i].classList.add('wrong');
      const ok = i === ci; ball.classList.remove('go'); ball.classList.add(ok ? 'back' : 'miss');
      $('.g6b-serve u', tbl).textContent = r.a;
      if (ok) c++; else { cpu++; missed.push({ en: `${r.s}, ${r.a}`, au: r.au }); }
      const sc = $$('.g6b-score b', tbl); sc[0].textContent = c; sc[1].textContent = cpu;
      if (i < 0) M.toast('⏱️ ¡Muy lento! La pelota pasó.');
      await say(body, ok, `${r.s}, ${r.a}`, esc(r.es), r.au);
    }
    return finish(c, R.length, 'reading', missed, '🏓 Ping-pong', `¡Ganaste el partido ${c}–${R.length - c}! Tus coletillas son de campeón 🏆`);
  }

  /* ====== t8p2 — DETECTIVE DE ENTONACIÓN ====== */
  const WAVE = (() => { let d = 'M6 45'; for (let x = 6; x <= 294; x += 6) d += ` L${x} ${(45 + Math.sin(x / 9) * 9 * Math.sin(x / 60)).toFixed(1)}`; return d; })();
  const PITCH = { down: 'M8 52 C70 52 120 48 170 44 C210 40 225 24 240 22 C262 22 278 60 294 76', up: 'M8 56 C70 56 120 58 170 58 C210 58 228 64 240 64 C262 62 278 28 294 12' };
  async function tagPitchDetective(stage, p) {
    const T = sample(G().ptag || [], 3), I = sample(G().pinto || [], 3); const R = [];
    for (let i = 0; i < Math.max(T.length, I.length); i++) { if (T[i]) R.push({ k: 't', ...T[i] }); if (I[i]) R.push({ k: 'i', ...I[i] }); }
    let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const isT = r.k === 't';
      const body = head(stage, { lbl: 'Game', title: '🎼 Detective de entonación', ins: isT ? '🔎 <b>Caso especial:</b> elige la coletilla correcta (I am, let\'s, imperativos, never, nobody…).' : '🎧 Lee la situación y decide: ¿la voz <b>baja ↘</b> (solo confirmas) o <b>sube ↗</b> (preguntas de verdad)?', count: `${k + 1} / ${R.length}` });
      const scope = h(`<div class="g6b-scope"><div class="g6b-scope-h"><span>🎙️ PITCH ANALYZER</span><i></i></div><svg viewBox="0 0 300 90" preserveAspectRatio="none"><path class="grid" d="M0 22H300M0 45H300M0 68H300M60 0V90M120 0V90M180 0V90M240 0V90"/><path class="wave idle" d="${WAVE}"/></svg></div>`);
      body.appendChild(scope);
      let ok;
      if (isT) {
        body.appendChild(h(`<div class="g3-sent">“${esc(r.s)}, <u>_____</u>”</div>`));
        ok = await pick(body, r.a, r.o, 'g3-three');
        $('.g3-sent u', body).textContent = r.a;
        if (ok) c++; else missed.push({ en: `${r.s}, ${r.a}`, au: r.au });
        await say(body, ok, `${r.s}, ${r.a}`, esc(r.why), r.au);
      } else {
        body.appendChild(h(`<div class="g6b-case"><b>📁 Situación</b><p>${r.ctx}</p><div class="g6b-case-s">“${esc(r.s)}”</div></div>`));
        const wrap = h(`<div class="g6b-pitchbtns"><button class="opt" data-d="down">↘<b>Falling</b><small>Solo confirmo</small></button><button class="opt" data-d="up">↗<b>Rising</b><small>Pregunto de verdad</small></button></div>`); body.appendChild(wrap);
        const btns = $$('button', wrap);
        const d = await new Promise(res => btns.forEach(b => b.onclick = () => res(b.dataset.d)));
        btns.forEach(b => { b.disabled = true; if (b.dataset.d === r.d) b.classList.add('right'); else if (b.dataset.d === d) b.classList.add('wrong'); });
        ok = d === r.d;
        const w = $('.wave', scope); w.classList.remove('idle'); w.setAttribute('d', PITCH[r.d]); w.classList.add('draw', r.d);
        $('.g6b-scope-h i', scope).textContent = r.d === 'down' ? '↘ FALLING = confirmación' : '↗ RISING = pregunta real';
        if (ok) c++; else missed.push({ en: r.s, au: r.au });
        await say(body, ok, `${r.s} ${r.d === 'down' ? '↘' : '↗'}`, r.d === 'down' ? 'Estás seguro: la voz baja al final.' : 'No lo sabes: la voz sube al final.', r.au);
      }
    }
    return finish(c, R.length, 'listening', missed, '🎼 Casos resueltos', '¡Tienes oído de detective! Tus coletillas suenan naturales 🕵️');
  }

  /* ====== t9p1 — TELÉFONO ROTO EN LA OFICINA ====== */
  async function reportedGossipChain(stage, p) {
    const R = sample(G().gossip || [], 6); let c = 0; const missed = []; const hops = [];
    const crew = ['🧑‍💼', '👩‍💻', '🧔', '👩‍🦱', '👨‍🦰', '👩‍🔧', '🧑‍🎤'];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '📞 Teléfono roto en la oficina', ins: 'Pasa el mensaje <b>sin romperlo</b>: completa el estilo indirecto hueco por hueco (<b>say/tell</b>, <b>backshift</b>, tiempo y lugar).', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g6b-chain">${crew.slice(0, R.length + 1).map((e, i) => `<span class="${i < k ? (hops[i] ? 'ok' : 'no') : i === k ? 'cur' : ''}">${e}${i < R.length ? `<i>${i < k ? (hops[i] ? '✉️' : '🌀') : i === k ? '📨' : '·'}</i>` : ''}</span>`).join('')}</div>`));
      const bub = h(`<div class="g6b-said"><span class="g6b-av">${r.e}</span><div><b>${esc(r.n)}</b> said:<p>“${esc(r.q)}”</p></div></div>`); body.appendChild(bub); $('div', bub).appendChild(rep(r.qau, '🔊'));
      const slots = []; let html = '';
      r.parts.forEach(x => { if (Array.isArray(x)) { html += ` <span class="g6b-slot" data-s="${slots.length}">_____</span>`; slots.push(x); } else html += (/^[.,]/.test(x) ? '' : ' ') + esc(x); });
      const line = h(`<div class="g6b-rline">📝 ${html.trim()}</div>`); body.appendChild(line);
      let all = true;
      for (let s = 0; s < slots.length && live(stage); s++) {
        const sl = $(`[data-s="${s}"]`, line); sl.classList.add('cur');
        const [a, ...o] = slots[s]; const opts = shuffle([a, ...o]);
        const wrap = h(`<div class="opts g3-opts g3-three g6b-slotopts">${opts.map(x => `<button class="opt">${esc(x)}</button>`).join('')}</div>`); body.appendChild(wrap);
        const btns = $$('button', wrap); const i = await new Promise(res => btns.forEach((b, j) => b.onclick = () => res(j)));
        const ok = opts[i] === a; if (!ok) all = false; sfx(ok ? 'tap' : 'bad');
        sl.classList.remove('cur'); sl.classList.add(ok ? 'ok' : 'no'); sl.textContent = a;
        if (!ok) M.toast(`Era: ${a}`);
        await sleep(ok ? 250 : 700); wrap.remove();
      }
      hops.push(all); if (all) c++; else missed.push({ en: r.full, au: r.au });
      await say(body, all, r.full, esc(r.es), r.au);
    }
    const intact = hops.filter(Boolean).length;
    return finish(c, R.length, 'writing', missed, '📞 Mensajes intactos', intact === R.length ? '¡El mensaje llegó perfecto hasta el final! 📨' : '¡Casi nada se perdió en el camino! 📨');
  }

  /* ====== t9p2 — EL TRIBUNAL ====== */
  async function reportingVerbCourtroom(stage, p) {
    const R = sample(G().court || [], 6); let c = 0; const missed = []; const log = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '⚖️ Orden en la sala', ins: 'Eres el/la <b>taquígrafo(a)</b> del juicio. 1) Elige el <b>verbo</b> que resume lo que dijo. 2) Elige la oración con el <b>patrón correcto</b>.', count: `Caso ${k + 1} / ${R.length}` });
      const court = h(`<div class="g6b-court"><div class="g6b-bench"><span class="g6b-judge">👩‍⚖️</span><span class="g6b-gavel">🔨</span><small>THE HONORABLE J. MARTÍNEZ</small></div>
        <div class="g6b-stand"><span class="g6b-wit">${r.e}</span><div class="g6b-q"><small>${esc(r.role)}</small>“${esc(r.q)}”</div></div></div>`); body.appendChild(court);
      $('.g6b-q', court).appendChild(rep(r.qau, '🔊'));
      body.appendChild(h(`<p class="g6b-step">① ¿Qué hizo? <i>He / She…</i></p>`));
      const ok1 = await pick(body, r.v, r.vo, 'g3-three');
      body.appendChild(h(`<p class="g6b-step">② Transcripción oficial 🖋️</p>`));
      const ok2 = await pick(body, r.a, r.o);
      const ok = ok1 && ok2; if (ok) { c++; $('.g6b-gavel', court).classList.add('bang'); } else missed.push({ en: r.a, au: r.au });
      log.push(ok);
      await say(body, ok, r.a, `<b>${esc(r.pat)}</b> · ${esc(r.es)}`, r.au);
    }
    return finish(c, R.length, 'writing', missed, '⚖️ Transcripciones', '¡Transcripción impecable! La jueza está impresionada 👩‍⚖️');
  }

  /* ====== t10p1 — EL CONSERJE DEL HOTEL ====== */
  async function politeConciergeDesk(stage, p) {
    const R = sample(G().concierge || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🛎️ El conserje del hotel', ins: 'Un huésped pregunta de forma muy directa 😤. Reformula su pregunta en forma <b>indirecta y cortés</b> tocando los bloques en orden. ¡Ojo: hay un <b>bloque trampa</b>!', count: `${k + 1} / ${R.length}` });
      const pol = Math.round(c / R.length * 100);
      const desk = h(`<div class="g6b-hotel"><div class="g6b-hotel-top"><span>🏨 GRAND PALM HOTEL · MIAMI</span><span>Politeness <b>${pol}%</b></span></div><div class="g6b-polbar"><i style="width:${pol}%"></i></div>
        <div class="g6b-guest"><span>🙎‍♂️🧳</span><div class="g6b-rude">“${esc(r.d)}”</div></div></div>`); body.appendChild(desk);
      $('.g6b-guest', desk).appendChild(rep(r.dau, '🔊'));
      const line = h(`<div class="g6b-build"><span class="g6b-ph">🛎️ Toca los bloques…</span></div>`); body.appendChild(line);
      const tiles = shuffle([...r.t, r.x]);
      const tb = h(`<div class="g6b-tiles">${tiles.map((t, i) => `<button class="g6b-tile" data-i="${i}">${esc(t)}</button>`).join('')}</div>`); body.appendChild(tb);
      const undo = h(`<div class="center"><button class="btn w sm g6b-undo" disabled>↩️ Borrar último</button></div>`); body.appendChild(undo);
      const ub = $('button', undo); const chosen = [];
      const draw = () => { line.innerHTML = chosen.length ? chosen.map(i => `<span>${esc(tiles[i])}</span>`).join(' ') + (chosen.length === r.t.length ? esc(r.p) : '') : '<span class="g6b-ph">🛎️ Toca los bloques…</span>'; ub.disabled = !chosen.length; };
      await new Promise(res => {
        $$('.g6b-tile', tb).forEach(b => b.onclick = () => { sfx('tap'); b.disabled = true; chosen.push(+b.dataset.i); draw(); if (chosen.length === r.t.length) res(); });
        ub.onclick = () => { const i = chosen.pop(); if (i == null) return; $(`[data-i="${i}"]`, tb).disabled = false; draw(); };
      });
      $$('button', tb).forEach(b => b.disabled = true); ub.disabled = true;
      const ok = chosen.map(i => tiles[i]).join(' ') === r.t.join(' ');
      line.classList.add(ok ? 'ok' : 'no'); if (!ok) line.innerHTML = `<span>${esc(r.full)}</span>`;
      if (ok) { c++; sfx('ok'); $('.g6b-rude', desk).classList.add('calm'); $('.g6b-guest span', desk).textContent = '😊🧳'; } else missed.push({ en: r.full, au: r.au });
      await say(body, ok, r.full, esc(r.es), r.au);
    }
    const stars = '⭐'.repeat(Math.max(1, Math.round(c / R.length * 5)));
    return finish(c, R.length, 'writing', missed, `🛎️ Reseña del hotel ${stars}`, '¡Los huéspedes te dejaron 5 estrellas por tu cortesía! 🌟');
  }

  /* ====== t10p2 — ESCAPE ROOM: LA SALA DE ENTREVISTAS ====== */
  async function whetherEscapeLock(stage, p) {
    const E = G().escape || []; const R = shuffle([...sample(E.filter(x => x.k === 'rep'), 4), ...sample(E.filter(x => x.k === 'ifw'), 2)]);
    const code = R.map(() => Math.floor(Math.random() * 10)); const got = []; let c = 0; const missed = [];
    const door = (open) => `<div class="g6b-door ${open ? 'open' : ''}"><div class="g6b-leaf"><span class="g6b-knob"></span><b>INTERVIEW<br>ROOM 4B</b></div><div class="g6b-pad">${code.map((d, i) => `<span class="${got[i] === true ? 'ok' : got[i] === false ? 'no' : ''}">${got[i] === true ? d : got[i] === false ? '✖' : '–'}</span>`).join('')}</div><div class="g6b-alarm"></div></div>`;
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🔐 Escape room: la sala de entrevistas', ins: 'Te quedaste encerrado después de la entrevista. Cada respuesta correcta revela un <b>número del código</b>. ¡Abre la puerta!', count: `Pista ${k + 1} / ${R.length}` });
      const d = h(door(false)); body.appendChild(d);
      let ok;
      if (r.k === 'rep') {
        const card = h(`<div class="g6b-clue"><b>🎙️ The interviewer asked:</b><p>“${esc(r.q)}”</p><small>¿Cómo lo reportas?</small></div>`); body.appendChild(card); card.appendChild(rep(r.qau, '🔊'));
        ok = await pick(body, r.a, r.o);
      } else {
        body.appendChild(h(`<div class="g6b-clue"><b>🧩 Candado if / whether</b><p>${esc(r.q).replace('___', '<u>_____</u>')}</p></div>`));
        ok = await pick(body, r.a, r.o, 'g3-three');
      }
      got[k] = ok; const pad = $('.g6b-pad', d); pad.outerHTML = $('.g6b-pad', h(door(false))).outerHTML;
      if (!ok) d.classList.add('alarm');
      if (ok) c++; else missed.push({ en: r.k === 'rep' ? r.a : r.q.replace('___', r.a), au: r.au });
      await say(body, ok, r.k === 'rep' ? r.a : r.q.replace('___', r.a), esc(r.why), r.au);
    }
    if (live(stage)) {
      const esc_ = c >= Math.ceil(R.length * .6);
      const body = head(stage, { lbl: 'Game', title: esc_ ? '🚪 ¡La puerta se abre!' : '🚨 Código incompleto', ins: esc_ ? `Código: <b>${code.join(' ')}</b>. ¡Escapaste de la sala de entrevistas!` : 'Te faltaron números del código. ¡El guardia te abrió la puerta esta vez! 😅' });
      body.appendChild(h(door(esc_))); if (esc_) sfx('win'); await sleep(1400);
    }
    return finish(c, R.length, 'reading', missed, '🔐 Números del código', '¡Escapaste! Dominas las preguntas reportadas y whether 🗝️');
  }

  /* ====== t11p1 — NOTICIERO EN VIVO ====== */
  async function passiveNewsroomTicker(stage, p) {
    const R = sample(G().news || [], 7); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const aud = 40 + Math.round(c / R.length * 60);
      const body = head(stage, { lbl: 'Game', title: '📺 Noticiero en vivo', ins: 'El reportero envía la noticia en voz <b>activa</b>. Tú eres el presentador: léela al aire en <b>voz pasiva</b> con el tiempo verbal correcto.', count: `${k + 1} / ${R.length}` });
      const tv = h(`<div class="g6b-tv"><div class="g6b-tv-top"><span class="g6b-live">● LIVE</span><b>NEWS 24</b><span>👁️ ${aud}%</span></div>
        <div class="g6b-tv-scr"><span class="g6b-anchor">🧑‍💼</span><div class="g6b-desk">NEWS 24</div></div>
        <div class="g6b-ticker"><span>BREAKING ▸ …</span></div></div>`); body.appendChild(tv);
      const note = h(`<div class="g6b-note"><b>📝 From the field (active voice):</b><p>${esc(r.act)}</p></div>`); body.appendChild(note); note.appendChild(rep(r.aau, '🔊'));
      const ok = await pick(body, r.a, r.o);
      $('.g6b-ticker', tv).innerHTML = `<span class="run">BREAKING ▸ ${esc(r.a.toUpperCase())} ▸ ${esc(r.a.toUpperCase())}</span>`;
      if (ok) c++; else missed.push({ en: r.a, au: r.au });
      await say(body, ok, r.a, esc(r.why), r.au);
    }
    return finish(c, R.length, 'reading', missed, '📺 Noticias al aire', '¡Récord de audiencia! Eres el mejor presentador de noticias 🎙️');
  }

  /* ====== t11p2 — LA FÁBRICA DE CHOCOLATE ====== */
  async function passiveFactoryConveyor(stage, p) {
    const F = G().factory || [], RU = sample(G().rumor || [], 2); const total = F.length + RU.length; let c = 0; const missed = [];
    const belt = (pos, prod, oks) => `<div class="g6b-fac"><div class="g6b-stations">${F.map((s, i) => `<span class="${oks[i] === true ? 'ok' : oks[i] === false ? 'no' : i === pos ? 'cur' : ''}">${s.st}<i>${i + 1}</i></span>`).join('')}</div>
      <div class="g6b-belt"><span class="g6b-prod" style="left:calc(${((Math.min(pos, F.length - 1) + .5) / F.length * 100).toFixed(1)}% - 16px)">${prod}</span></div><div class="g6b-gears">⚙️ ⚙️ ⚙️</div></div>`;
    const oks = [];
    for (let k = 0; k < F.length && live(stage); k++) {
      const r = F[k];
      const body = head(stage, { lbl: 'Game', title: '🏭 La fábrica de chocolate', ins: 'Describe el proceso en <b>voz pasiva</b> (is/are + participio). Cada respuesta mueve el producto a la siguiente estación.', count: `${k + 1} / ${total}` });
      const fac = h(belt(k, k ? F[k - 1].pr : '🌱', oks)); body.appendChild(fac);
      body.appendChild(h(`<div class="g3-sent">${esc(r.s).replace('___', '<u>_____</u>')}<small>${esc(r.es)}</small></div>`));
      const ok = await pick(body, r.a, r.o, 'g3-three'); oks[k] = ok;
      const nf = h(belt(k + 1, r.pr, oks)); fac.replaceWith(nf);
      if (ok) c++; else missed.push({ en: r.s.replace('___', r.a), au: r.au });
      await say(body, ok, r.s.replace('___', r.a), '', r.au);
    }
    for (let k = 0; k < RU.length && live(stage); k++) {
      const r = RU[k];
      const body = head(stage, { lbl: 'Game', title: '📰 Rumores en la fábrica', ins: 'Los periodistas llegaron a la fábrica. Escribe la noticia con la <b>pasiva impersonal</b> (it is said that… / is believed to…).', count: `${F.length + k + 1} / ${total}` });
      body.appendChild(h(`<div class="g6b-paper"><small>THE DAILY CHRONICLE</small><b>${esc(r.h)}</b></div>`));
      body.appendChild(h(`<div class="g3-sent">${esc(r.s).replace('___', '<u>_____</u>')}<small>${esc(r.es)}</small></div>`));
      const ok = await pick(body, r.a, r.o);
      if (ok) c++; else missed.push({ en: r.s.replace('___', r.a), au: r.au });
      await say(body, ok, r.s.replace('___', r.a), '', r.au);
    }
    return finish(c, total, 'reading', missed, '🏭 Producción', '¡Chocolate listo y noticia publicada! Dominas la voz pasiva 🍫');
  }

  /* ====== t12p1 — CIUDAD DE SERVICIOS ====== */
  async function causativeServiceCity(stage, p) {
    const S = G().shops || [], R = sample(G().serv || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🏙️ Ciudad de servicios', ins: '① Lee el problema y toca el <b>negocio</b> correcto en el mapa. ② Di qué vas a hacer con <b>have + objeto + participio</b>.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g6b-prob">😩 ${r.p}</div>`));
      const map = h(`<div class="g6b-map">${S.map(s => `<button class="g6b-shop" data-id="${s.id}"><span>${s.e}</span><small>${esc(s.n)}</small></button>`).join('')}<div class="g6b-road h"></div><div class="g6b-road v"></div></div>`); body.appendChild(map);
      const btns = $$('.g6b-shop', map);
      const id = await new Promise(res => btns.forEach(b => b.onclick = () => res(b.dataset.id)));
      btns.forEach(b => { b.disabled = true; if (b.dataset.id === r.shop) b.classList.add('right'); else if (b.dataset.id === id) b.classList.add('wrong'); });
      const ok1 = id === r.shop; $(`[data-id="${r.shop}"]`, map).insertAdjacentHTML('beforeend', '<i class="g6b-walk">🚶</i>'); sfx(ok1 ? 'ok' : 'bad');
      if (!ok1) M.toast(`Mejor ve a: ${S.find(s => s.id === r.shop).n}`);
      body.appendChild(h(`<p class="g6b-step">② ¿Cómo lo dices?</p>`));
      const ok2 = await pick(body, r.a, r.o);
      const ok = ok1 && ok2; if (ok) c++; else missed.push({ en: r.a, au: r.au });
      await say(body, ok, r.a, 'have + objeto + participio = alguien lo hace por ti', r.au);
    }
    return finish(c, R.length, 'reading', missed, '🏙️ Encargos', '¡Resolviste todos tus pendientes en la ciudad! 🛍️');
  }

  /* ====== t12p2 — RECLAMO AL SEGURO ====== */
  async function causativeInsuranceClaim(stage, p) {
    const R = sample(G().claim || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '📋 Reclamo al seguro', ins: 'Trabajas en <b>SafeHome Insurance</b>. Lee lo que le pasó al cliente y elige la <b>declaración</b> correcta para aprobar el reclamo.', count: `${k + 1} / ${R.length}` });
      const form = h(`<div class="g6b-claim"><div class="g6b-clip"></div><div class="g6b-claim-h"><b>🛡️ SafeHome Insurance</b><span>CLAIM #${4120 + k * 37}</span></div>
        <div class="g6b-row"><small>Incident type</small><b>${esc(r.type)}</b></div>
        <div class="g6b-scene">${r.e}</div>
        <div class="g6b-row"><small>¿Qué pasó? (notas del agente)</small><span>${esc(r.es)}</span></div>
        <div class="g6b-row st"><small>Customer statement</small><b class="g6b-stmt">_____________</b></div><div class="g6b-stamp"></div></div>`); body.appendChild(form);
      const ok = await pick(body, r.a, r.o);
      $('.g6b-stmt', form).textContent = r.a; const stp = $('.g6b-stamp', form); stp.textContent = ok ? 'APPROVED' : 'REJECTED'; stp.classList.add(ok ? 'ok' : 'no', 'on');
      if (ok) c++; else missed.push({ en: r.a, au: r.au });
      await say(body, ok, r.a, '', r.au);
    }
    return finish(c, R.length, 'reading', missed, '📋 Reclamos aprobados', '¡Todos los reclamos aprobados! Eres el mejor agente de seguros 🛡️');
  }

  /* ====== t13p1 — RADAR DEL FUTURO ====== */
  async function futureTimelineRadar(stage, p) {
    const SC = G().radar || []; const R = [];
    SC.forEach(s => { const by = s.rounds.filter(x => x.kind === 'by'), inn = s.rounds.filter(x => x.kind === 'in'); shuffle([...by.slice(0, 1), ...sample(inn, 2)]).forEach(r => R.push({ s, r })); });
    let c = 0; const missed = []; const X = (t) => ((t - 6) / 18 * 100).toFixed(2);
    for (let k = 0; k < R.length && live(stage); k++) {
      const { s, r } = R[k];
      const body = head(stage, { lbl: 'Game', title: '📡 Radar del futuro', ins: 'Mira la agenda de mañana. El radar marca una hora: ¿qué <b>estará haciendo</b> (will be + -ing) o qué <b>habrá hecho</b> ya (will have + participio)?', count: `${k + 1} / ${R.length}` });
      const tl = h(`<div class="g6b-radar"><div class="g6b-radar-h"><span>${s.e} <b>${esc(s.who)}</b> · tomorrow (${esc(s.day)})</span></div>
        <div class="g6b-track">${s.blocks.map((b, i) => `<div class="g6b-blk" data-i="${i}" style="left:${X(b.s)}%;width:${(X(b.e) - X(b.s)).toFixed(2)}%">${b.ic}</div>`).join('')}
        ${[6, 9, 12, 15, 18, 21, 24].map(t => `<span class="g6b-tick" style="left:${X(t)}%">${t === 12 ? '12p' : t === 24 ? '12a' : t > 12 ? (t - 12) + 'p' : t + 'a'}</span>`).join('')}
        <div class="g6b-pin" style="left:0%"><i>📍</i><b>${esc(r.tl)}</b></div></div>
        <ul class="g6b-legend">${s.blocks.map((b, i) => `<li data-i="${i}">${b.ic} <small>${esc(b.sl)}–${esc(b.el)}</small> ${esc(b.ing)}</li>`).join('')}</ul></div>`); body.appendChild(tl);
      setTimeout(() => { const pin = $('.g6b-pin', tl); if (pin) pin.style.left = X(r.t) + '%'; }, 80);
      body.appendChild(h(`<div class="g3-sent">${r.kind === 'in' ? 'At' : 'By'} ${esc(r.tl)} tomorrow, ${esc(s.who)} <u>_____</u>.</div>`));
      const ok = await pick(body, r.a, r.o);
      $$(`[data-i="${r.bi}"]`, tl).forEach(x => x.classList.add('hit'));
      if (ok) c++; else missed.push({ en: r.en, au: r.au });
      await say(body, ok, r.en, esc(r.es), r.au);
    }
    return finish(c, R.length, 'reading', missed, '📡 Predicciones', '¡Lees el futuro como un radar! 🛰️');
  }

  /* ====== t13p2 — SPRINT DEL VIERNES (KANBAN) ====== */
  async function deadlineKanbanSprint(stage, p) {
    const K = G().kanban || []; const R = shuffle([...sample(K.filter(x => x.col === 'todo'), 1), ...sample(K.filter(x => x.col !== 'todo'), 5)]);
    const COLS = [['todo', '📋 To do', 'won\'t have done'], ['prog', '⏳ In progress', 'will be doing'], ['done', '✅ Done', 'will have done']];
    const placed = { todo: [], prog: [], done: [] }; let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🗂️ El sprint del viernes', ins: '¿Cómo estará cada tarea el <b>viernes a las 5 p.m.</b>? ① Toca la <b>columna</b> correcta. ② Elige la oración.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g6b-dl">⏰ DEADLINE · <b>Friday 5:00 p.m.</b></div>`));
      body.appendChild(h(`<div class="g6b-card new"><span>${r.e}</span><div><b>${esc(r.t)}</b><small>${esc(r.info)}</small></div></div>`));
      const board = h(`<div class="g6b-kan">${COLS.map(([id, t, g]) => `<button class="g6b-kcol" data-c="${id}"><b>${t}</b><small>${g}</small><div>${placed[id].map(e => `<i>${e}</i>`).join('')}</div></button>`).join('')}</div>`); body.appendChild(board);
      const cb = $$('.g6b-kcol', board);
      const col = await new Promise(res => cb.forEach(b => b.onclick = () => res(b.dataset.c)));
      cb.forEach(b => { b.disabled = true; if (b.dataset.c === r.col) b.classList.add('right'); else if (b.dataset.c === col) b.classList.add('wrong'); });
      const ok1 = col === r.col; sfx(ok1 ? 'ok' : 'bad'); placed[r.col].push(r.e); $(`[data-c="${r.col}"] div`, board).insertAdjacentHTML('beforeend', `<i class="drop">${r.e}</i>`);
      body.appendChild(h(`<p class="g6b-step">② Reporte para el jefe 📨</p>`));
      const ok2 = await pick(body, r.a, r.o);
      const ok = ok1 && ok2; if (ok) c++; else missed.push({ en: r.a, au: r.au });
      await say(body, ok, r.a, r.col === 'done' ? 'Terminada antes del plazo → will have + participio' : r.col === 'prog' ? 'En progreso a esa hora → will be + -ing' : 'Aún sin empezar → won\'t have + participio', r.au);
    }
    return finish(c, R.length, 'reading', missed, '🗂️ Tareas', '¡Sprint perfecto! Tu equipo cumplió todos los plazos 🚀');
  }

  /* ====== t14p1 — EL CONTADOR DE HITOS ====== */
  const odoHTML = (n) => { const s = String(n).padStart(2, '0'); return s.split('').map(d => `<span class="g6b-dig"><i style="transform:translateY(-${+d * 10}%)">${[...Array(10).keys()].map(x => `<b>${x}</b>`).join('')}</i></span>`).join(''); };
  async function milestoneOdometerRoll(stage, p) {
    const R = sample(G().odo || [], 5); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const U = r.u === 'years' ? 'years' : 'hours';
      const body = head(stage, { lbl: 'Game', title: '🧮 El contador de hitos', ins: '① Calcula <b>cuánto tiempo</b> habrá pasado. ② Elige la oración con <b>will have been + -ing</b>.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g6b-mile"><span>${r.e}</span><div><p>${r.ctx}</p><b>${r.q}</b></div></div>`));
      const odo = h(`<div class="g6b-odo"><div class="g6b-odo-w">${odoHTML(0)}</div><small>${U.toUpperCase()}</small></div>`); body.appendChild(odo);
      const nums = shuffle([r.n, ...r.no]);
      const ok1 = await ask(body, nums.map(n => `for ${n} ${U}`), nums.indexOf(r.n), 'g3-three');
      $('.g6b-odo-w', odo).innerHTML = odoHTML(0); await sleep(30);
      const digs = $$('.g6b-dig i', odo); String(r.n).padStart(2, '0').split('').forEach((d, i) => { digs[i].style.transform = `translateY(-${+d * 10}%)`; });
      odo.classList.add('roll'); sfx(ok1 ? 'ok' : 'bad'); await sleep(700);
      body.appendChild(h(`<p class="g6b-step">② ¿Cómo lo dices?</p>`));
      const ok2 = await pick(body, r.a, r.o);
      const ok = ok1 && ok2; if (ok) c++; else missed.push({ en: r.a, au: r.au });
      await say(body, ok, r.a, 'will have been + -ing + for (duración hasta un momento futuro)', r.au);
    }
    return finish(c, R.length, 'speaking', missed, '🧮 Hitos', '¡Calculas el tiempo como un reloj suizo! ⏱️');
  }

  /* ====== t14p2 — EL CAMBIO DE VÍA ====== */
  const RAIL_SVG = `<svg viewBox="0 0 320 150" class="g6b-rails" preserveAspectRatio="none"><g class="tie">${[...Array(15).keys()].map(i => `<line x1="${10 + i * 9}" y1="68" x2="${10 + i * 9}" y2="82"/>`).join('')}</g>
    <path class="rail" d="M8 72H140 C190 72 200 26 250 24H312"/><path class="rail" d="M8 78H140 C190 78 200 30 250 30H312"/>
    <path class="rail" d="M140 72 C190 72 200 120 250 120H312"/><path class="rail" d="M140 78 C190 78 200 126 250 126H312"/></svg>`;
  async function perfectContinuousRailSwitch(stage, p) {
    const R = sample(G().rail || [], 8); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🚂 El cambio de vía', ins: 'Mueve la palanca: ¿la oración habla de un <b>RESULTADO</b> (cantidad, trabajo terminado) o de una <b>DURACIÓN</b> (for, since, all night)? El tren llevará la forma correcta a su estación.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g3-sent g6b-cargo">📦 ${esc(r.s).replace('___', '<u>_____</u>')}</div>`));
      const yard = h(`<div class="g6b-yard">${RAIL_SVG}<span class="g6b-stn top">✅ RESULT<small>will have + participio</small></span><span class="g6b-stn bot">⏳ DURATION<small>will have been + -ing</small></span><span class="g6b-train">🚂</span><span class="g6b-lever">🕹️</span></div>`); body.appendChild(yard);
      const lv = h(`<div class="g6b-levers"><button class="opt" data-k="p">⬆️ RESULT<small>${esc(r.p)}</small></button><button class="opt" data-k="c">⬇️ DURATION<small>${esc(r.c)}</small></button></div>`); body.appendChild(lv);
      const bs = $$('button', lv);
      const ch = await new Promise(res => bs.forEach(b => b.onclick = () => res(b.dataset.k)));
      bs.forEach(b => b.disabled = true); sfx('tap');
      const tr = $('.g6b-train', yard); tr.classList.add(ch === 'p' ? 'up' : 'down'); $('.g6b-lever', yard).classList.add(ch === 'p' ? 'up' : 'down');
      await sleep(1100);
      const ok = ch === r.k; bs.forEach(b => { if (b.dataset.k === r.k) b.classList.add('right'); else if (b.dataset.k === ch) b.classList.add('wrong'); });
      $(`.g6b-stn.${ch === 'p' ? 'top' : 'bot'}`, yard).classList.add(ok ? 'ok' : 'no');
      $('.g6b-cargo', body).innerHTML = `📦 ${esc(r.full)}`;
      if (ok) c++; else missed.push({ en: r.full, au: r.au });
      await say(body, ok, r.full, esc(r.why), r.au);
    }
    return finish(c, R.length, 'reading', missed, '🚂 Trenes en su estación', '¡Ningún tren descarrilado! Distingues resultado y duración 🛤️');
  }

  Object.assign(window.M1A, { tagPingPong, tagPitchDetective, reportedGossipChain, reportingVerbCourtroom, politeConciergeDesk, whetherEscapeLock,
    passiveNewsroomTicker, passiveFactoryConveyor, causativeServiceCity, causativeInsuranceClaim, futureTimelineRadar, deadlineKanbanSprint,
    milestoneOdometerRoll, perfectContinuousRailSwitch });
})();
