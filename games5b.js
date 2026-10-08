/* =====================================================================
   JUEGOS ÚNICOS DEL MÓDULO 3 (B2) — temas 8 a 13 (una dinámica distinta en cada clase)
   t8p1 specShowdown · t8p2 awardsNight · t9p1 thenNow · t9p2 cultureShock
   t10p1 limitGauge · t10p2 genieLamp · t11p1 pantryScan · t11p2 conciergeDesk
   t12p1 halfFull · t12p2 chartTalk · t13p1 bridgeBuilder · t13p2 investorPitch
   ===================================================================== */
(function () {
  const M = window.M1, A = window.M1A;
  const { $, $$, h, esc, shuffle, sample, sleep, play, stop, sfx, sheet } = M;
  const { head, result } = A;
  const G = () => window.M1G5B || {};
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
  const gap = (s, fill) => esc(s).replace('___', fill ? `<u>${esc(fill)}</u>` : '<u>&nbsp;?&nbsp;</u>');
  const choose = (btns) => new Promise(r => btns.forEach((b, k) => b.onclick = () => r(k)));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ====== t8p1 — DUELO DE ESPECIFICACIONES ====== */
  const fmt = (v, u) => u === '$' ? '$' + Number(v).toLocaleString('en-US') : `${v}${u === '★' || u === '°F' ? '' : ' '}${u}`;
  async function specShowdown(stage, p) {
    const R = sample(G().spec || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const mx = Math.max(r.va, r.vb) || 1;
      const body = head(stage, { lbl: 'Game', title: '⚔️ Duelo de especificaciones', ins: 'Compara los datos y elige la oración <b>más precisa</b>: ¿la diferencia es enorme (<i>far, much, twice</i>), pequeña (<i>slightly, a bit</i>) o no hay diferencia (<i>as … as</i>)?', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g5b-duel"><div class="g5b-cat">${esc(r.cat)}</div>
        <div class="g5b-fight"><div class="g5b-fighter a"><span class="e">${r.a[0]}</span><b>${esc(r.a[1])}</b><i>${fmt(r.va, r.unit)}</i></div>
        <div class="g5b-vs">VS</div>
        <div class="g5b-fighter b"><span class="e">${r.b[0]}</span><b>${esc(r.b[1])}</b><i>${fmt(r.vb, r.unit)}</i></div></div>
        <div class="g5b-bars"><div class="a"><span style="width:${(r.va / mx * 100).toFixed(1)}%"></span></div><div class="b"><span style="width:${(r.vb / mx * 100).toFixed(1)}%"></span></div></div></div>`));
      const opts = shuffle([r.ok, ...r.bad]);
      const ok = await ask(body, opts.map(esc), opts.indexOf(r.ok), 'g5b-col');
      const diff = r.vb ? Math.round((r.va - r.vb) / r.vb * 100) : 0;
      body.appendChild(h(`<div class="g5b-meter"><span>Diferencia</span><b>${diff > 0 ? '+' : ''}${diff}%</b><em>${Math.abs(diff) < 1 ? '🟰 none' : Math.abs(diff) < 10 ? '↗️ small' : '⬆️ big'}</em></div>`));
      if (ok) c++; else missed.push({ en: r.ok, au: r.au });
      await say(body, ok, r.ok, r.es, r.au);
    }
    return finish(c, R.length, 'reading', missed, '⚔️ Duelos', '¡Comparas como un analista profesional! 📊');
  }

  /* ====== t8p2 — NOCHE DE PREMIOS ====== */
  async function awardsNight(stage, p) {
    const R = sample(G().awards || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🏆 Noche de premios', ins: 'Eres el presentador de la gala. Abre el <b>sobre dorado</b> con la palabra que completa la frase ganadora.', count: `${k + 1} / ${R.length}` });
      const shelf = Array.from({ length: R.length }, (_, i) => `<i class="${i < c ? 'won' : ''}">🏆</i>`).join('');
      body.appendChild(h(`<div class="g5b-gala"><div class="g5b-shelf">${shelf}</div><div class="g5b-spot"></div>
        <div class="g5b-award"><span class="e">${r.e}</span><small>And the award for</small><b>${esc(r.cat)}</b><small>goes to…</small></div>
        <div class="g5b-quote">“${gap(r.s)}”</div></div>`));
      const opts = shuffle([r.a, ...r.o]);
      const wrap = h(`<div class="g5b-envs">${opts.map(o => `<button class="g5b-env"><span class="seal">★</span><b>${esc(o)}</b></button>`).join('')}</div>`); body.appendChild(wrap);
      const btns = $$('button', wrap); const i = await choose(btns); const ok = opts[i] === r.a;
      btns.forEach(b => b.disabled = true); btns[i].classList.add('open'); btns[opts.indexOf(r.a)].classList.add('win'); if (!ok) btns[i].classList.add('lose');
      $('.g5b-quote', body).innerHTML = `“${gap(r.s, r.a)}”`;
      if (ok) { c++; $('.g5b-gala', body).classList.add('lit'); $$('.g5b-shelf i', body)[c - 1].classList.add('won'); }
      else missed.push({ en: r.full, au: r.au });
      await say(body, ok, r.full, r.es, r.au);
    }
    return finish(c, R.length, 'reading', missed, '🏆 Premios entregados', '¡La gala fue un éxito rotundo! 🎬');
  }

  /* ====== t9p1 — ANTES Y AHORA ====== */
  async function thenNow(stage, p) {
    const T = sample(G().then || [], 4), W = sample(G().would || [], 3);
    const R = [T[0], W[0], T[1], W[1], T[2], W[2], T[3]].filter(Boolean); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const isW = 'ok' in r && 'why' in r; let ok;
      if (!isW) {
        const body = head(stage, { lbl: 'Game', title: '📸 Antes y ahora', ins: 'Mira el álbum de fotos: así era la vida <b>antes</b> y así es <b>ahora</b>. Elige la oración <b>correcta</b> con <i>used to / would / didn\'t use to</i>.', count: `${k + 1} / ${R.length}` });
        body.appendChild(h(`<div class="g5b-album"><div class="g5b-pol then"><span>${r.t}</span><small>1995</small></div><div class="g5b-arr">➜</div><div class="g5b-pol now"><span>${r.n}</span><small>2026</small></div></div>`));
        const opts = shuffle([r.a, ...r.o]);
        ok = await ask(body, opts.map(esc), opts.indexOf(r.a), 'g5b-col');
        if (ok) c++; else missed.push({ en: r.a, au: r.au });
        await say(body, ok, r.a, r.es, r.au);
      } else {
        const body = head(stage, { lbl: 'Game', title: '📔 ¿Would funciona?', ins: 'Lee la frase del diario del abuelo. ¿Se puede usar <b>would</b> (acción repetida) o <b>solo used to</b> (estado: <i>live, have, own, be</i>)?', count: `${k + 1} / ${R.length}` });
        body.appendChild(h(`<div class="g5b-diary"><small>Grandpa's diary · 1978</small><p>${esc(r.s).replace('would', '<u>would</u>')}</p></div>`));
        const opts = ['🔁 Sí, <b>would</b> funciona', '🏠 No: solo <b>used to</b>'];
        ok = await ask(body, opts, r.ok ? 0 : 1, 'g3-two');
        if (ok) c++; else missed.push({ en: r.why, au: r.au });
        await say(body, ok, r.ok ? r.s : r.why.split('→ ').pop(), r.why, r.au);
      }
    }
    return finish(c, R.length, 'reading', missed, '📸 Recuerdos', '¡Hablas del pasado como un nativo! 🕰️');
  }

  /* ====== t9p2 — CHOQUE CULTURAL ====== */
  function gaugeSVG(lv) {
    const ang = [-62, 0, 62][lv];
    return `<svg viewBox="0 0 200 118" class="g5b-gsvg"><path d="M20 105 A80 80 0 0 1 60 36" stroke="#E3242B" stroke-width="18" fill="none"/><path d="M64 33 A80 80 0 0 1 136 33" stroke="#F5B700" stroke-width="18" fill="none"/><path d="M140 36 A80 80 0 0 1 180 105" stroke="#16A34A" stroke-width="18" fill="none"/>
      <g class="ndl" style="transform:rotate(${ang}deg)"><line x1="100" y1="105" x2="100" y2="38" stroke="#0B2A5B" stroke-width="6" stroke-linecap="round"/></g><circle cx="100" cy="105" r="10" fill="#0B2A5B"/>
      <text x="16" y="116" font-size="16">😰</text><text x="91" y="18" font-size="16">😐</text><text x="168" y="116" font-size="16">😎</text></svg>`;
  }
  async function cultureShock(stage, p) {
    const R = sample(G().shock || [], 6); let c = 0; const missed = [];
    const MO = ['Month 1', 'Month 4', 'Month 12'], MOes = ['Mes 1: todo es nuevo 😰', 'Mes 4: en proceso 😐', 'Mes 12: ¡ya es normal! 😎'];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🧳 Choque cultural', ins: 'Lucía se mudó de Madrid a Atlanta. Mira el <b>mes</b> y el <b>medidor de adaptación</b>, y elige la oración correcta: <i>isn\'t used to</i> · <i>is getting used to</i> · <i>is used to</i>.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g5b-shock"><div class="g5b-tl">${MO.map((m, i) => `<span class="${i === r.lv ? 'on' : ''}">${m}</span>`).join('')}</div>
        <div class="g5b-shock-in"><div class="g5b-sit"><span>${r.e}</span><b>${esc(r.es)}</b><small>${MOes[r.lv]}</small></div><div class="g5b-gauge">${gaugeSVG(r.lv)}</div></div>
        <div class="g5b-adapt"><i style="width:${(k / R.length * 100).toFixed(0)}%"></i><small>Lucía's adaptation ${Math.round(k / R.length * 100)}%</small></div></div>`));
      const opts = shuffle([r.a, ...r.o]);
      const ok = await ask(body, opts.map(esc), opts.indexOf(r.a), 'g5b-col');
      if (ok) c++; else missed.push({ en: r.a, au: r.au });
      await say(body, ok, r.a, r.lv === 1 ? 'get used to = proceso (acostumbrarse)' : 'be used to + -ing / sustantivo = estar acostumbrado', r.au);
    }
    return finish(c, R.length, 'reading', missed, '🧳 Adaptación', '¡Lucía ya se siente en casa en Atlanta! 🍑');
  }

  /* ====== t10p1 — EL PUESTO DE CONTROL ====== */
  async function limitGauge(stage, p) {
    const R = sample(G().gauge || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const mx = Math.max(r.val, r.req) * 1.25;
      const body = head(stage, { lbl: 'Game', title: '🚧 Puesto de control', ins: 'Eres el inspector. Compara el <b>valor</b> con el <b>requisito</b>: primero pon el sello <b>PASS</b> o <b>STOP</b>, luego elige la oración con <i>too</i> o <i>enough</i>.', count: `${k + 1} / ${R.length}` });
      const unit = r.unit === '$' ? '' : ' ' + r.unit; const v = (x) => r.unit === '$' ? '$' + x : x + unit;
      const card = h(`<div class="g5b-check"><div class="g5b-ck-h"><span>${r.e}</span><div><b>${esc(r.what)}</b><small>${esc(r.who)}</small></div><em class="g5b-stamp"></em></div>
        <div class="g5b-track"><span class="val ${r.pass ? 'ok' : 'no'}" style="width:${(r.val / mx * 100).toFixed(1)}%"><i>${esc(r.lbl)}: ${v(r.val)}</i></span>
        <span class="req" style="left:${(r.req / mx * 100).toFixed(1)}%"><i>${r.kind === 'min' ? 'min' : 'max'} ${v(r.req)}</i></span></div></div>`); body.appendChild(card);
      const sw = h(`<div class="g5b-stamps"><button class="g5b-sbtn pass">✅ PASS</button><button class="g5b-sbtn stop">⛔ STOP</button></div>`); body.appendChild(sw);
      const sb = $$('button', sw); const si = await choose(sb); sb.forEach(b => b.disabled = true);
      const stampOk = (si === 0) === r.pass; const st = $('.g5b-stamp', card); st.textContent = r.pass ? 'PASS' : 'STOP'; st.className = 'g5b-stamp on ' + (r.pass ? 'ok' : 'no');
      sfx(stampOk ? 'ok' : 'bad'); if (!stampOk) M.toast(r.pass ? '👀 Mira bien: sí cumple el requisito.' : '👀 Mira bien: no cumple el requisito.');
      await sleep(350); sw.remove();
      const opts = shuffle([r.a, ...r.o]);
      const ok = await ask(body, opts.map(esc), opts.indexOf(r.a), 'g5b-col');
      if (ok) c++; else missed.push({ en: r.a, au: r.au });
      await say(body, ok, r.a, r.es, r.au);
    }
    return finish(c, R.length, 'reading', missed, '🚧 Inspecciones', '¡Inspector certificado de too y enough! 🛂');
  }

  /* ====== t10p2 — LA LÁMPARA DEL GENIO ====== */
  async function genieLamp(stage, p) {
    const R = sample(G().genie || [], 6); let c = 0; const missed = [];
    const TY = [['now', '🕐 Presente', 'wish + past'], ['past', '⏪ Pasado', 'wish + had + participio'], ['would', '😤 Queja', 'wish + would']];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🧞 La lámpara del genio', ins: 'Alguien frota la lámpara y se queja. 1️⃣ ¿Qué tipo de deseo es? 2️⃣ Formula el deseo <b>correctamente</b> para que el genio lo cumpla.', count: `Deseo ${k + 1} / ${R.length}` });
      const scene = h(`<div class="g5b-genie"><div class="g5b-lamps">${R.map((_, i) => `<i class="${i < k ? 'used' : ''}">🪔</i>`).join('')}</div>
        <div class="g5b-comp"><span class="who">${['🙍🏽‍♀️', '🙍🏻‍♂️', '🧑🏾', '👩🏼', '👨🏽‍🦱', '👩🏻‍🦱', '🧔🏻', '👱🏾‍♀️'][k % 8]}</span><div class="bubble">“${esc(r.c)}”<small>${esc(r.es)}</small></div></div>
        <div class="g5b-lamp"><span class="smoke"></span><span class="gen">🧞</span><span class="lp">🪔</span></div></div>`); body.appendChild(scene);
      center(body, rep(r.cau));
      play(r.cau);
      const tw = h(`<div class="g5b-types">${TY.map(t => `<button class="g5b-type"><b>${t[1]}</b><small>${t[2]}</small></button>`).join('')}</div>`); body.appendChild(tw);
      const tb = $$('button', tw); const ti = await choose(tb); tb.forEach(b => b.disabled = true);
      const tc = TY.findIndex(t => t[0] === r.t); tb[tc].classList.add('right'); if (ti !== tc) { tb[ti].classList.add('wrong'); M.toast(`Es ${TY[tc][1]} → ${TY[tc][2]}`); sfx('bad'); } else sfx('ok');
      await sleep(400);
      const opts = shuffle([r.a, ...r.o]);
      const ok = await ask(body, opts.map(o => `✨ ${esc(o)}`), opts.indexOf(r.a), 'g5b-col');
      if (ok) { c++; scene.classList.add('granted'); } else scene.classList.add('poof');
      if (!ok) missed.push({ en: r.a, au: r.au });
      await say(body, ok, r.a, ok ? '🧞 “Your wish is my command!”' : TY[tc][2], r.au);
    }
    return finish(c, R.length, 'writing', missed, '🧞 Deseos concedidos', '¡El genio está impresionado con tu gramática! ✨');
  }

  /* ====== t11p1 — EL ESCÁNER DE LA DESPENSA ====== */
  async function pantryScan(stage, p) {
    const P = G().pantry || { items: [], qs: [] }; const R = sample(P.qs, 6); let c = 0; const missed = [];
    const shelf = () => `<div class="g5b-pantry">${P.items.map(it => `<div class="g5b-pi" data-k="${it.k}"><div class="g5b-pv">${it.n != null
      ? (it.n ? `<span class="cnt">${it.e.repeat(Math.min(it.n, 9))}</span>` : '<span class="cnt empty">∅</span>')
      : `<span class="jar"><i style="height:${it.lvl}%"></i><b style="${it.lvl ? '' : 'opacity:.3'}">${it.e}</b></span>${it.lvl ? '' : '<em class="g5b-out">EMPTY</em>'}`}</div><small>${esc(it.lbl)}</small></div>`).join('')}</div>`;
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '📡 Escáner de la despensa', ins: 'Tu roommate pregunta qué hay en la cocina. Mira el <b>escáner</b> 🔍 y responde con <i>much, many, some, any, a lot of</i> o envases.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g5b-fridge"><div class="g5b-fh"><span>🧊 SMART PANTRY</span><span class="led"></span></div>${shelf()}</div>`));
      const it = $(`.g5b-pi[data-k="${r.k}"]`, body); if (it) it.classList.add('scan');
      body.appendChild(h(`<div class="g3-sent">“${esc(r.q)}”<small>${esc(r.es)}</small></div>`)); center(body, rep(r.qau)); play(r.qau);
      const opts = shuffle([r.a, ...r.o]);
      const ok = await ask(body, opts.map(esc), opts.indexOf(r.a), 'g5b-col');
      if (ok) c++; else missed.push({ en: r.a, au: r.au });
      await say(body, ok, r.a, '', r.au);
    }
    return finish(c, R.length, 'listening', missed, '📡 Escaneos', '¡Tu despensa está bajo control! 🛒');
  }

  /* ====== t11p2 — LA RECEPCIÓN DEL HOTEL ====== */
  async function conciergeDesk(stage, p) {
    const D = G().desk || []; const good = shuffle(D.filter(x => x.ok)).slice(0, 2), badL = shuffle(D.filter(x => !x.ok)).slice(0, 4);
    const R = shuffle([...good, ...badL]); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🛎️ Recepción del hotel', ins: 'Eres el conserje del <b>Bayview Hotel</b> en San Diego. Lee la solicitud del huésped: ¿está <b>bien escrita</b>? Si tiene un error, elige la versión correcta.', count: `Huésped ${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g5b-desk"><div class="g5b-stars">${Array.from({ length: R.length }, (_, i) => `<i class="${i < c ? 'on' : ''}">★</i>`).join('')}</div>
        <div class="g5b-guest"><span>${r.g}</span><em>🔑 ${r.room}</em></div>
        <div class="g5b-card"><small>GUEST REQUEST · Room ${r.room}</small><p>${esc(r.s)}</p></div><div class="g5b-counter"><span>🛎️</span></div></div>`));
      const ok1 = await ask(body, ['✅ Está correcta', '✏️ Tiene un error'], r.ok ? 0 : 1, 'g3-two');
      let ok = ok1;
      if (!r.ok) {
        if (!ok1) { sfx('bad'); M.toast('Esta solicitud tiene un error. ¡Corrígela!'); } else sfx('ok');
        await sleep(300);
        body.appendChild(h(`<p class="center g3-st">✏️ ¿Cuál es la versión correcta?</p>`));
        const opts = shuffle([r.fix, r.s, ...r.o]).filter((x, i, a) => a.indexOf(x) === i);
        const ok2 = await ask(body, opts.map(esc), opts.indexOf(r.fix), 'g5b-col');
        ok = ok1 && ok2;
      }
      if (ok) c++; else missed.push({ en: r.fix, au: r.au });
      await say(body, ok, r.fix, r.why, r.au);
    }
    return finish(c, R.length, 'writing', missed, '🛎️ Huéspedes felices', '¡Cinco estrellas para tu servicio! ⭐⭐⭐⭐⭐');
  }

  /* ====== t12p1 — ¿MEDIO LLENO O MEDIO VACÍO? ====== */
  function glassSVG(pct) {
    const y = 150 - pct * 1.25;
    return `<svg viewBox="0 0 100 160" class="g5b-glass"><defs><clipPath id="g5bcl"><path d="M14 12 L86 12 L76 150 L24 150 Z"/></clipPath></defs>
      <rect x="0" y="${y.toFixed(1)}" width="100" height="160" fill="#7CC4FA" clip-path="url(#g5bcl)" class="wtr"/><path d="M14 12 L86 12 L76 150 L24 150 Z" fill="none" stroke="#0B2A5B" stroke-width="5" stroke-linejoin="round"/></svg>`;
  }
  async function halfFull(stage, p) {
    const R = shuffle(G().half || []).slice(0, 7); let c = 0; const missed = []; const W = ['a few', 'few', 'a little', 'little'];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const isO = r.w === 'O'; const start = r.s.startsWith('___');
      const body = head(stage, { lbl: 'Game', title: '🥛 ¿Medio lleno o medio vacío?', ins: '<b>Olivia</b> es optimista 😃 (<i>a few / a little</i> = alcanza) y <b>Pete</b> es pesimista 😟 (<i>few / little</i> = casi nada). Completa lo que dice cada uno.', count: `${k + 1} / ${R.length}` });
      body.appendChild(h(`<div><div class="g5b-hf"><div class="g5b-pp ${isO ? 'on' : ''}"><span>😃</span><b>Olivia</b><small>Optimist</small></div>
        <div class="g5b-gl">${glassSVG(Math.min(100, 20 + c * 12))}</div>
        <div class="g5b-pp ${!isO ? 'on' : ''}"><span>😟</span><b>Pete</b><small>Pessimist</small></div></div>
        <div class="g5b-say ${isO ? 'o' : 'p'}">“${gap(r.s)}”</div></div>`));
      const labels = W.map(w => start ? cap(w) : w);
      const ci = W.indexOf(r.a.toLowerCase());
      const ok = await ask(body, labels.map(esc), ci, 'g5b-four');
      $('.g5b-say', body).innerHTML = `“${gap(r.s, r.a)}”`;
      if (ok) { c++; const g = $('.g5b-gl', body); if (g) g.innerHTML = glassSVG(Math.min(100, 20 + c * 12)); }
      else missed.push({ en: r.full, au: r.au });
      await say(body, ok, r.full, r.es, r.au);
    }
    return finish(c, R.length, 'reading', missed, '🥛 Vasos llenos', '¡Ves el vaso medio lleno… y la gramática completa! 😃');
  }

  /* ====== t12p2 — EL TABLERO DE DATOS ====== */
  function chartSVG(r) {
    if (r.pct != null) {
      const C = 2 * Math.PI * 40, d = C * r.pct / 100;
      return `<svg viewBox="0 0 120 120" class="g5b-donut"><circle cx="60" cy="60" r="40" fill="none" stroke="#E5ECF7" stroke-width="18"/><circle cx="60" cy="60" r="40" fill="none" stroke="#E3242B" stroke-width="18" stroke-dasharray="${d.toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 60 60)"/><text x="60" y="67" text-anchor="middle" font-size="22" font-weight="800" fill="#0B2A5B">${r.pct}%</text></svg>`;
    }
    const mx = Math.max(...r.bars.map(b => b[1])) || 1;
    return `<div class="g5b-hbars">${r.bars.map((b, i) => `<div><small>${esc(b[0])}</small><span><i class="c${i}" style="width:${Math.max(2, b[1] / mx * 100).toFixed(1)}%"></i></span><b>${Number(b[1]).toLocaleString('en-US')}</b></div>`).join('')}</div>`;
  }
  async function chartTalk(stage, p) {
    const R = sample(G().chart || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '📊 Informe de la encuesta', ins: 'Eres analista de datos y presentas los resultados al jefe. Mira la gráfica y elige la frase <b>correcta</b>: <i>fewer / less, plenty of, hardly any, the majority, a handful, a great deal of…</i>', count: `Slide ${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g5b-dash"><div class="g5b-dh"><span>📈 Denver Workplace Survey</span><small>n = 5,000</small></div><h4>${esc(r.t)}</h4>${chartSVG(r)}</div>`));
      const opts = shuffle([r.a, ...r.o]);
      const ok = await ask(body, opts.map(esc), opts.indexOf(r.a), 'g5b-col');
      if (ok) c++; else missed.push({ en: r.a, au: r.au });
      await say(body, ok, r.a, r.es, r.au);
    }
    return finish(c, R.length, 'reading', missed, '📊 Slides presentados', '¡Tu informe convenció a toda la junta directiva! 💼');
  }

  /* ====== t13p1 — CONSTRUYE EL PUENTE ====== */
  async function bridgeBuilder(stage, p) {
    const R = sample(G().bridge || [], 6); let c = 0; const missed = [];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k];
      const body = head(stage, { lbl: 'Game', title: '🌉 Construye el puente', ins: 'Une las dos ideas con el <b>tablón</b> correcto. Recuerda: <i>although</i> + oración · <i>despite</i> + sustantivo/-ing · <i>However,</i> inicia oración nueva.', count: `Puente ${k + 1} / ${R.length}` });
      const scene = h(`<div class="g5b-bridge"><div class="g5b-cliff l"><span class="car">🚗</span></div><div class="g5b-gap"><span class="plank"></span><span class="river">🌊🌊</span></div><div class="g5b-cliff r"><span>🏁</span></div></div>`); body.appendChild(scene);
      const txt = h(`<div class="g5b-btext"><span class="l">${gap(r.l)}</span> <span class="r">${gap(r.r)}</span></div>`); body.appendChild(txt);
      const opts = shuffle([r.a, ...r.o]);
      const wrap = h(`<div class="g5b-planks">${opts.map(o => `<button class="g5b-plank">${esc(o)}</button>`).join('')}</div>`); body.appendChild(wrap);
      const btns = $$('button', wrap); const i = await choose(btns); const ok = opts[i] === r.a;
      btns.forEach(b => b.disabled = true); btns[opts.indexOf(r.a)].classList.add('right');
      $('.plank', scene).textContent = r.a;
      if (ok) { scene.classList.add('built'); await sleep(50); scene.classList.add('go'); c++; }
      else { btns[i].classList.add('wrong'); scene.classList.add('fall'); }
      txt.innerHTML = `<span class="l">${gap(r.l, r.a)}</span> <span class="r">${gap(r.r, r.a)}</span>`;
      await sleep(700);
      if (!ok) missed.push({ en: r.full, au: r.au });
      await say(body, ok, r.full, r.why, r.au);
    }
    return finish(c, R.length, 'reading', missed, '🌉 Puentes', '¡Ingeniero experto en conectores! 👷');
  }

  /* ====== t13p2 — RONDA DE INVERSIONISTAS ====== */
  async function investorPitch(stage, p) {
    const R = (G().pitch || []).slice(); let c = 0; const missed = [];
    const INV = [['🧔🏽', 'Ray'], ['👩🏻‍💼', 'Lori'], ['👨🏿‍💼', 'Marcus']];
    for (let k = 0; k < R.length && live(stage); k++) {
      const r = R[k]; const pct = Math.round(c / R.length * 100);
      const body = head(stage, { lbl: 'Game', title: '🦈 Ronda de inversionistas', ins: 'Presentas tu startup <b>“FlowDesk”</b> ante 3 inversionistas. Elige el <b>conector</b> que hace tu argumento más convincente: añadir ➕, resultado ➡️, contraste ⚖️, conclusión 🎯.', count: `Slide ${k + 1} / ${R.length}` });
      body.appendChild(h(`<div class="g5b-tank"><div class="g5b-invs">${INV.map((x, i) => `<div class="${pct >= (i + 1) * 28 ? 'in' : ''}"><span>${x[0]}</span><b>${x[1]}</b><small>${pct >= (i + 1) * 28 ? "I'm in! 🤝" : '🤔'}</small></div>`).join('')}</div>
        <div class="g5b-pm"><i style="width:${pct}%"></i><small>Persuasion ${pct}%</small></div>
        <div class="g5b-slide"><span class="ic">${r.ic}</span><p>${gap(r.s)}</p></div></div>`));
      const opts = shuffle([r.a, ...r.o]);
      const ok = await ask(body, opts.map(esc), opts.indexOf(r.a), 'g3-three');
      $('.g5b-slide p', body).innerHTML = gap(r.s, r.a);
      if (ok) c++; else missed.push({ en: r.full, au: r.au });
      await say(body, ok, r.full, r.why, r.au);
    }
    if (live(stage)) {
      const deal = c >= R.length - 2;
      const body = head(stage, { lbl: 'Game', title: deal ? '🤝 ¡Trato hecho!' : '🦈 Sin trato… esta vez', ins: deal ? 'Los tres inversionistas aceptan: <b>$500,000 por el 10 %</b> de FlowDesk.' : 'Tu argumento necesita conectores más claros. ¡Inténtalo de nuevo!' });
      body.appendChild(h(`<div class="g5b-deal ${deal ? 'yes' : 'no'}"><span>${deal ? '🤝💰🚀' : '🦈📉'}</span><b>${c} / ${R.length}</b></div>`));
      await waitBtn(body, 'Ver resultado →');
    }
    return finish(c, R.length, 'writing', missed, '🦈 Argumentos', '¡Conseguiste la inversión! 💰🚀');
  }

  Object.assign(window.M1A, { specShowdown, awardsNight, thenNow, cultureShock, limitGauge, genieLamp, pantryScan, conciergeDesk, halfFull, chartTalk, bridgeBuilder, investorPitch });
})();
