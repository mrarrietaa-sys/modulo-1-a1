/* =====================================================================
   JUEGOS ÚNICOS DEL MÓDULO 2 (A2) — una dinámica distinta en cada clase
   t1p1 setClock · t1p2 departures · t2p1 dayOrder · t2p2 errorHunt
   t3p1 simonBody · t3p2 pharmacy · t4p1 avatarMaker · t4p2 guessWho
   t5p1 situations · t5p2 balance · t6p1 diary · t6p2 pastRush
   t7p1 stories · t7p2 alibi · t8p1 freqSlider · t8p2 agenda
   t9p1 talentShow · t9p2 signs · t10p1 pronounTrain · t10p2 hostParty
   t11p1 switches · t11p2 busRoute
   ===================================================================== */
(function () {
  const M = window.M1, A = window.M1A;
  const { $, $$, h, esc, shuffle, sample, sleep, play, stop, sfx, sheet, photo } = M;
  const { head, result } = A;
  const G = () => window.M1G4 || {};
  const V = (p, en) => (p.vocab || []).find(v => v.en.toLowerCase() === String(en).toLowerCase());
  const live = (stage) => stage.isConnected;
  const norm = (s) => String(s || '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z' ]/g, '').trim();

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

  /* ---------- reloj SVG ---------- */
  function clockSVG(hr, mn, big) {
    const pt = (a, l) => { const r = (a - 90) * Math.PI / 180; return [100 + l * Math.cos(r), 100 + l * Math.sin(r)]; };
    let t = ''; for (let i = 0; i < 12; i++) { const [a, b] = pt(i * 30, 86), [c, d] = pt(i * 30, i % 3 ? 78 : 72); t += `<line x1="${a.toFixed(1)}" y1="${b.toFixed(1)}" x2="${c.toFixed(1)}" y2="${d.toFixed(1)}" stroke="#0B2A5B" stroke-width="${i % 3 ? 2 : 4}" stroke-linecap="round"/>`; }
    const n = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(k => { const [x, y] = pt(k * 30, 60); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Poppins,sans-serif" font-weight="800" font-size="16" fill="#0B2A5B">${k}</text>`; }).join('');
    const [hx, hy] = pt(((hr % 12) + mn / 60) * 30, 42), [mx, my] = pt(mn * 6, 66);
    return `<svg class="g4-clock" viewBox="0 0 200 200" width="${big ? 220 : 180}" height="${big ? 220 : 180}"><circle cx="100" cy="100" r="94" fill="#fff" stroke="#0B2A5B" stroke-width="6"/>${t}${n}<line class="hh" x1="100" y1="100" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#0B2A5B" stroke-width="8" stroke-linecap="round"/><line class="mh" x1="100" y1="100" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#E3242B" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="100" r="7" fill="#0B2A5B" stroke="#E3242B" stroke-width="2"/></svg>`;
  }

  /* ====== t1p1 — AJUSTA EL RELOJ ====== */
  async function setClock(stage, p) {
    const R = sample(G().clock || [], 5); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; let hh = 12, mm = 0;
      const body = head(stage, { lbl: 'Game', title: '⏰ Ajusta el reloj', ins: 'Escucha la hora 🔊 y <b>mueve las manecillas</b> con los botones. Luego toca “Comprobar”.', count: `${k + 1} / ${R.length}` });
      center(body, rep(r.au, '🔊 Escuchar la hora')); play(r.au);
      const box = h(`<div class="g4-clockbox"><div class="g4-cl">${clockSVG(hh, mm, true)}</div><div class="g4-ctrl"><div><small>Hora</small><button class="btn w sm" data-d="h-">−</button><b id="hv">12</b><button class="btn w sm" data-d="h+">+</button></div><div><small>Minutos</small><button class="btn w sm" data-d="m-">−5</button><b id="mv">00</b><button class="btn w sm" data-d="m+">+5</button></div></div></div>`); body.appendChild(box);
      const draw = () => { $('.g4-cl', box).innerHTML = clockSVG(hh, mm, true); $('#hv', box).textContent = hh; $('#mv', box).textContent = String(mm).padStart(2, '0'); };
      $$('[data-d]', box).forEach(b => b.onclick = () => { sfx('tap'); const d = b.dataset.d; if (d === 'h+') hh = hh % 12 + 1; if (d === 'h-') hh = hh === 1 ? 12 : hh - 1; if (d === 'm+') mm = (mm + 5) % 60; if (d === 'm-') mm = (mm + 55) % 60; draw(); });
      const ok = await new Promise(res => { const bar = h(`<div class="actionbar"><button class="btn k lg">Comprobar ✓</button></div>`); body.appendChild(bar); $('button', bar).onclick = () => { bar.remove(); $$('[data-d]', box).forEach(b => b.disabled = true); res((hh % 12) === (r.h % 12) && mm === r.m); }; });
      if (!ok) { hh = r.h || 12; mm = r.m; draw(); }
      if (ok) c++; else missed.push({ en: r.en, au: r.au });
      await say(body, ok, r.en, `${String(r.h).padStart(2, '0')}:${String(r.m).padStart(2, '0')}`, r.au);
    }
    return finish(c, R.length, 'listening', missed, '⏰ Relojes', '¡Ya sabes decir la hora en inglés! 🕐');
  }

  /* ====== t1p2 — TABLERO DE SALIDAS ====== */
  async function departures(stage, p) {
    const D = G().dep || []; const board = sample(D, 6); const asks = sample(board, 4); let c = 0; const missed = [];
    for (let k = 0; k < asks.length && live(stage); k++) {
      const r = asks[k];
      const body = head(stage, { lbl: 'Game', title: '🚌 Terminal de buses', ins: 'Escucha el anuncio 🔊 y toca en el tablero el <b>bus correcto</b> (destino y hora).', count: `${k + 1} / ${asks.length}` });
      const brd = h(`<div class="g4-board"><div class="g4-bh"><span>🚌 DEPARTURES · SALIDAS</span><span>${new Date().toLocaleDateString('en-US', { weekday: 'short' })}</span></div>${board.map((x, i) => `<button data-i="${i}"><span>${esc(x.to)}</span><b>${x.t}</b></button>`).join('')}</div>`); body.appendChild(brd);
      center(body, rep(r.au, '🔊 Escuchar el anuncio')); play(r.au);
      const btns = $$('button', brd);
      const i = await new Promise(res => btns.forEach(b => b.onclick = () => res(+b.dataset.i)));
      const ci = board.indexOf(r); btns.forEach(b => b.disabled = true); btns[ci].classList.add('right'); const ok = i === ci; if (!ok) btns[i].classList.add('wrong');
      if (ok) c++; else missed.push({ en: `The bus to ${r.to} leaves at ${r.say}.`, au: r.au });
      await say(body, ok, `The bus to ${r.to} leaves at ${r.say}.`, `Sale a las ${r.t}`, r.au);
    }
    return finish(c, asks.length, 'listening', missed, '🚌 Buses', '¡Nunca vas a perder un bus! 🎫');
  }

  /* ====== t2p1 — ORDENA TU DÍA ====== */
  async function dayOrder(stage, p) {
    const P = (p.vocab || []); const ROUNDS = 2; let c = 0, t = 0; const missed = [];
    for (let k = 0; k < ROUNDS && live(stage); k++) {
      const idx = sample(P.map((_, i) => i), 5).sort((a, b) => a - b); const items = idx.map(i => P[i]); const sh = shuffle(items);
      const body = head(stage, { lbl: 'Game', title: '🌅 Ordena el día', ins: 'Toca las fotos en el <b>orden de un día normal</b>: de la mañana a la noche.', count: `${k + 1} / ${ROUNDS}` });
      const line = h(`<div class="g4-line">${items.map((_, i) => `<span>${i + 1}</span>`).join('')}</div>`); body.appendChild(line);
      const wrap = h(`<div class="opts g3-opts g3-img g4-day">${sh.map(v => `<button class="opt imgopt">${photo(v.img)}<span class="imglbl">${esc(v.en)}</span></button>`).join('')}</div>`); body.appendChild(wrap);
      const btns = $$('.opt', wrap); let n = 0, first = true;
      await new Promise(res => btns.forEach((b, j) => b.onclick = () => { const v = sh[j];
        if (v === items[n]) { b.disabled = true; b.classList.add('right'); b.insertAdjacentHTML('beforeend', `<i class="g4-num">${n + 1}</i>`); $$('span', line)[n].textContent = v.en; $$('span', line)[n].classList.add('ok'); sfx('ok'); play(v.au); n++; if (n === items.length) res(); }
        else { first = false; sfx('bad'); b.classList.add('shake'); M.toast(`Antes va: ${items[n].en} (${items[n].es})`); setTimeout(() => b.classList.remove('shake'), 400); } }));
      t++; if (first) c++; else missed.push(...items);
      await say(body, first, items.map(v => v.en).join(' → '), '', null);
    }
    return finish(c, t, 'reading', missed, '🌅 Días ordenados', '¡Tu rutina en inglés es perfecta! ☀️');
  }

  /* ====== t2p2 — CAZA EL ERROR ====== */
  async function errorHunt(stage, p) {
    const R = sample(G().err || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🔎 Caza el error', ins: 'Cada oración tiene <b>un error</b>. Toca la palabra equivocada y luego elige la correcta.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<p class="center muted" style="margin:0 0 6px"><i>${esc(r.es)}</i></p>`));
      const line = h(`<div class="g4-toks">${r.toks.map((w, i) => `<button data-i="${i}">${esc(w)}</button>`).join('')}</div>`); body.appendChild(line);
      const tb = $$('button', line);
      const wi = await new Promise(res => tb.forEach(b => b.onclick = () => res(+b.dataset.i)));
      tb.forEach(b => b.disabled = true); let ok = wi === r.wi;
      tb[r.wi].classList.add('bad'); if (!ok) tb[wi].classList.add('shake');
      if (ok) { sfx('ok'); const wrongW = r.toks[r.wi].replace(/[.?!]$/, ''); const alt = /s$/.test(r.c) ? r.c.replace(/s$/, '') : r.c + 's';
        const opts = shuffle([r.c, wrongW, alt].filter((x, i, arr) => arr.indexOf(x) === i));
        ok = await ask(body, opts.map(esc), opts.indexOf(r.c), 'g3-three'); }
      tb[r.wi].textContent = r.c + (r.wi === r.toks.length - 1 ? r.toks[r.wi].slice(-1) : ''); tb[r.wi].classList.remove('bad'); tb[r.wi].classList.add('fixed');
      if (ok) c++; else missed.push({ en: r.full, au: r.au });
      await say(body, ok, r.full, r.es, r.au);
    }
    return finish(c, R.length, 'writing', missed, '🔎 Errores corregidos', '¡Ojo de editor profesional! ✍️');
  }

  /* ====== t3p1 — SIMÓN DICE (cuerpo) ====== */
  const BODY_SVG = `<svg viewBox="0 0 200 330" class="g4-bodysvg">
    <rect x="70" y="118" width="60" height="96" rx="18" fill="#1D5FD1"/>
    <rect x="44" y="122" width="22" height="78" rx="11" fill="#F2C29B"/><rect x="134" y="122" width="22" height="78" rx="11" fill="#F2C29B"/>
    <circle cx="55" cy="208" r="13" fill="#F2C29B"/><circle cx="145" cy="208" r="13" fill="#F2C29B"/>
    <rect x="74" y="212" width="22" height="88" rx="10" fill="#0B2A5B"/><rect x="104" y="212" width="22" height="88" rx="10" fill="#0B2A5B"/>
    <ellipse cx="80" cy="306" rx="20" ry="10" fill="#E3242B"/><ellipse cx="120" cy="306" rx="20" ry="10" fill="#E3242B"/>
    <rect x="90" y="96" width="20" height="26" fill="#F2C29B"/>
    <circle cx="100" cy="60" r="40" fill="#F2C29B"/><path d="M60 58 Q62 16 100 18 Q140 16 140 58 Q132 34 100 32 Q70 34 60 58Z" fill="#2B1B12"/>
    <ellipse cx="58" cy="64" rx="7" ry="11" fill="#E9B48A"/><ellipse cx="142" cy="64" rx="7" ry="11" fill="#E9B48A"/>
    <circle cx="85" cy="58" r="5" fill="#2B1B12"/><circle cx="115" cy="58" r="5" fill="#2B1B12"/>
    <path d="M100 62 L95 74 L104 74" fill="none" stroke="#B9835F" stroke-width="3" stroke-linecap="round"/>
    <path d="M88 84 Q100 94 112 84" fill="none" stroke="#B5462A" stroke-width="4" stroke-linecap="round"/>
    <g class="g4-hot" fill="transparent">
      <rect data-p="shoulders" x="62" y="112" width="76" height="20"/><rect data-p="arm" x="40" y="130" width="30" height="66"/><rect data-p="arm" x="130" y="130" width="30" height="66"/>
      <circle data-p="hand" cx="55" cy="208" r="16"/><circle data-p="hand" cx="145" cy="208" r="16"/>
      <rect data-p="leg" x="70" y="214" width="60" height="82"/><rect data-p="feet" x="56" y="296" width="88" height="22"/>
      <rect data-p="neck" x="86" y="96" width="28" height="18"/><rect data-p="head" x="64" y="36" width="72" height="16"/>
      <path data-p="hair" d="M60 58 Q62 16 100 18 Q140 16 140 58 Q132 34 100 32 Q70 34 60 58Z"/>
      <ellipse data-p="ears" cx="58" cy="64" rx="10" ry="14"/><ellipse data-p="ears" cx="142" cy="64" rx="10" ry="14"/>
      <rect data-p="eyes" x="74" y="49" width="52" height="18" rx="8"/><rect data-p="nose" x="92" y="64" width="16" height="14"/><rect data-p="mouth" x="84" y="79" width="32" height="14"/>
    </g></svg>`;
  async function simonBody(stage, p) {
    const R = sample(G().body || [], 7); let c = 0; const missed = [];
    const body = head(stage, { lbl: 'Game', title: '🙋 Simón dice', ins: 'Escucha la orden 🔊 (<i>Touch your…</i>) y <b>toca esa parte del cuerpo</b> en el dibujo.' });
    const hud = h(`<div class="g3-call">🔊 <b id="sb">—</b></div>`); body.appendChild(hud);
    const fig = h(`<div class="g4-body">${BODY_SVG}</div>`); body.appendChild(fig);
    const rp = center(body, rep(null, '🔊 Repetir'));
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; $('#sb', hud).innerHTML = `Orden ${k + 1} de ${R.length}`; rp.onclick = () => play(r.au); await sleep(300); play(r.au);
      const hot = $$('[data-p]', fig);
      const got = await new Promise(res => hot.forEach(el => el.onclick = () => res(el.dataset.p)));
      const ok = got === r.p; hot.filter(el => el.dataset.p === r.p).forEach(el => el.classList.add('on'));
      $('#sb', hud).innerHTML = `${ok ? '✅' : '❌'} Touch your <u>${esc(r.p)}</u> = ${esc(r.es)}${ok ? '' : ` <small>(tocaste: ${esc(got)})</small>`}`;
      sfx(ok ? 'ok' : 'bad'); if (ok) c++; else missed.push({ en: r.p, au: r.au }); await play(r.au); await sleep(ok ? 700 : 1600);
      hot.forEach(el => el.classList.remove('on'));
    }
    return finish(c, R.length, 'listening', missed, '🙋 Partes del cuerpo', '¡Conoces tu cuerpo en inglés! 💪');
  }

  /* ====== t3p2 — LA FARMACIA ====== */
  async function pharmacy(stage, p) {
    const PH = G().pharm || []; const R = sample(PH, 5); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '💊 En la farmacia', ins: 'Eres el farmaceuta. Escucha al cliente y elige el <b>mejor consejo</b> (should / shouldn\'t).', count: `Cliente ${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g3-officer">${k % 2 ? '🧔🏽' : '👩🏻'}<div class="bubble">“${esc(r.p)}”<small>${esc(r.pes)}</small></div></div>`)).appendChild(rep(r.pau));
      play(r.pau);
      const opts = shuffle([r, ...sample(PH.filter(x => x !== r), 2)]);
      const ok = await ask(body, opts.map(o => `💊 ${esc(o.a)}`), opts.indexOf(r));
      if (ok) c++; else missed.push({ en: r.a, au: r.aau });
      await say(body, ok, r.a, r.aes, r.aau);
    }
    return finish(c, R.length, 'reading', missed, '💊 Clientes atendidos', '¡Excelentes consejos! 🩺');
  }

  /* ---------- avatar (cara) ---------- */
  const HC = { blond: '#E8C15A', dark: '#2B1B12', red: '#B5462A', gray: '#A8A8A8' }, EC = { blue: '#2F6FE0', brown: '#6B3E1E', green: '#1E9E4A' };
  function avatar(o, w = 140) {
    const hc = HC[o.color] || '#2B1B12'; let back = '', front = '';
    if (o.len === 'long') back = o.style === 'curly' ? Array.from({ length: 9 }, (_, i) => `<circle cx="${i % 2 ? 36 : 164}" cy="${70 + Math.floor(i / 2) * 18}" r="16" fill="${hc}"/>`).join('') : `<rect x="30" y="50" width="140" height="110" rx="30" fill="${hc}"/>`;
    if (o.len !== 'bald') front = o.style === 'curly' ? Array.from({ length: 9 }, (_, i) => `<circle cx="${52 + i * 12}" cy="${42 - Math.sin(i / 8 * Math.PI) * 14}" r="14" fill="${hc}"/>`).join('') : `<path d="M48 76 Q46 22 100 22 Q154 22 152 76 Q140 46 100 44 Q62 46 48 76Z" fill="${hc}"/>`;
    else front = `<path d="M50 70 Q52 60 58 58 L58 80Z M150 70 Q148 60 142 58 L142 80Z" fill="${hc}"/>`;
    const eyes = [76, 124].map(x => `<circle cx="${x}" cy="82" r="10" fill="#fff"/><circle cx="${x}" cy="83" r="6" fill="${EC[o.eyes] || '#6B3E1E'}"/><circle cx="${x}" cy="83" r="2.5" fill="#111"/>`).join('');
    const gl = o.glasses ? `<g fill="none" stroke="#111" stroke-width="4"><circle cx="76" cy="82" r="16"/><circle cx="124" cy="82" r="16"/><path d="M92 82 L108 82"/></g>` : '';
    const beard = o.beard ? `<path d="M56 100 Q60 150 100 156 Q140 150 144 100 Q132 126 100 126 Q68 126 56 100Z" fill="${o.color === 'blond' ? '#C9A040' : hc}"/>` : '';
    const lips = o.sex === 'f' ? '#C2410C' : '#9A5B40';
    return `<svg viewBox="0 0 200 175" width="${w}" class="g4-av">${back}<circle cx="100" cy="88" r="56" fill="#F2C29B"/>${front}${eyes}${gl}<path d="M100 92 L95 106 L104 106" fill="none" stroke="#B9835F" stroke-width="3" stroke-linecap="round"/>${beard}<path d="M86 120 Q100 130 114 120" fill="none" stroke="${lips}" stroke-width="4" stroke-linecap="round"/></svg>`;
  }

  /* ====== t4p1 — CREA EL PERSONAJE ====== */
  async function avatarMaker(stage, p) {
    const R = sample(G().avatar || [], 4); let c = 0; const missed = [];
    const OPT = { len: [['long', 'long'], ['short', 'short'], ['bald', 'bald']], style: [['straight', 'straight'], ['curly', 'curly']], color: [['blond', 'blond'], ['dark', 'dark'], ['red', 'red'], ['gray', 'gray']], eyes: [['blue', 'blue'], ['brown', 'brown'], ['green', 'green']], glasses: [[true, 'glasses ✓'], [false, 'no glasses']], beard: [[true, 'beard ✓'], [false, 'no beard']] };
    const LBL = { len: 'Hair length', style: 'Hair style', color: 'Hair color', eyes: 'Eyes', glasses: 'Glasses', beard: 'Beard' };
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const cur = { len: 'short', style: 'straight', color: 'dark', eyes: 'brown', glasses: false, beard: false, sex: r.sex };
      const body = head(stage, { lbl: 'Game', title: '🎨 Crea el personaje', ins: 'Escucha y lee la descripción. <b>Arma el personaje</b> eligiendo el cabello, los ojos y los accesorios.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g3-sent">“${esc(r.en)}”</div>`)).appendChild(rep(r.au)); play(r.au);
      const ed = h(`<div class="g4-avedit"><div class="g4-avbox">${avatar(cur, 170)}</div><div class="g4-avopts">${Object.keys(OPT).filter(kk => kk !== 'beard' || r.sex === 'm').map(kk => `<div><small>${LBL[kk]}</small><div>${OPT[kk].map(([v, l]) => `<button data-k="${kk}" data-v="${v}" class="${cur[kk] === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>`).join('')}</div></div>`); body.appendChild(ed);
      $$('[data-k]', ed).forEach(b => b.onclick = () => { const kk = b.dataset.k; let v = b.dataset.v; if (v === 'true') v = true; if (v === 'false') v = false; cur[kk] = v; sfx('tap'); $$(`[data-k="${kk}"]`, ed).forEach(x => x.classList.toggle('on', x === b)); $('.g4-avbox', ed).innerHTML = avatar(cur, 170); });
      const ok = await new Promise(res => { const bar = h(`<div class="actionbar"><button class="btn k lg">Comprobar ✓</button></div>`); body.appendChild(bar); $('button', bar).onclick = () => { bar.remove(); $$('[data-k]', ed).forEach(b => b.disabled = true);
        const keys = ['len', 'color', 'eyes', 'glasses'].concat(r.len !== 'bald' ? ['style'] : []).concat(r.sex === 'm' ? ['beard'] : []); res(keys.every(kk => cur[kk] === r[kk])); }; });
      if (!ok) { $('.g4-avbox', ed).insertAdjacentHTML('beforeend', `<div class="g4-avok"><small>Correcto:</small>${avatar(r, 120)}</div>`); }
      if (ok) c++; else missed.push({ en: r.en, au: r.au });
      await say(body, ok, r.en, '', r.au);
    }
    return finish(c, R.length, 'reading', missed, '🎨 Personajes', '¡Gran artista! Describes muy bien 🖌️');
  }

  /* ====== t4p2 — ¿QUIÉN ES? ====== */
  async function guessWho(stage, p) {
    const PE = G().people || []; const R = sample(PE, 4); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const set = shuffle([r, ...sample(PE.filter(x => x !== r), 5)]);
      const body = head(stage, { lbl: 'Game', title: '🕵️ ¿Quién es?', ins: 'Lee y escucha las pistas. Toca a la <b>persona correcta</b>. (tall = alto · short = bajo)', count: `${k + 1} / ${R.length}` });
      const clues = h(`<div class="g3-clues">${r.clues.map((x, i) => `<div class="g3-clue"><b>${i + 1}.</b> ${esc(x.en)}</div>`).join('')}</div>`); body.appendChild(clues);
      const playAll = async () => { for (const x of r.clues) { if (!live(stage)) return; await play(x.au); await sleep(150); } };
      center(body, rep(null, '🔊 Escuchar pistas')).onclick = playAll; playAll();
      const grid = h(`<div class="g4-who">${set.map((x, i) => `<button data-i="${i}" class="${x.h}"><div class="g4-whoav">${avatar(x, x.h === 'tall' ? 96 : 76)}</div><span>${x.h === 'tall' ? '📏 tall' : '📏 short'}</span><b>${esc(x.n)}</b></button>`).join('')}</div>`); body.appendChild(grid);
      const btns = $$('button', grid);
      const i = await new Promise(res => btns.forEach(b => b.onclick = () => res(+b.dataset.i)));
      stop(); const ci = set.indexOf(r); btns.forEach(b => b.disabled = true); btns[ci].classList.add('right'); const ok = i === ci; if (!ok) btns[i].classList.add('wrong');
      if (ok) c++; else missed.push({ en: r.clues.map(x => x.en).join(' ') });
      await say(body, ok, `It's ${r.n}!`, r.clues.map(x => x.en).join(' '), null);
    }
    return finish(c, R.length, 'reading', missed, '🕵️ Personas encontradas', '¡Detective de primera! 🔍');
  }

  /* ====== t5p1 — SITUACIONES ====== */
  async function situations(stage, p) {
    const S = G().sit || []; const R = sample(S, 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const v = V(p, r.a) || {};
      const body = head(stage, { lbl: 'Game', title: '🃏 ¿Cómo es su personalidad?', ins: 'Voltea la tarjeta, lee la situación y elige el <b>adjetivo</b> que describe a la persona.', count: `${k + 1} / ${R.length}` });
      const card = h(`<div class="g4-flip"><div class="g4-fi"><div class="g4-ff">🃏<small>Toca para voltear</small></div><div class="g4-fb2">${esc(r.s)}</div></div></div>`); body.appendChild(card);
      await new Promise(res => card.onclick = () => { card.classList.add('on'); sfx('tap'); play(r.au); res(); });
      await sleep(500);
      const pool = S.map(x => x.a).filter((x, i, a) => x !== r.a && a.indexOf(x) === i);
      const opts = shuffle([r.a, ...sample(pool, 2)]);
      const ok = await ask(body, opts.map(esc), opts.indexOf(r.a), 'g3-three');
      if (ok) c++; else missed.push(v.en ? v : { en: r.a });
      await say(body, ok, `He/She is ${r.a}.`, v.es || '', v.au);
    }
    return finish(c, R.length, 'reading', missed, '🃏 Personalidades', '¡Lees a las personas muy bien! 😄');
  }

  /* ====== t5p2 — LA BALANZA DE OPUESTOS ====== */
  async function balance(stage, p) {
    const O = G().opp || []; const R = sample(O, 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const [a, b] = Math.random() < .5 ? R[k] : [R[k][1], R[k][0]];
      const body = head(stage, { lbl: 'Game', title: '⚖️ La balanza de opuestos', ins: 'Pon en el otro plato la palabra <b>opuesta</b> para equilibrar la balanza.', count: `${k + 1} / ${R.length}` });
      const bal = h(`<div class="g4-bal tilt"><div class="g4-beam"><div class="g4-pan"><b>${esc(a)}</b></div><div class="g4-pan r"><b>?</b></div></div><div class="g4-post"></div></div>`); body.appendChild(bal);
      const pool = O.flat().filter(x => x !== a && x !== b);
      const opts = shuffle([b, ...sample(pool, 2)]);
      const ok = await ask(body, opts.map(esc), opts.indexOf(b), 'g3-three');
      $('.g4-pan.r b', bal).textContent = b; bal.classList.toggle('tilt', !ok); bal.classList.toggle('even', ok);
      const va = V(p, a), vb = V(p, b);
      if (ok) c++; else missed.push(vb || { en: b });
      await say(body, ok, `${a} ↔ ${b}`, va && vb ? `${va.es} ↔ ${vb.es}` : '', (vb || va || {}).au);
    }
    return finish(c, R.length, 'reading', missed, '⚖️ Opuestos', '¡Equilibrio perfecto! ⚖️');
  }

  /* ====== t6p1 — MI DIARIO (escribe el pasado) ====== */
  async function diary(stage, p) {
    const D = G().diary || []; let c = 0; const missed = [];
    const body = head(stage, { lbl: 'Game', title: '📔 El diario de ayer', ins: 'Completa el diario escribiendo el <b>pasado</b> de cada verbo (+ed). ¡Cuidado con la ortografía: study → studied, stop → stopped!' });
    const page = h(`<div class="g4-diary"><div class="g4-dh">📔 Dear diary,</div></div>`); body.appendChild(page);
    for (let k = 0; k < D.length && live(stage); k++) {
      const r = D[k];
      const row = h(`<div class="g4-drow">${esc(r.s).replace('___', `<input class="inp g4-din" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(r.b)}">`)}<button class="btn k sm">✓</button></div>`); page.appendChild(row);
      const inp = $('input', row); setTimeout(() => inp.focus({ preventScroll: true }), 150); row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      const ok = await new Promise(res => { const go = () => { const v = norm(inp.value); if (!v) return; inp.disabled = true; $('button', row).remove(); res(v === r.a); }; $('button', row).onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); }; });
      inp.value = r.a; inp.classList.add(ok ? 'right' : 'wrong'); sfx(ok ? 'ok' : 'bad'); if (!ok) { row.appendChild(h(`<small class="g4-dfix">❌ ${esc(r.b)} → <b>${esc(r.a)}</b></small>`)); missed.push({ en: r.full, au: r.au }); } else c++;
      await play(r.au);
    }
    await sleep(400);
    return finish(c, D.length, 'writing', missed, '📔 Verbos en pasado', '¡Tu diario quedó perfecto! ✍️');
  }

  /* ====== t6p2 — CONTRARRELOJ DE IRREGULARES ====== */
  async function pastRush(stage, p) {
    const I = shuffle(G().irr || []); const DUR = 45000; let c = 0, t = 0, k = 0; const missed = [];
    const body = head(stage, { lbl: 'Game', title: '⏱️ Contrarreloj: verbos irregulares', ins: 'Tienes <b>45 segundos</b>. Escribe el <b>pasado</b> de cada verbo lo más rápido que puedas. (go → went)' });
    const hud = h(`<div class="cw-hud"><span>⏱️ <b id="pt">45</b>s</span><span>✅ <b id="pc">0</b></span><span>❌ <b id="pw">0</b></span></div>`); body.appendChild(hud);
    const card = h(`<div class="g4-rush"><small>Presente</small><b id="pv">—</b><small id="pes"></small><input class="inp g3-in" id="pi" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="pasado…" disabled></div>`); body.appendChild(card);
    const go = h(`<div class="center"><button class="btn k lg">⏱️ ¡Empezar!</button></div>`); body.appendChild(go);
    await new Promise(r => $('button', go).onclick = r); go.remove();
    const inp = $('#pi', card); inp.disabled = false; inp.focus(); const t0 = Date.now();
    const show = () => { const v = I[k % I.length]; $('#pv', card).textContent = v[0]; $('#pes', card).textContent = `(${v[2]})`; inp.value = ''; };
    show();
    const tick = setInterval(() => { $('#pt', hud).textContent = Math.max(0, Math.ceil((DUR - (Date.now() - t0)) / 1000)); }, 250);
    await new Promise(done => {
      const answer = () => { if (!live(stage) || Date.now() - t0 > DUR) return done(); const v = I[k % I.length]; const a = norm(inp.value); if (!a) return; t++;
        if (a === v[1]) { c++; sfx('ok'); card.classList.add('okf'); $('#pc', hud).textContent = c; } else { sfx('bad'); card.classList.add('nof'); missed.push({ en: `${v[0]} → ${v[1]}` }); M.toast(`❌ ${v[0]} → ${v[1]}`); $('#pw', hud).textContent = t - c; }
        setTimeout(() => card.classList.remove('okf', 'nof'), 300); k++; show(); };
      inp.onkeydown = e => { if (e.key === 'Enter') answer(); };
      const sb = h(`<div class="actionbar"><button class="btn k">Enviar ↵</button></div>`); body.appendChild(sb); $('button', sb).onclick = () => { answer(); inp.focus(); };
      setTimeout(done, DUR);
    });
    clearInterval(tick); inp.disabled = true; $('#pt', hud).textContent = 0; $$('.actionbar', body).forEach(x => x.remove());
    if (!t) t = 1;
    if (c >= 8) { M.confetti(1300); sfx('win'); }
    await sheet({ ok: c >= t / 2, title: `⏱️ ${c} verbos correctos de ${t}`, msg: c >= 10 ? '¡Velocidad de campeón! 🏆' : 'Repasa la lista: go-went, eat-ate, buy-bought, see-saw… ¡y vuelve a intentarlo!' });
    return result(Math.min(c, t), t, 'writing', missed);
  }

  /* ====== t7p1 — HISTORIAS (stories) ====== */
  async function stories(stage, p) {
    const P = (p.vocab || []).filter(v => v.img); const R = sample(P, 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const v = R[k];
      const body = head(stage, { lbl: 'Game', title: '📱 Historias de tus amigos', ins: 'Mira la historia (story) y elige qué está haciendo la persona <b>ahora mismo</b>. ¡Tienes 12 segundos!', count: `${k + 1} / ${R.length}` });
      const st = h(`<div class="g4-story"><div class="g4-sbars">${R.map((_, i) => `<i class="${i < k ? 'done' : i === k ? 'cur' : ''}"></i>`).join('')}</div><div class="g4-suser">👤 <b>${['@laura_m', '@carlos.r', '@valen_23', '@pipe.co', '@ana.gomez', '@juanda'][k % 6]}</b> <small>ahora</small></div>${photo(v.img)}</div>`); body.appendChild(st);
      const opts = shuffle([v, ...sample(P.filter(x => x !== v), 2)]);
      const wrap = h(`<div class="opts g3-opts"></div>`); body.appendChild(wrap);
      const btns = opts.map(o => { const b = h(`<button class="opt">${esc(o.en)}</button>`); wrap.appendChild(b); return b; });
      const bar = $('.g4-sbars i.cur', st); bar.style.setProperty('--d', '12s');
      const i = await new Promise(res => { const to = setTimeout(() => res(-1), 12000); btns.forEach((b, j) => b.onclick = () => { clearTimeout(to); res(j); }); });
      const ci = opts.indexOf(v); btns.forEach(b => b.disabled = true); btns[ci].classList.add('right'); if (i >= 0 && i !== ci) btns[i].classList.add('wrong'); bar.classList.add('done');
      const ok = i === ci; if (ok) c++; else missed.push(v);
      await say(body, ok, v.en, i < 0 ? `⏰ Se acabó el tiempo — ${v.es}` : v.es, v.au);
    }
    return finish(c, R.length, 'reading', missed, '📱 Historias', '¡Entiendes todo lo que pasa ahora mismo! 👀');
  }

  /* ====== t7p2 — LA COARTADA ====== */
  async function alibi(stage, p) {
    const AL = G().alibi || { times: [], people: [], st: [] }; const R = sample(AL.st, 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🚨 La coartada', ins: 'Anoche desapareció un pastel 🎂. Mira la tabla de lo que <b>estaba haciendo</b> cada persona y di si la frase es <b>verdadera o falsa</b>.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g4-tbl"><table><tr><th></th>${AL.times.map(t => `<th>${esc(t)}</th>`).join('')}</tr>${AL.people.map(pp => `<tr><th>${esc(pp.n)}</th>${pp.acts.map((a, ti) => `<td class="${pp.n === r.n && ti === r.t ? 'hl' : ''}">${esc(a)}</td>`).join('')}</tr>`).join('')}</table></div>`));
      body.appendChild(h(`<div class="g3-sent">“${esc(r.en)}”</div>`)).appendChild(rep(r.au)); play(r.au);
      const ok = await ask(body, ['✅ True', '❌ False'], r.ok ? 0 : 1, 'g3-two');
      const truth = AL.people.find(x => x.n === r.n).acts[r.t];
      if (ok) c++; else missed.push({ en: `${r.n} was ${truth}.` });
      await say(body, ok, r.ok ? 'True ✅' : `False — ${r.n} was ${truth}.`, `A las ${AL.times[r.t]}, ${r.n} was ${truth}.`, null);
    }
    return finish(c, R.length, 'reading', missed, '🚨 Coartadas revisadas', '¡Caso resuelto, detective! 🕵️');
  }

  /* ====== t8p1 — EL TERMÓMETRO DE FRECUENCIA ====== */
  async function freqSlider(stage, p) {
    const F = [['always', 100], ['usually', 90], ['often', 70], ['sometimes', 50], ['rarely', 10], ['hardly ever', 5], ['never', 0]];
    const R = sample(F, 5); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const [w, pct] = R[k]; const v = V(p, w) || {};
      const body = head(stage, { lbl: 'Game', title: '🌡️ El termómetro de frecuencia', ins: 'Escucha el adverbio y <b>mueve el termómetro</b> al porcentaje correcto. Luego toca “Comprobar”.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g3-call">🔊 <b>${esc(w)}</b></div>`)); center(body, rep(v.au)); play(v.au);
      const box = h(`<div class="g4-therm"><input type="range" min="0" max="100" step="5" value="50" id="rg"><div class="g4-tscale"><span>0 %</span><span>50 %</span><span>100 %</span></div><div class="g4-tval"><b id="tv">50</b> %</div></div>`); body.appendChild(box);
      const rg = $('#rg', box); rg.oninput = () => { $('#tv', box).textContent = rg.value; };
      const ok = await new Promise(res => { const bar = h(`<div class="actionbar"><button class="btn k lg">Comprobar ✓</button></div>`); body.appendChild(bar); $('button', bar).onclick = () => { bar.remove(); rg.disabled = true; res(Math.abs(+rg.value - pct) <= 10); }; });
      rg.value = pct; $('#tv', box).textContent = pct; box.classList.add(ok ? 'ok' : 'no');
      if (ok) c++; else missed.push(v.en ? v : { en: w });
      await say(body, ok, `${w} = ${pct} %`, v.es || '', v.au);
    }
    return finish(c, R.length, 'listening', missed, '🌡️ Adverbios', '¡Siempre aciertas! (always 😉)');
  }

  /* ====== t8p2 — LA AGENDA ====== */
  async function agenda(stage, p) {
    const ACT = [['🏋️', 'go to the gym', 'vas al gimnasio'], ['🏊', 'go swimming', 'vas a nadar'], ['🍕', 'eat pizza', 'comes pizza'], ['📞', 'call your mother', 'llamas a tu mamá'], ['🎬', 'go to the cinema', 'vas al cine'], ['🧹', 'clean the house', 'limpias la casa']];
    const FR = [['every day', 7], ['once a week', 1], ['twice a week', 2], ['three times a week', 3], ['never', 0]];
    const D = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; const R = sample(ACT, 5); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const [ic, act, es] = R[k]; const [fr, n] = sample(FR, 1)[0]; const days = new Set(sample([0, 1, 2, 3, 4, 5, 6], n));
      const body = head(stage, { lbl: 'Game', title: '🗓️ Mi agenda', ins: 'Mira la agenda de la semana y responde: <b>How often...?</b> (¿Con qué frecuencia?)', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g4-week">${D.map((d, i) => `<div class="${days.has(i) ? 'on' : ''}"><small>${d}</small><span>${days.has(i) ? ic : '·'}</span></div>`).join('')}</div>`));
      body.appendChild(h(`<div class="g3-sent">How often do you ${esc(act)}?<small>¿Con qué frecuencia ${esc(es)}?</small></div>`));
      const opts = shuffle([fr, ...sample(FR.map(x => x[0]).filter(x => x !== fr), 2)]);
      const ok = await ask(body, opts.map(o => `I ${esc(act)} ${esc(o)}.`.replace(`I ${esc(act)} never.`, `I never ${esc(act)}.`)), opts.indexOf(fr));
      const ans = fr === 'never' ? `I never ${act}.` : `I ${act} ${fr}.`;
      if (ok) c++; else missed.push({ en: ans });
      await say(body, ok, ans, '', null);
    }
    return finish(c, R.length, 'reading', missed, '🗓️ Frecuencias', '¡Organizas tu semana en inglés! 📅');
  }

  /* ====== t9p1 — SHOW DE TALENTOS ====== */
  async function talentShow(stage, p) {
    const AB = [['🏊', 'swim', 'nadar'], ['🚗', 'drive', 'manejar'], ['🎸', 'play the guitar', 'tocar guitarra'], ['🍳', 'cook', 'cocinar'], ['💃', 'dance salsa', 'bailar salsa'], ['🇫🇷', 'speak French', 'hablar francés'], ['🎤', 'sing', 'cantar']];
    const C = [['Laura', 'she', '👩🏻'], ['Andrés', 'he', '👨🏽'], ['Sofía', 'she', '👩🏽‍🦱'], ['Mateo', 'he', '🧔🏻']]; let c = 0; const missed = []; const ROUNDS = 6;
    const people = C.map(([n, pr, e]) => ({ n, pr, e, ab: sample(AB, 4).map(a => [a, Math.random() < .5]) }));
    const body0 = () => people.map(x => `<div class="g4-cand"><div class="g4-ce">${x.e}</div><b>${x.n}</b>${x.ab.map(([a, y]) => `<span class="${y ? 'y' : 'n'}">${a[0]} ${y ? '✓' : '✗'}</span>`).join('')}</div>`).join('');
    for (let k = 0; k < ROUNDS && live(stage); k++) {
      const x = sample(people, 1)[0]; const [[ic, verb, es], can] = sample(x.ab, 1)[0];
      const body = head(stage, { lbl: 'Game', title: '🎤 Show de talentos', ins: 'Mira lo que <b>puede (✓)</b> y <b>no puede (✗)</b> hacer cada concursante y responde.', count: `${k + 1} / ${ROUNDS}` });
      body.appendChild(h(`<div class="g4-cands">${body0()}</div>`));
      const Pr = x.pr[0].toUpperCase() + x.pr.slice(1);
      body.appendChild(h(`<div class="g3-sent">Can ${esc(x.n)} ${esc(verb)}? ${ic}<small>¿${esc(x.n)} sabe ${esc(es)}?</small></div>`));
      const opts = [`Yes, ${x.pr} can.`, `No, ${x.pr} can't.`];
      const ok = await ask(body, opts, can ? 0 : 1, 'g3-two');
      const ans = can ? `Yes, ${x.pr} can. ${Pr} can ${verb}.` : `No, ${x.pr} can't. ${Pr} can't ${verb}.`;
      if (ok) c++; else missed.push({ en: ans });
      await say(body, ok, ans, '', null);
    }
    return finish(c, ROUNDS, 'reading', missed, '🎤 Talentos', '¡Jurado experto! ⭐');
  }

  /* ====== t9p2 — LAS SEÑALES ====== */
  async function signs(stage, p) {
    const S = sample(G().signs || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < S.length && live(stage); k++) {
      const r = S[k];
      const body = head(stage, { lbl: 'Game', title: '🚸 ¿Qué dice la señal?', ins: 'Mira la señal y elige la regla correcta: <b>must</b> (debes) · <b>mustn\'t</b> (prohibido) · <b>don\'t have to</b> (no es necesario) · <b>should</b> (consejo).', count: `${k + 1} / ${S.length}` });
      body.appendChild(h(`<div class="g4-sign"><span>${r.e}</span></div>`));
      const opts = shuffle([r.a, ...r.o]);
      const ok = await ask(body, opts.map(esc), opts.indexOf(r.a));
      if (ok) c++; else missed.push({ en: r.a, au: r.au });
      await say(body, ok, r.a, r.es, r.au);
    }
    return finish(c, S.length, 'reading', missed, '🚸 Señales', '¡Conoces todas las reglas! 🚦');
  }

  /* ====== t10p1 — EL TREN DE LOS PRONOMBRES ====== */
  async function pronounTrain(stage, p) {
    const P = (p.vocab || []).filter(v => v.x); const R = shuffle(P); let c = 0; const missed = [];
    const body = head(stage, { lbl: 'Game', title: '🚂 El tren de los pronombres', ins: 'Cada vagón lleva un pronombre. Toca la <b>carga</b> (reflexivo) y luego el <b>vagón</b> correcto.' });
    const train = h(`<div class="g4-train"><div class="g4-loco">🚂</div>${R.map((v, i) => `<button class="g4-car" data-i="${i}"><b>${esc(v.x)}</b><small></small></button>`).join('')}</div>`); body.appendChild(train);
    const cargo = h(`<div class="g4-cargo">${shuffle(R.map((v, i) => i)).map(i => `<button data-i="${i}">📦 ${esc(R[i].en)}</button>`).join('')}</div>`); body.appendChild(cargo);
    const st = h(`<p class="center g3-st">👆 Toca una carga</p>`); body.appendChild(st);
    let sel = null, done = 0, wrong = new Set();
    await new Promise(res => {
      $$('button', cargo).forEach(b => b.onclick = () => { if (b.disabled) return; $$('button', cargo).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = b; sfx('tap'); st.textContent = '👉 Ahora toca el vagón correcto'; play(R[+b.dataset.i].au); });
      $$('.g4-car', train).forEach(car => car.onclick = () => { if (!sel || car.classList.contains('full')) return; const i = +sel.dataset.i, j = +car.dataset.i;
        if (i === j) { car.classList.add('full'); $('small', car).textContent = R[i].en; sel.disabled = true; sel.classList.remove('sel'); sel = null; done++; sfx('ok'); if (!wrong.has(i)) c++; st.textContent = done === R.length ? '🎉 ¡Tren completo!' : '👆 Toca otra carga'; if (done === R.length) setTimeout(res, 800); }
        else { wrong.add(i); sfx('bad'); car.classList.add('shake'); setTimeout(() => car.classList.remove('shake'), 400); M.toast(`❌ ${R[i].en} no va con “${R[j].x}”`); missed.push(R[i]); } });
    });
    train.classList.add('go');
    await sleep(900);
    return finish(c, R.length, 'reading', missed, '🚂 Vagones al primer intento', '¡El tren salió a tiempo! 🚂');
  }

  /* ====== t10p2 — EL ANFITRIÓN ====== */
  async function hostParty(stage, p) {
    const R = G().host || []; let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🎉 Eres el anfitrión', ins: 'Tus invitados llegan a la fiesta. Escucha lo que dicen y elige la <b>respuesta correcta</b> con el pronombre reflexivo.', count: `Invitado ${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g4-party"><div class="g4-pguest">${['👩🏽', '🧑🏻', '👨🏾', '👩🏼‍🦰', '🧔🏽', '👱🏻‍♀️'][k % 6]}<div class="bubble">“${esc(r.g)}”</div></div><div class="g4-pdeco">🎈🎶🍰🥤🎉</div></div>`)).appendChild(rep(r.gau)); play(r.gau);
      const opts = shuffle([r.a, ...r.o]);
      const ok = await ask(body, opts.map(o => `🏠 ${esc(o)}`), opts.indexOf(r.a));
      if (ok) c++; else missed.push({ en: r.a, au: r.aau });
      await say(body, ok, r.a, '', r.aau);
    }
    return finish(c, R.length, 'reading', missed, '🎉 Invitados felices', '¡La mejor fiesta del año! 🥳');
  }

  /* ====== t11p1 — LOS INTERRUPTORES ====== */
  async function switches(stage, p) {
    const SW = sample(G().sw || [], 7); let c = 0; const missed = [];
    const S = { light: 'off', tv: 'off', radio: 'mid', jacket: 'off', shoes: 'off' };
    const body = head(stage, { lbl: 'Game', title: '💡 La casa inteligente', ins: 'Escucha la orden 🔊 y toca el <b>botón correcto</b> del objeto (on / off / up / down).' });
    const hud = h(`<div class="g3-call">🔊 <b id="sw">—</b></div>`); body.appendChild(hud);
    const room = h(`<div class="g4-room">
      <div data-o="light"><span class="ic">💡</span><b>light</b><div><button data-a="on">on</button><button data-a="off">off</button></div></div>
      <div data-o="tv"><span class="ic">📺</span><b>TV</b><div><button data-a="on">on</button><button data-a="off">off</button></div></div>
      <div data-o="radio"><span class="ic">📻</span><b>music</b><div><button data-a="up">up 🔊</button><button data-a="down">down 🔉</button></div></div>
      <div data-o="jacket"><span class="ic">🧥</span><b>jacket</b><div><button data-a="on">put on</button><button data-a="off">take off</button></div></div>
      <div data-o="shoes"><span class="ic">👟</span><b>shoes</b><div><button data-a="on">put on</button><button data-a="off">take off</button></div></div></div>`); body.appendChild(room);
    const rp = center(body, rep(null, '🔊 Repetir'));
    const paint = () => $$('[data-o]', room).forEach(d => { d.className = 'st-' + S[d.dataset.o]; });
    paint();
    for (let k = 0; k < SW.length && live(stage); k++) {
      const r = SW[k]; $('#sw', hud).textContent = `Orden ${k + 1} de ${SW.length}`; rp.onclick = () => play(r.au); await sleep(300); play(r.au);
      const btns = $$('[data-a]', room);
      const [o, a] = await new Promise(res => btns.forEach(b => b.onclick = () => res([b.closest('[data-o]').dataset.o, b.dataset.a])));
      const ok = o === r.obj && a === r.st; S[r.obj] = r.st; paint(); sfx(ok ? 'ok' : 'bad');
      $('#sw', hud).innerHTML = `${ok ? '✅' : '❌'} ${esc(r.en)}`;
      if (ok) c++; else missed.push({ en: r.en, au: r.au }); await play(r.au); await sleep(ok ? 500 : 1300);
    }
    return finish(c, SW.length, 'listening', missed, '💡 Órdenes', '¡Tu casa inteligente te obedece! 🏠');
  }

  /* ====== t11p2 — LA RUTA DEL BUS ====== */
  async function busRoute(stage, p) {
    const B = G().bus || { stops: [], routes: [] }; const R = B.routes; let c = 0, t = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🚌 La ruta del bus', ins: 'Escucha la instrucción. Cuando el bus llegue a cada parada, toca <b>Get on</b> (subirte), <b>Get off</b> (bajarte) o espera.', count: `Viaje ${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g3-sent">“${esc(r.en)}”</div>`)).appendChild(rep(r.au)); play(r.au);
      const road = h(`<div class="g4-road">${B.stops.map((s, i) => `<div class="g4-stop" data-i="${i}"><i></i><small>${esc(s)}</small></div>`).join('')}<div class="g4-busic">🚌</div></div>`); body.appendChild(road);
      const ctr = h(`<div class="g4-busbtn"><button class="btn lg" id="on">🙋 Get on</button><button class="btn w lg" id="wt">⏳ Wait</button><button class="btn k lg" id="off">👋 Get off</button></div>`); body.appendChild(ctr);
      const st = h(`<p class="center g3-st">🚏 El bus está en la parada 1</p>`); body.appendChild(st);
      await sleep(900); let inside = false, okAll = true;
      for (let s = 0; s < B.stops.length && live(stage); s++) {
        const bus = $('.g4-busic', road); bus.style.left = `calc(${(s + .5) / B.stops.length * 100}% - 18px)`; $$('.g4-stop', road)[s].classList.add('cur');
        st.textContent = `🚏 Parada: ${B.stops[s]}${inside ? ' — vas dentro del bus 🧍' : ''}`;
        const want = s === r.on ? 'on' : s === r.off ? 'off' : 'wt';
        const got = await new Promise(res => { $('#on', ctr).onclick = () => res('on'); $('#off', ctr).onclick = () => res('off'); $('#wt', ctr).onclick = () => res('wt'); });
        const ok = got === want; $$('.g4-stop', road)[s].classList.remove('cur'); $$('.g4-stop', road)[s].classList.add(ok ? 'ok' : 'no'); sfx(ok ? 'tap' : 'bad');
        if (!ok) { okAll = false; M.toast(want === 'on' ? `Aquí debías subirte: Get on at ${B.stops[s]}` : want === 'off' ? `Aquí debías bajarte: Get off at ${B.stops[s]}` : 'Aquí debías esperar ⏳'); }
        if (want === 'on') inside = true; if (want === 'off') break;
        await sleep(350);
      }
      t++; if (okAll) c++; else missed.push({ en: r.en, au: r.au });
      await say(body, okAll, r.en, `Súbete en ${B.stops[r.on]} y bájate en ${B.stops[r.off]}.`, r.au);
    }
    return finish(c, t, 'listening', missed, '🚌 Viajes perfectos', '¡Llegaste a tu destino! 🎯');
  }

  Object.assign(window.M1A, { setClock, departures, dayOrder, errorHunt, simonBody, pharmacy, avatarMaker, guessWho, situations, balance, diary, pastRush,
    stories, alibi, freqSlider, agenda, talentShow, signs, pronounTrain, hostParty, switches, busRoute });
})();
