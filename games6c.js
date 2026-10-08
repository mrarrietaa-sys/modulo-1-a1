/* =====================================================================
   JUEGOS ÚNICOS DEL MÓDULO 4 · C1 CONTENTS (debates) — una dinámica distinta en cada clase
   t15p1 aiArgumentForge   · La forja del argumento (arma un robot con tesis, razón, concesión y conclusión)
   t16p1 globeRebuttalDuel · Duelo de contraargumentos (barras de vida + golpe crítico por rapidez)
   t17p1 feedFallacyFlag   · Cazador de falacias en un feed de redes sociales
   t18p1 justiceNuanceDial · El extremómetro: gira las palabras absolutas hasta matizar la frase
   t19p1 eduEssayRedPen    · El bolígrafo rojo: tacha la oración que rompe la coherencia y reemplázala
   t20p1 demoTownHall      · Modera el town hall: detecta quién rompe las reglas y elige tu frase
   t21p1 spaceCountdown    · Cuenta regresiva: condicionales invertidas para cargar el cohete
   ===================================================================== */
(function () {
  const M = window.M1, A = window.M1A;
  const { $, $$, h, esc, shuffle, sample, sleep, play, stop, sfx, sheet } = M;
  const { head, result } = A;
  const G = () => window.M1G6C || {};
  const live = (stage) => stage.isConnected;
  const nrm = (s) => String(s || '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim();

  function waitBtn(body, txt = 'Continuar →') {
    return new Promise(res => { const bar = h(`<div class="actionbar g3-next"><button class="btn k lg">${txt}</button></div>`); body.appendChild(bar); bar.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); $('button', bar).onclick = () => { stop(); bar.remove(); res(); }; });
  }
  async function ask(parent, labels, correct, cls = '') {
    const wrap = h(`<div class="opts g3-opts ${cls}"></div>`);
    const btns = labels.map(l => { const b = h(`<button class="opt">${l}</button>`); wrap.appendChild(b); return b; });
    parent.appendChild(wrap); wrap.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const i = await new Promise(r => btns.forEach((b, k) => b.onclick = () => r(k)));
    btns.forEach(b => b.disabled = true); btns[correct].classList.add('right'); if (i !== correct) btns[i].classList.add('wrong');
    return i === correct;
  }
  async function say(body, ok, en, es, au) {
    const fb = h(`<div class="g3-fb ${ok ? 'ok' : 'no'}">${ok ? '✅ ¡Correcto!' : '❌ ¡Casi! La respuesta es:'} <b>${esc(en)}</b>${es ? `<span>${es}</span>` : ''}</div>`);
    body.appendChild(fb); fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    sfx(ok ? 'ok' : 'bad'); await sleep(300);
    if (au) await play(au);
    if (ok) { if (Math.random() < .35) M.praise(); await sleep(900); }
    else await waitBtn(body);
  }
  async function finish(c, t, skill, missed, title, okMsg) {
    if (t && c >= t - 1) { M.confetti(1300); sfx('win'); }
    await sheet({ ok: c >= t / 2, title: `${title}: ${c} de ${t}`, msg: c >= t - 1 ? okMsg : 'Repasa la explicación y vuelve a intentarlo. ¡Tú puedes! 💪' });
    return result(c, t, skill, missed);
  }
  const rep = (au, label = '🔊 Escuchar') => { const b = h(`<button class="btn w sm g3-rep">${label}</button>`); b.onclick = () => { sfx('tap'); if (Array.isArray(au)) M.playSeq(au.filter(Boolean)); else play(au); }; return b; };
  const center = (body, el) => { const d = h(`<div class="center"></div>`); d.appendChild(el); body.appendChild(d); return el; };
  const esT = (txt) => { const d = h(`<div class="g6c-es"><button class="g6c-esb g3-rep" type="button">🇪🇸 Ver en español</button><span class="hidden">${esc(txt)}</span></div>`); $('button', d).onclick = () => { $('span', d).classList.toggle('hidden'); }; return d; };

  /* =====================================================================
     t15p1 — LA FORJA DEL ARGUMENTO (robot por piezas)
     ===================================================================== */
  const ROBOT = `<svg viewBox="0 0 160 176" class="g6c-robot" aria-hidden="true">
    <g data-p="claim" class="g6c-rp"><line x1="80" y1="6" x2="80" y2="20" stroke-width="4"/><circle cx="80" cy="6" r="5"/><rect x="48" y="20" width="64" height="44" rx="12"/><circle class="eye" cx="66" cy="42" r="6"/><circle class="eye" cx="94" cy="42" r="6"/><rect class="mouth" x="68" y="53" width="24" height="4" rx="2"/></g>
    <g data-p="reason" class="g6c-rp"><rect x="44" y="70" width="72" height="56" rx="10"/><circle class="core" cx="80" cy="96" r="11"/><rect class="core" x="58" y="114" width="44" height="5" rx="2"/></g>
    <g data-p="concession" class="g6c-rp"><rect x="18" y="74" width="20" height="46" rx="10"/><rect x="122" y="74" width="20" height="46" rx="10"/><circle cx="28" cy="126" r="8"/><circle cx="132" cy="126" r="8"/></g>
    <g data-p="conclusion" class="g6c-rp"><rect x="52" y="132" width="20" height="34" rx="8"/><rect x="88" y="132" width="20" height="34" rx="8"/><rect x="44" y="164" width="32" height="10" rx="5"/><rect x="84" y="164" width="32" height="10" rx="5"/></g>
  </svg>`;
  async function aiArgumentForge(stage, p) {
    const R = sample(G().forge || [], 3), ROLES = G().roles || []; let c = 0, t = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🤖 La forja del argumento', ins: 'Arma un argumento C1 pieza por pieza. En cada paso toca la oración que cumple esa <b>función</b>. ⚠️ Hay una <b>pieza defectuosa</b> que no sirve.', count: `${k + 1} / ${R.length}` });
      const top = h(`<div class="g6c-forge"><div class="g6c-rbox">${ROBOT}<div class="g6c-spark"></div></div><div class="g6c-fq"><small>DEBATE QUESTION</small><b>${esc(r.q)}</b><i>${esc(r.qes)}</i><div class="g6c-steps">${ROLES.map((x, i) => `<span data-i="${i}">${x.lbl}</span>`).join('')}</div></div></div>`);
      body.appendChild(top); const qb = rep(r.qau, '🔊 Pregunta'); $('.g6c-fq', top).appendChild(qb);
      const para = h(`<div class="g6c-para"></div>`); body.appendChild(para);
      const slot = h(`<p class="g6c-slot"></p>`); body.appendChild(slot);
      const pieces = shuffle([...r.pcs.map(x => ({ ...x })), { r: 'decoy', t: r.dec }]);
      const bank = h(`<div class="g6c-bank">${pieces.map((x, i) => `<button class="g6c-piece" data-i="${i}">${esc(x.t)}</button>`).join('')}</div>`); body.appendChild(bank);
      const btns = $$('button', bank); let firstAll = true;
      for (let s = 0; s < ROLES.length && live(stage); s++) {
        const role = ROLES[s]; let first = true;
        $$('.g6c-steps span', top).forEach((e, i) => { e.classList.toggle('on', i === s); e.classList.toggle('done', i < s); });
        slot.innerHTML = `Paso ${s + 1}/4 · <b>${role.lbl}</b> <span>— ${esc(role.es)}</span>`;
        await new Promise(res => btns.forEach(b => b.onclick = () => {
          const pc = pieces[+b.dataset.i];
          if (pc.r === role.r) {
            b.disabled = true; b.classList.add('used'); sfx('ok'); play(pc.au);
            para.appendChild(h(`<span class="g6c-pp ${role.r}">${esc(pc.t)} </span>`));
            const part = $(`[data-p="${role.r}"]`, top); if (part) part.classList.add('lit');
            const sp = $('.g6c-spark', top); sp.classList.remove('go'); void sp.offsetWidth; sp.classList.add('go');
            res();
          } else {
            first = false; sfx('bad'); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 420);
            if (pc.r === 'decoy') { b.classList.add('broken'); b.disabled = true; M.toast('🔧 Pieza defectuosa: ' + r.why); }
            else { const rr = ROLES.find(x => x.r === pc.r); M.toast(`Esa pieza es la ${rr ? rr.lbl : ''}. Ahora buscamos: ${role.lbl}`); }
          }
        }));
        t++; if (first) c++; else { firstAll = false; const pc = r.pcs.find(x => x.r === role.r); missed.push({ en: pc.t, au: pc.au }); }
      }
      $$('.g6c-steps span', top).forEach(e => { e.classList.remove('on'); e.classList.add('done'); });
      btns.forEach(b => b.disabled = true); bank.classList.add('off');
      top.classList.add('alive'); slot.innerHTML = '⚡ <b>¡Robot activado!</b> Tu argumento completo:';
      center(body, rep(r.full, '🔊 Escuchar el argumento completo'));
      await say(body, firstAll, firstAll ? '¡Argumento perfecto!' : 'Revisa el orden: tesis → razón → concesión → conclusión.', 'Una buena intervención C1 presenta, justifica, concede y concluye.', null);
    }
    return finish(c, t, 'reading', missed, '🤖 Piezas correctas', '¡Construyes argumentos como un experto en debate! 🏆');
  }

  /* =====================================================================
     t16p1 — DUELO DE CONTRAARGUMENTOS
     ===================================================================== */
  async function globeRebuttalDuel(stage, p) {
    const R = sample(G().duel || [], 5); let c = 0; const missed = []; let me = 100, foe = 100, combo = 0;
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🥊 Duelo de contraargumentos', ins: 'Tu rival defiende una postura sobre la globalización. Elige el <b>mejor contraargumento</b>: responde a la idea, no a la persona. ⚡ ¡Si respondes rápido, el golpe es crítico!', count: `${k + 1} / ${R.length}` });
      const arena = h(`<div class="g6c-arena">
        <div class="g6c-fighter me"><div class="g6c-av">🧑🏽‍💼</div><b>You</b><div class="g6c-hp"><i style="width:${me}%"></i></div><small>${me} HP</small></div>
        <div class="g6c-vs">VS</div>
        <div class="g6c-fighter foe"><div class="g6c-av">🌐</div><b>Rival</b><div class="g6c-hp"><i style="width:${foe}%"></i></div><small>${foe} HP</small></div></div>`);
      body.appendChild(arena);
      const bub = h(`<div class="g6c-claim"><small>🌐 RIVAL SAYS:</small><b>“${esc(r.c)}”</b></div>`); body.appendChild(bub); bub.appendChild(esT(r.ces));
      center(body, rep(r.cau, '🔊 Escuchar al rival')); play(r.cau);
      const tm = h(`<div class="g6c-timer"><i></i><span>⚡ Golpe crítico</span></div>`); body.appendChild(tm);
      const t0 = Date.now(), LIM = 20000; const bar = $('i', tm);
      const iv = setInterval(() => { const f = Math.max(0, 1 - (Date.now() - t0) / LIM); bar.style.width = (f * 100) + '%'; if (!f) { tm.classList.add('out'); clearInterval(iv); } }, 120);
      const opts = shuffle([r.g, ...r.b]);
      const ok = await ask(body, opts.map(o => `<span class="g6c-reb">🗨️ ${esc(o)}</span>`), opts.indexOf(r.g), 'g6c-one');
      clearInterval(iv); const crit = ok && Date.now() - t0 < LIM;
      if (ok) { c++; combo++; foe = Math.max(0, foe - (crit ? 26 : 18)); } else { combo = 0; me = Math.max(0, me - 20); missed.push({ en: r.g, au: r.gau }); }
      const target = $(ok ? '.foe' : '.me', arena); target.classList.add('hit');
      $('.me .g6c-hp i', arena).style.width = me + '%'; $('.me small', arena).textContent = me + ' HP';
      $('.foe .g6c-hp i', arena).style.width = foe + '%'; $('.foe small', arena).textContent = foe + ' HP';
      arena.appendChild(h(`<div class="g6c-pow ${ok ? '' : 'ouch'}">${ok ? (crit ? '⚡ CRITICAL!' : '💥 HIT!') + (combo > 1 ? ` ×${combo}` : '') : '😵 OUCH!'}</div>`));
      if (foe === 0) $('.foe .g6c-av', arena).textContent = '😵';
      await say(body, ok, r.g, `${esc(r.ges)}<br>💡 ${esc(r.why)}`, r.gau);
    }
    if (live(stage)) {
      const body = head(stage, { lbl: 'Game', title: '🥊 Resultado del duelo', ins: '' });
      body.appendChild(h(`<div class="g6c-ko"><div>${foe <= me ? '🏆' : '🤝'}</div><b>${foe <= me ? 'You win the debate!' : 'A close debate!'}</b><span>Tú: ${me} HP · Rival: ${foe} HP</span></div>`));
      await sleep(900);
    }
    return finish(c, R.length, 'reading', missed, '🥊 Contraargumentos', '¡Rebates con argumentos, no con ataques! 🌍');
  }

  /* =====================================================================
     t17p1 — CAZADOR DE FALACIAS EN EL FEED
     ===================================================================== */
  async function feedFallacyFlag(stage, p) {
    const F = G().fall || []; const R = sample(G().posts || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const fx = F.find(x => x.k === r.k) || {};
      const body = head(stage, { lbl: 'Game', title: '🚩 Cazador de falacias', ins: 'Lee la publicación sobre redes sociales. ¿Qué <b>error de razonamiento</b> (falacia) comete? Márcala con la bandera correcta.', count: `${k + 1} / ${R.length}` });
      const phone = h(`<div class="g6c-phone"><div class="g6c-notch"></div><div class="g6c-app"><b>Feedly</b><span>🔔 💬</span></div>
        <div class="g6c-post"><div class="g6c-ph"><span class="g6c-pav">${r.av}</span><div><b>@${esc(r.u)}</b><small>${2 + k}h · 🌎</small></div></div>
        <p>${esc(r.t)}</p><div class="g6c-pact"><span>❤️ ${r.likes.toLocaleString('en-US')}</span><span>💬 ${Math.round(r.likes / 9)}</span><span>🔁 ${Math.round(r.likes / 5)}</span></div><div class="g6c-stamp hidden"></div></div></div>`);
      body.appendChild(phone); center(body, rep(r.au, '🔊 Escuchar la publicación')); play(r.au);
      const gd = h(`<details class="g6c-guide"><summary>📖 Guía rápida de falacias</summary>${F.map(x => `<p><b>${esc(x.en)}</b> (${esc(x.es)}): ${esc(x.def)}</p>`).join('')}</details>`);
      const wrap = h(`<div class="g6c-flags">${F.map((x, i) => `<button class="g6c-flag" data-i="${i}"><b>🚩 ${esc(x.en)}</b><small>${esc(x.es)}</small></button>`).join('')}</div>`);
      body.appendChild(wrap); body.appendChild(gd);
      const btns = $$('button', wrap);
      const i = await new Promise(res => btns.forEach(b => b.onclick = () => res(+b.dataset.i)));
      const ci = F.indexOf(fx); const ok = i === ci; btns.forEach(b => b.disabled = true); btns[ci].classList.add('right'); if (!ok) btns[i].classList.add('wrong');
      const st = $('.g6c-stamp', phone); st.textContent = '🚩 ' + fx.en; st.classList.remove('hidden'); $('.g6c-post', phone).classList.add('flagged');
      if (ok) c++; else missed.push({ en: r.fix, au: r.fau });
      body.appendChild(h(`<div class="g6c-fix"><small>💡 ${esc(fx.es)}: ${esc(fx.def)}</small><b>✍️ A more reasonable version:</b><p>${esc(r.fix)}</p></div>`));
      await say(body, ok, fx.en + ' · ' + fx.es, '', r.fau);
    }
    return finish(c, R.length, 'reading', missed, '🚩 Falacias detectadas', '¡Ningún post engañoso se te escapa! 🕵️');
  }

  /* =====================================================================
     t18p1 — EL EXTREMÓMETRO (hedging)
     ===================================================================== */
  function gauge(ext) {
    const ang = -90 + 180 * ext;
    return `<svg viewBox="0 0 200 110" class="g6c-gauge"><defs><linearGradient id="g6cgr" x1="0" x2="1"><stop offset="0" stop-color="#16A34A"/><stop offset=".5" stop-color="#1D5FD1"/><stop offset="1" stop-color="#E3242B"/></linearGradient></defs>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#g6cgr)" stroke-width="18" stroke-linecap="round"/>
      <g style="transform:rotate(${ang}deg);transform-origin:100px 100px;transition:transform .5s cubic-bezier(.3,1.6,.5,1)"><line x1="100" y1="100" x2="100" y2="34" stroke="#0B2A5B" stroke-width="5" stroke-linecap="round"/></g>
      <circle cx="100" cy="100" r="9" fill="#0B2A5B" stroke="#fff" stroke-width="3"/></svg>`;
  }
  async function justiceNuanceDial(stage, p) {
    const R = sample(G().nuance || [], 5); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const slots = r.toks.filter(x => typeof x !== 'string').map(x => { const ord = [0, ...shuffle([1, 2].filter(i => i < x.o.length))]; return { o: x.o, a: x.a, ord, cur: 0 }; });
      const body = head(stage, { lbl: 'Game', title: '⚖️ El extremómetro', ins: 'Esta frase es demasiado <b>absoluta</b>. Toca las palabras subrayadas para cambiarlas hasta que la frase quede <b>matizada y correcta</b>. ¡Ojo con las trampas gramaticales!', count: `${k + 1} / ${R.length}` });
      const gbox = h(`<div class="g6c-gbox"><div class="g6c-g"></div><div class="g6c-glbl"><span>⚖️ Matizada</span><b></b><span>Extrema 🔥</span></div></div>`); body.appendChild(gbox);
      let si = 0; const line = h(`<div class="g6c-nline">${r.toks.map(x => typeof x === 'string' ? `<span>${esc(x)}</span>` : `<button class="g6c-dial" data-s="${si++}"></button>`).join('')}</div>`); body.appendChild(line);
      const dials = $$('.g6c-dial', line);
      const draw = () => {
        dials.forEach((b, i) => { const s = slots[i]; b.innerHTML = `${esc(s.o[s.ord[s.cur]])}<i>↻</i>`; b.classList.toggle('abs', s.ord[s.cur] === 0); });
        const ext = slots.filter(s => s.ord[s.cur] === 0).length / slots.length;
        $('.g6c-g', gbox).innerHTML = gauge(ext); $('b', gbox).textContent = ext >= .99 ? '🔥 ABSOLUTA' : ext > 0 ? '🌡️ Todavía extrema' : '✅ Sin absolutos';
      };
      draw();
      dials.forEach((b, i) => b.onclick = () => { sfx('tap'); const s = slots[i]; s.cur = (s.cur + 1) % s.ord.length; b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin'); draw(); });
      const ok = await new Promise(res => { const bar = h(`<div class="actionbar"><button class="btn k lg">Comprobar ✓</button></div>`); body.appendChild(bar); $('button', bar).onclick = () => { bar.remove(); dials.forEach(d => d.disabled = true); res(slots.every(s => s.ord[s.cur] === s.a)); }; });
      dials.forEach((d, i) => { const s = slots[i]; const right = s.ord[s.cur] === s.a; d.classList.add(right ? 'ok' : 'bad'); if (!right) { s.cur = s.ord.indexOf(s.a); } }); draw();
      if (ok) c++; else missed.push({ en: r.full, au: r.au });
      await say(body, ok, r.full, esc(r.es), r.au);
    }
    return finish(c, R.length, 'writing', missed, '⚖️ Frases matizadas', '¡Hablas con la precisión y el equilibrio de un juez! 👩‍⚖️');
  }

  /* =====================================================================
     t19p1 — EL BOLÍGRAFO ROJO (coherencia)
     ===================================================================== */
  async function eduEssayRedPen(stage, p) {
    const R = sample(G().pen || [], 4); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🖍️ El bolígrafo rojo', ins: 'Eres el profesor. 1️⃣ Toca la oración que <b>rompe la coherencia</b> del párrafo (irrelevante, ilógica o contradictoria). 2️⃣ Elige la mejor oración para reemplazarla.', count: `${k + 1} / ${R.length}` });
      const paper = h(`<div class="g6c-paper"><div class="g6c-ptitle">Essay draft · <b>${esc(r.title)}</b></div>${r.s.map((s, i) => `<button class="g6c-sent" data-i="${i}">${esc(s)}</button>`).join(' ')}<div class="g6c-grade"></div></div>`);
      body.appendChild(paper);
      const sb = $$('.g6c-sent', paper);
      const i = await new Promise(res => sb.forEach(b => b.onclick = () => res(+b.dataset.i)));
      sb.forEach(b => b.disabled = true); const ok1 = i === r.bad;
      sb[r.bad].classList.add('struck'); if (!ok1) { sb[i].classList.add('fine'); }
      sfx(ok1 ? 'ok' : 'bad'); if (ok1) c++;
      body.appendChild(h(`<p class="g6c-why ${ok1 ? 'ok' : 'no'}">${ok1 ? '✅ ¡Bien visto!' : '❌ Esa oración sí encaja. La que sobra es la tachada.'} <span>${esc(r.why)}</span></p>`));
      body.appendChild(h(`<p class="g6c-step2">2️⃣ ¿Con qué oración la reemplazas?</p>`));
      const opts = shuffle(r.rep.slice());
      const ok2 = await ask(body, opts.map(esc), opts.indexOf(r.rep[0]), 'g6c-one');
      if (ok2) c++;
      const ins = h(`<span class="g6c-ins">${esc(r.rep[0])}</span>`); sb[r.bad].after(ins);
      $('.g6c-grade', paper).textContent = (ok1 && ok2) ? 'A+' : ok1 || ok2 ? 'B' : 'C';
      if (!(ok1 && ok2)) missed.push({ en: r.rep[0], au: r.gau });
      await say(body, ok2, r.rep[0], ok2 ? 'Coherente, lógica y gramaticalmente correcta.' : 'Las otras tienen errores de gramática o contradicen el párrafo.', r.gau);
    }
    return finish(c, R.length * 2, 'writing', missed, '🖍️ Correcciones', '¡Tienes ojo de editor académico! 📝');
  }

  /* =====================================================================
     t20p1 — MODERA EL TOWN HALL
     ===================================================================== */
  async function demoTownHall(stage, p) {
    const SP = G().spk || []; const R = sample(G().th || [], 5); let c = 0; const missed = []; let ap = 50;
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🏛️ Modera el town hall', ins: 'Tú eres el <b>moderador</b>. 1️⃣ Lee lo que dicen y toca a la persona que necesita tu intervención. 2️⃣ Elige la frase de moderador adecuada.', count: `${k + 1} / ${R.length}` });
      const hall = h(`<div class="g6c-hall"><div class="g6c-hbar"><span>🏛️ TOWN HALL · <b>${esc(r.topic)}</b></span><span class="g6c-live">● LIVE</span></div>
        <div class="g6c-crowd"><span>👏 Público</span><div class="g6c-ap"><i style="width:${ap}%"></i></div><b>${ap}%</b></div>
        <div class="g6c-seats">${r.lines.map((l, i) => `<button class="g6c-seat" data-i="${i}"><span class="g6c-sav">${SP[i].av}</span><span class="g6c-sb"><b>${esc(SP[i].n)}</b><span>${esc(l.t)}</span></span></button>`).join('')}</div>
        <div class="g6c-podium">🎙️ <b>You</b> · Moderator</div></div>`);
      body.appendChild(hall); center(body, rep(r.lines.map(l => l.au), '🔊 Escuchar a los tres'));
      const task = h(`<p class="g6c-task">🔎 ${esc(r.task)}</p>`); body.appendChild(task);
      const seats = $$('.g6c-seat', hall);
      const i = await new Promise(res => seats.forEach(b => b.onclick = () => res(+b.dataset.i)));
      seats.forEach(b => b.disabled = true); const ok1 = i === r.who; seats[r.who].classList.add('pick'); if (!ok1) seats[i].classList.add('wrong');
      sfx(ok1 ? 'ok' : 'bad'); if (ok1) c++;
      task.innerHTML = `${ok1 ? '✅' : '❌'} ${esc(r.task.split('.')[0])}: <b>${esc(SP[r.who].n)}</b>. 2️⃣ ¿Qué dices como moderador?`;
      const opts = shuffle([r.g, ...r.b]);
      const ok2 = await ask(body, opts.map(o => `🎙️ ${esc(o)}`), opts.indexOf(r.g), 'g6c-one');
      if (ok2) c++;
      ap = Math.max(5, Math.min(100, ap + (ok1 ? 6 : -6) + (ok2 ? 8 : -10)));
      $('.g6c-ap i', hall).style.width = ap + '%'; $('.g6c-crowd b', hall).textContent = ap + '%';
      hall.appendChild(h(`<div class="g6c-react">${ok2 ? '👏👏👏' : '😬'}</div>`));
      if (!(ok1 && ok2)) missed.push({ en: r.g, au: r.gau });
      await say(body, ok2, r.g, '💡 ' + esc(r.why), r.gau);
    }
    if (live(stage)) {
      const body = head(stage, { lbl: 'Game', title: '🗳️ Encuesta del público', ins: '' });
      body.appendChild(h(`<div class="g6c-poll"><p>Was the moderator fair and effective?</p><div><span>👍 Yes</span><i style="--w:${ap}%"></i><b>${ap}%</b></div><div><span>👎 No</span><i class="n" style="--w:${100 - ap}%"></i><b>${100 - ap}%</b></div></div>`));
      await sleep(1100);
    }
    return finish(c, R.length * 2, 'reading', missed, '🏛️ Moderación', '¡Moderas un debate con autoridad y respeto! 🎙️');
  }

  /* =====================================================================
     t21p1 — CUENTA REGRESIVA (condicionales invertidas)
     ===================================================================== */
  const ROCKET = `<svg viewBox="0 0 80 150" class="g6c-rocket" aria-hidden="true"><path d="M40 4 C58 22 62 52 60 96 L20 96 C18 52 22 22 40 4Z" fill="#fff" stroke="#0B2A5B" stroke-width="4"/>
    <circle cx="40" cy="48" r="10" fill="#1D5FD1" stroke="#0B2A5B" stroke-width="4"/><path d="M20 70 L4 104 L20 98Z M60 70 L76 104 L60 98Z" fill="#E3242B" stroke="#0B2A5B" stroke-width="3"/>
    <rect x="28" y="96" width="24" height="10" fill="#0B2A5B"/><path class="flame" d="M30 108 Q40 146 50 108Z" fill="#FFB020"/><path class="flame2" d="M34 108 Q40 132 46 108Z" fill="#E3242B"/></svg>`;
  async function spaceCountdown(stage, p) {
    const R = sample(G().launch || [], 6); let c = 0; const missed = []; const N = R.length;
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🚀 Cuenta regresiva', ins: 'Reescribe la condicional con <b>inversión</b> (Had… / Were… to… / Should…). Escribe o toca las palabras. Cada respuesta correcta carga combustible al cohete.', count: `${k + 1} / ${N}` });
      const pad = h(`<div class="g6c-pad"><div class="g6c-sky">${ROCKET}</div><div class="g6c-cd"><small>COUNTDOWN</small><b>T-${N - k}</b><div class="g6c-fuel">${R.map((_, i) => `<i class="${i < c ? 'on' : ''}"></i>`).join('')}</div><span>⛽ ${c}/${N}</span></div></div>`);
      body.appendChild(pad);
      body.appendChild(h(`<div class="g6c-src"><small>ORIGINAL</small><p>${esc(r.src)}</p><small>REWRITE ✍️</small><p class="g6c-frame">${esc(r.frame).replace('___', '<u>______</u>')}</p></div>`));
      const inp = h(`<input class="inp g6c-inp" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe aquí…">`); body.appendChild(inp);
      const chips = h(`<div class="g6c-chips">${shuffle(r.chips.slice()).map(w => `<button class="g6c-chip">${esc(w)}</button>`).join('')}<button class="g6c-chip del" title="Borrar la última palabra">⌫</button></div>`); body.appendChild(chips);
      const frameU = $('.g6c-frame u', body); const upd = () => { frameU.textContent = inp.value.trim() || '______'; };
      inp.addEventListener('input', upd);
      $$('.g6c-chip', chips).forEach(b => b.onclick = () => { sfx('tap'); if (b.classList.contains('del')) inp.value = inp.value.trim().split(/\s+/).slice(0, -1).join(' '); else inp.value = (inp.value.trim() + ' ' + b.textContent).trim(); upd(); });
      const ok = await new Promise(res => { const bar = h(`<div class="actionbar"><button class="btn k lg">Comprobar ✓</button></div>`); body.appendChild(bar);
        $('button', bar).onclick = () => { if (!inp.value.trim()) { M.toast('Escribe o toca las palabras primero ✍️'); return; } bar.remove(); inp.disabled = true; $$('button', chips).forEach(b => b.disabled = true); res(nrm(inp.value) === nrm(r.a)); }; });
      if (ok) { c++; pad.classList.add('fuel'); $$('.g6c-fuel i', pad)[c - 1].classList.add('on'); $('.g6c-cd span', pad).textContent = `⛽ ${c}/${N}`; }
      else { missed.push({ en: r.full, au: r.au }); pad.classList.add('nofuel'); }
      frameU.textContent = r.a; frameU.classList.add(ok ? 'ok' : 'fix');
      await say(body, ok, r.full, esc(r.es), r.au);
    }
    if (live(stage)) {
      const go = c >= Math.ceil(N / 2);
      const body = head(stage, { lbl: 'Game', title: go ? '🚀 ¡Despegue!' : '🛑 Misión abortada', ins: go ? 'Tenías suficiente combustible. ¡Rumbo a Marte!' : 'No hubo suficiente combustible. Repasa la inversión y vuelve a intentarlo.' });
      const sc = h(`<div class="g6c-launch ${go ? 'go' : 'abort'}"><div class="g6c-stars"></div>${ROCKET}<b>${go ? 'T-0 · LIFTOFF!' : 'ABORT'}</b></div>`); body.appendChild(sc);
      sfx(go ? 'win' : 'bad'); await sleep(1800);
    }
    return finish(c, N, 'writing', missed, '🚀 Inversiones correctas', '¡Dominas las condicionales invertidas! Had you not practiced, you wouldn\'t be here. 🪐');
  }

  Object.assign(window.M1A, { aiArgumentForge, globeRebuttalDuel, feedFallacyFlag, justiceNuanceDial, eduEssayRedPen, demoTownHall, spaceCountdown });
})();
