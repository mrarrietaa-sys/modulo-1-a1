/* =====================================================================
   JUEGOS ÚNICOS DEL MÓDULO 4 (B2+) · TEMAS 1–7 — una dinámica distinta en cada clase
   t1p1 fc1DominoChain · t1p2 fc2DealNegotiator · t2p1 sc1ParallelPortal · t2p2 sc2AdviceColumn
   t3p1 tc1TimeRewind · t3p2 tc2StartupPostmortem · t4p1 vg1VerbSwipe · t4p2 vg2MeaningTwins
   t5p1 snMatchmaker · t5p2 snAuxRadar · t6p1 ppcSherlock · t6p2 ppcMarathonApp
   t7p1 rcTabooCards · t7p2 rcFusionLab
   ===================================================================== */
(function () {
  const M = window.M1, A = window.M1A;
  const { $, $$, h, esc, shuffle, sample, sleep, play, stop, sfx, sheet } = M;
  const { head, result } = A;
  const G = () => window.M1G6A || {};
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
  const blank = (s, fill) => esc(s).replace('___', fill ? `<u class="g6a-blank on">${esc(fill)}</u>` : '<u class="g6a-blank">&nbsp;?&nbsp;</u>');

  /* ====== t1p1 — EFECTO DOMINÓ (first conditional chains) ====== */
  const KIND = { res: '🎯 Elige el <b>resultado</b> correcto', link: '🔗 Elige el <b>conector</b> correcto', form: '✏️ Elige la <b>forma del verbo</b>' };
  const tiles = (n, k, st, fall) => `<div class="g6a-dm-row${fall ? ' fall' : ''}">${Array.from({ length: n }, (_, i) => `<div class="g6a-dm-tile ${i < k ? (st[i] ? 'ok' : 'bad') : i === k ? 'now' : ''}" style="--d:${i * 0.22}s"><i></i><i></i><b>${i < k ? (st[i] ? '✓' : '✗') : i + 1}</b></div>`).join('')}<div class="g6a-dm-goal">🏁</div></div>`;
  async function fc1DominoChain(stage, p) {
    const CH = sample(G().domino || [], 2); let c = 0, t = 0; const missed = [];
    for (let ci = 0; ci < CH.length && live(stage); ci++) {
      const ch = CH[ci]; const st = [];
      for (let k = 0; k < ch.steps.length && live(stage); k++) {
        const s = ch.steps[k];
        const body = head(stage, { lbl: 'Game', title: '⛓️ Efecto dominó', ins: 'Cada consecuencia empuja a la siguiente. Completa la ficha con el <b>primer condicional</b> correcto para que la cadena no se rompa.', count: `Cadena ${ci + 1}/${CH.length} · ficha ${k + 1}/${ch.steps.length}` });
        body.appendChild(h(`<div class="g6a-dm-top"><span>${ch.e}</span><b>${esc(ch.t)}</b></div>`));
        body.appendChild(h(tiles(ch.steps.length, k, st)));
        const card = h(`<div class="g6a-dm-card"><small>${KIND[s.k]}</small><p>${blank(s.p)}</p></div>`); body.appendChild(card);
        const opts = shuffle([s.a, ...s.o]);
        const ok = await ask(body, opts.map(esc), opts.indexOf(s.a), 'g6a-col');
        $('p', card).innerHTML = blank(s.p, s.a); card.classList.add(ok ? 'ok' : 'no');
        st.push(ok); t++; if (ok) c++; else missed.push({ en: s.full, au: s.au });
        await say(body, ok, s.full, s.es, s.au);
      }
      if (!live(stage)) break;
      const body = head(stage, { lbl: 'Game', title: '⛓️ ¡Cadena completa!', ins: 'Mira cómo cae tu cadena de consecuencias y escucha cada eslabón.', count: `Cadena ${ci + 1}/${CH.length}` });
      body.appendChild(h(`<div class="g6a-dm-top"><span>${ch.e}</span><b>${esc(ch.t)}</b></div>`));
      const row = h(tiles(ch.steps.length, ch.steps.length, st)); body.appendChild(row);
      const list = h(`<ol class="g6a-dm-list">${ch.steps.map((s, i) => `<li class="${st[i] ? 'ok' : 'no'}">${esc(s.full)}</li>`).join('')}</ol>`); body.appendChild(list);
      await sleep(250); row.classList.add('fall'); sfx(st.every(Boolean) ? 'win' : 'tap');
      for (const s of ch.steps) { if (!live(stage)) break; await play(s.au); }
      await waitBtn(body, ci < CH.length - 1 ? 'Siguiente cadena →' : 'Ver resultado →');
    }
    return finish(c, t, 'reading', missed, '⛓️ Fichas en su lugar', '¡Dominas las consecuencias reales con if, unless y as soon as! 🎯');
  }

  /* ====== t1p2 — MESA DE NEGOCIACIÓN (as long as / provided that / in case / unless) ====== */
  function gauge(v) {
    const a = Math.PI * (1 - v / 100), x = 100 + 72 * Math.cos(a), y = 100 - 72 * Math.sin(a);
    return `<svg viewBox="0 0 200 112" class="g6a-ng-gauge"><path d="M18 100 A82 82 0 0 1 182 100" fill="none" stroke="#e3e8f0" stroke-width="18" stroke-linecap="round"/>
      <path d="M18 100 A82 82 0 0 1 182 100" fill="none" stroke="url(#g6ag)" stroke-width="18" stroke-linecap="round" pathLength="100" stroke-dasharray="${v} 100"/>
      <defs><linearGradient id="g6ag"><stop offset="0" stop-color="#E3242B"/><stop offset=".55" stop-color="#FFD43B"/><stop offset="1" stop-color="#2E9E5B"/></linearGradient></defs>
      <line x1="100" y1="100" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#0B2A5B" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="100" r="8" fill="#0B2A5B"/>
</svg><b class="g6a-ng-pct">${v}%</b>`;
  }
  async function fc2DealNegotiator(stage, p) {
    const R = G().neg || []; let c = 0, deal = 40; const missed = [];
    const moods = ['😠', '😒', '😐', '🙂', '😃'];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🤝 Mesa de negociación', ins: 'Negocias 500 sillas con <b>Ms. Carter</b> (Lone Star Furniture, Dallas). Cumple tu objetivo con el conector correcto y sube el <b>medidor del trato</b>.', count: `Ronda ${k + 1} / ${R.length}` });
      const hud = h(`<div class="g6a-ng-hud"><div class="g6a-ng-g">${gauge(deal)}<small>Probabilidad de cerrar el trato</small></div><div class="g6a-ng-sup"><span class="g6a-ng-face">${moods[Math.min(4, Math.floor(deal / 21))]}</span><b>Ms. Carter</b><small>Supplier · Dallas, TX</small></div></div>`); body.appendChild(hud);
      const bub = h(`<div class="g6a-ng-bub">“${esc(r.s)}”</div>`); body.appendChild(bub); bub.appendChild(rep(r.sau, '🔊'));
      play(r.sau);
      body.appendChild(h(`<div class="g6a-ng-goal">🎯 <b>Tu objetivo:</b> ${esc(r.ins)}</div>`));
      const opts = shuffle([r.a, ...r.o]);
      const ok = await ask(body, opts.map(o => `🗣️ ${esc(o)}`), opts.indexOf(r.a), 'g6a-col');
      deal = Math.max(0, Math.min(100, deal + (ok ? 9 : -7)));
      $('.g6a-ng-g', hud).innerHTML = `${gauge(deal)}<small>Probabilidad de cerrar el trato</small>`; $('.g6a-ng-face', hud).textContent = moods[Math.min(4, Math.floor(deal / 21))];
      if (ok) c++; else missed.push({ en: r.a, au: r.aau });
      await say(body, ok, r.a, r.es, r.aau);
    }
    if (live(stage)) {
      const won = deal >= 70;
      const body = head(stage, { lbl: 'Game', title: won ? '🖊️ ¡Trato cerrado!' : '📉 Sin trato… por ahora', ins: won ? 'Ms. Carter firmó el contrato. ¡Negociaste como un profesional!' : 'Ms. Carter necesita pensarlo. Repasa los conectores y vuelve a intentarlo.' });
      body.appendChild(h(`<div class="g6a-ng-contract ${won ? 'won' : ''}"><h4>PURCHASE AGREEMENT</h4><p>500 office chairs · Lone Star Furniture</p><p class="g6a-ng-line">Price per unit: <b>${won ? '$41.85' : '—'}</b></p><p class="g6a-ng-line">Deal meter: <b>${deal}%</b></p><svg viewBox="0 0 220 60" class="g6a-ng-sig"><path d="M10 40 C30 5, 45 55, 60 30 S90 10, 100 35 S130 50, 140 25 S170 20, 210 38" fill="none" stroke="#0B2A5B" stroke-width="3" stroke-linecap="round"/></svg><small>${won ? 'Signed: Ms. Carter ✔' : 'Pending signature…'}</small></div>`));
      sfx(won ? 'win' : 'bad'); await waitBtn(body, 'Ver resultado →');
    }
    return finish(c, R.length, 'listening', missed, '🤝 Rondas ganadas', '¡Negocias en inglés como en Wall Street! 💼');
  }

  /* ====== t2p1 — PORTAL AL MUNDO PARALELO (second conditional) ====== */
  async function sc1ParallelPortal(stage, p) {
    const R = sample(G().portal || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const toggle = k % 2 === 0;
      const body = head(stage, { lbl: 'Game', title: '🌀 Portal al mundo paralelo', ins: toggle ? 'Lee la <b>realidad</b> y crea el mundo paralelo: toca cada casilla para cambiar la palabra hasta formar el <b>segundo condicional</b>. Luego “Comprobar”.' : 'Lee la <b>realidad</b> y elige cómo sería el <b>mundo paralelo</b> (segundo condicional).', count: `${k + 1} / ${R.length}` });
      const worlds = h(`<div class="g6a-pt"><div class="g6a-pt-w real"><small>🌍 REAL WORLD</small><span class="g6a-pt-e">${r.er}</span><p>${esc(r.r)}</p><i>${esc(r.res)}</i></div><div class="g6a-pt-portal"><div></div></div><div class="g6a-pt-w par"><small>🌀 PARALLEL WORLD</small><span class="g6a-pt-e">❔</span><p>…</p></div></div>`); body.appendChild(worlds);
      center(body, rep(r.rau, '🔊 Escuchar la realidad')); play(r.rau);
      const P = r.parts; let ok;
      if (toggle) {
        const sel = [-1, -1]; const ord = [shuffle([0, 1, 2]), shuffle([0, 1, 2])];
        const line = h(`<div class="g6a-pt-line">${esc(P[0])} <button class="g6a-pt-slot" data-s="0">▾ ? ▾</button> ${esc(P[2])} <button class="g6a-pt-slot" data-s="1">▾ ? ▾</button> ${esc(P[4])}</div>`); body.appendChild(line);
        const slots = $$('.g6a-pt-slot', line); const opt = (s) => s === 0 ? P[1] : P[3];
        slots.forEach(b => b.onclick = () => { const s = +b.dataset.s; const pos = (ord[s].indexOf(sel[s]) + 1) % 3; sel[s] = ord[s][pos]; b.textContent = opt(s)[sel[s]]; b.classList.add('set'); sfx('tap'); });
        ok = await new Promise(res => { const bar = h(`<div class="actionbar"><button class="btn k lg">Comprobar ✓</button></div>`); body.appendChild(bar); $('button', bar).onclick = () => { if (sel.includes(-1)) { M.toast('Toca las dos casillas para elegir las palabras 👆'); return; } bar.remove(); slots.forEach(b => b.disabled = true); res(sel[0] === 0 && sel[1] === 0); }; });
        slots.forEach((b, s) => { b.classList.add(sel[s] === 0 ? 'right' : 'wrong'); b.textContent = opt(s)[0]; });
      } else {
        const mk = (i, j) => `${P[0]} ${P[1][i]} ${P[2]} ${P[3][j]} ${P[4]}`;
        const opts = shuffle([mk(0, 0), mk(1, 1), mk(0, 1)]);
        ok = await ask(body, opts.map(esc), opts.indexOf(mk(0, 0)), 'g6a-col');
      }
      const par = $('.par', worlds); par.classList.add('on'); $('.g6a-pt-e', par).textContent = r.ep; $('p', par).textContent = r.full; $('.g6a-pt-portal', worlds).classList.add('burst');
      if (ok) c++; else missed.push({ en: r.full, au: r.au });
      await say(body, ok, r.full, '', r.au);
    }
    return finish(c, R.length, 'writing', missed, '🌀 Mundos creados', '¡Eres un arquitecto de mundos hipotéticos! 🪐');
  }

  /* ====== t2p2 — CONSULTORIO “ASK DANA” (if I were you / would) ====== */
  async function sc2AdviceColumn(stage, p) {
    const R = sample(G().advice || [], 6); let c = 0, likes = 120; const missed = [];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '📰 Consultorio “Ask Dana”', ins: 'Hoy tú eres <b>Dana</b>, la columnista. Lee la carta y elige la respuesta con el <b>segundo condicional</b> correcto y un buen consejo.', count: `Carta ${k + 1} / ${R.length}` });
      const paper = h(`<div class="g6a-ad-paper"><div class="g6a-ad-mast"><b>THE DAILY DILEMMA</b><small>${esc(today)} · Advice column</small></div><div class="g6a-ad-letter"><p><i>Dear Dana,</i></p><p>${esc(r.l)}</p><p class="g6a-ad-sig">— ${esc(r.sig)}</p><details><summary>🇪🇸 Ver traducción</summary>${esc(r.les)}</details></div><div class="g6a-ad-likes">❤️ <b>${likes}</b> readers found Dana helpful</div></div>`); body.appendChild(paper);
      center(body, rep(r.lau, '🔊 Escuchar la carta')); play(r.lau);
      body.appendChild(h(`<p class="g6a-ad-q">✍️ <b>Dear ${esc(r.sig.split(' ')[0])},</b> …</p>`));
      const opts = shuffle([r.a, ...r.o]);
      const ok = await ask(body, opts.map(esc), opts.indexOf(r.a), 'g6a-col');
      if (ok) { likes += 40 + Math.floor(Math.random() * 60); const L = $('.g6a-ad-likes', paper); L.innerHTML = `❤️ <b>${likes}</b> readers found Dana helpful`; L.classList.add('pop'); c++; }
      else missed.push({ en: r.a, au: r.au });
      await say(body, ok, r.a, '', r.au);
    }
    return finish(c, R.length, 'reading', missed, '📰 Cartas respondidas', `¡Tu columna ya tiene ${likes} lectores felices! ✍️`);
  }

  /* ====== t3p1 — REBOBINA EL TIEMPO (third conditional) ====== */
  async function tc1TimeRewind(stage, p) {
    const R = sample(G().rewind || [], 5); let c = 0, t = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '⏪ Rebobina el tiempo', ins: 'Esto es lo que <b>pasó</b>. Rebobina la cinta y reescribe el pasado con el <b>tercer condicional</b>.', count: `Cinta ${k + 1} / ${R.length}` });
      const vhs = h(`<div class="g6a-tr"><div class="g6a-tr-top"><span class="g6a-tr-reel"></span><b>REALITY · ${k + 1}</b><span class="g6a-tr-reel"></span></div><div class="g6a-tr-line">${r.ev.map((e, i) => `<div class="g6a-tr-ev"><span>${e.e}</span><p>${esc(e.t)}</p></div>${i < 2 ? '<i>➜</i>' : ''}`).join('')}</div></div>`); body.appendChild(vhs);
      await new Promise(res => { const bar = h(`<div class="actionbar"><button class="btn k lg">⏪ Rebobinar</button></div>`); body.appendChild(bar); $('button', bar).onclick = () => { bar.remove(); res(); }; });
      vhs.classList.add('rw'); sfx('tap'); await sleep(900);
      body.appendChild(h(`<p class="g6a-tr-q">🤔 <b>What if…?</b> Elige la oración correcta:</p>`));
      const o1 = shuffle([r.a, ...r.o]);
      const ok1 = await ask(body, o1.map(esc), o1.indexOf(r.a), 'g6a-col');
      t++; if (ok1) c++; else missed.push({ en: r.a, au: r.au });
      await say(body, ok1, r.a, r.es, r.au);
      if (!live(stage)) break;
      const b2 = head(stage, { lbl: 'Game', title: '⏪ Rebobina el tiempo', ins: `Ahora elige el modal según la certeza: <b>${esc(r.h2)}</b>.`, count: `Cinta ${k + 1} / ${R.length}` });
      b2.appendChild(h(`<div class="g6a-tr alt"><div class="g6a-tr-top"><span class="g6a-tr-reel"></span><b>NEW TIMELINE ✨</b><span class="g6a-tr-reel"></span></div><div class="g6a-tr-new"><span>${r.alt}</span><p>${blank(r.p2)}</p></div></div>`));
      b2.appendChild(h(`<div class="g6a-tr-key"><span><b>would have</b> = seguro ✅</span><span><b>could have</b> = habría podido 💪</span><span><b>might have</b> = quizás 🤷</span></div>`));
      const o2 = shuffle([r.a2, ...r.o2]);
      const ok2 = await ask(b2, o2.map(esc), o2.indexOf(r.a2), 'g6a-3');
      $('.g6a-tr-new p', b2).innerHTML = blank(r.p2, r.a2);
      t++; if (ok2) c++; else missed.push({ en: r.f2, au: r.au2 });
      await say(b2, ok2, r.f2, '', r.au2);
    }
    return finish(c, t, 'writing', missed, '⏪ Pasados reescritos', '¡Viajas en el tiempo con el tercer condicional! 🕰️');
  }

  /* ====== t3p2 — POST-MORTEM DE LA STARTUP (should have / mixed) ====== */
  async function tc2StartupPostmortem(stage, p) {
    const N = sample(G().pm || [], 6); let c = 0; const done = new Array(N.length).fill(null); const missed = [];
    const cols = ['#FFD43B', '#FF8FA3', '#8FD3FF', '#A7F3A0', '#FFC078', '#D0BFFF'];
    const body = head(stage, { lbl: 'Game', title: '🧠 Post-mortem de la startup', ins: '<b>FoodDrone Inc.</b> (Austin, TX) cerró. Toca cada nota adhesiva para ver un error y escribe la <b>lección</b> con <i>should have</i> o un <b>condicional mixto</b>.' });
    const hud = h(`<div class="g6a-pm-hud">📋 Notas analizadas: <b>0</b> / ${N.length}</div>`); body.appendChild(hud);
    const board = h(`<div class="g6a-pm-board"><div class="g6a-pm-title">🚁 FoodDrone · What went wrong?</div>${N.map((n, i) => `<button class="g6a-pm-note" data-i="${i}" style="--c:${cols[i % 6]};--r:${(i % 3 - 1) * 2.5}deg"><span>${n.e}</span><small>#${i + 1}</small></button>`).join('')}</div>`); body.appendChild(board);
    const panel = h(`<div class="g6a-pm-panel"></div>`); body.appendChild(panel);
    for (let k = 0; k < N.length && live(stage); k++) {
      panel.innerHTML = `<p class="center muted">👆 Toca una nota del tablero.</p>`;
      const notes = $$('.g6a-pm-note', board).filter(b => !b.disabled);
      const i = await new Promise(res => notes.forEach(b => b.onclick = () => res(+b.dataset.i)));
      $$('.g6a-pm-note', board).forEach(b => b.onclick = null);
      const n = N[i], nb = $(`.g6a-pm-note[data-i="${i}"]`, board); nb.classList.add('open'); nb.disabled = true; sfx('tap');
      panel.innerHTML = `<div class="g6a-pm-mis" style="--c:${cols[i % 6]}"><span>${n.e}</span><div><b>${esc(n.m)}</b><small>${esc(n.mes)}</small></div></div><p class="g6a-pm-tag">${n.k === 'mixed' ? '🔀 Condicional mixto' : '😬 should / shouldn\'t have'}</p>`;
      panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      const opts = shuffle([n.a, ...n.o]);
      const ok = await ask(panel, opts.map(esc), opts.indexOf(n.a), 'g6a-col');
      done[i] = ok; nb.classList.add(ok ? 'ok' : 'no'); $('small', nb).textContent = ok ? '✅' : '❌';
      $('b', hud).textContent = k + 1;
      if (ok) c++; else missed.push({ en: n.a, au: n.au });
      await say(panel, ok, n.a, '', n.au);
    }
    if (live(stage)) {
      panel.innerHTML = `<div class="g6a-pm-lessons"><h4>📌 Lessons learned</h4><ul>${N.map((n, i) => `<li class="${done[i] ? 'ok' : 'no'}">${n.e} ${esc(n.a)}</li>`).join('')}</ul></div>`;
      await waitBtn(panel, 'Ver resultado →');
    }
    return finish(c, N.length, 'writing', missed, '🧠 Lecciones aprendidas', '¡Tu próxima startup será un éxito! 🚀');
  }

  /* ====== t4p1 — DESLIZA EL VERBO (gerund vs infinitive, estilo app de citas) ====== */
  async function vg1VerbSwipe(stage, p) {
    const R = sample(G().swipe || [], 8); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const toF = r.ing ? r.w : r.a, ingF = r.ing ? r.a : r.w;
      const body = head(stage, { lbl: 'Game', title: '💘 VerbMatch', ins: 'Cada verbo busca su pareja perfecta. Desliza a la <b>izquierda</b> para <b>to + verbo</b> o a la <b>derecha</b> para <b>-ing</b>.', count: `Perfil ${k + 1} / ${R.length}` });
      const deck = h(`<div class="g6a-sw-deck"><div class="g6a-sw-card back2"></div><div class="g6a-sw-card back1"></div><div class="g6a-sw-card top"><div class="g6a-sw-ph"><span>${r.e}</span><b>${esc(r.n)}, ${r.age}</b><small>📍 ${esc(r.city)}</small></div><p class="g6a-sw-s">${blank(r.s)} <em>(${esc(r.b)})</em></p><div class="g6a-sw-stamp"></div></div></div>`); body.appendChild(deck);
      const bar = h(`<div class="g6a-sw-btns"><button class="g6a-sw-l" data-v="to">⬅️ <b>${esc(toF)}</b><small>to + verbo</small></button><button class="g6a-sw-r" data-v="ing"><b>${esc(ingF)}</b> ➡️<small>verbo + -ing</small></button></div>`); body.appendChild(bar);
      const v = await new Promise(res => $$('button', bar).forEach(b => b.onclick = () => res(b.dataset.v)));
      $$('button', bar).forEach(b => b.disabled = true);
      const ok = (v === 'ing') === r.ing; const top = $('.top', deck);
      $('.g6a-sw-s', top).innerHTML = `${blank(r.s, r.a)}`; $('.g6a-sw-stamp', top).textContent = ok ? "IT'S A MATCH 💘" : 'NO MATCH 💔'; top.classList.add(ok ? 'match' : 'nomatch');
      await sleep(650); top.classList.add(v === 'ing' ? 'fly-r' : 'fly-l');
      if (ok) c++; else missed.push({ en: r.full, au: r.au });
      await say(body, ok, r.full, r.es, r.au);
    }
    return finish(c, R.length, 'reading', missed, '💘 Parejas perfectas', '¡Cada verbo encontró su pareja ideal! 💞');
  }

  /* ====== t4p2 — GEMELOS DE SIGNIFICADO (stop/remember/try… + prepositions) ====== */
  async function vg2MeaningTwins(stage, p) {
    const pairs = sample(G().twins || [], 5); const preps = sample(G().prep || [], 3); let c = 0; const missed = [];
    const total = pairs.length + preps.length;
    for (let k = 0; k < pairs.length && live(stage); k++) {
      const pr = pairs[k]; const ti = Math.random() < .5 ? 0 : 1; const tg = pr[ti]; const order = shuffle([0, 1]);
      const body = head(stage, { lbl: 'Game', title: '👯 Gemelos de significado', ins: 'Mismo verbo, ¡distinto significado! Escucha la oración y toca la <b>viñeta</b> que la representa.', count: `${k + 1} / ${total}` });
      body.appendChild(h(`<div class="g6a-tw-sent">🎬 “${esc(tg.en)}”</div>`)).appendChild(rep(tg.au, '🔊'));
      play(tg.au);
      const panels = h(`<div class="g6a-tw-panels">${order.map((j, x) => `<button class="g6a-tw-p" data-j="${j}"><em>${x ? 'B' : 'A'}</em><span>${pr[j].e}</span><small>${esc(pr[j].es)}</small></button>`).join('')}</div>`); body.appendChild(panels);
      const btns = $$('.g6a-tw-p', panels);
      const j = await new Promise(res => btns.forEach(b => b.onclick = () => res(+b.dataset.j)));
      btns.forEach(b => { b.disabled = true; const bj = +b.dataset.j; b.classList.add(bj === ti ? 'right' : (bj === j ? 'wrong' : 'dim')); b.insertAdjacentHTML('beforeend', `<i>“${esc(pr[bj].en)}”</i>`); });
      const ok = j === ti; if (ok) c++; else missed.push({ en: tg.en, au: tg.au });
      await say(body, ok, tg.en, tg.es, tg.au);
    }
    for (let k = 0; k < preps.length && live(stage); k++) {
      const r = preps[k];
      const body = head(stage, { lbl: 'Game', title: '👯 Bonus: preposición + -ing', ins: 'Después de una <b>preposición</b> (at, for, without, in, instead of) el verbo va en <b>-ing</b>. ¿Cuál es correcta?', count: `${pairs.length + k + 1} / ${total}` });
      body.appendChild(h(`<div class="g6a-tw-sent big">${blank(r.s)}</div>`));
      const opts = shuffle([r.a, r.w]);
      const ok = await ask(body, opts.map(esc), opts.indexOf(r.a), 'g3-two');
      if (ok) c++; else missed.push({ en: r.full, au: r.au });
      await say(body, ok, r.full, r.es, r.au);
    }
    return finish(c, total, 'listening', missed, '👯 Gemelos identificados', '¡Ya no te engañan stop, remember ni try! 🧠');
  }

  /* ====== t5p1 — NETWORKING MATCHMAKER (so / neither / disagree) ====== */
  async function snMatchmaker(stage, p) {
    const R = sample(G().match || [], 6); let c = 0; const missed = []; const met = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🥂 Networking en Austin', ins: 'Lee <b>tu gafete</b> (✅ = es verdad para ti · ❌ = no). Responde a cada persona con la reacción correcta: <i>So do I / Neither have I / Oh, I don\'t…</i>', count: `Persona ${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g6a-mm-badge"><div class="g6a-mm-hello">HELLO<small>my profile</small></div><ul>${R.map((x, i) => `<li class="${i === k ? 'cur' : ''}"><span>${x.fe}</span>${esc(x.ft)}<b class="${x.me ? 'y' : 'n'}">${x.me ? '✅' : '❌'}</b></li>`).join('')}</ul></div>`));
      const who = h(`<div class="g6a-mm-who"><span class="g6a-mm-av">${r.av}</span><div class="g6a-mm-bub"><small>${esc(r.n)}</small>“${esc(r.s)}”</div></div>`); body.appendChild(who);
      who.appendChild(rep(r.sau, '🔊')); play(r.sau);
      const opts = shuffle([r.a, ...r.o]);
      const ok = await ask(body, opts.map(o => `💬 ${esc(o)}`), opts.indexOf(r.a), 'g6a-grid2');
      if (ok) { c++; met.push(r); } else missed.push({ en: `${r.s} — ${r.a}`, au: r.au });
      const why = r.me ? (r.a.startsWith('So') ? 'Tú también (✅) y la frase es positiva → So + auxiliar.' : 'Tú sí (✅) pero la frase es negativa → desacuerdo: I + auxiliar positivo.')
        : (r.a.startsWith('Neither') ? 'Tú tampoco (❌) y la frase es negativa → Neither + auxiliar.' : 'Tú no (❌) pero la frase es positiva → desacuerdo: I + auxiliar negativo.');
      await say(body, ok, r.a, why, r.au);
    }
    if (live(stage)) {
      const body = head(stage, { lbl: 'Game', title: '📇 Tus nuevos contactos', ins: 'Intercambiaste tarjetas con las personas con las que conectaste.' });
      body.appendChild(h(`<div class="g6a-mm-cards">${met.length ? met.map(m => `<div class="g6a-mm-card"><span>${m.av}</span><b>${esc(m.n)}</b><small>“${esc(m.a)}”</small></div>`).join('') : '<p class="center muted">Ninguna tarjeta esta vez… ¡inténtalo de nuevo! 🙂</p>'}</div>`));
      await waitBtn(body, 'Ver resultado →');
    }
    return finish(c, R.length, 'listening', missed, '🥂 Conexiones', '¡Eres el alma del evento de networking! 🤝');
  }

  /* ====== t5p2 — RADAR DE AUXILIARES (either / neither… nor / short reactions) ====== */
  async function snAuxRadar(stage, p) {
    const D = G(); const set = D.auxset || [];
    const Q = shuffle([...sample(D.aux || [], 4).map(x => ({ t: 'aux', x })), ...sample(D.rep || [], 2).map(x => ({ t: 'rep', x })), ...sample(D.cor || [], 2).map(x => ({ t: 'cor', x }))]);
    let c = 0; const missed = [];
    for (let k = 0; k < Q.length && live(stage); k++) {
      const { t, x } = Q[k];
      const ins = t === 'aux' ? 'Lee el diálogo y <b>toca en el radar</b> el auxiliar que falta.' : t === 'rep' ? 'Intercepta la transmisión y elige la respuesta con <b>either / nor</b> bien usada.' : 'Completa la transmisión con la pareja correcta: <b>neither…nor · either…or · both…and</b>.';
      const body = head(stage, { lbl: 'Game', title: '📡 Radar de auxiliares', ins, count: `Señal ${k + 1} / ${Q.length}` });
      const radar = h(`<div class="g6a-rd ${t === 'aux' ? 'act' : ''}"><div class="g6a-rd-sweep"></div><div class="g6a-rd-ring r1"></div><div class="g6a-rd-ring r2"></div>${set.map((a, i) => { const ang = i / set.length * 2 * Math.PI - Math.PI / 2; const rr = i % 2 ? 37 : 42; return `<button class="g6a-rd-b" data-a="${a}" style="left:${(50 + rr * Math.cos(ang)).toFixed(1)}%;top:${(50 + rr * Math.sin(ang)).toFixed(1)}%">${a}</button>`; }).join('')}<div class="g6a-rd-c">📡</div></div>`);
      const tx = h(`<div class="g6a-rd-tx"><small>📻 INCOMING TRANSMISSION</small></div>`);
      body.appendChild(tx); let ok, en, es, au;
      if (t === 'aux') {
        const [sa, sb] = x.s.split(' B: ');
        tx.insertAdjacentHTML('beforeend', `<p><b>A:</b> ${esc(sa.replace('A: ', ''))}<br><b>B:</b> ${blank(sb)}</p>`);
        body.appendChild(radar);
        const btns = $$('.g6a-rd-b', radar);
        const got = await new Promise(res => btns.forEach(b => b.onclick = () => res(b.dataset.a)));
        btns.forEach(b => { b.disabled = true; if (b.dataset.a === x.a.toLowerCase()) b.classList.add('right'); else if (b.dataset.a === got) b.classList.add('wrong'); });
        ok = got === x.a.toLowerCase(); en = x.full.replace('A: ', '').replace(' B: ', ' — '); es = x.es; au = x.au;
      } else if (t === 'rep') {
        tx.insertAdjacentHTML('beforeend', `<p><b>A:</b> ${esc(x.s)}<br><b>B:</b> <u class="g6a-blank">&nbsp;?&nbsp;</u> <small>(${esc(x.es)})</small></p>`);
        tx.appendChild(rep(x.sau, '🔊'));
        play(x.sau);
        const opts = shuffle([x.a, ...x.o]); ok = await ask(body, opts.map(esc), opts.indexOf(x.a), 'g6a-col');
        en = `${x.s} — ${x.a}`; es = x.es; au = x.au;
      } else {
        tx.insertAdjacentHTML('beforeend', `<p>${esc(x.s).replace(/___/g, '<u class="g6a-blank">&nbsp;?&nbsp;</u>')}</p>`);
        const cand = shuffle([x.a, ...x.o]); const lbl = cand.map(o => `${o[0]} … ${o[1]}`);
        ok = await ask(body, lbl.map(esc), cand.indexOf(x.a), 'g6a-3');
        en = x.full; es = x.es; au = x.au;
      }
      if (ok) c++; else missed.push({ en, au });
      await say(body, ok, en, es, au);
    }
    return finish(c, Q.length, 'writing', missed, '📡 Señales captadas', '¡Tu radar de auxiliares es infalible! 🛰️');
  }

  /* ====== t6p1 — SHERLOCK (present perfect continuous: evidence & duration) ====== */
  async function ppcSherlock(stage, p) {
    const D = G(); const Q = [...sample(D.sher || [], 5).map(x => ({ t: 's', x })), ...sample(D.dur || [], 2).map(x => ({ t: 'd', x }))];
    let c = 0; const missed = [];
    for (let k = 0; k < Q.length && live(stage); k++) {
      const { t, x } = Q[k];
      if (t === 's') {
        const body = head(stage, { lbl: 'Game', title: '🕵️ Elemental, querido Watson', ins: 'Examina las <b>3 pistas</b> 🔍 y deduce qué <b>ha estado haciendo</b> esta persona (<i>has/have been + -ing</i>).', count: `Caso ${k + 1} / ${Q.length}` });
        body.appendChild(h(`<div class="g6a-sh-file"><span class="g6a-sh-av">${x.av}</span><div><small>CASE FILE #${221 + k}B</small><b>${esc(x.n)}</b></div><span class="g6a-sh-pipe">🔎</span></div>`));
        const clues = h(`<div class="g6a-sh-clues">${x.ce.map((e, i) => `<button class="g6a-sh-c" data-i="${i}"><span class="q">🔍</span><span class="e">${e}</span><small>${esc(x.ct[i])}</small></button>`).join('')}</div>`); body.appendChild(clues);
        const seen = new Set();
        await new Promise(res => $$('.g6a-sh-c', clues).forEach(b => b.onclick = () => { if (b.classList.contains('on')) return; b.classList.add('on'); sfx('tap'); seen.add(b.dataset.i); if (seen.size === x.ce.length) res(); }));
        $$('.g6a-sh-c', clues).forEach(b => b.disabled = true);
        body.appendChild(h(`<p class="g6a-sh-q">🧠 <b>Your deduction:</b></p>`));
        const opts = shuffle([x.a, ...x.o]);
        const ok = await ask(body, opts.map(esc), opts.indexOf(x.a), 'g6a-col');
        if (ok) c++; else missed.push({ en: x.a, au: x.au });
        await say(body, ok, x.a, x.es, x.au);
      } else {
        const body = head(stage, { lbl: 'Game', title: '🕵️ ¿Desde cuándo? ¿Cuánto tiempo?', ins: 'Mira la línea de tiempo y elige la frase correcta con <b>for</b> (periodo) o <b>since</b> (inicio).', count: `Caso ${k + 1} / ${Q.length}` });
        body.appendChild(h(`<div class="g6a-sh-tl"><div class="a"><b>${esc(x.t0)}</b><small>start</small></div><div class="bar"><i></i></div><div class="b"><b>${esc(x.t1)}</b><small>now</small></div></div>`));
        body.appendChild(h(`<div class="g6a-tw-sent">📝 ${esc(x.s)}</div>`)).appendChild(rep(x.sau, '🔊'));
        play(x.sau);
        const opts = shuffle([x.a, ...x.o]);
        const ok = await ask(body, opts.map(esc), opts.indexOf(x.a), 'g6a-col');
        if (ok) c++; else missed.push({ en: x.a, au: x.au });
        await say(body, ok, x.a, x.es, x.au);
      }
    }
    return finish(c, Q.length, 'reading', missed, '🕵️ Casos resueltos', '¡Sherlock estaría orgulloso de tus deducciones! 🎩');
  }

  /* ====== t6p2 — APP DE MARATÓN (had been doing / stative verbs) ====== */
  const ROUTE = 'M20 150 C60 40, 110 40, 120 100 S170 170, 200 110 S250 20, 300 60';
  async function ppcMarathonApp(stage, p) {
    const R = sample(G().mar || [], 7); let c = 0, prog = 0; const missed = [];
    const body = head(stage, { lbl: 'Game', title: '🏃 RunTrack: la maratón', ins: 'Corres la maratón de Chicago. En cada punto de control elige el <b>tiempo verbal</b> correcto para avanzar. ¡Un error = calambre! 🐢' });
    const app = h(`<div class="g6a-mr"><div class="g6a-mr-top"><b>RunTrack</b><span>🔴 LIVE · Chicago</span></div><div class="g6a-mr-stats"><div><b id="g6a-mi">0.0</b><small>miles</small></div><div><b id="g6a-tm">0:00</b><small>time</small></div><div><b id="g6a-hr">92</b><small>❤️ bpm</small></div></div><svg viewBox="0 0 320 190" class="g6a-mr-map"><path d="${ROUTE}" fill="none" stroke="#24406e" stroke-width="10" stroke-linecap="round"/><path class="pr" d="${ROUTE}" fill="none" stroke="#FFD43B" stroke-width="6" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100"/><text x="300" y="44" text-anchor="middle" font-size="18">🏁</text><text class="rn" x="20" y="150" text-anchor="middle" font-size="22">🏃</text></svg></div>`); body.appendChild(app);
    const panel = h(`<div class="g6a-mr-q"></div>`); body.appendChild(panel);
    const path = $('path', app), pr = $('.pr', app), rn = $('.rn', app); let L = 0; try { L = path.getTotalLength(); } catch (e) { L = 0; }
    const move = () => { pr.setAttribute('stroke-dasharray', `${prog} 100`); if (L) { const pt = path.getPointAtLength(L * prog / 100); rn.setAttribute('x', pt.x.toFixed(1)); rn.setAttribute('y', (pt.y + 6).toFixed(1)); }
      $('#g6a-mi', app).textContent = (26.2 * prog / 100).toFixed(1); const mins = Math.round(270 * prog / 100); $('#g6a-tm', app).textContent = `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`; $('#g6a-hr', app).textContent = 120 + Math.round(Math.random() * 40); };
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      panel.innerHTML = `<div class="g6a-mr-cp">📍 Checkpoint ${k + 1} / ${R.length}</div><p class="g6a-mr-s">${blank(r.s)}</p>`;
      const opts = shuffle([r.a, ...r.o]);
      const ok = await ask(panel, opts.map(esc), opts.indexOf(r.a), 'g6a-col');
      $('.g6a-mr-s', panel).innerHTML = blank(r.s, r.a);
      prog = Math.min(100, prog + (ok ? 100 / R.length : 100 / R.length / 2)); if (k === R.length - 1) prog = 100; move();
      if (!ok) { app.classList.add('cramp'); setTimeout(() => app.classList.remove('cramp'), 700); }
      if (ok) c++; else missed.push({ en: r.full, au: r.au });
      await say(panel, ok, r.full, r.es, r.au);
    }
    if (live(stage)) {
      panel.innerHTML = `<div class="g6a-mr-fin"><span>🏅</span><b>FINISHER · Chicago Marathon</b><small>${c} / ${R.length} checkpoints sin calambre</small></div>`;
      sfx('win'); await waitBtn(panel, 'Ver resultado →');
    }
    return finish(c, R.length, 'writing', missed, '🏃 Checkpoints', '¡Cruzaste la meta sin un solo calambre gramatical! 🏅');
  }

  /* ====== t7p1 — TABÚ (who / which / whose / where / when) ====== */
  async function rcTabooCards(stage, p) {
    const D = G(); const Q = [...sample(D.taboo || [], 5).map(x => ({ t: 'def', x })), ...sample(D.guess || [], 3).map(x => ({ t: 'g', x }))];
    let c = 0; const missed = []; const PR = ['who', 'which', 'whose', 'where', 'when'];
    for (let k = 0; k < Q.length && live(stage); k++) {
      const { t, x } = Q[k];
      if (t === 'def') {
        const body = head(stage, { lbl: 'Game', title: '🚫 Tabú: define sin decirla', ins: 'Describe la palabra a tu equipo <b>sin usar las palabras prohibidas</b>. Elige el <b>pronombre relativo</b> correcto antes de que se acabe el tiempo ⏳.', count: `Tarjeta ${k + 1} / ${Q.length}` });
        const card = h(`<div class="g6a-tb-card"><div class="g6a-tb-w"><span>${x.e}</span><b>${esc(x.w)}</b></div><ul>${x.tb.map(w => `<li>${esc(w)}</li>`).join('')}</ul><div class="g6a-tb-time"><i></i></div></div>`); body.appendChild(card);
        body.appendChild(h(`<div class="g6a-tb-def">🗣️ “${blank(x.d)}”</div>`));
        const wrap = h(`<div class="g6a-tb-pr">${PR.map(w => `<button class="opt" data-w="${w}">${w}</button>`).join('')}</div>`); body.appendChild(wrap);
        const bar = $('.g6a-tb-time i', card); const T0 = Date.now(), LIM = 30000; let tm;
        const got = await new Promise(res => { $$('button', wrap).forEach(b => b.onclick = () => res(b.dataset.w)); tm = setInterval(() => { if (!live(stage)) { clearInterval(tm); res(null); return; } const f = 1 - (Date.now() - T0) / LIM; bar.style.width = Math.max(0, f * 100) + '%'; if (f <= 0) res('⏰'); }, 200); });
        clearInterval(tm); $$('button', wrap).forEach(b => { b.disabled = true; if (b.dataset.w === x.a) b.classList.add('right'); else if (b.dataset.w === got) b.classList.add('wrong'); });
        const ok = got === x.a; card.classList.add(ok ? 'ok' : 'buzz'); if (got === '⏰') M.toast('⏰ ¡Se acabó el tiempo!');
        $('.g6a-tb-def', body).innerHTML = `🗣️ “${blank(x.d, x.a)}”`;
        if (ok) c++; else missed.push({ en: `${x.w}: ${x.full}`, au: x.au });
        await say(body, ok, x.full, x.es, x.au);
      } else {
        const body = head(stage, { lbl: 'Game', title: '🚫 Tabú: adivina la palabra', ins: 'Ahora tu compañero describe. Escucha 🔊 y toca la <b>palabra</b> correcta.', count: `Tarjeta ${k + 1} / ${Q.length}` });
        body.appendChild(h(`<div class="g6a-tb-def">🗣️ “${esc(x.d)}”</div>`)).appendChild(rep(x.au, '🔊'));
        play(x.au);
        const o = shuffle(x.o.slice());
        const ok = await ask(body, o.map(z => `<span class="g6a-tb-e">${z.e}</span>${esc(z.w)}`), o.indexOf(x.o[0]), 'g6a-3 g6a-tb-g');
        if (ok) c++; else missed.push({ en: x.d, au: x.au });
        await say(body, ok, x.o[0].w, x.d, x.au);
      }
    }
    return finish(c, Q.length, 'reading', missed, '🚫 Tarjetas ganadas', '¡Tu equipo gana el Tabú gracias a tus definiciones! 🏆');
  }

  /* ====== t7p2 — LABORATORIO DE FUSIÓN (non-defining, prepositions, omission) ====== */
  async function rcFusionLab(stage, p) {
    const D = G(); const Q = [...sample(D.fuse || [], 5).map(x => ({ t: 'f', x })), ...sample(D.cut || [], 3).map(x => ({ t: 'c', x }))];
    const ord = [Q[0], Q[1], Q[5], Q[2], Q[3], Q[6], Q[4], Q[7]].filter(Boolean);
    let c = 0; const missed = [];
    for (let k = 0; k < ord.length && live(stage); k++) {
      const { t, x } = ord[k];
      if (t === 'f') {
        const body = head(stage, { lbl: 'Game', title: '⚛️ Laboratorio de fusión', ins: 'Fusiona las dos oraciones en <b>una sola</b> con una cláusula relativa. ¡Ojo con las <b>comas</b>, <b>that</b> y las <b>preposiciones</b>!', count: `Experimento ${k + 1} / ${ord.length}` });
        const lab = h(`<div class="g6a-fu"><div class="g6a-fu-at a">${esc(x.a1)}</div><div class="g6a-fu-core">⚛️</div><div class="g6a-fu-at b">${esc(x.a2)}</div></div>`); body.appendChild(lab);
        await new Promise(res => { const bar = h(`<div class="actionbar"><button class="btn k lg">⚡ Fusionar</button></div>`); body.appendChild(bar); $('button', bar).onclick = () => { bar.remove(); res(); }; });
        lab.classList.add('go'); sfx('tap'); await sleep(700);
        const opts = shuffle([x.a, ...x.o]);
        const ok = await ask(body, opts.map(esc), opts.indexOf(x.a), 'g6a-col');
        lab.classList.add(ok ? 'ok' : 'boom'); $('.g6a-fu-core', lab).textContent = ok ? '💎' : '💥';
        if (ok) c++; else missed.push({ en: x.a, au: x.au });
        await say(body, ok, x.a, x.es, x.au);
      } else {
        const body = head(stage, { lbl: 'Game', title: '✂️ ¿Se puede cortar?', ins: '¿Puedes <b>omitir</b> el pronombre relativo resaltado? Solo se puede si es <b>objeto</b> en una cláusula <b>sin comas</b>.', count: `Experimento ${k + 1} / ${ord.length}` });
        const s = h(`<div class="g6a-fu-cut">${esc(x.pre)} <span class="w">${esc(x.w)}</span> ${esc(x.post)}</div>`); body.appendChild(s);
        const bar = h(`<div class="g6a-fu-cb"><button class="opt" data-v="1">✂️ Cortar</button><button class="opt" data-v="0">🔒 Mantener</button></div>`); body.appendChild(bar);
        const btns = $$('button', bar);
        const v = await new Promise(res => btns.forEach(b => b.onclick = () => res(b.dataset.v === '1')));
        btns.forEach(b => { b.disabled = true; const bv = b.dataset.v === '1'; if (bv === x.ok) b.classList.add('right'); else if (bv === v) b.classList.add('wrong'); });
        const ok = v === x.ok; if (x.ok) $('.w', s).classList.add('gone'); else $('.w', s).classList.add('lock');
        if (ok) c++; else missed.push({ en: x.full, au: x.au });
        await say(body, ok, x.ok ? `${x.pre} ${x.post}` : x.full, x.es, x.au);
      }
    }
    return finish(c, ord.length, 'writing', missed, '⚛️ Fusiones exitosas', '¡Eres el científico de las cláusulas relativas! 🧪');
  }

  Object.assign(window.M1A, { fc1DominoChain, fc2DealNegotiator, sc1ParallelPortal, sc2AdviceColumn, tc1TimeRewind, tc2StartupPostmortem,
    vg1VerbSwipe, vg2MeaningTwins, snMatchmaker, snAuxRadar, ppcSherlock, ppcMarathonApp, rcTabooCards, rcFusionLab });
})();
