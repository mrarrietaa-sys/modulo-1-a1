/* =====================================================================
   JUEGOS NUEVOS — para que cada clase sea una experiencia diferente
   wordSearch · hangman · bubblePop · matchLines · quizShow · oddOneOut
   ===================================================================== */
(function () {
  const M = window.M1, A = window.M1A;
  const { $, $$, h, esc, shuffle, sample, sleep, photo, play, stop, sfx, sheet } = M;
  const { head, playBtn, feedback, result, waitNext } = A;
  const uniq = (arr, k = 'en') => arr.filter((x, i, a) => a.findIndex(y => y[k] === x[k]) === i);
  const hasPh = (it) => it.img && !String(it.img).startsWith('#');
  const single = (p) => uniq(p.vocab || []).filter(v => /^[A-Za-z]{3,10}$/.test(v.en));

  /* ============ SOPA DE LETRAS ============ */
  async function wordSearch(stage, p) {
    const words = sample(single(p), 6); const W = words.map(w => w.en.toUpperCase());
    const n = Math.min(10, Math.max(8, Math.max(...W.map(w => w.length)) + 1));
    const grid = Array.from({ length: n }, () => Array(n).fill(''));
    const place = (w) => { for (let t = 0; t < 300; t++) { const dir = Math.random() < .55 ? [0, 1] : [1, 0]; const r = Math.floor(Math.random() * (n - dir[0] * (w.length - 1))), c = Math.floor(Math.random() * (n - dir[1] * (w.length - 1)));
      let ok = true; for (let i = 0; i < w.length; i++) { const ch = grid[r + dir[0] * i][c + dir[1] * i]; if (ch && ch !== w[i]) { ok = false; break; } }
      if (ok) { for (let i = 0; i < w.length; i++) grid[r + dir[0] * i][c + dir[1] * i] = w[i]; return { r, c, dir }; } } return null; };
    const pos = W.map(place); const AB = 'ABCDEFGHIJKLMNOPRSTUVWY';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!grid[r][c]) grid[r][c] = AB[Math.floor(Math.random() * AB.length)];
    const body = head(stage, { lbl: 'Game', title: '🔎 Sopa de letras', ins: 'Busca las palabras en inglés. Toca la <b>primera letra</b> y luego la <b>última letra</b> de cada palabra (→ o ↓).' });
    const list = h(`<div class="ws-list"></div>`); body.appendChild(list);
    words.forEach((w, i) => { const e = h(`<button class="ws-w" data-i="${i}"><b>${esc(w.es || '')}</b><small>${'_ '.repeat(W[i].length).trim()}</small></button>`); e.onclick = () => play(w.au); list.appendChild(e); });
    const g = h(`<div class="ws-grid" style="grid-template-columns:repeat(${n},minmax(0,1fr))"></div>`); body.appendChild(g);
    const cells = []; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const e = h(`<button class="ws-c">${grid[r][c]}</button>`); e.dataset.r = r; e.dataset.c = c; g.appendChild(e); cells.push(e); }
    const at = (r, c) => cells[r * n + c];
    const info = h(`<p class="center muted" style="margin-top:10px">Encontradas: <b id="wf">0</b> / ${words.length} · 💡 Toca una pista para escucharla</p>`); body.appendChild(info);
    let start = null, found = new Set();
    const done = await new Promise(res => {
      cells.forEach(e => e.onclick = () => {
        const r = +e.dataset.r, c = +e.dataset.c; sfx('tap');
        if (!start) { start = { r, c, e }; e.classList.add('sel'); return; }
        const s = start; start = null; s.e.classList.remove('sel');
        if (s.r !== r && s.c !== c) { M.toast('Solo en línea recta: → o ↓'); return; }
        const dr = Math.sign(r - s.r), dc = Math.sign(c - s.c); const len = Math.max(Math.abs(r - s.r), Math.abs(c - s.c)) + 1;
        let str = ''; const path = []; for (let i = 0; i < len; i++) { const x = at(s.r + dr * i, s.c + dc * i); str += x.textContent; path.push(x); }
        const k = W.findIndex((w, i) => !found.has(i) && (w === str || w === [...str].reverse().join('')));
        if (k >= 0) { found.add(k); path.forEach(x => x.classList.add('ok')); const it = list.children[k]; it.classList.add('ok'); $('small', it).textContent = W[k]; play(words[k].au); sfx('ok'); $('#wf', info).textContent = found.size;
          if (found.size === words.length) setTimeout(() => res(true), 700); }
        else { sfx('bad'); path.forEach(x => { x.classList.add('no'); setTimeout(() => x.classList.remove('no'), 500); }); }
      });
      const bar = h(`<div class="actionbar"><button class="btn w">Me rindo, ver respuestas</button></div>`); body.appendChild(bar);
      $('button', bar).onclick = () => res(false);
    });
    if (!done) { W.forEach((w, i) => { if (found.has(i) || !pos[i]) return; for (let j = 0; j < w.length; j++) at(pos[i].r + pos[i].dir[0] * j, pos[i].c + pos[i].dir[1] * j).classList.add('show'); $('small', list.children[i]).textContent = w; }); await sleep(400); }
    else { M.confetti(1200); sfx('win'); }
    await sheet({ ok: found.size >= words.length / 2, title: done ? '¡Encontraste todas! 🎉' : `Encontraste ${found.size} de ${words.length}`, msg: done ? '¡Ojo de águila! 🦅' : 'Mira dónde estaban las que faltaron (en amarillo).' });
    return result(found.size, words.length, 'reading', words.filter((w, i) => !found.has(i)));
  }

  /* ============ AHORCADO (adivina la palabra) ============ */
  async function hangman(stage, p) {
    const items = sample(single(p), Math.min(4, single(p).length)); let c = 0; const missed = [];
    for (let k = 0; k < items.length; k++) {
      if (!stage.isConnected) break;
      const it = items[k], W = it.en.toUpperCase();
      const body = head(stage, { lbl: 'Game', title: '🎯 Adivina la palabra', ins: 'Mira la pista y toca las letras. Tienes <b>6 vidas</b> ❤️.', count: `${k + 1} / ${items.length}` });
      if (hasPh(it)) body.appendChild(h(`<div class="mainph" style="max-width:240px">${photo(it.img)}</div>`));
      body.appendChild(h(`<p class="center"><span class="hint">Significa: <b>${esc(it.es || '')}</b> · ${W.length} letras</span></p>`));
      const lives = h(`<div class="hm-lives">${'❤️'.repeat(6)}</div>`); body.appendChild(lives);
      const slots = h(`<div class="slots">${W.split('').map(() => '<div class="slot"></div>').join('')}</div>`); body.appendChild(slots);
      const kb = h(`<div class="hm-kb"></div>`); body.appendChild(kb);
      const ok = await new Promise(res => {
        let left = 6; const got = new Set();
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(ch => { const b = h(`<button class="hm-k">${ch}</button>`); kb.appendChild(b);
          b.onclick = () => { b.disabled = true;
            if (W.includes(ch)) { b.classList.add('ok'); sfx('ok'); got.add(ch); W.split('').forEach((x, i) => { if (x === ch) { slots.children[i].textContent = ch; slots.children[i].classList.add('f'); } });
              if (W.split('').every(x => got.has(x))) res(true); }
            else { b.classList.add('no'); sfx('bad'); left--; lives.textContent = '❤️'.repeat(left) + '🤍'.repeat(6 - left); if (left <= 0) res(false); } }; });
      });
      W.split('').forEach((x, i) => { slots.children[i].textContent = x; slots.children[i].classList.add('f'); });
      $$('.hm-k', kb).forEach(b => b.disabled = true); await play(it.au);
      if (ok) c++; else missed.push(it);
      await feedback(ok, `${it.en} = ${it.es || ''}`, 'Piensa primero en las vocales: A, E, I, O, U.');
    }
    return result(c, items.length, 'writing', missed);
  }

  /* ============ REVIENTA BURBUJAS ============ */
  async function bubblePop(stage, p) {
    const pool = uniq(p.vocab || []); const rounds = sample(pool, Math.min(6, pool.length)); let c = 0; const missed = [];
    const body = head(stage, { lbl: 'Game', title: '🫧 Revienta la burbuja', ins: 'Escucha 🔊 y revienta la burbuja con la palabra correcta. ¡Rápido!' });
    const top = h(`<div class="center" style="margin-bottom:6px"></div>`); body.appendChild(top);
    const cnt = h(`<p class="center muted" style="margin:0 0 6px">Ronda <b id="br">1</b> / ${rounds.length} · 🫧 <b id="bc">0</b></p>`); body.appendChild(cnt);
    const sky = h(`<div class="bsky"></div>`); body.appendChild(sky);
    for (let k = 0; k < rounds.length; k++) {
      if (!stage.isConnected) break;
      const it = rounds[k]; $('#br', cnt).textContent = k + 1;
      top.innerHTML = ''; top.appendChild(playBtn(it.au));
      const opts = shuffle([it, ...sample(pool.filter(x => x.en !== it.en), Math.min(3, pool.length - 1))]);
      sky.innerHTML = '';
      const btns = opts.map((o, i) => { const b = h(`<button class="bub" style="--d:${(i * .35).toFixed(2)}s;--x:${(i % 2 ? 6 : -6)}px">${esc(o.en)}</button>`); sky.appendChild(b); return b; });
      setTimeout(() => play(it.au), 300);
      const i = await A.choose(btns); const ok = opts[i] === it;
      if (ok) { btns[i].classList.add('pop'); sfx('ok'); c++; $('#bc', cnt).textContent = c; } else { btns[i].classList.add('shake'); btns[opts.indexOf(it)].classList.add('right'); sfx('bad'); missed.push(it); }
      await sleep(ok ? 650 : 1300);
    }
    if (c >= rounds.length - 1) { M.confetti(1200); sfx('win'); }
    await sheet({ ok: c >= rounds.length / 2, title: `🫧 ${c} de ${rounds.length} burbujas`, msg: c === rounds.length ? '¡Oído perfecto! 👂' : 'Escucha otra vez las palabras que fallaste en la Explanation.' });
    return result(c, rounds.length, 'listening', missed);
  }

  /* ============ UNE LAS PAREJAS (inglés ↔ español) ============ */
  async function matchLines(stage, p) {
    const pairs = sample(uniq(p.vocab || []).filter(v => v.es), 5);
    const body = head(stage, { lbl: 'Practice', title: '🔗 Une las parejas', ins: 'Toca una palabra en <b>inglés</b> y luego su significado en <b>español</b>.' });
    const wrap = h(`<div class="ml"><div class="ml-col l"></div><div class="ml-col r"></div></div>`); body.appendChild(wrap);
    const L = shuffle(pairs.slice()), R = shuffle(pairs.slice()); let sel = null, done = 0, errors = 0;
    await new Promise(res => {
      L.forEach(it => { const b = h(`<button class="ml-b en">${esc(it.en)}</button>`); b._it = it; $('.l', wrap).appendChild(b);
        b.onclick = () => { if (b.classList.contains('ok')) return; $$('.ml-b.en', wrap).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = b; play(it.au); }; });
      R.forEach(it => { const b = h(`<button class="ml-b es">${esc(it.es)}</button>`); b._it = it; $('.r', wrap).appendChild(b);
        b.onclick = () => { if (!sel || b.classList.contains('ok')) { if (!sel) M.toast('Primero toca una palabra en inglés 👈'); return; }
          if (sel._it === it) { sel.classList.remove('sel'); sel.classList.add('ok'); b.classList.add('ok'); sfx('ok'); sel = null; done++; if (done === pairs.length) setTimeout(res, 500); }
          else { errors++; sfx('bad'); b.classList.add('no'); setTimeout(() => b.classList.remove('no'), 500); } }; });
    });
    const c = Math.max(0, pairs.length - Math.ceil(errors / 2));
    if (!errors) { M.confetti(1000); sfx('win'); }
    await sheet({ ok: true, title: errors ? `¡Listo! (${errors} ${errors === 1 ? 'error' : 'errores'})` : '¡Perfecto, sin errores! 🎉', msg: errors ? 'Repasa las palabras que confundiste.' : '' });
    return result(c, pairs.length, 'reading');
  }

  /* ============ CONCURSO (quiz show con escalera de premios) ============ */
  async function quizShow(stage, p) {
    const pool = uniq(p.vocab || []); const audioOnly = p.letters || p.numbers || pool.some(v => !v.es);
    const qs = sample(pool, Math.min(5, pool.length)); const prizes = [100, 200, 500, 1000, 2000]; let c = 0, fifty = true; const missed = [];
    for (let k = 0; k < qs.length; k++) {
      if (!stage.isConnected) break;
      const it = qs[k]; const type = audioOnly ? 'au' : ['es', 'au', 'en'][k % 3];
      const body = head(stage, { lbl: 'Quiz show', title: '🏆 ¿Quién quiere ser campeón?', ins: 'Responde bien y sube en la escalera de premios. Tienes un comodín <b>50:50</b>.', count: `${k + 1} / ${qs.length}` });
      body.appendChild(h(`<div class="qs-ladder">${prizes.slice(0, qs.length).map((pz, i) => `<span class="${i < k ? 'done' : i === k ? 'now' : ''}">${pz}</span>`).join('')}</div>`));
      const q = h(`<div class="qs-q"></div>`); body.appendChild(q);
      if (type === 'es') q.innerHTML = `¿Cómo se dice <b>“${esc(it.es)}”</b> en inglés?`;
      else if (type === 'en') q.innerHTML = `¿Qué significa <b>“${esc(it.en)}”</b>?`;
      else { q.innerHTML = '¿Qué escuchas? 🎧'; q.appendChild(playBtn(it.au, false)); setTimeout(() => play(it.au), 300); }
      const others = sample(pool.filter(x => x.en !== it.en && (type !== 'en' || x.es !== it.es)), Math.min(3, pool.length - 1));
      const opts = shuffle([it, ...others]); const lab = (o) => type === 'en' ? o.es : o.en;
      const grid = h(`<div class="opts qs-opts"></div>`); body.appendChild(grid);
      const btns = opts.map((o, i) => { const b = h(`<button class="opt"><span class="qs-l">${'ABCD'[i]}</span> ${esc(lab(o))}</button>`); grid.appendChild(b); return b; });
      const bar = h(`<div class="actionbar"><button class="btn w" ${fifty && opts.length > 2 ? '' : 'disabled'}>⚡ 50:50</button></div>`); body.appendChild(bar);
      $('button', bar).onclick = (e) => { fifty = false; e.currentTarget.disabled = true; sfx('tap'); opts.map((o, i) => i).filter(i => opts[i] !== it).slice(0, 2).forEach(i => { btns[i].disabled = true; btns[i].classList.add('dim'); }); };
      const i = await A.choose(btns); const ok = opts[i] === it; bar.remove();
      btns[opts.indexOf(it)].classList.add('right'); if (!ok) btns[i].classList.add('wrong');
      play(it.au); if (ok) c++; else missed.push(it);
      await feedback(ok, `${it.en} = ${it.es || it.en}`, 'Escucha la palabra otra vez y repítela.');
    }
    const prize = c ? prizes[c - 1] : 0; if (c === qs.length) { M.confetti(1800); sfx('win'); }
    await sheet({ ok: c >= qs.length / 2, title: `🏆 ¡Ganaste ${prize} puntos!`, msg: c === qs.length ? '¡Eres el campeón del concurso! 👑' : `Respondiste bien ${c} de ${qs.length}.` });
    return result(c, qs.length, 'reading', missed);
  }

  /* ============ ¿CUÁL NO PERTENECE? ============ */
  async function oddOneOut(stage, p) {
    const pool = uniq(p.vocab || []);
    const others = uniq(M.allParts().filter(x => x.topic !== p.topic && !x.letters && !x.numbers).flatMap(x => x.vocab || []).filter(v => v.es && !pool.some(y => y.en === v.en)));
    const R = Math.min(4, Math.floor(pool.length / 3) + 1); let c = 0; const missed = [];
    for (let k = 0; k < R; k++) {
      if (!stage.isConnected) break;
      const three = sample(pool, 3), odd = sample(others, 1)[0]; const opts = shuffle([...three, odd]);
      const body = head(stage, { lbl: 'Challenge', title: '🕵️ ¿Cuál no pertenece?', ins: `Tres palabras son del tema <b>${esc(p._t.title)}</b>. Encuentra la que <b>no</b> pertenece.`, count: `${k + 1} / ${R}` });
      const grid = h(`<div class="opts"></div>`); body.appendChild(grid);
      const allPh = opts.every(hasPh);
      const btns = opts.map(o => { const b = h(`<button class="opt odd">${allPh ? `<span class="odd-ph">${photo(o.img)}</span>` : ''}<span>${esc(o.en)}</span></button>`); grid.appendChild(b); return b; });
      const i = await A.choose(btns); const ok = opts[i] === odd;
      btns[opts.indexOf(odd)].classList.add('right'); if (!ok) btns[i].classList.add('wrong');
      play(odd.au); if (ok) c++; else missed.push(odd);
      await feedback(ok, `${odd.en} (${odd.es}) no es del tema ${p._t.title}`, `Las otras tres son del tema: ${three.map(x => x.en).join(', ')}.`);
    }
    return result(c, R, 'reading', missed);
  }

  Object.assign(window.M1A, { wordSearch, hangman, bubblePop, matchLines, quizShow, oddOneOut });
})();
