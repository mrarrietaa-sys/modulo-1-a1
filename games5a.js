/* =====================================================================
   JUEGOS ÚNICOS DEL MÓDULO 3 (B2) — temas 1 a 7 · una dinámica distinta por clase
   t1p1 crystalBall · t1p2 ceoPlanner · t2p1 spanglishScan · t2p2 apostropheLab
   t3p1 lostFound · t3p2 gavelJudge · t4p1 bucketList · t4p2 resumeTimeline
   t5p1 tooLate · t5p2 noirCase · t6p1 timeZoom · t6p2 podcastBleep
   t7p1 droneFlight · t7p2 gridCity
   ===================================================================== */
(function () {
  const M = window.M1, A = window.M1A;
  const { $, $$, h, esc, shuffle, sample, sleep, play, stop, sfx, sheet } = M;
  const { head, result } = A;
  const G = () => window.M1G5A || {};
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
  // opciones barajadas: la primera de `list` es la correcta
  async function askS(parent, list, cls = '') { const o = shuffle(list.slice()); return ask(parent, o.map(esc), o.indexOf(list[0]), cls); }
  async function say(body, ok, en, es, au) {
    const fb = h(`<div class="g3-fb ${ok ? 'ok' : 'no'}">${ok ? '✅ ¡Correcto!' : '❌ ¡Casi! La respuesta es:'} <b>${esc(en)}</b>${es ? `<span>${esc(es)}</span>` : ''}</div>`);
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
  const blank = (s, w = '_____') => esc(s).replace('___', `<u>${w}</u>`);
  const mini = (body, ok, txt) => { const d = h(`<p class="g5a-mini ${ok ? 'ok' : 'no'}">${ok ? '✔' : '✘'} ${txt}</p>`); body.appendChild(d); sfx(ok ? 'ok' : 'bad'); return d; };

  /* ====== t1p1 — LA BOLA DE CRISTAL (will vs going to + razón) ====== */
  async function crystalBall(stage, p) {
    const D = G().crystal || { items: [], reasons: {} }; const R = sample(D.items, 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🔮 La bola de cristal', ins: 'Madame Zora ve el futuro… Lee la situación, elige <b>will</b> o <b>going to</b> y luego explica <b>por qué</b>.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g5a-zora"><div class="g5a-ball"><i></i><span>${r.e}</span></div><div class="g5a-ctx"><small>🧙‍♀️ Madame Zora ve…</small>${esc(r.ctx)}</div></div>`));
      const sent = h(`<div class="g3-sent">${blank(r.s)}</div>`); body.appendChild(sent);
      const ok1 = await askS(body, r.o, 'g3-two');
      sent.innerHTML = esc(r.full); mini(body, ok1, ok1 ? '¡Buena elección!' : `Era <b>${esc(r.o[0])}</b>`);
      body.appendChild(h(`<p class="g5a-q">🤔 ¿Por qué se usa <b>${esc(r.o[0].replace(/^'/, ''))}</b> aquí?</p>`));
      const keys = [r.r, ...sample(Object.keys(D.reasons).filter(x => x !== r.r), 2)];
      const ok2 = await askS(body, keys.map(x => D.reasons[x]), 'g5a-col');
      c += (ok1 ? 1 : 0) + (ok2 ? 1 : 0); if (!(ok1 && ok2)) missed.push({ en: r.full, au: r.au });
      await say(body, ok1 && ok2, r.full, D.reasons[r.r], r.au);
    }
    return finish(c, R.length * 2, 'reading', missed, '🔮 Predicciones', '¡Madame Zora quiere contratarte como asistente! 🔮');
  }

  /* ====== t1p2 — LA AGENDA DEL CEO ====== */
  async function ceoPlanner(stage, p) {
    const D = G().ceo || { cal: [], req: [], slot: [] }; const idx = sample(D.req.map((_, i) => i), 6); let c = 0; const missed = [];
    for (let k = 0; k < idx.length && live(stage); k++) {
      const i = idx[k], r = D.req[i], [day, ev] = D.slot[i] || [0, 0];
      const body = head(stage, { lbl: 'Game', title: '📅 La agenda del CEO', ins: 'Eres el asistente de la CEO. Revisa <b>la agenda</b> 📅 y elige la respuesta correcta: si ya está planeado → <b>presente continuo / going to</b>; si está libre y decides ahora → <b>will</b>.', count: `${k + 1} / ${idx.length}` });
      const cal = h(`<div class="g5a-cal">${D.cal.map((d, di) => `<div class="g5a-day ${di === day ? 'hl' : ''}"><b>${d.d}<small>${d.es}</small></b><div>${d.ev.map((e, ei) => `<span class="${di === day && ei === ev ? 'on' : ''}">${e[1]} <i>${esc(e[0])}</i> ${esc(e[2])}</span>`).join('')}${di === day && ev < 0 ? '<span class="free">🟢 <i>free</i> Libre</span>' : ''}</div></div>`).join('')}</div>`);
      body.appendChild(cal); $$('.g5a-day span', cal).forEach(s => { if (!s.classList.contains('on') && !s.classList.contains('free')) s.classList.add('dim'); });
      $$('.g5a-day span.on,.g5a-day span.free', cal).forEach(s => s.classList.add('blink'));
      const call = h(`<div class="g5a-call"><span>📞</span><div><small>Incoming call · Llamada entrante</small><b>“${esc(r.q)}”</b></div></div>`); body.appendChild(call);
      center(body, rep(r.qau, '🔊 Escuchar la llamada')); play(r.qau);
      const ok = await askS(body, r.o, 'g5a-col');
      if (ok) c++; else missed.push({ en: r.o[0], au: r.au });
      await say(body, ok, r.o[0], r.es, r.au);
    }
    return finish(c, idx.length, 'listening', missed, '📅 Llamadas atendidas', '¡La CEO dice que eres el mejor asistente de Silicon Valley! 💼');
  }

  /* ====== t2p1 — DETECTOR DE SPANGLISH ====== */
  async function spanglishScan(stage, p) {
    const R = sample(G().spang || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🛰️ Detector de Spanglish', ins: 'La máquina tradujo <b>palabra por palabra</b> y suena “Spanglish”. Mira las palabras en rojo y elige la versión <b>natural</b> en inglés.', count: `${k + 1} / ${R.length}` });
      const words = r.bad.split(' ').map((w, i) => r.bw.includes(i) ? `<mark>${esc(w)}</mark>` : esc(w)).join(' ');
      const m = h(`<div class="g5a-mach"><div class="g5a-mh"><span>SPANGLISH DETECTOR 3000</span><i class="g5a-led"></i></div>
        <div class="g5a-scr"><small>🇪🇸 Español</small><p>${esc(r.es)}</p></div>
        <div class="g5a-scr bad"><small>⚠️ Traducción literal</small><p>${words}</p><i class="g5a-laser"></i></div></div>`);
      body.appendChild(m);
      body.appendChild(h(`<p class="g5a-q">✨ ¿Cómo lo diría un nativo?</p>`));
      const ok = await askS(body, r.o, 'g5a-col');
      const scr = $('.g5a-scr.bad', m); scr.classList.remove('bad'); scr.classList.add('good'); scr.innerHTML = `<small>✅ Natural English</small><p>${esc(r.good)}</p>`; $('.g5a-led', m).classList.add('ok');
      if (ok) c++; else missed.push({ en: r.good, au: r.au });
      await say(body, ok, r.good, r.why, r.au);
    }
    return finish(c, R.length, 'writing', missed, '🛰️ Spanglish detectado', '¡Tu inglés ya no tiene acento de traductor! 🇺🇸');
  }

  /* ====== t2p2 — LABORATORIO DEL APÓSTROFO ====== */
  async function apostropheLab(stage, p) {
    const R = sample(G().apos || [], 7); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🧪 Laboratorio del apóstrofo', ins: 'Lee la frase en español y elige el <b>tubo de ensayo</b> correcto: ¿<b>\'s</b>, <b>s\'</b>, <b>of</b> o <b>whose</b>? Si aciertas, la fórmula se pone verde 🟢.', count: `${k + 1} / ${R.length}` });
      const lab = h(`<div class="g5a-lab"><div class="g5a-ctxes"><span>${r.e}</span><i>“${esc(r.es)}”</i></div>
        <div class="g5a-beaker"><div class="g5a-liq"></div><b>${blank(r.s, '???')}</b></div></div>`); body.appendChild(lab);
      const o = shuffle(r.o.slice()); const rack = h(`<div class="g5a-rack">${o.map((x, i) => `<button class="g5a-tube" style="--c:${['#1D5FD1', '#E3242B', '#7C3AED'][i]}"><i></i><span>${esc(x)}</span></button>`).join('')}</div>`); body.appendChild(rack);
      const btns = $$('button', rack);
      const i = await new Promise(res => btns.forEach((b, j) => b.onclick = () => res(j)));
      btns.forEach(b => b.disabled = true); const ok = o[i] === r.o[0];
      btns[o.indexOf(r.o[0])].classList.add('right'); if (!ok) btns[i].classList.add('wrong');
      const bk = $('.g5a-beaker', lab); bk.classList.add(ok ? 'ok' : 'no'); $('b', bk).innerHTML = esc(r.full);
      if (ok) c++; else missed.push({ en: r.full, au: r.au });
      await say(body, ok, r.full, r.es, r.au);
    }
    return finish(c, R.length, 'writing', missed, '🧪 Fórmulas perfectas', '¡Premio Nobel del apóstrofo! 🏆');
  }

  /* ====== t3p1 — OBJETOS PERDIDOS (deducción) ====== */
  async function lostFound(stage, p) {
    const R = sample(G().lost || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🛎️ Objetos perdidos del hotel', ins: 'Eres el recepcionista. Escucha a los huéspedes 🔊, <b>deduce de quién es</b> el objeto y tócalo. Luego elige qué dices al devolverlo.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g5a-item"><span>${r.ie}</span><div><small>LOST &amp; FOUND · #${100 + k * 7}</small><b>${esc(r.it)}</b></div></div>`));
      const cl = h(`<div class="g5a-clues"></div>`); body.appendChild(cl);
      for (const x of r.cl) { cl.appendChild(h(`<div class="g5a-bub"><span>${r.g[x.w].e}</span><p><small>${esc(r.g[x.w].n)}</small>“${esc(x.en)}”</p></div>`)); await sleep(250); }
      const seq = h(`<button class="btn w sm g3-rep">🔊 Escuchar a los huéspedes</button>`); seq.onclick = () => { sfx('tap'); M.playSeq(r.cl.map(x => x.au)); }; center(body, seq); M.playSeq(r.cl.map(x => x.au));
      body.appendChild(h(`<p class="g5a-q">🕵️ ${esc(r.q)}</p>`));
      const gs = h(`<div class="g5a-guests">${r.g.map(g => `<button><span>${g.e}</span><b>${esc(g.n)}</b></button>`).join('')}</div>`); body.appendChild(gs);
      const gb = $$('button', gs);
      const pick = await new Promise(res => gb.forEach((b, j) => b.onclick = () => res(j)));
      stop(); gb.forEach(b => b.disabled = true); gb[r.own].classList.add('right'); const ok1 = pick === r.own; if (!ok1) gb[pick].classList.add('wrong');
      mini(body, ok1, ok1 ? '¡Exacto, buen detective!' : `Era de <b>${esc(r.g[r.own].n)}</b>`);
      body.appendChild(h(`<p class="g5a-q">💬 Le entregas el objeto. ¿Qué dices?</p>`));
      const ok2 = await askS(body, r.o, 'g3-three');
      c += (ok1 ? 1 : 0) + (ok2 ? 1 : 0); if (!(ok1 && ok2)) missed.push({ en: r.o[0], au: r.au });
      await say(body, ok1 && ok2, r.o[0], `${r.ie} → ${r.g[r.own].n}`, r.au);
    }
    return finish(c, R.length * 2, 'listening', missed, '🛎️ Objetos devueltos', '¡Ningún huésped se fue sin sus cosas! 🧳');
  }

  /* ====== t3p2 — EL TRIBUNAL ====== */
  async function gavelJudge(stage, p) {
    const all = G().judge || []; const R = shuffle([...sample(all.filter(x => !x.ok), 4), ...sample(all.filter(x => x.ok), 3)]); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '⚖️ ¡Orden en la corte!', ins: 'Eres el juez. Lee la declaración del testigo: si es correcta → <b>Overruled</b> (no hay error). Si tiene un error con los posesivos → <b>¡Objection sustained!</b> y corrígela.', count: `${k + 1} / ${R.length}` });
      const ct = h(`<div class="g5a-court"><div class="g5a-bench"><span class="g5a-gavel">🔨</span><b>🧑‍⚖️ THE HONORABLE YOU</b></div>
        <div class="g5a-wit"><span>🧍</span><p><small>Witness #${k + 1} says:</small>“${esc(r.s)}”</p></div>
        <div class="g5a-jury"><small>Jury</small><i style="width:${Math.round(c / R.length * 100)}%"></i></div></div>`); body.appendChild(ct);
      if (r.sau) center(body, rep(r.sau, '🔊 Escuchar al testigo'));
      const v = h(`<div class="opts g3-opts g3-two g5a-verd"><button class="opt">✅ Overruled<small>Está correcta</small></button><button class="opt">❌ Objection!<small>Tiene un error</small></button></div>`); body.appendChild(v);
      const vb = $$('button', v); const pick = await new Promise(res => vb.forEach((b, j) => b.onclick = () => res(j)));
      vb.forEach(b => b.disabled = true); const want = r.ok ? 0 : 1; vb[want].classList.add('right'); let ok = pick === want; if (!ok) vb[pick].classList.add('wrong');
      const gv = $('.g5a-gavel', ct); gv.classList.add('bang'); sfx('tap');
      if (ok && !r.ok) { body.appendChild(h(`<p class="g5a-q">✍️ Sustained! ¿Cuál es la versión correcta?</p>`)); ok = await askS(body, r.o, 'g5a-col'); }
      if (ok) c++; else missed.push({ en: r.fix, au: r.au });
      $('.g5a-jury i', ct).style.width = Math.round(c / R.length * 100) + '%';
      await say(body, ok, r.fix, r.ok ? 'La declaración era correcta: Overruled.' : 'Objection sustained: había un error.', r.au);
    }
    return finish(c, R.length, 'reading', missed, '⚖️ Veredictos', '¡Caso cerrado! El jurado te aplaude de pie. 👏');
  }

  /* ====== t4p1 — BUCKET LIST ====== */
  async function bucketList(stage, p) {
    const D = G().bucket || { list: [], q: [] }; const R = sample(D.q, 6); let c = 0; const missed = []; const stamped = new Set();
    const ST = { done: ['✅', 'Done'], yet: ['⏳', 'Not yet'], never: ['❌', 'Never'] };
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '📝 La bucket list de Rebecca', ins: 'Mira la lista de sueños de Rebecca ✅⏳❌ y responde con el <b>presente perfecto</b> (ever, never, already, yet, just).', count: `${k + 1} / ${R.length}` });
      const nb = h(`<div class="g5a-note"><div class="g5a-nh">✈️ Rebecca's Bucket List <small>“Fifty before fifty”</small></div>${D.list.map((x, i) => `<div class="g5a-li ${i === r.i ? 'hl' : ''} ${stamped.has(i) ? 'st' : ''}"><span>${x.e}</span><b>${esc(x.en)}</b><em class="${x.st}">${ST[x.st][0]} ${ST[x.st][1]}${x.note ? ` · ${esc(x.note)}` : ''}</em></div>`).join('')}</div>`);
      body.appendChild(nb);
      body.appendChild(h(`<div class="g5a-call g5a-qq"><span>🎙️</span><div><small>Podcast host asks:</small><b>“${esc(r.q)}”</b></div></div>`));
      center(body, rep(r.qau, '🔊 Escuchar')); play(r.qau);
      const ok = await askS(body, r.o, 'g5a-col');
      if (ok) { c++; stamped.add(r.i); } else missed.push({ en: r.o[0], au: r.au });
      await say(body, ok, r.o[0], '', r.au);
    }
    return finish(c, R.length, 'reading', missed, '📝 Bucket list', '¡Has respondido como un experto en experiencias! 🌎');
  }

  /* ====== t4p2 — LÍNEA DE TIEMPO DEL CV ====== */
  function resumeSVG(D, hi) {
    const y0 = 2008, y1 = D.now, X = y => 14 + (y - y0) / (y1 - y0) * 300, rowH = 30, H = D.bars.length * rowH + 34;
    let s = `<svg viewBox="0 0 340 ${H}" class="g5a-tl">`;
    [2008, 2012, 2016, 2020].forEach(y => { s += `<line x1="${X(y)}" y1="6" x2="${X(y)}" y2="${H - 22}" stroke="#CBD5E1" stroke-dasharray="3 3"/><text x="${X(y)}" y="${H - 8}" text-anchor="middle" font-size="10" font-weight="700" fill="#4A5B78">${y}</text>`; });
    s += `<line x1="${X(y1)}" y1="2" x2="${X(y1)}" y2="${H - 22}" stroke="#E3242B" stroke-width="2"/><text x="${X(y1) - 2}" y="${H - 8}" text-anchor="end" font-size="10" font-weight="900" fill="#E3242B">NOW</text>`;
    D.bars.forEach((b, i) => {
      const y = 8 + i * rowH, open = b.b == null, x1 = X(b.a), x2 = X(open ? y1 : b.b);
      const col = open ? '#E3242B' : '#0B2A5B', hl = i === hi;
      s += `<g class="${hl ? 'hl' : ''}"><text x="${Math.min(x1, 200)}" y="${y + 8}" font-size="10.5" font-weight="800" fill="#0B2A5B">${b.e} ${esc(b.en)}</text>
        <rect x="${x1}" y="${y + 12}" width="${x2 - x1}" height="9" rx="4.5" fill="${col}" opacity="${hi == null || hl ? 1 : .35}" ${hl ? 'stroke="#FACC15" stroke-width="3"' : ''}/>
        ${open ? `<path d="M${x2} ${y + 10} l7 6.5 l-7 6.5z" fill="${col}"/>` : ''}<text x="${x1}" y="${y + 30}" font-size="8.5" fill="#64748B">${b.a}${open ? ' → now' : '–' + b.b}</text></g>`;
    });
    return s + '</svg>';
  }
  async function resumeTimeline(stage, p) {
    const D = G().resume || { bars: [], q: [], now: 2026 }; const R = sample(D.q, 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🧑‍💼 La entrevista: el CV de Javier', ins: 'Mira la línea de tiempo: las barras <b style="color:#E3242B">rojas</b> siguen hasta hoy (→ <b>presente perfecto</b> + for/since); las <b>azules</b> ya terminaron (→ <b>pasado simple</b>).', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g5a-cv">${resumeSVG(D, r.i)}</div>`));
      body.appendChild(h(`<div class="g5a-call g5a-qq"><span>👩‍💼</span><div><small>Interviewer:</small><b>“${esc(r.q)}”</b></div></div>`));
      center(body, rep(r.qau, '🔊 Escuchar')); play(r.qau);
      const ok = await askS(body, r.o, 'g5a-col');
      if (ok) c++; else missed.push({ en: r.o[0], au: r.au });
      const b = D.bars[r.i]; await say(body, ok, r.o[0], b.b == null ? `Sigue hasta hoy (desde ${b.a}) → presente perfecto.` : `Terminó en ${b.b} → pasado simple.`, r.au);
    }
    return finish(c, R.length, 'reading', missed, '🧑‍💼 Entrevista', '¡Contratado! Tu dominio del presente perfecto es impecable. 🤝');
  }

  /* ====== t5p1 — ¡LLEGASTE TARDE! ====== */
  async function tooLate(stage, p) {
    const R = sample(G().late || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '⏱️ ¡Llegaste tarde!', ins: 'Mira la línea de tiempo: ¿qué pasó <b>ANTES</b> de que llegaras (🏃 YOU)? Eso va en <b>pasado perfecto</b> (had + participio).', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g5a-scene"><span>${r.e}</span><b>${esc(r.sc)}</b></div>`));
      const tl = h(`<div class="g5a-vt">${r.ev.map(e => e.en === 'YOU' ? `<div class="you"><i>${esc(e.t)}</i><b>🏃 YOU ARRIVED</b></div>` : `<div><i>${esc(e.t)}</i><b>${esc(e.en)}</b></div>`).join('')}</div>`); body.appendChild(tl);
      const rows = $$('div', tl); rows.forEach((d, i) => { d.style.animationDelay = (i * .18) + 's'; });
      const yi = r.ev.findIndex(e => e.en === 'YOU'); rows.forEach((d, i) => { if (i < yi) d.classList.add('before'); else if (i > yi) d.classList.add('after'); });
      body.appendChild(h(`<div class="g3-sent">${esc(r.lead)}</div>`));
      const ok = await askS(body, r.o, 'g5a-col');
      if (ok) c++; else missed.push({ en: r.full, au: r.au });
      await say(body, ok, r.full, 'Lo que pasó antes de tu llegada → had + participio.', r.au);
    }
    return finish(c, R.length, 'reading', missed, '⏱️ Llegadas', '¡Ahora sabes exactamente qué pasó antes! ⏪');
  }

  /* ====== t5p2 — CASO NOIR ====== */
  async function noirCase(stage, p) {
    const D = G().noir || { lines: [], sus: [] }; const L = D.lines; let c = 0; const missed = []; const done = [];
    const page = () => `<div class="g5a-noir"><div class="g5a-nh2">🕵️ CASE FILE #47 · <span>The Blue Star Diamond</span></div><div class="g5a-paper">${done.map(x => `<p>${esc(x)}</p>`).join('') || '<p class="mut">…</p>'}</div></div>`;
    for (let k = 0; k < L.length && live(stage); k++) {
      const r = L[k];
      const body = head(stage, { lbl: 'Game', title: '🕵️ Caso Noir: el diamante', ins: 'Ayuda al detective Cruz a escribir su informe. Elige el tiempo verbal correcto: <b>pasado simple</b>, <b>continuo</b> o <b>perfecto</b>. Al final… ¡acusa al culpable!', count: `${k + 1} / ${L.length + 1}` });
      body.appendChild(h(page())); const pp = $('.g5a-paper', body); pp.scrollTop = pp.scrollHeight;
      body.appendChild(h(`<div class="g3-sent g5a-type">${blank(r.s)}</div>`));
      const ok = await askS(body, r.o, 'g3-three');
      if (ok) c++; else missed.push({ en: r.full, au: r.au });
      done.push(r.full);
      await say(body, ok, r.full, r.why, r.au);
    }
    if (live(stage)) {
      const body = head(stage, { lbl: 'Game', title: '🕵️ ¡J’accuse! ¿Quién fue?', ins: 'Relee el informe y la pista final. Toca al <b>culpable</b>.', count: `${L.length + 1} / ${L.length + 1}` });
      body.appendChild(h(page()));
      body.appendChild(h(`<div class="g5a-clue">🔑 <b>Final clue:</b> ${esc(D.clue)}</div>`)); play(D.clueau);
      const sb = h(`<div class="g5a-guests g5a-sus">${D.sus.map(s => `<button><span>${s.e}</span><b>${esc(s.n)}</b><small>${esc(s.r)}</small></button>`).join('')}</div>`); body.appendChild(sb);
      const bs = $$('button', sb); const pick = await new Promise(res => bs.forEach((b, j) => b.onclick = () => res(j)));
      bs.forEach(b => b.disabled = true); bs[D.own].classList.add('right'); const ok = pick === D.own; if (!ok) bs[pick].classList.add('wrong');
      if (ok) c++; else missed.push({ en: D.clue, au: D.clueau });
      await say(body, ok, 'Case closed. Victor had planned the whole thing.', 'Solo el gerente tenía la llave y había enviado al guardia a casa.', D.endau);
    }
    return finish(c, L.length + 1, 'writing', missed, '🕵️ Caso resuelto', '¡Detective de primera! Tu narración fue impecable. 🔍');
  }

  /* ====== t6p1 — LA PIRÁMIDE DEL TIEMPO ====== */
  async function timeZoom(stage, p) {
    const D = G().zoom || { z: [], bu: [] }; const R = [...sample(D.z, 6).map(x => ({ ...x, t: 'z' })), ...sample(D.bu, 2).map(x => ({ ...x, t: 'b' }))]; let c = 0; const missed = [];
    const LAB = { at: 'AT', on: 'ON', in: 'IN', '-': 'Ø', by: 'BY', until: 'UNTIL' };
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: r.t === 'z' ? '🔺 La pirámide del tiempo' : '🏁 By o until', ins: r.t === 'z' ? 'Toca el nivel correcto de la pirámide: <b>AT</b> (punto exacto) · <b>ON</b> (días y fechas) · <b>IN</b> (períodos largos) · <b>Ø</b> (sin preposición: next, last, this…).' : '<b>BY</b> = fecha límite (a más tardar) · <b>UNTIL</b> = algo que continúa hasta ese momento.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g3-sent g5a-card">${blank(r.s, '__')}</div>`));
      let keys, wrap;
      if (r.t === 'z') {
        keys = ['at', 'on', 'in', '-'];
        wrap = h(`<div class="g5a-pyr"><button data-k="at" class="l1"><b>AT</b><small>⏰ 9:00 · noon · night</small></button><button data-k="on" class="l2"><b>ON</b><small>📅 Monday · July 4th</small></button><button data-k="in" class="l3"><b>IN</b><small>🌍 May · 2030 · the summer</small></button><button data-k="-" class="l0"><b>Ø</b><small>🚫 next / last / this</small></button></div>`);
      } else {
        keys = ['by', 'until'];
        wrap = h(`<div class="g5a-bu"><button data-k="by"><b>BY 🏁</b><i class="flag"></i><small>deadline · a más tardar</small></button><button data-k="until"><b>UNTIL ⏳</b><i class="bar"></i><small>continúa hasta</small></button></div>`);
      }
      body.appendChild(wrap); const bs = $$('button', wrap);
      const pick = await new Promise(res => bs.forEach(b => b.onclick = () => res(b.dataset.k)));
      bs.forEach(b => b.disabled = true); const ok = pick === r.a;
      bs.find(b => b.dataset.k === r.a).classList.add('right'); if (!ok) bs.find(b => b.dataset.k === pick).classList.add('wrong');
      $('.g5a-card', body).innerHTML = esc(r.full);
      if (ok) c++; else missed.push({ en: r.full, au: r.au });
      await say(body, ok, r.full, r.t === 'z' ? (r.a === '-' ? 'Sin preposición con next / last / this / every.' : `${LAB[r.a]} ${r.a === 'at' ? '→ punto exacto' : r.a === 'on' ? '→ día o fecha' : '→ período largo'}`) : r.es, r.au);
    }
    return finish(c, R.length, 'reading', missed, '🔺 Pirámide del tiempo', '¡Dominas at, on, in, by y until como un nativo! ⏰');
  }

  /* ====== t6p2 — EL PÓDCAST CON BIP ====== */
  async function podcastBleep(stage, p) {
    const R = sample(G().pod || [], 7); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🎙️ The Commute Show', ins: 'El editor del pódcast tapó una palabra con un <b>¡BIP!</b> 🔇 Elige la palabra que falta (during, for, while, within, in time, on time…).', count: `${k + 1} / ${R.length}` });
      const bars = Array.from({ length: 26 }, (_, i) => `<i style="--h:${20 + Math.round(Math.abs(Math.sin(i * 1.7 + k)) * 70)}%;--d:${(i % 7) * .09}s"></i>`).join('');
      const pl = h(`<div class="g5a-pod"><div class="g5a-cover"><b>🎙️</b><span>THE<br>COMMUTE<br>SHOW</span></div><div class="g5a-pr"><small>EP. ${41 + k} · Life in traffic</small><div class="g5a-wave">${bars}</div><div class="g5a-prog"><i style="width:${Math.round((k + 1) / R.length * 100)}%"></i></div></div></div>`); body.appendChild(pl);
      const tr = h(`<div class="g5a-tr"><span class="${r.v}">${r.v === 'f' ? '👩🏽' : '👨🏻'}</span><p><small>${esc(r.who)}</small>${esc(r.s).replace('___', '<mark class="bleep">BIP 🔇</mark>')}</p></div>`); body.appendChild(tr);
      sfx('flip');
      const ok = await askS(body, r.o, 'g3-three');
      $('p', tr).innerHTML = `<small>${esc(r.who)}</small>${esc(r.full)}`;
      if (ok) c++; else missed.push({ en: r.full, au: r.au });
      await say(body, ok, r.full, '', r.au);
    }
    return finish(c, R.length, 'listening', missed, '🎙️ Episodio editado', '¡El productor dice que eres el mejor editor del show! 🎧');
  }

  /* ====== t7p1 — PILOTO DE DRON ====== */
  const MAP_SVG = `<svg viewBox="0 0 320 220" class="g5a-map" preserveAspectRatio="none">
    <rect width="320" height="220" fill="#BBF7D0"/>
    <path d="M0 96 Q80 88 160 98 T320 94 L320 126 Q240 132 160 124 T0 128Z" fill="#60A5FA"/>
    <rect x="236" y="88" width="28" height="42" fill="#A16207" rx="3"/><line x1="240" y1="92" x2="240" y2="126" stroke="#FDE68A" stroke-width="2"/><line x1="260" y1="92" x2="260" y2="126" stroke="#FDE68A" stroke-width="2"/>
    <rect x="28" y="176" width="126" height="32" rx="14" fill="#15803D"/>
    <polygon points="262,52 284,18 306,52" fill="#78716C"/><polygon points="246,52 262,30 278,52" fill="#A8A29E"/><polygon points="280,18 284,12 288,18" fill="#fff"/>
    <text x="72" y="104" font-size="9" font-weight="800" fill="#1E3A8A">RIVER</text>
  </svg>`;
  const DRONE = `<svg viewBox="0 0 40 40" width="38" height="38"><g class="g5a-rot"><circle cx="8" cy="8" r="6.5" fill="#fff" stroke="#0B2A5B" stroke-width="2"/><circle cx="32" cy="8" r="6.5" fill="#fff" stroke="#0B2A5B" stroke-width="2"/><circle cx="8" cy="32" r="6.5" fill="#fff" stroke="#0B2A5B" stroke-width="2"/><circle cx="32" cy="32" r="6.5" fill="#fff" stroke="#0B2A5B" stroke-width="2"/></g><path d="M9 9 L31 31 M31 9 L9 31" stroke="#0B2A5B" stroke-width="3"/><rect x="13" y="13" width="14" height="14" rx="4" fill="#E3242B" stroke="#0B2A5B" stroke-width="2"/><circle cx="20" cy="20" r="3" fill="#fff"/></svg>`;
  const PINS = [['🌲', 50, 192], ['🌲', 90, 190], ['🌳', 128, 193], ['🗼', 158, 54], ['☕', 245, 182], ['🏦', 100, 62], ['🚩', 100, 156], ['🏠', 30, 40], ['🏢', 205, 60], ['⛪', 30, 160]];
  async function droneFlight(stage, p) {
    const R = sample(G().drone || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🛸 Piloto de dron', ins: 'Observa el vuelo del dron 🛸 sobre el mapa y elige la preposición que describe <b>cómo se movió</b> o <b>dónde aterrizó</b>.', count: `${k + 1} / ${R.length}` });
      const box = h(`<div class="g5a-mapbox">${MAP_SVG}${PINS.map(([e, x, y]) => `<span class="g5a-pin" style="left:${x / 3.2}%;top:${y / 2.2}%">${e}</span>`).join('')}<div class="g5a-trail"></div><div class="g5a-drone">${DRONE}</div></div>`); body.appendChild(box);
      const dr = $('.g5a-drone', box); const pos = (pt) => { dr.style.left = (pt[0] / 3.2) + '%'; dr.style.top = (pt[1] / 2.2) + '%'; };
      const fly = async () => { dr.style.transition = 'none'; pos(r.p[0]); dr.style.opacity = 1; await sleep(60); for (let i = 1; i < r.p.length; i++) { if (!live(stage)) return; dr.style.transition = 'left .5s linear, top .5s linear'; pos(r.p[i]); await sleep(520); } if (r.a === 'beyond') dr.style.opacity = .15; };
      const again = h(`<button class="btn w sm g3-rep">🔁 Ver el vuelo otra vez</button>`); again.onclick = () => { sfx('tap'); fly(); }; center(body, again);
      await fly();
      const blankS = r.en.replace(new RegExp(`\\b${r.a}\\b`), '___');
      body.appendChild(h(`<div class="g3-sent">${blank(blankS)}</div>`));
      const ok = await askS(body, r.o, 'g3-three');
      if (ok) c++; else missed.push({ en: r.en, au: r.au });
      await say(body, ok, r.en, '', r.au);
    }
    return finish(c, R.length, 'reading', missed, '🛸 Vuelos', '¡Licencia de piloto aprobada! Dominas across, along, through… ✈️');
  }

  /* ====== t7p2 — MAPA DE LA CIUDAD ====== */
  async function gridCity(stage, p) {
    const D = G().city || { lots: {}, q: [], streets: [], ave: '' }; const R = D.q; let c = 0; const missed = []; const shown = {};
    const RW = [1, 3, 5], CL = [1, 2, 4, 5];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🗺️ Perdido en Maple Grove', ins: 'Escucha 🔊 o lee la descripción y toca en el mapa la <b>cuadra ❓ correcta</b>. Fíjate en <b>next to, between, across from, on the corner of</b>.', count: `${k + 1} / ${R.length}` });
      let cells = '';
      for (let ri = 0; ri < 3; ri++) for (let ci = 0; ci < 4; ci++) {
        const key = `r${ri}c${ci}`, fix = D.lots[key], st = `grid-row:${RW[ri]};grid-column:${CL[ci]}`;
        if (fix) cells += `<div class="g5a-lot fix" style="${st}"><span>${fix.e}</span><small>${esc(fix.n)}</small></div>`;
        else cells += `<button class="g5a-lot" data-k="${key}" style="${st}">${shown[key] ? `<span>${shown[key].e}</span><small>${esc(shown[key].n)}</small>` : '<span>❓</span>'}</button>`;
      }
      const map = h(`<div class="g5a-city"><div class="g5a-st" style="grid-row:2"><span>${esc(D.streets[0])}</span></div><div class="g5a-st" style="grid-row:4"><span>${esc(D.streets[1])}</span></div><div class="g5a-av"><span>${esc(D.ave)}</span></div>${cells}<i class="g5a-n">N ⬆</i></div>`); body.appendChild(map);
      body.appendChild(h(`<div class="g5a-call g5a-qq"><span>${r.e}</span><div><small>Where is the ${esc(r.n.toLowerCase())}?</small><b>“${esc(r.en)}”</b></div></div>`));
      center(body, rep(r.au, '🔊 Escuchar')); play(r.au);
      const bs = $$('button.g5a-lot', map);
      const pick = await new Promise(res => bs.forEach(b => b.onclick = () => res(b.dataset.k)));
      bs.forEach(b => b.disabled = true); const ok = pick === r.k;
      const tb = bs.find(b => b.dataset.k === r.k); tb.innerHTML = `<span>${r.e}</span><small>${esc(r.n)}</small>`; tb.classList.add('right'); if (!ok) bs.find(b => b.dataset.k === pick).classList.add('wrong');
      shown[r.k] = { e: r.e, n: r.n };
      if (ok) c++; else missed.push({ en: r.en, au: r.au });
      await say(body, ok, r.en, '', r.au);
    }
    return finish(c, R.length, 'listening', missed, '🗺️ Lugares encontrados', '¡Ya te puedes mover por cualquier ciudad de EE. UU.! 🏙️');
  }

  Object.assign(window.M1A, { crystalBall, ceoPlanner, spanglishScan, apostropheLab, lostFound, gavelJudge, bucketList, resumeTimeline, tooLate, noirCase, timeZoom, podcastBleep, droneFlight, gridCity });
})();
