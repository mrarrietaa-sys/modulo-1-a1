/* =====================================================================
   ACTIVIDADES — cada una devuelve {c: correctas, t: total, skill, missed}
   ===================================================================== */
(function () {
  const M = window.M1;
  const { $, $$, h, esc, shuffle, sample, sleep, photo, play, stop, sfx, sheet, good, bad, praise } = M;

  /* ---------- shared bits ---------- */
  function head(stage, { lbl, title, ins, count }) {
    stage.innerHTML = `<div class="hd"><span class="lbl">${lbl}</span>${count ? `<span class="qcount">${count}</span>` : ''}</div>
      <h2>${title}</h2>${ins ? `<p class="ins">${ins}</p>` : ''}<div class="body"></div>`;
    return $('.body', stage);
  }
  const playBtn = (au, big = true) => {
    const b = h(big ? `<button class="play" aria-label="Escuchar">🔊</button>` : `<button class="aud" aria-label="Escuchar">🔊</button>`);
    b.onclick = (e) => { e.stopPropagation(); if (b.classList.contains('playing')) { stop(); return; } sfx('tap'); play(au, { btn: b }); }; return b;
  };
  const slowBtn = (au) => { const b = h(`<button class="slowbtn">🐢 Lento</button>`); b.onclick = () => play(au, { rate: .72 }); return b; };
  const hasPhoto = (it) => it.img && !it.img.startsWith('#');
  const label = (it) => it.en;
  function result(c, t, skill, missed = []) { return { c, t, skill, missed }; }
  function onePerKey(items, key = 'en') { const seen = new Set(); return items.filter(x => { const k = x[key]; if (seen.has(k)) return false; seen.add(k); return true; }); }

  async function feedback(ok, correctTxt, tip, au) {
    if (ok) { sfx('ok'); if (Math.random() < .35) praise(); }
    else sfx('bad');
    await sheet({ ok, title: ok ? good() : bad(), msg: ok ? '' : (correctTxt ? `Respuesta correcta: <b>${esc(correctTxt)}</b>` : ''), tip: ok ? '' : tip });
  }

  /* ================= 1. LEARN (Explanation) ================= */
  async function learn(stage, p) {
    const isPl = !!p.plurals;
    const body = head(stage, { lbl: 'Explanation', title: 'Listen and repeat', ins: 'Toca cada tarjeta para escuchar la pronunciación y <b>repítela en voz alta</b>. Usa <b>“Escuchar todo”</b> para oírlas seguidas.' });
    const tools = h(`<div class="row" style="margin-bottom:14px"><button class="btn sm k" id="all">▶ Escuchar todo</button><span class="muted" id="cnt"></span></div>`);
    body.appendChild(tools);
    const grid = h(`<div class="lgrid"></div>`); body.appendChild(grid);
    const heard = new Set();
    const upd = () => { $('#cnt', tools).textContent = `${heard.size} / ${p.vocab.length} escuchadas`; };
    const cards = p.vocab.map((it, i) => {
      const badge = it.x === 'near' ? '👉 cerca' : it.x === 'far' ? '👉 lejos' : '';
      const en = isPl ? `${esc(it.sg)} → <u>${esc(it.en)}</u>` : esc(it.en);
      const c = h(`<button class="lcard">${photo(it.img, { badge })}<div class="tx"><div class="en">${en}</div><div class="esn">${esc(it.es)}</div></div></button>`);
      c.onclick = async () => { $$('.lcard', grid).forEach(x => x.classList.remove('on')); c.classList.add('on'); heard.add(i); upd(); if (!c.querySelector('.heard')) c.appendChild(h('<span class="heard">✓</span>'));
        if (isPl) { await play(it.sgau); await sleep(200); } await play(it.au); };
      grid.appendChild(c); return c;
    });
    upd();
    $('#all', tools).onclick = async (e) => { const b = e.currentTarget; if (b._run) { b._run = false; stop(); b.textContent = '▶ Escuchar todo'; return; } b._run = true; b.textContent = '⏹ Detener'; const onStop = () => { b._run = false; }; window.addEventListener('m1-audio-stop', onStop, { once: true }); const hideF = M.floatStop(b);
      for (const c of cards) { if (!b._run || !b.isConnected) break; c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); await c.onclick(); await sleep(450); } hideF(); b._run = false; b.textContent = '▶ Escuchar todo'; };
    // mini lesson + tips
    if (p.tip) body.appendChild(h(`<div class="lesson lesson-mra">${M.mascot('lesson-img', 'idea')}<div><h3>📘 Mini lección de Mr. Arrieta</h3>${p.tip}</div></div>`));
    if (p.tips && p.tips.length) { const tb = h(`<div class="lesson" style="background:#fff"><h3>🗣️ Tips de pronunciación del profe</h3></div>`); p.tips.forEach(t => tb.appendChild(h(`<div class="tipbox"><span>💡</span><span>${t}</span></div>`))); body.appendChild(tb); }
    await waitNext(stage, 'Ya practiqué, ¡continuar!');
    return null; // not scored
  }
  function waitNext(stage, txt = 'Continuar') {
    return new Promise(res => { const bar = h(`<div class="actionbar"><button class="btn k lg">${txt} →</button></div>`); stage.appendChild(bar); $('button', bar).onclick = () => { stop(); res(); }; });
  }

  /* ---------- generic question loop ---------- */
  async function qloop(stage, meta, items, renderQ) {
    let c = 0; const missed = [];
    for (let i = 0; i < items.length; i++) {
      if (!stage.isConnected) break;
      const body = head(stage, Object.assign({}, meta, { count: `${i + 1} / ${items.length}` }));
      const ok = await renderQ(body, items[i], i);
      if (ok === true) { c++; M.okWeak(items[i].en || items[i].w); } else if (ok === false) { missed.push(items[i]); M.addWeak(items[i].en || items[i].w || items[i].full, items[i].au); }
    }
    return { c, missed };
  }
  // waits for one click among option buttons; returns chosen index
  function choose(btns) { return new Promise(res => btns.forEach((b, i) => b.onclick = () => { btns.forEach(x => x.disabled = true); res(i); })); }

  /* ================= 2. LISTEN & CHOOSE ================= */
  async function listenChoose(stage, p) {
    const pool = onePerKey(p.vocab);
    const usePh = pool.filter(hasPhoto).length >= pool.length * .6;
    const items = sample(pool, Math.min(6, pool.length));
    const r = await qloop(stage, { lbl: 'Listening', title: 'Listen and choose', ins: 'Escucha el audio y elige la opción correcta.' }, items, async (body, it) => {
      body.appendChild(playBtn(it.au));
      const opts = shuffle([it, ...sample(pool.filter(x => x.en !== it.en && x.img !== it.img), 3)]);
      const wrap = h(`<div class="opts"></div>`); body.appendChild(wrap);
      const big = p.letters || p.numbers;
      const btns = opts.map(o => { const b = h(usePh ? `<button class="opt imgopt">${photo(o.img)}<span class="imglbl">${esc(label(o))}</span></button>` : `<button class="opt ${big ? 'big' : ''}">${esc(label(o))}</button>`); wrap.appendChild(b); return b; });
      setTimeout(() => play(it.au), 350);
      const i = await choose(btns); const ok = opts[i] === it;
      btns[opts.indexOf(it)].classList.add('right'); if (!ok) btns[i].classList.add('wrong'); btns.forEach((b, k) => { if (opts[k] !== it && k !== i) b.classList.add('dim'); });
      await feedback(ok, `${it.en} (${it.es})`, 'Escucha otra vez con el botón 🔊 y fíjate en cada sonido.'); return ok;
    });
    return result(r.c, items.length, 'listening', r.missed);
  }

  /* ================= 3. CHOOSE & LISTEN (pick word) ================= */
  async function pickWord(stage, p) {
    const pool = onePerKey(p.vocab);
    const items = sample(pool, Math.min(6, pool.length));
    const r = await qloop(stage, { lbl: 'Reading', title: 'Choose and listen', ins: 'Lee la palabra en español y elige cómo se dice en inglés. ¡Luego escúchala!' }, items, async (body, it) => {
      body.appendChild(h(`<div class="mainph" style="max-width:300px">${photo(it.img)}</div>`));
      body.appendChild(h(`<div class="sent" style="margin-top:-4px">${esc(it.es)}</div>`));
      const opts = shuffle([it, ...sample(pool.filter(x => x.en !== it.en), 3)]);
      const wrap = h(`<div class="opts"></div>`); body.appendChild(wrap);
      const btns = opts.map(o => { const b = h(`<button class="opt">${esc(o.en)}</button>`); wrap.appendChild(b); return b; });
      const i = await choose(btns); const ok = opts[i] === it;
      btns[opts.indexOf(it)].classList.add('right'); if (!ok) btns[i].classList.add('wrong');
      await play(it.au); await feedback(ok, `${it.en} = ${it.es}`); return ok;
    });
    return result(r.c, items.length, 'reading', r.missed);
  }

  /* ================= 4. LISTEN & TYPE (word / letter / number / sentence / phone / spelled name) ================= */
  function typeQ(body, { au, answer, img, hint, mode, showLen = true, numeric }) {
    return new Promise(res => {
      body.appendChild(playBtn(au));
      if (img) body.appendChild(h(`<div class="mainph" style="max-width:300px">${photo(img)}</div>`));
      if (hint) body.appendChild(h(`<p class="center"><span class="hint">${hint}</span></p>`));
      const plain = answer.replace(/[^A-Za-z0-9 ]/g, '');
      const hl = h(`<div class="hintline ${showLen && mode !== 'sentence' ? '' : 'hidden'}"></div>`); body.appendChild(hl);
      const drawLine = (n) => { hl.innerHTML = plain.split('').map((ch, k) => ch === ' ' ? '&nbsp;' : (k < n ? `<b>${esc(ch)}</b>` : '_')).join(' '); };
      drawLine(0);
      const hintBox = h(`<p class="center hidden" style="margin:-4px 0 10px"><span class="hint"></span></p>`); body.appendChild(hintBox);
      const inp = h(`<input class="inp" autocomplete="off" autocapitalize="off" spellcheck="false" ${numeric ? 'inputmode="numeric"' : ''} placeholder="${mode === 'sentence' ? 'Escribe la oración que escuchas…' : 'Escribe aquí…'}">`);
      body.appendChild(inp);
      const bar = h(`<div class="actionbar"><button class="btn w" id="hintb">💡 Pista</button><button class="btn k lg" id="chk">Comprobar ✓</button></div>`); body.appendChild(bar);
      setTimeout(() => { play(au); inp.focus({ preventScroll: true }); }, 350);
      let hints = 0;
      // la pista NUNCA escribe la respuesta: solo muestra una ayuda; el estudiante debe escribirla completa
      $('#hintb', bar).onclick = () => {
        hints++; play(au); const ch = plain.replace(/ /g, '');
        if (mode === 'sentence') {
          const w = answer.replace(/[.?!,]/g, '').split(' '); const n = Math.min(w.length - 1, hints * Math.max(1, Math.ceil(w.length / 4)));
          $('.hint', hintBox).innerHTML = `💡 Empieza así: <b>${esc(w.slice(0, n).join(' '))} …</b> (${w.length} palabras)`; hintBox.classList.remove('hidden');
          if (n >= w.length - 1) $('#hintb', bar).disabled = true;
        } else if (ch.length <= 1) {
          const AB = numeric ? '0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; const k = AB.indexOf(ch.toUpperCase());
          $('.hint', hintBox).innerHTML = k > 0 && k < AB.length - 1 ? `💡 Está entre <b>${AB[k - 1]}</b> y <b>${AB[k + 1]}</b> ${numeric ? '' : 'en el abecedario'}` : `💡 Es ${k === 0 ? 'la primera' : 'la última'} ${numeric ? 'cifra' : 'letra del abecedario'}`;
          hintBox.classList.remove('hidden'); $('#hintb', bar).disabled = true;
        } else {
          const n = Math.min(plain.length - 1, hints * Math.max(1, Math.ceil(plain.length / 4))); drawLine(n); hl.classList.remove('hidden');
          if (hints >= 3 || n >= plain.length - 1) $('#hintb', bar).disabled = true;
        }
        inp.focus();
      };
      const check = async () => {
        const v = inp.value.trim(); if (!v) { inp.focus(); return; }
        let ok;
        if (numeric) ok = v.replace(/\D/g, '') === answer.replace(/\D/g, '');
        else ok = M.norm(v) === M.norm(answer);
        const near = !ok && !numeric && M.lev(M.norm(v), M.norm(answer)) <= Math.max(1, Math.floor(answer.length / 8));
        inp.classList.add(ok ? 'right' : 'wrong'); inp.disabled = true; bar.remove();
        play(au);
        let tip = near ? 'Estuviste muy cerca: revisa la ortografía letra por letra.' : 'Escucha de nuevo con 🔊 y escribe palabra por palabra.';
        if (!ok && mode === 'sentence') tip = 'Revisa las palabras pequeñas (a, an, the, is, are) y los apóstrofes ( I\'m, it\'s ).';
        if (!ok && numeric) tip = 'Recuerda: <b>-teen</b> (13-19) se acentúa al final; <b>-ty</b> (30, 40...) al inicio.';
        if (ok && hints) { await sheet({ ok: true, title: good(), msg: 'Lo lograste con pista. ¡La próxima sin ayuda! 😉' }); res(true); return; }
        await feedback(ok, answer, tip); res(ok);
      };
      $('#chk', bar).onclick = check; inp.onkeydown = (e) => { if (e.key === 'Enter') check(); };
    });
  }
  async function typeWord(stage, p) {
    const items = sample(onePerKey(p.vocab), Math.min(5, p.vocab.length));
    const r = await qloop(stage, { lbl: 'Writing', title: 'Listen and type', ins: 'Escucha y escribe la palabra en inglés.' }, items, (body, it) => typeQ(body, { au: it.au, answer: it.en, img: it.img, hint: it.es }));
    return result(r.c, items.length, 'writing', r.missed);
  }
  async function typeLetter(stage, p) {
    const items = sample(p.vocab, 6);
    const r = await qloop(stage, { lbl: 'Listening', title: 'Listen and type the letter', ins: 'Escucha la letra y escríbela.' }, items, (body, it) => typeQ(body, { au: it.au, answer: it.en, showLen: false }));
    return result(r.c, items.length, 'listening', r.missed);
  }
  async function typeNumber(stage, p) {
    const extra = sample(p.vocab.filter(v => +v.en > 20), 2).map(v => ({ a: v.en, au: v.au }));
    const items = shuffle([...(p.typeNums || []), ...extra]).slice(0, 7).map(x => ({ en: x.a, au: x.au }));
    const r = await qloop(stage, { lbl: 'Listening', title: 'Listen and type the number', ins: 'Escucha y escribe el número con dígitos (ej: 15).' }, items, (body, it) => typeQ(body, { au: it.au, answer: it.en, numeric: true, showLen: false }));
    return result(r.c, items.length, 'listening', r.missed);
  }
  async function phone(stage, p) {
    const items = p.phone.map(x => ({ en: x.a, au: x.au }));
    const r = await qloop(stage, { lbl: 'Listening', title: 'What\'s the phone number?', ins: 'Escucha el número de teléfono y escríbelo (solo dígitos). Recuerda: <b>oh</b> = 0.' }, items, (body, it) => typeQ(body, { au: it.au, answer: it.en, numeric: true, showLen: false, hint: '📞 10 dígitos' }));
    return result(r.c, items.length, 'listening', r.missed);
  }
  async function spellName(stage, p) {
    const items = p.spellName.map(x => ({ en: x.w, au: x.au }));
    const r = await qloop(stage, { lbl: 'Listening', title: 'Listen and write the name', ins: 'Escucha cómo deletrean el nombre y escríbelo.' }, items, (body, it) => typeQ(body, { au: it.au, answer: it.en, hint: '✍️ Nombre deletreado' }));
    return result(r.c, items.length, 'listening', r.missed);
  }
  async function typeSentence(stage, p) {
    const items = sample(p.sentences, Math.min(4, p.sentences.length));
    const r = await qloop(stage, { lbl: 'Writing', title: 'Listen and type', ins: 'Escucha la oración completa y escríbela. (Mayúsculas y signos no cuentan).' }, items, (body, it) => typeQ(body, { au: it.au, answer: it.en, img: it.img, mode: 'sentence', hint: it.es }));
    return result(r.c, items.length, 'writing', r.missed);
  }

  /* ================= 5. FILL THE GAP ================= */
  async function fill(stage, p, items) {
    items = items || shuffle(p.fill);
    const r = await qloop(stage, { lbl: 'Practice', title: 'Complete the sentence', ins: 'Elige la palabra que completa la oración.' }, items, async (body, it) => {
      const sent = h(`<div class="sent">${esc(it.s).replace('___', '<span class="blank">&nbsp;</span>')}</div>`); body.appendChild(sent);
      if (it.h) body.appendChild(h(`<p class="center" style="margin-top:-8px"><span class="hint">💡 ${esc(it.h)}</span></p>`));
      const opts = shuffle([it.a, ...it.o]); const wrap = h(`<div class="opts" style="grid-template-columns:repeat(${opts.length},1fr)"></div>`); body.appendChild(wrap);
      const btns = opts.map(o => { const b = h(`<button class="opt">${esc(o)}</button>`); wrap.appendChild(b); return b; });
      const i = await choose(btns); const ok = opts[i] === it.a;
      btns[opts.indexOf(it.a)].classList.add('right'); if (!ok) btns[i].classList.add('wrong');
      $('.blank', sent).textContent = it.a; play(it.au);
      await feedback(ok, it.full, it.h); return ok;
    });
    return result(r.c, items.length, 'reading', r.missed);
  }

  /* ================= 6. UNSCRAMBLE ================= */
  async function unscramble(stage, p) {
    const items = sample(p.sentences.filter(s => s.en.split(' ').length <= 9), Math.min(4, p.sentences.length));
    const r = await qloop(stage, { lbl: 'Writing', title: 'Put the words in order', ins: 'Toca las palabras en el orden correcto para formar la oración.' }, items, (body, it) => new Promise(res => {
      const punct = (it.en.match(/[.?!]$/) || [''])[0];
      const toks = it.en.replace(/[.?!]$/, '').split(' ');
      body.appendChild(h(`<div class="mainph" style="max-width:260px">${photo(it.img)}</div>`));
      body.appendChild(h(`<p class="center" style="margin-top:-6px"><span class="hint">${esc(it.es)}</span></p>`));
      const line = h(`<div class="line"></div>`); const bank = h(`<div class="bank"></div>`); body.appendChild(line); body.appendChild(bank);
      let order = shuffle(toks.map((t, i) => ({ t, i }))); if (toks.length > 1 && order.every((o, k) => o.i === k)) order = order.reverse();
      const picked = [];
      order.forEach(o => {
        const chip = h(`<button class="chip">${esc(o.t)}</button>`); bank.appendChild(chip);
        chip.onclick = () => { sfx('tap'); chip.classList.add('used'); const c2 = h(`<button class="chip">${esc(o.t)}</button>`); line.appendChild(c2); picked.push(o);
          c2.onclick = () => { sfx('tap'); c2.remove(); chip.classList.remove('used'); picked.splice(picked.indexOf(o), 1); }; };
      });
      const hintP = h(`<p class="center hidden" style="margin:10px 0 0"><span class="hint"></span></p>`); body.appendChild(hintP);
      const bar = h(`<div class="actionbar"><button class="btn w" id="uh">💡 Pista</button><button class="btn k lg" id="uc">Comprobar ✓</button></div>`); body.appendChild(bar);
      $('#uh', bar).onclick = () => {
        let k = 0; while (k < picked.length && picked[k].t === toks[k]) k++;
        if (k < picked.length) { $('.hint', hintP).innerHTML = '💡 Hay una palabra en el lugar equivocado: tócala arriba para quitarla.'; hintP.classList.remove('hidden'); return; }
        const nxt = toks[k]; $('.hint', hintP).innerHTML = k === 0 ? `💡 La oración empieza con: <b>${esc(nxt)}</b>` : `💡 La siguiente palabra es: <b>${esc(nxt)}</b>`; hintP.classList.remove('hidden');
        const ch = [...bank.children].find(c => !c.classList.contains('used') && c.textContent === nxt); if (ch) { ch.classList.remove('blink'); void ch.offsetWidth; ch.classList.add('blink'); } play(it.au);
      };
      $('#uc', bar).onclick = async () => {
        if (picked.length < toks.length) { M.toast('Usa todas las palabras 😉'); return; }
        const ans = picked.map(o => o.t).join(' '); const ok = M.norm(ans, false) === M.norm(toks.join(' '), false);
        line.classList.add(ok ? 'right' : 'wrong'); bar.remove(); play(it.au);
        await feedback(ok, it.en, 'En inglés el orden básico es: <b>Sujeto + Verbo + Complemento</b>.'); res(ok);
      };
      void punct;
    }));
    return result(r.c, items.length, 'writing', r.missed);
  }

  /* ================= 7. MEMORY ================= */
  async function memory(stage, p) {
    let pairs;
    if (p.pairs) pairs = sample(p.pairs, 6).map(x => ({ a: { txt: x.a, au: x.aau }, b: { txt: x.b, au: x.bau }, key: x.a }));
    else pairs = sample(onePerKey(p.vocab).filter(x => x.es), 6).map(x => ({ a: { img: hasPhoto(x) ? x.img : null, txt: x.en, au: x.au }, b: { txt: x.es, es: true, au: x.au }, key: x.en }));
    const body = head(stage, { lbl: 'Practice', title: 'Memory game', ins: p.pairs ? 'Encuentra las parejas: <b>singular ↔ plural</b>.' : 'Encuentra las parejas: <b>inglés ↔ español</b>. ¡Usa tu memoria!' });
    const cards = shuffle(pairs.flatMap(pr => [{ ...pr.a, key: pr.key }, { ...pr.b, key: pr.key }]));
    const grid = h(`<div class="mem"></div>`); body.appendChild(grid);
    const info = h(`<p class="center muted" style="margin-top:12px">Intentos: <b id="tries">0</b> · Parejas: <b id="pr">0</b>/${pairs.length}</p>`); body.appendChild(info);
    let open = [], lock = false, tries = 0, found = 0;
    await new Promise(res => {
      cards.forEach((cd) => {
        const back = cd.img ? `<div class="mimg"><img src="${M.imgURL(cd.img, 600, 440)}" alt=""><span>${esc(cd.txt)}</span></div>` : (cd.es ? `<span class="mes">${esc(cd.txt)}</span>` : esc(cd.txt));
        const el = h(`<button class="mc"><div class="in"><div class="f">?</div><div class="b">${back}</div></div></button>`); grid.appendChild(el);
        el.onclick = async () => {
          if (lock || el.classList.contains('flip')) return;
          sfx('flip'); el.classList.add('flip'); open.push({ el, cd });
          if (open.length === 2) {
            lock = true; tries++; $('#tries', info).textContent = tries;
            const [x, y] = open;
            if (x.cd.key === y.cd.key) { x.el.classList.add('match'); y.el.classList.add('match'); found++; $('#pr', info).textContent = found; sfx('ok'); play(y.cd.au || x.cd.au); open = []; lock = false; if (found === pairs.length) { await sleep(700); res(); } }
            else { await sleep(900); x.el.classList.remove('flip'); y.el.classList.remove('flip'); open = []; lock = false; }
          }
        };
      });
    });
    const extra = Math.max(0, tries - pairs.length);
    const c = Math.max(Math.round(pairs.length * .5), pairs.length - Math.floor(extra / 2));
    M.confetti(1200); sfx('win');
    await sheet({ ok: true, title: `¡Completado en ${tries} intentos!`, msg: tries <= pairs.length + 2 ? '¡Memoria de elefante! 🐘' : 'Buen trabajo. Intenta hacerlo con menos intentos la próxima vez.' });
    return result(c, pairs.length, 'reading');
  }

  /* ================= 8. SORT / CLASSIFY ================= */
  async function sort(stage, p) {
    const so = p.sort; const items = shuffle(so.items);
    const body = head(stage, { lbl: 'Practice', title: 'Classify the words', ins: 'Toca una palabra y luego la categoría correcta.' });
    const bank = h(`<div class="bank"></div>`); body.appendChild(bank);
    const cats = h(`<div class="cats" style="--n:${Math.min(so.cats.length, 4)}"></div>`); body.appendChild(cats);
    let sel = null, c = 0, placed = 0; const missed = [];
    const catEls = so.cats.map(ct => { const e = h(`<div class="cat"><h4>${esc(ct)}</h4><div class="in"></div></div>`); cats.appendChild(e); return e; });
    await new Promise(res => {
      items.forEach(it => {
        const chip = h(`<button class="chip">${esc(it.w)}</button>`); bank.appendChild(chip); it._tries = 0;
        chip.onclick = () => { sfx('tap'); $$('.chip', bank).forEach(x => x.classList.remove('sel')); chip.classList.add('sel'); sel = { it, chip }; catEls.forEach(e => e.classList.add('hot')); if (it.au) play(it.au); };
      });
      catEls.forEach((e, k) => e.onclick = async () => {
        if (!sel) { M.toast('Primero toca una palabra 👆'); return; }
        const { it, chip } = sel;
        if (so.cats[k] === it.c) {
          sfx('ok'); chip.remove(); $('.in', e).appendChild(h(`<span class="chip okc">${esc(it.w)}</span>`)); placed++;
          if (it._tries === 0) c++; else missed.push({ en: it.w, au: it.au });
          sel = null; catEls.forEach(x => x.classList.remove('hot'));
          if (placed === items.length) { await sleep(400); res(); }
        } else { sfx('bad'); it._tries++; e.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 300 }); M.toast('Mmm… intenta otra categoría'); }
      });
    });
    await sheet({ ok: c >= items.length * .7, title: c === items.length ? '¡Perfecto! Todo clasificado' : `¡Listo! ${c} de ${items.length} al primer intento`, msg: c === items.length ? '' : 'Repasa las palabras que te costaron.' });
    return result(c, items.length, 'reading', missed);
  }

  /* ================= 9. CROSSWORD ================= */
  function buildCrossword(words) {
    words = words.slice().sort((a, b) => b.w.length - a.w.length);
    let best = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      const order = attempt === 0 ? words : [words[0], ...shuffle(words.slice(1))];
      const grid = new Map(); const placed = [];
      const key = (x, y) => x + ',' + y;
      const canPlace = (w, x, y, dir) => {
        let inter = 0;
        for (let i = 0; i < w.length; i++) {
          const cx = x + (dir ? 0 : i), cy = y + (dir ? i : 0); const g = grid.get(key(cx, cy));
          if (g) { if (g !== w[i]) return -1; inter++; }
          else {
            const n1 = dir ? key(cx - 1, cy) : key(cx, cy - 1), n2 = dir ? key(cx + 1, cy) : key(cx, cy + 1);
            if (grid.has(n1) || grid.has(n2)) return -1;
          }
        }
        const b = dir ? key(x, y - 1) : key(x - 1, y), a = dir ? key(x, y + w.length) : key(x + w.length, y);
        if (grid.has(b) || grid.has(a)) return -1;
        return inter;
      };
      const put = (o, x, y, dir) => { for (let i = 0; i < o.w.length; i++) grid.set(key(x + (dir ? 0 : i), y + (dir ? i : 0)), o.w[i]); placed.push({ ...o, x, y, dir }); };
      put(order[0], 0, 0, 0);
      for (const o of order.slice(1)) {
        let cand = [];
        for (const pl of placed) for (let i = 0; i < pl.w.length; i++) for (let j = 0; j < o.w.length; j++) {
          if (pl.w[i] !== o.w[j]) continue;
          const dir = pl.dir ? 0 : 1; const px = pl.x + (pl.dir ? 0 : i), py = pl.y + (pl.dir ? i : 0);
          const x = dir ? px : px - j, y = dir ? py - j : py;
          const sc = canPlace(o.w, x, y, dir); if (sc > 0) cand.push({ x, y, dir, sc });
        }
        if (cand.length) { cand.sort((a, b) => b.sc - a.sc || Math.random() - .5); const c = cand[0]; put(o, c.x, c.y, c.dir); }
      }
      const xs = [...grid.keys()].map(k => +k.split(',')[0]), ys = [...grid.keys()].map(k => +k.split(',')[1]);
      const W = Math.max(...xs) - Math.min(...xs) + 1, H = Math.max(...ys) - Math.min(...ys) + 1;
      const score = placed.length * 100 - (W * H) / 4 - Math.abs(W - H) * 2;
      if (W <= 13 && (!best || score > best.score)) best = { placed, minx: Math.min(...xs), miny: Math.min(...ys), W, H, score };
    }
    return best;
  }
  async function crossword(stage, p) {
    const src = onePerKey(p.vocab).filter(v => /^[A-Za-z]{3,10}$/.test(v.en)).map(v => ({ w: v.en.toUpperCase(), it: v }));
    const cw = buildCrossword(sample(src, Math.min(8, src.length)));
    const P = cw.placed.map(o => ({ ...o, x: o.x - cw.minx, y: o.y - cw.miny }));
    // numbering
    const starts = {}; let n = 0;
    P.slice().sort((a, b) => a.y - b.y || a.x - b.x).forEach(o => { const k = o.x + ',' + o.y; if (!starts[k]) starts[k] = ++n; o.num = starts[k]; });
    const body = head(stage, { lbl: 'Writing', title: 'Crossword', ins: 'Escucha 🔊 o mira la pista y escribe la palabra en el crucigrama. Toca una pista para seleccionar la palabra.' });
    const gridEl = h(`<div class="cw" style="grid-template-columns:repeat(${cw.W},auto)"></div>`); body.appendChild(gridEl);
    const cells = {};
    for (let y = 0; y < cw.H; y++) for (let x = 0; x < cw.W; x++) {
      const k = x + ',' + y; const used = P.some(o => o.dir ? (o.x === x && y >= o.y && y < o.y + o.w.length) : (o.y === y && x >= o.x && x < o.x + o.w.length));
      const cell = h(`<div class="cwc">${used ? `<input maxlength="1" autocomplete="off" autocapitalize="characters">${starts[k] ? `<span class="n">${starts[k]}</span>` : ''}` : ''}</div>`);
      gridEl.appendChild(cell); if (used) cells[k] = $('input', cell);
    }
    let active = P[0];
    const cellsOf = (o) => Array.from({ length: o.w.length }, (_, i) => cells[(o.x + (o.dir ? 0 : i)) + ',' + (o.y + (o.dir ? i : 0))]);
    const hl = (o) => { active = o; Object.values(cells).forEach(c => c.classList.remove('hl')); cellsOf(o).forEach(c => c.classList.add('hl')); $$('.clue', body).forEach(c => c.classList.toggle('on', c._o === o)); };
    Object.entries(cells).forEach(([k, inp]) => {
      inp.onfocus = () => { const mine = P.filter(o => cellsOf(o).includes(inp)); if (!mine.includes(active)) hl(mine[0]); };
      inp.oninput = () => { inp.value = inp.value.slice(-1).toUpperCase(); inp.classList.remove('wrong', 'right'); const cs = cellsOf(active); const i = cs.indexOf(inp); if (inp.value && i < cs.length - 1) cs[i + 1].focus(); };
      inp.onkeydown = (e) => { if (e.key === 'Backspace' && !inp.value) { const cs = cellsOf(active); const i = cs.indexOf(inp); if (i > 0) { cs[i - 1].focus(); cs[i - 1].value = ''; } } };
    });
    const clues = h(`<div class="clues"><div><h4>➡️ HORIZONTALES</h4><div id="ac"></div></div><div><h4>⬇️ VERTICALES</h4><div id="dn"></div></div></div>`); body.appendChild(clues);
    P.slice().sort((a, b) => a.num - b.num).forEach(o => {
      const c = h(`<div class="clue"><b>${o.num}.</b>${o.it.img && !o.it.img.startsWith('#') ? `<img src="${M.imgURL(o.it.img, 120, 90)}" alt="">` : ''}<span class="grow">${esc(o.it.es)} <small class="muted">(${o.w.length})</small></span></div>`);
      const b = playBtn(o.it.au, false); b.classList.add('sm'); c.appendChild(b); c._o = o;
      c.onclick = () => { hl(o); const cs = cellsOf(o); (cs.find(x => !x.value) || cs[0]).focus(); };
      $(o.dir ? '#dn' : '#ac', clues).appendChild(c);
    });
    hl(P[0]);
    const bar = h(`<div class="actionbar"><button class="btn k lg">Comprobar ✓</button></div>`); body.appendChild(bar);
    let checks = 0;
    return await new Promise(res => {
      $('button', bar).onclick = async () => {
        checks++; let good_ = 0; const missed = [];
        P.forEach(o => { const cs = cellsOf(o); const val = cs.map(c => c.value || ' ').join(''); const ok = val === o.w; if (ok) { good_++; cs.forEach(c => c.classList.add('right')); } else { cs.forEach(c => { if (!c.classList.contains('right')) c.classList.add('wrong'); }); missed.push(o.it); } $$('.clue', body).find(c => c._o === o).classList.toggle('done', ok); });
        if (good_ === P.length) { sfx('win'); M.confetti(1500); await sheet({ ok: true, title: '¡Crucigrama completo! 🧩', msg: checks === 1 ? '¡A la primera! Impresionante.' : '' }); res(result(checks === 1 ? P.length : Math.max(good_ - checks + 1, Math.ceil(P.length / 2)), P.length, 'writing', [])); return; }
        sfx('bad');
        if (checks >= 3) {
          bar.innerHTML = ''; const rv = h(`<button class="btn w">👀 Ver respuestas</button>`); const nx = h(`<button class="btn k lg">Continuar →</button>`); bar.append(rv, nx);
          rv.onclick = () => P.forEach(o => cellsOf(o).forEach((c, i) => { c.value = o.w[i]; }));
          nx.onclick = () => res(result(good_, P.length, 'writing', missed));
          M.toast(`${good_} de ${P.length} correctas`);
        } else M.toast(`${good_} de ${P.length} correctas — corrige las rojas (intento ${checks}/3)`);
      };
    });
  }

  /* ================= 10. SPEED CHALLENGE ================= */
  async function speed(stage, p) {
    const pool = onePerKey(p.vocab);
    const body = head(stage, { lbl: 'Challenge', title: '⚡ Speed challenge', ins: '¿La palabra en inglés significa lo mismo que la palabra en español? Responde lo más rápido que puedas. ¡Tienes 40 segundos!' });
    const start = h(`<div class="center" style="padding:30px 0">${M.mascot('mascot bounce', 'wow')}<br><button class="btn k lg">¡Empezar! ⏱️</button></div>`); body.appendChild(start);
    await new Promise(r => $('button', start).onclick = r); start.remove();
    const tm = h(`<div class="timer"><i style="width:100%"></i></div>`); body.appendChild(tm);
    const sc = h(`<p class="center" style="font-weight:800;margin:0 0 8px">✔ <span id="ok">0</span> &nbsp; ✘ <span id="ko">0</span></p>`); body.appendChild(sc);
    const area = h(`<div></div>`); body.appendChild(area);
    let ok = 0, ko = 0, alive = true; const T = 40; let left = T; const missed = [];
    const iv = setInterval(() => { left--; $('i', tm).style.width = (left / T * 100) + '%'; if (left <= 0) { alive = false; clearInterval(iv); } }, 1000);
    while (alive) {
      const it = pool[Math.floor(Math.random() * pool.length)]; const match = Math.random() < .5; const shown = match ? it : sample(pool.filter(x => x.en !== it.en), 1)[0];
      area.innerHTML = `<div class="mainph" style="max-width:260px;margin-bottom:6px">${photo(it.img)}</div><div class="center" style="font-size:18px;font-weight:700">${esc(it.es)}</div><div class="spword">${esc(shown.en)}</div>`;
      const tf = h(`<div class="tfb"><button class="opt">✅</button><button class="opt">❌</button></div>`); area.appendChild(tf);
      const btns = $$('button', tf);
      const ans = await Promise.race([choose(btns), new Promise(r => { const w = setInterval(() => { if (!alive) { clearInterval(w); r(-1); } }, 200); })]);
      if (ans === -1) break;
      const right = (ans === 0) === match;
      if (right) { ok++; sfx('ok'); btns[ans].classList.add('right'); } else { ko++; sfx('bad'); btns[ans].classList.add('wrong'); missed.push(it); }
      $('#ok', sc).textContent = ok; $('#ko', sc).textContent = ko; await sleep(260);
    }
    clearInterval(iv); const tot = ok + ko;
    if (!body.isConnected) return result(0, 0, 'reading');
    if (ok >= 10) { sfx('win'); M.confetti(1500); }
    await sheet({ ok: ok >= ko, title: `⏱️ ¡Tiempo! ${ok} correctas`, msg: ok >= 15 ? '¡Eres un rayo! ⚡' : ok >= 8 ? '¡Muy rápido! Intenta superar tu récord.' : 'La velocidad viene con la práctica. ¡Repite y mejora!' });
    return tot > 20 ? result(Math.round(ok / tot * 20), 20, 'reading', missed.slice(0, 6)) : result(ok, Math.max(tot, 1), 'reading', missed.slice(0, 6));
  }

  /* ================= 11. SPELL WITH TILES ================= */
  async function spell(stage, p) {
    const items = sample(p.spell, Math.min(5, p.spell.length)).map(x => ({ ...x, en: x.w }));
    const L = M.D.letters;
    const r = await qloop(stage, { lbl: 'Writing', title: 'Listen and spell', ins: 'Escucha la palabra y deletréala tocando las letras. ¡Cada letra suena!' }, items, (body, it) => new Promise(res => {
      body.appendChild(h(`<div class="mainph" style="max-width:260px">${photo(it.img)}</div>`)); const esW = it.es || (M.allParts().flatMap(q => q.vocab || []).find(v => M.norm(v.en) === M.norm(it.w)) || {}).es; if (esW) body.appendChild(h(`<p class="center" style="margin:-4px 0 6px"><span class="hint">Significa: <b>${esc(esW)}</b></span></p>`)); const pb = playBtn(it.au, false); const row = h(`<div class="center" style="margin-bottom:6px"></div>`); row.appendChild(pb); body.appendChild(row);
      const w = it.w.toUpperCase(); const slots = h(`<div class="slots">${w.split('').map(() => '<div class="slot"></div>').join('')}</div>`); body.appendChild(slots);
      const extras = sample('ABCDEFGHIJKLMNOPRSTUVWY'.split('').filter(c => !w.includes(c)), 2);
      const tiles = h(`<div class="tiles"></div>`); body.appendChild(tiles);
      const seq = []; const sl = $$('.slot', slots);
      shuffle([...w.split(''), ...extras]).forEach(ch => { const t = h(`<button class="tile">${ch}</button>`); tiles.appendChild(t);
        t.onclick = () => { if (seq.length >= w.length) return; play(L[ch]); t.classList.add('used'); seq.push({ ch, t }); sl[seq.length - 1].textContent = ch; sl[seq.length - 1].classList.add('f'); if (seq.length === w.length) check(); }; });
      const hintTxt = h(`<p class="center muted hidden" style="margin:6px 0 0;font-size:15px"></p>`); body.appendChild(hintTxt);
      const bar = h(`<div class="actionbar"><button class="btn w" id="hb">💡 Pista</button><button class="btn w" id="del">⌫ Borrar</button></div>`); body.appendChild(bar);
      $('#del', bar).onclick = () => { const l = seq.pop(); if (!l) return; l.t.classList.remove('used'); sl[seq.length].textContent = ''; sl[seq.length].classList.remove('f'); };
      // pista: marca la siguiente letra correcta (no la escribe) y repite el audio
      $('#hb', bar).onclick = () => {
        let k = 0; while (k < seq.length && seq[k].ch === w[k]) k++;
        if (k < seq.length) { hintTxt.textContent = '💡 Hay una letra equivocada: toca ⌫ Borrar y revisa.'; hintTxt.classList.remove('hidden'); return; }
        const need = w[seq.length]; const tile = [...tiles.children].find(t => !t.classList.contains('used') && t.textContent === need);
        hintTxt.innerHTML = `💡 La letra ${seq.length + 1} es la que parpadea. La palabra empieza por <b>${w[0]}</b> y tiene <b>${w.length}</b> letras.`; hintTxt.classList.remove('hidden');
        if (tile) { tile.classList.remove('blink'); void tile.offsetWidth; tile.classList.add('blink'); }
        play(it.au);
      };
      setTimeout(() => play(it.au), 300);
      async function check() { const ok = seq.map(s => s.ch).join('') === w; await sleep(300); bar.remove(); await play(it.au); await feedback(ok, w, 'Escucha cada letra al tocarla: así aprendes el abecedario.'); res(ok); }
    }));
    return result(r.c, items.length, 'writing', r.missed);
  }

  /* ================= 12. PLURALS ================= */
  async function plural(stage, p) {
    const items = sample(p.vocab, Math.min(6, p.vocab.length));
    const r = await qloop(stage, { lbl: 'Writing', title: 'Write the plural', ins: 'Mira la imagen y escribe el plural.' }, items, (body, it) => new Promise(res => {
      body.appendChild(h(`<div class="mainph" style="max-width:300px">${photo(it.img)}</div>`));
      body.appendChild(h(`<div class="sent">one <b>${esc(it.sg)}</b> → two <span class="blank">&nbsp;?&nbsp;</span></div>`));
      const inp = h(`<input class="inp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="plural…">`); body.appendChild(inp);
      const bar = h(`<div class="actionbar"><button class="btn k lg">Comprobar ✓</button></div>`); body.appendChild(bar); setTimeout(() => inp.focus({ preventScroll: true }), 200);
      const go = async () => { if (!inp.value.trim()) return; const ok = M.norm(inp.value) === M.norm(it.en); inp.classList.add(ok ? 'right' : 'wrong'); inp.disabled = true; bar.remove(); await play(it.sgau); await sleep(150); play(it.au);
        let tip = 'Revisa la regla del plural en la mini lección.'; if (/(s|x|ch|sh)$/.test(it.sg)) tip = 'Termina en s, x, ch o sh → agrega <b>-es</b>.'; else if (/[^aeiou]y$/.test(it.sg)) tip = 'Consonante + y → cambia la y por <b>-ies</b>.';
        await feedback(ok, `${it.sg} → ${it.en}`, tip); res(ok); };
      $('button', bar).onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
    }));
    return result(r.c, items.length, 'writing', r.missed);
  }

  /* ================= 13. DIALOGUE (listen + questions) ================= */
  async function dialogue(stage, p) {
    const d = p.dialogue; const who = [...new Set(d.lines.map(l => l.who))];
    const body = head(stage, { lbl: 'Listening', title: `🎧 ${d.title}`, ins: `${esc(d.es)}. Primero <b>escucha</b> la conversación (el texto está oculto). Luego responde las preguntas.` });
    body.appendChild(h(`<div class="mainph" style="max-width:340px">${photo(d.img)}</div>`));
    const chat = h(`<div class="chat"></div>`); body.appendChild(chat);
    const ctr = h(`<div class="row" style="justify-content:center"><button class="btn k" id="pl">▶ Escuchar conversación</button><button class="btn w sm" id="rv">👀 Mostrar texto</button></div>`); body.appendChild(ctr);
    const msgs = d.lines.map(l => { const side = who.indexOf(l.who) % 2 ? 'r' : ''; const m = h(`<div class="msg ${side} blur"><div class="av">${esc(l.who[0])}</div><div class="tx"><span class="who">${esc(l.who)}</span><span>${esc(l.t)}</span></div></div>`); m.onclick = () => play(l.au); return m; });
    let shown = 0, plays = 0;
    let halted = false; window.addEventListener('m1-audio-stop', () => { halted = true; });
    const runAll = async () => { plays++; halted = false; for (let i = 0; i < msgs.length; i++) { if (!body.isConnected) return; if (halted) break; if (!msgs[i].isConnected) chat.appendChild(msgs[i]); msgs.forEach(x => x.classList.remove('speaking')); msgs[i].classList.add('speaking'); msgs[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' }); await play(d.lines[i].au); await sleep(250); } msgs.forEach(x => x.classList.remove('speaking')); shown = msgs.length; next.disabled = false; };
    const plb = $('#pl', ctr); let running = false; plb.onclick = async () => { if (running) { stop(); return; } running = true; plb.textContent = '⏹ Detener'; const hideF = M.floatStop(plb); await runAll(); hideF(); running = false; msgs.forEach(x => x.classList.remove('speaking')); plb.textContent = '🔁 Escuchar otra vez'; };
    $('#rv', ctr).onclick = () => { msgs.forEach(m => { if (!m.isConnected) chat.appendChild(m); m.classList.remove('blur'); }); };
    const bar = h(`<div class="actionbar"><button class="btn k lg" disabled>Responder preguntas →</button></div>`); body.appendChild(bar); const next = $('button', bar);
    await new Promise(r => next.onclick = r); stop(); void shown; void plays;
    const r = await qloop(stage, { lbl: 'Listening', title: `🎧 ${d.title}`, ins: 'Responde según la conversación. Puedes volver a escucharla.' }, d.q.map(q => ({ ...q, en: q.q })), async (b2, q) => {
      const re = h(`<div class="center" style="margin-bottom:10px"><button class="btn w sm">🔁 Escuchar conversación</button></div>`); b2.appendChild(re); $('button', re).onclick = () => M.playSeq(d.lines.map(l => l.au));
      b2.appendChild(h(`<div class="sent">${esc(q.q)}</div>`));
      const opts = shuffle([q.a, ...q.o]); const wrap = h(`<div class="opts" style="grid-template-columns:1fr"></div>`); b2.appendChild(wrap);
      const btns = opts.map(o => { const b = h(`<button class="opt">${esc(o)}</button>`); wrap.appendChild(b); return b; });
      const i = await choose(btns); stop(); const ok = opts[i] === q.a; btns[opts.indexOf(q.a)].classList.add('right'); if (!ok) btns[i].classList.add('wrong');
      await feedback(ok, q.a, 'Escucha la conversación otra vez prestando atención a los nombres y números.'); return ok;
    });
    return result(r.c, d.q.length, 'listening', []);
  }

  /* ================= 14. SPEAK (voice recognition + recording) ================= */
  function speakCard(body, it, { allowSkip = true } = {}) {
    return new Promise(res => {
      if (it.img) body.appendChild(h(`<div class="mainph" style="max-width:300px">${photo(it.img)}</div>`));
      const tgt = h(`<div class="target">${M.words(it.en).length ? esc(it.en) : ''}</div>`); body.appendChild(tgt);
      if (it.es) body.appendChild(h(`<p class="center muted" style="margin:-4px 0 10px">${esc(it.es)}</p>`));
      const ctr = h(`<div class="row" style="justify-content:center;margin-bottom:6px"></div>`); ctr.appendChild(playBtn(it.au, false)); body.appendChild(ctr);
      const mic = h(`<button class="mic" aria-label="Hablar">🎤</button>`); body.appendChild(mic);
      const st = h(`<p class="center" style="font-weight:700;margin:4px 0">${M.canSR ? 'Toca el micrófono y di la frase' : 'Tu navegador no reconoce voz: graba tu voz y compárala 👇'}</p>`); body.appendChild(st);
      const out = h(`<div></div>`); body.appendChild(out);
      const recRow = h(`<div class="row" style="justify-content:center;margin-top:10px"><button class="btn w sm" id="rec">🎙️ Grabar mi voz y comprobar</button></div>`); body.appendChild(recRow);
      const bar = h(`<div class="actionbar">${allowSkip ? '<button class="btn w" id="skip">Saltar</button>' : ''}<button class="btn k lg hidden" id="nx">Continuar →</button></div>`); body.appendChild(bar);
      let tries = 0, best = 0;
      const finish = (ok) => { stop(); res({ ok, score: best }); };
      if (allowSkip) $('#skip', bar).onclick = () => finish(null);
      $('#nx', bar).onclick = () => finish(best >= 60);
      // grabar: ahora SIEMPRE evalúa y dice si estuvo bien o mal, con opción de intentar otra vez
      const doRec = async () => {
        const b = $('#rec', recRow); try { b.disabled = true; stop(); const secs = Math.min(9, 3 + it.en.split(' ').length * .7);
          const r = await M.recordScore(it.en, secs * 1000, (f) => b.textContent = `🔴 Te escucho… ${Math.max(0, Math.ceil(secs * (1 - f)))}s`);
          b.textContent = '🎙️ Grabar otra vez'; b.disabled = false; tries++;
          if (r.score != null) best = Math.max(best, r.score);
          $$('.cmpbox,.srbox', out).forEach(x => x.remove()); const vb = h('<div class="cmpbox"></div>'); out.appendChild(vb);
          M.voiceResult(vb, { score: r.score, heard: r.heard, url: r.url, model: () => play(it.au), onRetry: doRec, pass: 70 });
          vb.addEventListener('selfok', () => { best = Math.max(best, 75); $('#nx', bar).classList.remove('hidden'); }, { once: true });
          if (r.score != null && (r.score >= 60 || tries >= 2)) $('#nx', bar).classList.remove('hidden');
          if (r.score == null) $('#nx', bar).classList.remove('hidden');
        } catch (err) { b.disabled = false; b.textContent = '🎙️ Grabar mi voz y comprobar'; M.toast('Permite el acceso al micrófono 🎤'); }
      };
      $('#rec', recRow).onclick = doRec;
      mic.onclick = async () => {
        if (!M.canSR) { $('#rec', recRow).click(); return; }
        stop(); mic.classList.add('rec'); st.textContent = '🎧 Te escucho… habla ahora';
        const r = await M.listen(Math.max(5000, it.en.split(' ').length * 1200)); mic.classList.remove('rec');
        if (r.error === 'not-allowed' || r.error === 'service-not-allowed') { st.textContent = 'Permite el micrófono en tu navegador 🎤'; return; }
        if (!r.alts.length) { st.textContent = 'No te escuché bien 🙉 Toca el micrófono e intenta otra vez.'; return; }
        tries++; const sc = M.speechScore(it.en, r.alts); best = Math.max(best, sc.score);
        const tw = it.en.replace(/[.?!,]/g, '').split(' ');
        tgt.innerHTML = tw.map((w, i) => `<span class="w ${sc.hit[i] ? 'ok' : 'no'}">${esc(w)}</span>`).join(' ');
        const missedW = tw.filter((w, i) => !sc.hit[i]);
        let msg, ok = sc.score >= 85, mid = sc.score >= 60;
        if (ok) { msg = '🌟 ¡Excelente pronunciación! Suenas muy natural.'; sfx('ok'); praise(); }
        else if (mid) { setTimeout(M.encourage, 250); msg = `👍 ¡Muy bien! Practica: <b>${esc(missedW.join(', '))}</b>. Escucha el modelo y repite despacio.`; sfx('ok'); }
        else { setTimeout(M.encourage, 250); msg = `💪 Escucha el modelo 🔊, repite palabra por palabra y vuelve a intentar.${missedW.length ? ` Revisa: <b>${esc(missedW.slice(0, 4).join(', '))}</b>` : ''}`; sfx('bad'); }
        out.querySelectorAll('.srbox').forEach(x => x.remove());
        out.prepend(h(`<div class="heardbox srbox"><div class="muted" style="font-size:13px">Escuché: “${esc(sc.heard)}”</div><div class="meter"><div class="bar"><i style="width:${sc.score}%;background:${ok ? 'var(--ok)' : mid ? 'var(--k)' : 'var(--bad)'}"></i></div><b>${sc.score}%</b></div><p style="margin:8px 0 0"><b>${ok ? '✅ ¡Bien hecho!' : mid ? '🟡 ¡Casi!' : '❌ Todavía no.'}</b> ${msg}</p><div class="row" style="margin-top:8px"><button class="btn sm ${ok ? 'w' : 'k'} again">🔁 Intentar otra vez</button></div></div>`));
        const ag = out.querySelector('.srbox .again'); if (ag) ag.onclick = () => mic.click();
        st.textContent = tries >= 3 || ok ? '' : 'Puedes intentarlo de nuevo 🎤';
        if (ok || mid || tries >= 2) $('#nx', bar).classList.remove('hidden');
      };
    });
  }
  async function speak(stage, p, opts = {}) {
    const src = opts.items || (p.sentences && !opts.words ? p.sentences : p.vocab);
    const items = sample(onePerKey(src), Math.min(opts.n || 4, src.length));
    let c = 0, t = 0; const missed = [];
    for (let i = 0; i < items.length; i++) {
      const body = head(stage, { lbl: 'Oral task', title: 'Listen, then repeat', ins: 'Escucha el modelo 🔊 y repite en voz alta 🎤. La plataforma evalúa tu pronunciación.', count: `${i + 1} / ${items.length}` });
      const r = await speakCard(body, items[i]);
      if (r.ok === null) continue; t++; if (r.ok) c++; else { missed.push(items[i]); M.addWeak(items[i].en, items[i].au); }
    }
    return result(c, Math.max(t, 0), 'speaking', missed);
  }
  const speakWords = (stage, p) => speak(stage, p, { words: true, n: 5 });

  window.M1A = { head, playBtn, slowBtn, waitNext, qloop, choose, feedback, typeQ, speakCard, learn, listenChoose, pickWord, typeWord, typeLetter, typeNumber, phone, spellName, typeSentence, fill, unscramble, memory, sort, crossword, speed, spell, plural, dialogue, speak, speakWords, result };
})();
