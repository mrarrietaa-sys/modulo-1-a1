/* =====================================================================
   JUEGOS DINÁMICOS (v18) — más movimiento y emoción en cada clase
   catchWord (palabras que caen) · spinWheel (ruleta + hablar)
   raceGame (carrera contra Mr. Arrieta) · sayPop (habla y revienta globos)
   ===================================================================== */
(function () {
  const M = window.M1, A = window.M1A;
  const { $, $$, h, esc, shuffle, sample, sleep, play, stop, sfx, sheet } = M;
  const { head, playBtn, feedback, result } = A;
  const uniq = (arr) => arr.filter((x, i, a) => a.findIndex(y => y.en === x.en) === i);
  const pool = (p) => uniq((p.vocab || []).filter(v => v.en));

  /* ============ ATRAPA LA PALABRA (caen del cielo) ============ */
  async function catchWord(stage, p) {
    const P = pool(p); const R = Math.min(6, P.length); const items = sample(P, R); let c = 0; const missed = [];
    const body = head(stage, { lbl: 'Game', title: '🪂 Atrapa la palabra', ins: 'Escucha 🔊 y lee la pista. Toca la palabra correcta <b>antes de que llegue al suelo</b>.' });
    const hud = h(`<div class="cw-hud"><span>Ronda <b id="cr">1</b>/${R}</span><span class="cw-clue" id="cc"></span><span>⭐ <b id="cs">0</b></span></div>`); body.appendChild(hud);
    const sky = h(`<div class="cw-sky"><div class="cw-ground">🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱</div></div>`); body.appendChild(sky);
    for (let k = 0; k < R; k++) {
      if (!stage.isConnected) break;
      const it = items[k]; $('#cr', hud).textContent = k + 1;
      $('#cc', hud).innerHTML = it.es ? `“${esc(it.es)}”` : '🔊'; const pb = playBtn(it.au, false); $('#cc', hud).appendChild(pb);
      setTimeout(() => play(it.au), 250);
      const opts = shuffle([it, ...sample(P.filter(x => x.en !== it.en), Math.min(2, P.length - 1))]);
      const lanes = shuffle([8, 38, 68]);
      const res = await new Promise(done => {
        let over = false;
        const btns = opts.map((o, i) => { const b = h(`<button class="cw-word" style="left:${lanes[i]}%;--t:${(5.6 + i * 0.7).toFixed(1)}s;--d:${(i * 0.45).toFixed(2)}s">🪂<br>${esc(o.en)}</button>`); sky.appendChild(b);
          b.onclick = () => { if (over) return; over = true; btns.forEach(x => x.style.animationPlayState = 'paused'); done({ ok: o === it, b, btns }); };
          if (o === it) b.addEventListener('animationend', () => { if (over) return; over = true; done({ ok: false, late: true, b, btns }); });
          return b; });
      });
      if (res.ok) { c++; sfx('ok'); res.b.classList.add('got'); $('#cs', hud).textContent = c; }
      else { sfx('bad'); missed.push(it); const right = res.btns[opts.indexOf(it)]; right.classList.add('right'); if (!res.late) res.b.classList.add('wrong'); M.toast(res.late ? `⏰ ¡Se cayó! Era: ${it.en}` : `Era: ${it.en}`); }
      play(it.au); await sleep(res.ok ? 700 : 1500);
      $$('.cw-word', sky).forEach(x => x.remove());
    }
    if (c >= R - 1) { M.confetti(1200); sfx('win'); }
    await sheet({ ok: c >= R / 2, title: `🪂 Atrapaste ${c} de ${R}`, msg: c === R ? '¡Reflejos de campeón! ⚡' : 'Escucha bien la palabra y toca rápido. ¡Tú puedes!' });
    return result(c, R, 'listening', missed);
  }

  /* ============ RULETA: gira, mira la palabra y dila en inglés ============ */
  async function spinWheel(stage, p) {
    const P = pool(p).filter(v => v.es); const N = Math.min(8, P.length); const seg = sample(P, N); const spins = Math.min(4, N); let c = 0, t = 0; const missed = []; let angle = 0; const used = new Set();
    const cols = ['#E3242B', '#0B2A5B', '#FFFFFF', '#1D5FD1'];
    const grad = seg.map((_, i) => `${cols[i % 4]} ${i * 360 / N}deg ${(i + 1) * 360 / N}deg`).join(',');
    for (let k = 0; k < spins; k++) {
      if (!stage.isConnected) break;
      const body = head(stage, { lbl: 'Game', title: '🎡 La ruleta', ins: 'Gira la ruleta. Te saldrá una palabra en <b>español</b>: dila en <b>inglés</b> 🎤 (o escríbela).', count: `${k + 1} / ${spins}` });
      const wrap = h(`<div class="sw-wrap"><div class="sw-pin">▼</div><div class="sw-wheel" style="background:conic-gradient(${grad});transform:rotate(${angle}deg)">${seg.map((s, i) => { const a = (i + .5) * 2 * Math.PI / N; return `<i class="sw-n" style="left:${(50 + 36 * Math.sin(a)).toFixed(1)}%;top:${(50 - 36 * Math.cos(a)).toFixed(1)}%;transform:translate(-50%,-50%) rotate(${((i + .5) * 360 / N).toFixed(0)}deg);color:${i % 4 === 2 ? '#0B2A5B' : '#fff'}">${i + 1}</i>`; }).join('')}<b class="sw-hub">GO</b></div></div>`); body.appendChild(wrap);
      const go = h(`<div class="center"><button class="btn k lg">🎡 ¡Girar!</button></div>`); body.appendChild(go);
      await new Promise(r => $('button', go).onclick = r); go.remove();
      let idx; do { idx = Math.floor(Math.random() * N); } while (used.has(idx) && used.size < N); used.add(idx);
      const target = 360 - (idx + .5) * 360 / N; angle = angle - (angle % 360) + 360 * 5 + target;
      const wh = $('.sw-wheel', wrap); wh.style.transition = 'transform 3.2s cubic-bezier(.17,.67,.21,1)'; wh.style.transform = `rotate(${angle}deg)`; sfx('tap');
      await sleep(3300); sfx('win');
      const it = seg[idx];
      const card = h(`<div class="sw-card"><small>Número ${idx + 1}</small><div class="sw-es">${esc(it.es)}</div><p class="muted" style="margin:4px 0 10px">¿Cómo se dice en inglés?</p></div>`); body.appendChild(card);
      const ok = await new Promise(res => {
        const mic = h(`<button class="mic">🎤</button>`); const st = h(`<p class="center" style="font-weight:700;margin:4px 0">${M.canSR ? 'Toca el micrófono y dila en inglés' : 'Escribe la palabra en inglés'}</p>`);
        const inp = h(`<div class="${M.canSR ? 'hidden' : ''}" style="max-width:420px;margin:0 auto"><input class="inp" placeholder="Escribe en inglés…" autocomplete="off" autocapitalize="off"></div>`);
        const bar = h(`<div class="actionbar"><button class="btn w" id="sh">💡 Pista</button>${M.canSR ? '<button class="btn w" id="ty">⌨️ Escribir</button>' : ''}<button class="btn k" id="sk">Comprobar ✓</button></div>`);
        card.append(mic, st, inp); body.appendChild(bar);
        let hints = 0;
        const finish = (good, heard) => { mic.disabled = true; $$('button', bar).forEach(b => b.disabled = true); res({ good, heard }); };
        mic.onclick = async () => { stop(); mic.classList.add('rec'); st.textContent = '🎧 Te escucho…'; const r = await M.listen(6000); mic.classList.remove('rec');
          if (!r.alts.length) { st.textContent = 'No te escuché 🙉 Intenta otra vez o escríbela.'; return; }
          const sc = M.speechScore(it.en, r.alts); if (sc.score >= 70) { M.praise(); finish(true, sc.heard); } else { st.innerHTML = `❌ Escuché “${esc(sc.heard)}”. Intenta otra vez (usa 💡 Pista).`; sfx('bad'); setTimeout(M.encourage, 250); } };
        if ($('#ty', bar)) $('#ty', bar).onclick = () => { inp.classList.remove('hidden'); $('input', inp).focus(); };
        $('#sh', bar).onclick = () => { hints++; if (hints === 1) st.innerHTML = `💡 Empieza por <b>${esc(it.en[0].toUpperCase())}</b> y tiene ${it.en.replace(/[^A-Za-z]/g, '').length} letras`; else { st.innerHTML = '💡 Escucha cómo suena 🔊'; play(it.au); } };
        $('#sk', bar).onclick = () => { const v = $('input', inp).value.trim(); if (v) finish(M.norm(v) === M.norm(it.en), v); else if (M.canSR) mic.click(); };
        $('input', inp).onkeydown = e => { if (e.key === 'Enter') $('#sk', bar).click(); };
      });
      t++; if (ok.good) c++; else missed.push(it); play(it.au);
      await feedback(ok.good, `${it.es} = ${it.en}`, 'Escucha la palabra y repítela en voz alta.');
    }
    return result(c, t, 'speaking', missed);
  }

  /* ============ CARRERA contra Mr. Arrieta ============ */
  async function raceGame(stage, p) {
    const P = pool(p); const GOAL = 5; let me = 0, bot = 0, q = 0, c = 0; const missed = [];
    const audioOnly = p.letters || p.numbers || P.some(v => !v.es);
    while (me < GOAL && bot < GOAL && q < 12) {
      if (!stage.isConnected) break;
      const it = sample(P, 1)[0]; q++;
      const body = head(stage, { lbl: 'Race', title: '🏁 Carrera contra Mr. Arrieta', ins: `Cada respuesta correcta te hace avanzar. ¡Llega primero a la meta! 🏆` });
      body.appendChild(h(`<div class="rc-track">${[['me', '🚗', 'Tú', me], ['bot', '', 'Mr. Arrieta', bot]].map(([k, ic, nm, v]) => `<div class="rc-lane"><span class="rc-name">${nm}</span><div class="rc-road"><span class="rc-car ${k}" style="left:calc(${v / GOAL * 100}% - ${v / GOAL * 46}px)">${k === 'bot' ? '<img src="mra-thumbs.webp" alt="">' : ic}</span><span class="rc-flag">🏁</span></div></div>`).join('')}</div>`));
      const type = audioOnly ? 'au' : (q % 2 ? 'es' : 'au');
      const qq = h(`<div class="qs-q">${type === 'es' ? `¿Cómo se dice <b>“${esc(it.es)}”</b>?` : '¿Qué escuchas? 🎧'}</div>`); body.appendChild(qq);
      if (type === 'au') { qq.appendChild(playBtn(it.au, false)); setTimeout(() => play(it.au), 250); }
      const opts = shuffle([it, ...sample(P.filter(x => x.en !== it.en), Math.min(3, P.length - 1))]);
      const grid = h(`<div class="opts"></div>`); body.appendChild(grid);
      const btns = opts.map(o => { const b = h(`<button class="opt">${esc(o.en)}</button>`); grid.appendChild(b); return b; });
      const i = await A.choose(btns); const ok = opts[i] === it;
      btns[opts.indexOf(it)].classList.add('right'); if (!ok) btns[i].classList.add('wrong');
      if (ok) { me++; c++; sfx('ok'); } else { missed.push(it); sfx('bad'); }
      if (!ok || Math.random() < .4) bot++;
      play(it.au);
      const cars = body.querySelectorAll('.rc-car'); cars[0].style.left = `calc(${Math.min(me, GOAL) / GOAL * 100}% - ${Math.min(me, GOAL) / GOAL * 46}px)`; cars[1].style.left = `calc(${Math.min(bot, GOAL) / GOAL * 100}% - ${Math.min(bot, GOAL) / GOAL * 46}px)`;
      await sleep(1100);
    }
    const won = me >= GOAL && me >= bot;
    if (won) { M.confetti(2000); sfx('win'); }
    await sheet({ ok: won, title: won ? '🏆 ¡Ganaste la carrera!' : '🏎️ ¡Mr. Arrieta llegó primero!', msg: won ? '¡Eres muy rápido! Le ganaste al profe 😎' : 'Buen intento. Repasa las palabras y vuelve a retarlo.' });
    return result(c, q, 'listening', missed);
  }

  /* ============ HABLA Y REVIENTA GLOBOS ============ */
  async function sayPop(stage, p) {
    const P = pool(p).filter(v => v.en.split(' ').length <= 3); const items = sample(P, Math.min(5, P.length)); const popped = new Set(); const missed = [];
    const body = head(stage, { lbl: 'Speaking game', title: '🎈 Habla y revienta', ins: M.canSR ? 'Toca un globo para escucharlo. Luego toca 🎤 y <b>di la palabra</b>: ¡si la pronuncias bien, el globo revienta!' : 'Escucha 🔊 y toca el globo con la palabra que oyes.' });
    const sky = h(`<div class="sp-sky"></div>`); body.appendChild(sky);
    const cols = ['#E3242B', '#1D5FD1', '#0B2A5B', '#E3242B', '#1D5FD1'];
    const balls = items.map((it, i) => { const b = h(`<button class="sp-ball" style="--c:${cols[i % 5]};--d:${(i * .4).toFixed(1)}s">${esc(it.en)}<i></i></button>`); b.onclick = () => { if (!M.canSR) return; sfx('tap'); play(it.au); }; sky.appendChild(b); return b; });
    const st = h(`<p class="center" style="font-weight:700;min-height:24px"></p>`); body.appendChild(st);
    const pop = (i) => { popped.add(i); balls[i].classList.add('pop'); sfx('ok'); M.praise(); };
    await new Promise(res => {
      const bar = h(`<div class="actionbar"><button class="btn w" id="sd">Terminar</button></div>`);
      if (M.canSR) {
        const mic = h(`<div class="center"><button class="mic">🎤</button></div>`); body.insertBefore(mic, st);
        let tries = 0;
        $('button', mic).onclick = async () => { const bt = $('button', mic); stop(); bt.classList.add('rec'); st.textContent = '🎧 Te escucho… di una palabra de los globos'; const r = await M.listen(5000); bt.classList.remove('rec'); tries++;
          if (!r.alts.length) { st.textContent = 'No te escuché 🙉 Intenta otra vez.'; return; }
          let best = -1, bs = 0, heard = ''; items.forEach((it, i) => { if (popped.has(i)) return; const sc = M.speechScore(it.en, r.alts); if (sc.score > bs) { bs = sc.score; best = i; heard = sc.heard; } });
          if (best >= 0 && bs >= 70) { pop(best); st.innerHTML = `✅ ¡Muy bien! Dijiste <b>${esc(items[best].en)}</b>`; } else { sfx('bad'); setTimeout(M.encourage, 250); st.innerHTML = `❌ Escuché “${esc(heard || r.alts[0])}”. Toca el globo para escucharlo y repite.`; }
          if (popped.size === items.length) setTimeout(res, 700); };
      } else {
        let k = 0; const order = shuffle(items.map((_, i) => i));
        const ask = () => { if (k >= order.length) return setTimeout(res, 600); const i = order[k]; st.innerHTML = '🔊 ¿Cuál escuchas?'; play(items[i].au); balls.forEach((b, j) => b.onclick = () => { if (popped.has(j)) return; if (j === i) { pop(j); k++; setTimeout(ask, 500); } else { sfx('bad'); missed.push(items[i]); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); } }); };
        ask(); const rp = h(`<button class="btn w" id="rp">🔊 Repetir</button>`); bar.prepend(rp); rp.onclick = () => play(items[order[Math.min(k, order.length - 1)]].au);
      }
      body.appendChild(bar); $('#sd', bar).onclick = res;
    });
    items.forEach((it, i) => { if (!popped.has(i)) missed.push(it); });
    if (popped.size === items.length) { M.confetti(1500); sfx('win'); }
    await sheet({ ok: popped.size >= items.length / 2, title: `🎈 Reventaste ${popped.size} de ${items.length}`, msg: popped.size === items.length ? '¡Pronunciación de campeón! 🏆' : 'Escucha cada globo y repite despacio.' });
    return result(popped.size, items.length, 'speaking', missed);
  }

  Object.assign(window.M1A, { catchWord, spinWheel, raceGame, sayPop });
})();
