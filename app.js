/* =====================================================================
   APP — pantallas: bienvenida, inicio, clase (estructura mrarrieta.com),
   resultados, progreso, examen final, desbloqueo
   ===================================================================== */
(function () {
  const M = window.M1, A = window.M1A;
  const { D, C, S, $, $$, h, esc, shuffle, sample, sleep, photo, play, stop, sfx, sheet, good, bad, save } = M;
  const app = $('#app');
  const SKILLS = [['listening', '🎧', 'Listening'], ['reading', '📖', 'Reading'], ['speaking', '🗣️', 'Speaking'], ['writing', '✍️', 'Writing']];
  const SKILL_TIPS = {
    listening: 'Escucha cada audio 2 veces: la primera para entender la idea y la segunda para los detalles. Puedes repetir cada audio las veces que quieras con 🔊.',
    reading: 'Lee en voz alta mientras escuchas la lectura. Subraya mentalmente las palabras que no conoces y búscalas en la Explanation.',
    speaking: 'Graba tu voz y compárala con el nativo. Exagera los sonidos que no existen en español (th, h aspirada, vocales largas).',
    writing: 'Escribe cada palabra nueva 3 veces y luego úsala en una oración. Revisa mayúsculas (I, países, días) y el punto final.'
  };

  /* ---------------- top bar ---------------- */
  function topbar() {
    const tb = $('#topbar');
    tb.innerHTML = `<div class="brand" id="go-home"><span class="logo-pill"><img class="logo" src="mra-brand.png" alt="mrarrieta.com"></span><small>MÓDULO 1 · A1</small></div><div class="sp"></div>
      <span class="pill y" title="Puntos de experiencia">⚡ ${S.xp} XP</span>
      <span class="pill hide-s" title="Días seguidos estudiando">🔥 ${S.streak.n || 0}</span>
      <button class="iconbtn chat-ic" id="chat-tb" title="Chat con mi profe" aria-label="Chat con mi profe"><svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><path d="M13 4C7.5 4 3 7.8 3 12.5c0 2.6 1.4 4.9 3.6 6.5L5.8 23.5l4.6-2.6c.8.2 1.7.3 2.6.3 5.5 0 10-3.8 10-8.5S18.5 4 13 4z" fill="#111"/><circle cx="8.6" cy="12.6" r="1.6" fill="#FFD43B"/><circle cx="13" cy="12.6" r="1.6" fill="#FFD43B"/><circle cx="17.4" cy="12.6" r="1.6" fill="#FFD43B"/><path d="M25.2 12.2c2.3 1.4 3.8 3.6 3.8 6.1 0 1.9-.9 3.7-2.3 5l.9 4-4.2-2.2c-.9.2-1.8.3-2.7.3-3.1 0-5.9-1.3-7.5-3.3" fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><i class="fbadge hidden" id="chat-n"></i></button>${S.dictHidden ? '<button class="iconbtn" id="dict-b" title="Diccionario">🔎</button>' : ''}<button class="iconbtn" id="menu-b" title="Menú">☰</button>`;
    $('#go-home', tb).onclick = () => { stop(); route('home'); };
    $('#menu-b', tb).onclick = menu;
    const db = $('#dict-b', tb); if (db) db.onclick = () => window.M1DICT && M1DICT.open();
    const ct = $('#chat-tb', tb); if (ct) ct.onclick = openChat;
    chatFab();
  }
  function menu() {
    const m = M.modal(`<div class="mhead"><h3>☰ Menú</h3><button class="mclose" data-a="close" title="Cerrar">✕</button></div><div style="display:grid;gap:10px;margin-top:10px">
      <button class="btn w block" data-a="home">🏠 Inicio</button>
      <button class="btn w block" data-a="progress">📊 Mi progreso</button>
      <button class="btn w block" data-a="chat">💬 Chat con mi profe</button>
      <button class="btn w block" data-a="unlock">🔑 Tengo un código de acceso</button>
      <button class="btn w block" data-a="remind">🔔 Recordatorio diario</button>
      <button class="btn w block" data-a="dict">${S.dictHidden ? '📌 Mostrar botón flotante del diccionario' : '🙈 Quitar botón flotante del diccionario'}</button>
      <button class="btn w block" data-a="tour">🧭 Ver el tour guiado</button>
      <button class="btn w block" data-a="name">✏️ Cambiar mi nombre</button>
      <button class="btn w block" data-a="sound">${S.sound ? '🔔 Sonidos: activados' : '🔕 Sonidos: desactivados'}</button>
      <button class="btn k block" data-a="close">Cerrar</button></div>`);
    $$('button', m).forEach(b => b.onclick = () => { const a = b.dataset.a; m.remove();
      if (a === 'chat') openChat(); else if (a === 'home' || a === 'progress') route(a); else if (a === 'unlock') unlockModal(); else if (a === 'remind') reminderModal(); else if (a === 'name') onboarding(true); else if (a === 'chath') { M.setBubbleHidden('chatHidden', !S.chatHidden); } else if (a === 'dict') { window.M1DICT && M1DICT.setHidden(!S.dictHidden); } else if (a === 'tour') { route('home'); setTimeout(tour, 400); } else if (a === 'sound') { S.sound = !S.sound; save(); M.toast(S.sound ? 'Sonidos activados 🔔' : 'Sonidos desactivados 🔕'); } });
  }

  /* ---------------- router ---------------- */
  window.addEventListener('m1-open-part', e => route('class', e.detail));
  window.addEventListener('m1-dict-toggle', () => { if ($('#topbar')) topbar(); });
  function route(name, arg) {
    stop(); window.scrollTo(0, 0); topbar();
    if (!S.name) return onboarding();
    if (name === 'home') return home();
    if (name === 'progress') return progress();
    if (name === 'class') return runClass(arg);
    if (name === 'final') return finalTest();
    if (name === 'cert') return certificateView();
    if (name === 'hw') return homeworkOnly(arg);
    if (name === 'chat') return chatScreen();
  }

  /* ---------------- onboarding ---------------- */
  function onboarding(edit) {
    topbar();
    app.innerHTML = `<div class="wrap" style="max-width:620px;padding-top:40px"><div class="card center">
      ${M.mascot('mascot bounce', 'thumbs')}
      <div class="bubble" style="margin:6px auto 18px">Hi! I'm Mr. Arrieta. Welcome! 👋</div>
      <h1 style="font-size:30px">${edit ? 'Cambia tu nombre' : '¡Bienvenido(a) al Módulo 1!'}</h1>
      <p class="muted" style="font-size:17px">${edit ? '' : 'Vas a aprender inglés <b>hablando</b>, escuchando, leyendo y escribiendo. Primero, ¿cómo te llamas?'}</p>
      <input class="inp" id="nm" placeholder="Escribe tu nombre" maxlength="30" value="${esc(S.name)}" style="margin:10px 0 16px">
      <button class="btn k lg block" id="go">${edit ? 'Guardar' : '¡Empezar! 🚀'}</button></div></div>`;
    const i = $('#nm'); i.focus();
    const go = () => { const v = i.value.trim(); if (!v) { i.classList.add('wrong'); return; } S.name = v.replace(/\s+/g, ' ').split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' '); M.touchStreak(); save(); sfx('win'); route('home'); };
    $('#go').onclick = go; i.onkeydown = e => { if (e.key === 'Enter') go(); };
  }


  /* ---------------- TOUR GUIADO (primera vez) ---------------- */
  function tour() {
    if ($('#tour')) return;
    const first = esc(S.name.split(' ')[0]);
    const steps = [
      { mood: 'welcome', t: `¡Hola, ${first}! 👋`, d: 'Soy Mr. Arrieta, tu profe. Te muestro en 1 minuto cómo funciona tu plataforma.' },
      { sel: '.ringbox', mood: 'point', t: 'Tu progreso', d: 'Aquí ves cuánto llevas del Módulo 1 y el botón para <b>empezar o continuar</b> tu clase.' },
      { sel: '.hello .skills', mood: 'idea', t: 'Tus 4 habilidades', d: 'Escuchar 🎧, leer 📖, hablar 🗣️ y escribir ✍️. Las barras suben con cada clase que haces.' },
      { sel: '#tgrid > :first-child', mood: 'pointside', t: 'Los 14 temas', d: 'Cada tema tiene <b>2 clases</b>. Los temas con 🔒 se desbloquean con un <b>código de acceso</b> que te da el profe.' },
      { mood: 'book', t: '¿Cómo es una clase?', d: 'Cada clase sigue el mismo orden: <b>Goal → Speaking → Reading → Explanation → Practice → Oral task → Music → Homework</b>.<br><br>🔊 escucha · 🎤 habla (permite el micrófono) · <b>← Atrás</b> para corregir · tu avance se guarda solo.' },
      { sel: '#dict-fab', mood: 'present', t: 'Tu diccionario', d: '¿No entiendes una palabra? Toca aquí, <b>escríbela o dila en voz alta</b> (en español o inglés) y te doy la respuesta con su pronunciación.' },
      { sel: '#chat-tb', mood: 'present', t: 'Chat con tu profe', d: 'Con este botón le escribes a tu docente cuando tengas dudas. El botón del diccionario lo puedes <b>arrastrar</b> a donde quieras o <b>quitarlo</b> soltándolo en la ✕ del centro.' },
      { sel: '#final-b', mood: 'celebrate', t: 'Examen final', d: 'Al terminar los 14 temas presentas el examen final. Si apruebas, ¡obtienes tu <b>certificado</b> del Módulo 1! 🎓' },
      { sel: '#menu-b', mood: 'watch', t: 'Menú', d: 'Aquí encuentras tu progreso, el código de acceso, el <b>recordatorio diario</b> y este tour por si quieres verlo otra vez.' },
      { mood: 'thumbs', t: '¡Listo! 🚀', d: 'Ya sabes todo lo necesario. Recuerda: un poquito cada día hace la diferencia. ¡Vamos a tu primera clase!', last: true },
    ];
    const ov = h(`<div id="tour"><div class="tour-hole"></div><div class="tour-card"></div></div>`); document.body.appendChild(ov);
    const hole = $('.tour-hole', ov), card = $('.tour-card', ov);
    let i = 0;
    const end = (start) => { ov.remove(); window.removeEventListener('resize', place); window.removeEventListener('scroll', place); S.tourDone = true; save(); if (start) { const nu = nextUp(); if (nu && M.isUnlocked(nu.topic)) route('class', nu.id); } };
    function place() {
      const s = steps[i]; const el = s.sel && $(s.sel);
      if (!el) { hole.style.cssText = 'left:50%;top:40%;width:0;height:0'; card.classList.add('center'); card.style.cssText = ''; return; }
      card.classList.remove('center');
      const r = el.getBoundingClientRect(), pad = 8;
      hole.style.cssText = `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
      const cw = Math.min(380, innerWidth - 24); const ch = card.offsetHeight || 220;
      let top = r.bottom + 16; if (top + ch > innerHeight - 10) top = Math.max(10, r.top - ch - 16);
      let left = Math.min(Math.max(12, r.left + r.width / 2 - cw / 2), innerWidth - cw - 12);
      card.style.cssText = `left:${left}px;top:${top}px;width:${cw}px`;
    }
    function show() {
      const s = steps[i]; const el = s.sel && $(s.sel);
      card.innerHTML = `<div class="tour-in">${M.mascot('tour-mra', s.mood)}<div><div class="tour-n">${i + 1} / ${steps.length}</div><h3>${s.t}</h3><p>${s.d}</p></div></div>
        <div class="tour-bar"><button class="btn w sm" id="tskip">${s.last ? 'Cerrar' : 'Saltar tour'}</button><div class="grow"></div>${i ? '<button class="btn w sm" id="tprev">←</button>' : ''}<button class="btn k" id="tnext">${s.last ? '¡Empezar mi clase! →' : 'Siguiente →'}</button></div>`;
      $('#tskip', card).onclick = () => end(false);
      if (i) $('#tprev', card).onclick = () => { i--; show(); };
      $('#tnext', card).onclick = () => { if (s.last) end(true); else { i++; show(); } };
      if (el) { el.scrollIntoView({ block: 'center' }); setTimeout(place, 60); } else place();
      sfx('tap');
    }
    window.addEventListener('resize', place); window.addEventListener('scroll', place, { passive: true });
    show();
  }


  /* ---------------- CHAT CON MI PROFE (vista previa) ---------------- */
  function chatRoom() { if (!S.sid) { S.sid = 's' + Math.random().toString(36).slice(2, 10); save(); } return S.teacher ? window.M1CHAT.store.room(S.teacher.code, S.sid) : null; }
  function chatCard() {
    if (!window.M1CHAT) return '';
    const room = chatRoom(); const n = room ? M1CHAT.store.unread(room, S.sid) : 0;
    return `<div class="card chat-card">${M.mascot('mascot', 'present')}<div class="grow"><h3 style="margin:0 0 4px">💬 Chat con mi profe ${n ? `<span class="badge-n">${n}</span>` : ''}</h3>
      <p class="muted" style="margin:0 0 10px">${S.teacher ? `Escríbele a <b>${esc(S.teacher.name)}</b> cuando tengas una duda.` : 'Cuando te asignen un docente, podrás escribirle aquí tus dudas.'}</p>
      <button class="btn k sm" id="chat-b">${S.teacher ? 'Abrir chat →' : 'Conectar con mi docente →'}</button></div></div>`;
  }
  function openChat() {
    if ($('.player', app)) {
      const m = M.modal(`<div class="center">${M.mascot('mascot', 'present')}</div><h3 class="center">¿Ir al chat con tu profe?</h3><p class="muted center">Saldrás de la clase. Tu avance queda guardado y podrás continuar donde ibas.</p><div class="row" style="justify-content:center"><button class="btn k" id="cy">Ir al chat</button><button class="btn w" id="cn">Seguir en la clase</button></div>`);
      $('#cy', m).onclick = () => { m.remove(); route('chat'); }; $('#cn', m).onclick = () => m.remove(); return;
    }
    route('chat');
  }
  function chatFab() {
    if (!window.M1CHAT) return;
    const room = S.teacher ? chatRoom() : null; const n = room ? M1CHAT.store.unread(room, S.sid) : 0;
    const bd = $('#chat-n'); if (bd) { bd.textContent = n; bd.classList.toggle('hidden', !n); }
  }
  function chatScreen() {
    const CH = window.M1CHAT; if (!CH) return route('home');
    const demo = CH.demo ? `<div class="chat-demo">🧪 <b>Vista previa.</b> Por ahora los mensajes se guardan solo en este dispositivo. Muy pronto se conectará para hablar con tu docente desde cualquier lugar.</div>` : '';
    if (!S.teacher) {
      app.innerHTML = `<div class="wrap" style="max-width:640px"><div class="card center">${M.mascot('mascot bounce', 'present')}
        <h2 style="margin:8px 0 6px">💬 Chat con mi profe</h2><p class="muted">Escribe el <b>código de tu docente</b>. Te lo entrega la academia cuando te asignan tu profe.</p>
        <input class="inp" id="tcode" placeholder="Ej: PROFE-ANA" style="margin:8px 0 12px;text-transform:uppercase"><button class="btn k lg block" id="tgo">Conectar</button>
        <p class="muted" style="font-size:13px;margin-top:12px">¿No tienes código? Escríbenos por WhatsApp y te ayudamos.</p></div>${demo}
        <p class="center"><button class="btn w sm" id="back">← Volver al inicio</button></p></div>`;
      $('#back').onclick = () => route('home');
      const go = () => { const t = CH.findTeacher($('#tcode').value); if (!t) { $('#tcode').classList.add('wrong'); M.toast('Ese código no existe. Revísalo 🙏'); return; }
        S.teacher = { code: t.code, name: t.name }; save(); CH.store.ensure(chatRoom(), { student: S.name, sid: S.sid, teacher: t.code }); sfx('win'); chatScreen(); };
      $('#tgo').onclick = go; $('#tcode').onkeydown = e => { if (e.key === 'Enter') go(); };
      return;
    }
    const room = chatRoom(); CH.store.ensure(room, { student: S.name, sid: S.sid, teacher: S.teacher.code });
    const ini = S.teacher.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    app.innerHTML = `<div class="wrap" style="max-width:760px"><div class="card chat-wrap">
      <div class="chat-head"><button class="iconbtn dark" id="back" title="Volver">←</button><div class="av">${esc(ini)}</div><div class="grow"><b>${esc(S.teacher.name)}</b><small>Tu docente</small></div></div>
      ${demo}<div id="thread"></div></div></div>`;
    $('#back').onclick = () => route('home');
    CH.thread($('#thread'), room, S.sid, S.teacher.name);
  }

  /* ---------------- home ---------------- */
  const MOTTO = ['Hoy es un gran día para aprender inglés 💛', '¡Cada clase te acerca a hablar con confianza!', 'Recuerda: se aprende inglés <b>HABLANDO</b> 🗣️', 'Un poquito cada día hace la diferencia 🔥', '¡Vamos por esas estrellas! ⭐'];
  function greeting() { const hr = new Date().getHours(); return hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'; }
  function nextUp() { return M.allParts().find(p => !(S.parts[p.id] && S.parts[p.id].done) && M.isUnlocked(p.topic)) || null; }
  function home() {
    const pct = M.overallPct(); const nu = nextUp(); const first = S.name.split(' ')[0];
    const doneN = M.allParts().filter(p => S.parts[p.id] && S.parts[p.id].done).length;
    app.innerHTML = `<div class="wrap">
      <section class="hero">
        <div class="card hello">
          <span class="lbl">${greeting()}!</span>
          <h1 style="margin-top:10px">¡Bienvenido(a), <span class="nm">${esc(first)}</span>! 👋</h1>
          <p>${MOTTO[new Date().getDate() % MOTTO.length]}</p>
          <div class="ringbox"><div class="ring" style="--p:${pct}"><b>${pct}%</b></div>
            <div><div style="font-weight:800;font-size:18px">Tu progreso del Módulo 1</div><div class="muted">${doneN} de 28 clases completadas · 🔥 ${S.streak.n || 0} día(s) seguidos</div>
            ${nu ? `<button class="btn k" style="margin-top:12px" id="cont">▶ ${doneN ? 'Continuar' : 'Empezar'}: ${esc(nu._t.title)} · Part ${nu.part}</button>` : (M.finalUnlocked() ? `<button class="btn k" style="margin-top:12px" id="tofinal">🏆 Presentar examen final</button>` : `<button class="btn k" style="margin-top:12px" id="buy2">🔓 Desbloquear más temas</button>`)}</div></div>
          <div class="skills">${SKILLS.map(([k, ic, nm]) => `<div class="skill"><div class="ic">${ic}</div><div class="nm">${nm}</div><div class="bar"><i style="width:${M.skillPct(k)}%"></i></div><small class="muted">${S.skills[k][1] ? M.skillPct(k) + '%' : '—'}</small></div>`).join('')}</div>
        </div>
        <div class="mascot-box">
          <div class="bubble">${doneN ? 'Welcome back, my friend! 💪' : 'Welcome my friend. Let\'s start!'}</div>
          ${M.mascot('mascot bounce', doneN ? 'wink' : 'welcome')}
          <div class="tipday">${tipOfDay()}</div>
        </div>
      </section>
      ${pendingBlock()}
      <div class="sect-title"><h2>📚 Temas del Módulo 1</h2><div class="row"><button class="btn sm w" id="prog">📊 Mi progreso</button><button class="btn sm" id="code">🔑 Código de acceso</button></div></div>
      <div class="grid" id="tgrid"></div>
      <div class="sect-title"><h2>🏆 Final Test</h2></div>
      <div class="card final">${M.mascot('mascot', 'point')}<div><h3>Well done! Get ready for the test.</h3><p style="margin:6px 0 0;color:#ddd">40 preguntas de los 14 temas (Listening, Reading, Writing y Speaking) · 45 minutos · 2 intentos. Si apruebas con ${(C.PASS_SCORE / 10).toFixed(1)}/10 o más, obtienes tu certificado 🎓</p>
        ${S.final ? `<p style="margin:8px 0 0;color:#fff;font-weight:800">Tu mejor resultado: ${(S.final.best / 10).toFixed(1)} / 10 ${S.final.passed ? '✅ Aprobado' : ''}</p>` : ''}${S.final && S.final.passed ? `<button class="btn sm" id="cert-b" style="margin-top:8px">🎓 Ver mi certificado</button>` : ''}
        <button class="btn lg" id="final-b">${M.finalUnlocked() ? 'FINAL TEST →' : '🔒 Bloqueado'}</button></div>
      <p class="center fx-foot" style="margin-top:22px;font-size:13.5px;color:#fff;grid-column:1/-1;font-weight:600">mrarrieta.com · ¡Aprende inglés HABLANDO! · WhatsApp ${esc(C.WHATSAPP.replace(/^57/, ''))}</p>
    </div>`;
    const g = $('#tgrid');
    D.topics.forEach(t => {
      const un = M.isUnlocked(t.n); const done = t.parts.every(p => S.parts[p.id] && S.parts[p.id].done);
      const card = h(`<div class="topic"><div class="cov" style="background-image:url('${M.imgURL(t.cover, 640, 360)}')"><span class="num">${t.n}</span>${done ? '<span class="done">✓ COMPLETO</span>' : ''}</div>
        <div class="bd"><h3>${esc(t.title)}</h3><div class="es">${esc(t.es)}</div></div></div>`);
      t.parts.forEach(p => {
        const st = M.partStars(p.id); const pd = S.parts[p.id];
        const b = h(`<button class="partbtn"><span class="t">PART ${p.part}<small>${esc(p.title)}</small></span><span class="stars">${[1, 2, 3].map(i => `<span class="${i <= st ? '' : 'off'}">⭐</span>`).join('')}</span></button>`);
        if (pd && !pd.done && pd.step) b.querySelector('small').innerHTML += ' · <b>en curso</b>';
        b.onclick = () => route('class', p.id); $('.bd', card).appendChild(b);
      });
      if (!un) { const lk = h(`<div class="lock"><div class="lk">🔒</div><b>Tema bloqueado</b><span style="font-size:13px">Desbloquéalo para continuar tu aprendizaje</span><button class="btn sm">🔓 Desbloquear</button></div>`); $('button', lk).onclick = unlockModal; card.appendChild(lk); }
      g.appendChild(card);
    });
    if ($('#cont')) $('#cont').onclick = () => route('class', nu.id);
    if ($('#tofinal')) $('#tofinal').onclick = () => route('final');
    if ($('#buy2')) $('#buy2').onclick = unlockModal;
    $('#prog').onclick = () => route('progress'); $('#code').onclick = unlockModal;
    $('#final-b').onclick = () => M.finalUnlocked() ? route('final') : unlockModal();
    if ($('#cert-b')) $('#cert-b').onclick = () => route('cert');
    $$('[data-hw]', app).forEach(b => b.onclick = () => route('hw', b.dataset.hw));
    const cb = $('#chat-b', app); if (cb) cb.onclick = () => route('chat');
    const pt = $('#pend-t', app); if (pt) pt.onclick = () => { const l = $('#pend-l', app); const open = l.classList.toggle('hidden') === false; pt.innerHTML = `📋 ${open ? 'Ocultar' : 'Ver'} mis tareas pendientes (${pendingHW().length}) ${open ? '▴' : '▾'}`; sfx('tap'); };
    if ($('#rem-b')) $('#rem-b').onclick = reminderModal;
    if (!S.tourDone) setTimeout(tour, 700); else dailyReminder();
  }

  /* ---------------- tareas pendientes + recordatorio diario ---------------- */
  function pendingHW() { return M.allParts().filter(p => p.hw && S.parts[p.id] && S.parts[p.id].done && !(S.hw[p.id] && S.hw[p.id].score != null)); }
  function pendingBlock() {
    const pend = pendingHW();
    if (!pend.length) return `<div class="card remind-card"><div class="grow"><b>🔔 ¿Quieres que te recuerde practicar todos los días?</b><div class="muted" style="font-size:14px">Agrega un recordatorio diario a tu celular en 10 segundos.</div></div><button class="btn sm" id="rem-b">Activar recordatorio</button></div>`;
    return `<div class="card pending-card">${M.mascot('mascot', 'point')}<div class="grow"><span class="lbl r">Tarea pendiente</span>
      <h3 style="font-size:22px;margin:8px 0 4px">${esc(S.name.split(' ')[0])}, tienes ${pend.length} ${pend.length === 1 ? 'tarea pendiente' : 'tareas pendientes'} ✍️</h3>
      <p class="muted" style="margin:0 0 10px">Hacer tu tarea es lo que más te ayuda a recordar lo que aprendiste. ¡Solo te toma 5 minutos!</p>
      <button class="btn k" id="pend-t">📋 Ver mis tareas pendientes (${pend.length}) ▾</button>
      <div class="pend-list hidden" id="pend-l" style="margin-top:10px">${pend.map(p => `<button class="partbtn" data-hw="${p.id}"><span class="t">${esc(p._t.title)} · Part ${p.part}<small>${esc(p.hw.es)}</small></span><span class="btn sm k" style="pointer-events:none">Hacer tarea →</span></button>`).join('')}</div>
      <div style="margin-top:10px"><button class="btn sm w" id="rem-b">🔔 Recordarme todos los días</button></div></div></div>`;
  }
  function dailyReminder() {
    const pend = pendingHW(); const t = new Date().toISOString().slice(0, 10);
    if (!pend.length || S.remindDay === t) return;
    S.remindDay = t; save();
    if (window.Notification && Notification.permission === 'granted') { try { new Notification('📚 Mr. Arrieta', { body: `Tienes ${pend.length} tarea(s) pendiente(s) en el Módulo 1. ¡Vamos!`, icon: 'mra-point.webp' }); } catch (e) { } }
    setTimeout(() => {
      const m = M.modal(`<div class="center">${M.mascot('mascot', 'watch')}</div><h3 class="center">¡Hola, ${esc(S.name.split(' ')[0])}! 👋</h3>
        <p class="center" style="font-size:17px">Te recuerdo que tienes <b>${pend.length} ${pend.length === 1 ? 'tarea pendiente' : 'tareas pendientes'}</b>.<br>Hazla ahora y suma XP ⚡</p>
        <div style="display:grid;gap:10px"><button class="btn k block lg" id="go">✍️ Hacer mi tarea ahora</button><button class="btn w block" id="later">Más tarde</button></div>`);
      $('#go', m).onclick = () => { m.remove(); route('hw', pend[0].id); }; $('#later', m).onclick = () => m.remove();
    }, 600);
  }
  function reminderModal() {
    const url = location.href.split('#')[0].split('?')[0];
    const m = M.modal(`<div class="center">${M.mascot('mascot', 'watch')}</div><h3 class="center">🔔 Recordatorio diario</h3>
      <p class="muted center">Elige la hora y agrega el recordatorio a tu calendario. Te llegará una alerta todos los días para practicar y hacer tu tarea.</p>
      <label style="font-weight:800">Hora</label><input type="time" class="inp" id="rt" value="${esc(S.remindTime || C.REMINDER_TIME || '19:00')}" style="margin:6px 0 12px">
      <div style="display:grid;gap:10px"><a class="btn k block" id="gcal" target="_blank" rel="noopener" style="text-decoration:none">📅 Agregar a Google Calendar (Android)</a>
      <button class="btn block" id="ics">📲 Descargar para iPhone / Outlook</button>
      ${window.Notification && Notification.permission !== 'granted' ? '<button class="btn w block" id="notif">🔔 Activar avisos en este navegador</button>' : ''}
      <button class="btn w block" id="close">Cerrar</button></div>`);
    const build = () => { const [hh, mm] = ($('#rt', m).value || '19:00').split(':'); S.remindTime = `${hh}:${mm}`; save();
      const d = new Date(); d.setDate(d.getDate() + (d.getHours() * 60 + d.getMinutes() >= (+hh) * 60 + (+mm) ? 1 : 0));
      const ymd = d.toISOString().slice(0, 10).replace(/-/g, ''); const st = `${ymd}T${hh}${mm}00`; const en = `${ymd}T${hh}${String(Math.min(59, +mm + 15)).padStart(2, '0')}00`;
      const title = '📚 Mr. Arrieta: practica inglés y haz tu tarea'; const det = `¡Es hora de practicar! Entra al Módulo 1: ${url}`;
      $('#gcal', m).href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(det)}&dates=${st}/${en}&recur=${encodeURIComponent('RRULE:FREQ=DAILY')}`;
      return { st, en, title, det }; };
    build(); $('#rt', m).onchange = build;
    $('#ics', m).onclick = () => { const e = build(); const now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
      const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//mrarrieta.com//Modulo1//ES', 'BEGIN:VEVENT', 'UID:m1-' + Date.now() + '@mrarrieta.com', 'DTSTAMP:' + now, 'DTSTART:' + e.st, 'DTEND:' + e.en, 'RRULE:FREQ=DAILY', 'SUMMARY:' + e.title, 'DESCRIPTION:' + e.det, 'URL:' + url, 'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:' + e.title, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      const a2 = document.createElement('a'); a2.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a2.download = 'recordatorio-mrarrieta.ics'; a2.click(); M.toast('Ábrelo para agregarlo a tu calendario 📅'); };
    if ($('#notif', m)) $('#notif', m).onclick = async () => { const r = await Notification.requestPermission(); M.toast(r === 'granted' ? '¡Avisos activados! 🔔' : 'No se activaron los avisos'); };
    $('#close', m).onclick = () => m.remove();
  }
  async function homeworkOnly(id) {
    const p = M.partById(id); if (!p || !p.hw) return route('home');
    app.innerHTML = `<div class="player"><div class="phead"><button class="x" title="Salir">✕</button><div class="prog"><i style="width:50%"></i></div></div><div class="stage"></div></div>`;
    $('.x', app).onclick = () => route('home');
    const r = await homework($('.stage', app), p);
    if (r && r.t) { M.addSkill('writing', r.c, r.t); const gain = r.c * 10 + 20; S.xp += gain; save(); sfx('win'); M.confetti(1500); M.toast(`¡Tarea entregada! +${gain} XP ⚡`); }
    route('home');
  }
  function tipOfDay() { const t = ['Tip: escucha y repite en voz alta 🗣️', 'Tip: usa el 📖 diccionario cuando no entiendas algo', 'Tip: graba tu voz y compárala 🎙️', 'Tip: estudia 15 min cada día 🔥', 'Tip: escribe tus tareas en inglés ✍️']; return t[new Date().getDay() % t.length]; }

  /* ---------------- unlock ---------------- */
  function unlockModal() {
    const wa = `https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent(C.BUY_MESSAGE + (S.name ? ` (Soy ${S.name})` : ''))}`;
    const m = M.modal(`<div class="center">${M.mascot('mascot', 'present')}</div><h3 class="center">🔓 Desbloquea el Módulo 1</h3>
      <p class="muted center">Ingresa el código de acceso que te dio tu profe.</p>
      <input class="inp" id="cd" placeholder="Ej: ABC-123" autocapitalize="characters" style="margin:8px 0 12px">
      <button class="btn k block lg" id="ok">Desbloquear</button>
      <p class="center" style="margin:16px 0 6px;font-weight:700">¿Aún no tienes código?</p>
      <a class="btn block" style="text-decoration:none;background:#25D366;color:#fff" target="_blank" rel="noopener" href="${wa}">💬 Comprar acceso por WhatsApp</a>`);
    const i = $('#cd', m); i.focus();
    const go = () => { const r = M.redeem(i.value); if (!r) { i.classList.add('wrong'); sfx('bad'); setTimeout(() => i.classList.remove('wrong'), 500); M.toast('Código no válido 😕'); return; }
      m.remove(); sfx('win'); M.confetti(); M.toast(r.topics === 'all' ? '¡Módulo completo desbloqueado! 🎉' : '¡Temas desbloqueados! 🎉'); route('home'); };
    $('#ok', m).onclick = go; i.onkeydown = e => { if (e.key === 'Enter') go(); };
  }

  /* =================================================================
     CLASS — estructura: GOAL · SPEAKING · READING · REVIEW · EXPLANATION
     · LISTEN & PRACTICE · PRACTICE · ORAL TASK · MUSIC · HOMEWORK
     ================================================================= */
  // Cada clase tiene su propia combinación de juegos para que ninguna se sienta igual
  const PLAN = {
    t1p1: ['learn', 'bubblePop', 'matchLines', 'sayPop', 'fill', 'quizShow', 'speakWords'], t1p2: ['learn', 'dialogue', 'oddOneOut', 'unscramble', 'spinWheel', 'speak'],
    t2p1: ['learn', 'catchWord', 'typeLetter', 'spell', 'raceGame'], t2p2: ['learn', 'spellName', 'dialogue', 'spell', 'catchWord'],
    t3p1: ['learn', 'catchWord', 'wordSearch', 'crossword', 'sayPop', 'speak'], t3p2: ['learn', 'matchLines', 'sort', 'spinWheel', 'typeWord', 'speak'],
    t4p1: ['learn', 'bubblePop', 'typeNumber', 'raceGame', 'phone', 'speak'], t4p2: ['learn', 'catchWord', 'hangman', 'unscramble', 'sayPop', 'speakWords'],
    t5p1: ['learn', 'fill', 'quizShow', 'unscramble', 'sayPop', 'speak'], t5p2: ['learn', 'sort', 'fill', 'raceGame', 'speak'],
    t6p1: ['learn', 'catchWord', 'wordSearch', 'crossword', 'spinWheel', 'speak'], t6p2: ['learn', 'dialogue', 'sort', 'raceGame', 'unscramble', 'speak'],
    t7p1: ['learn', 'hangman', 'memory', 'sayPop', 'matchLines', 'speak'], t7p2: ['learn', 'bubblePop', 'sort', 'raceGame', 'oddOneOut'],
    t8p1: ['learn', 'catchWord', 'fill', 'wordSearch', 'spinWheel', 'speak'], t8p2: ['learn', 'sort', 'memory', 'hangman', 'sayPop', 'oddOneOut'],
    t9p1: ['learn', 'raceGame', 'fill', 'wordSearch', 'speak'], t9p2: ['learn', 'quizShow', 'spell', 'catchWord', 'dialogue'],
    t10p1: ['learn', 'matchLines', 'spinWheel', 'typeSentence', 'bubblePop', 'speak'], t10p2: ['learn', 'catchWord', 'memory', 'sort', 'hangman', 'sayPop'],
    t11p1: ['learn', 'raceGame', 'spell', 'wordSearch', 'crossword', 'oddOneOut'], t11p2: ['learn', 'quizShow', 'sort', 'spinWheel', 'unscramble', 'speak'],
    t12p1: ['learn', 'catchWord', 'sort', 'plural', 'matchLines', 'speakWords'], t12p2: ['learn', 'memory', 'plural', 'raceGame', 'bubblePop'],
    t13p1: ['learn', 'fill', 'matchLines', 'unscramble', 'sayPop', 'speak'], t13p2: ['learn', 'sort', 'fill', 'dialogue', 'catchWord', 'speak'],
    t14p1: ['learn', 'fill', 'catchWord', 'unscramble', 'typeSentence', 'speak'], t14p2: ['learn', 'fill', 'dialogue', 'raceGame', 'spinWheel', 'speak'],
  };

  function buildSteps(p) {
    const st = [];
    st.push({ sec: 'Goal', k: 'goal' });
    if (p.warm) st.push({ sec: 'Speaking', k: 'warm' });
    if (p.reading) st.push({ sec: 'Reading', k: 'reading' });
    if (M.prevPart(p)) st.push({ sec: 'Review', k: 'review' });
    st.push({ sec: 'Explanation', k: 'learn' });
    if (p.keyq) st.push({ sec: 'Listen & practice', k: 'keyq' });
    const acts = PLAN[p.id] || p.acts;
    acts.filter(a => !['learn', 'speak', 'speakWords'].includes(a)).forEach(a => st.push({ sec: 'Practice', k: a }));
    const sp = acts.find(a => a === 'speak' || a === 'speakWords') || (p.sentences ? 'speak' : 'speakWords');
    if (!p.letters) st.push({ sec: 'Oral task', k: sp });
    else st.push({ sec: 'Oral task', k: 'speakLetters' });
    if (songFor(p)) st.push({ sec: 'Music', k: 'music' });
    if (p.hw) st.push({ sec: 'Homework', k: 'hw' });
    return st;
  }

  async function runClass(id) {
    const p = M.partById(id);
    if (!M.isUnlocked(p.topic)) { unlockModal(); return route('home'); }
    app.innerHTML = `<div class="wrap center" style="padding-top:80px">${M.mascot('mascot bounce', 'book')}<h2>Cargando tu clase…</h2></div>`;
    const pv = M.prevPart(p); await M.loadAudio(['common', 't' + p.topic].concat(pv ? ['t' + pv.topic] : []));
    const steps = buildSteps(p); const secs = [...new Set(steps.map(s => s.sec))];
    const rec = S.parts[id] = S.parts[id] || { done: false, stars: 0, best: 0 };
    let startAt = 0;
    if (!rec.done && rec.step && rec.step < steps.length && rec.run) {
      const ok = await new Promise(r => { const m = M.modal(`<h3>¿Continuar donde quedaste?</h3><p class="muted">Ibas en la sección <b>${esc(steps[rec.step].sec)}</b>.</p><div class="row"><button class="btn k" id="y">Sí, continuar</button><button class="btn w" id="n">Empezar de nuevo</button></div>`); $('#y', m).onclick = () => { m.remove(); r(true); }; $('#n', m).onclick = () => { m.remove(); r(false); }; });
      if (ok) startAt = Math.max(rec.step, (rec.run && rec.run.max) || 0);
    }
    const run = (startAt && rec.run && !Array.isArray(rec.run.res)) ? rec.run : { res: {}, xp: 0 };
    app.innerHTML = `<div class="player"><div class="phead"><button class="x" title="Salir">✕</button><button class="back" title="Volver al paso anterior">← Atrás</button><div class="prog"><i style="width:0%"></i></div></div>
      <div class="ptopic">📍 Estás en: <b>Topic ${p.topic} · ${esc(p._t.title)}</b> — Part ${p.part}: ${esc(p.title)} <span class="psec"></span></div>
      <button class="resume hidden">⏩ Continuar donde quedé</button>
      <div class="secbar">${secs.map(s => `<span data-s="${esc(s)}">${esc(s)}</span>`).join('')}</div><div class="stage"></div></div>`;
    $('.x', app).onclick = () => { stop(); route('home'); };
    const player = $('.player', app);
    let navBack = null, navJump = null;
    $('.back', app).onclick = () => { if (navBack) { sfx('tap'); navBack(); } };
    $('.resume', app).onclick = () => { if (navJump) { sfx('tap'); navJump(); } };
    // si el estudiante se fue un rato, Mr. Arrieta le recuerda en qué tema y sección está
    let lastAct = Date.now(), hiddenAt = 0, curSec = '', curI = 0;
    const where = () => { if (!app.contains(player) || $('.modal') || $('#tour')) return;
      const m = M.modal(`<div class="center">${M.mascot('mascot', 'watch')}</div><h3 class="center">¡Hola de nuevo, ${esc(S.name.split(' ')[0])}! 👋</h3>
        <p class="center" style="font-size:17px">Estás en <b>Topic ${p.topic} · ${esc(p._t.title)}</b><br>Part ${p.part}: ${esc(p.title)}<br>Sección: <b>${esc(curSec)}</b> (paso ${curI + 1} de ${steps.length})</p>
        <button class="btn k block lg" id="wb">¡Seguir donde iba! →</button>`);
      $('#wb', m).onclick = () => m.remove(); };
    const act = () => { if (Date.now() - lastAct > 4 * 60 * 1000) where(); lastAct = Date.now(); };
    const vis = () => { if (document.hidden) hiddenAt = Date.now(); else if (hiddenAt && Date.now() - hiddenAt > 90 * 1000) { hiddenAt = 0; where(); lastAct = Date.now(); } };
    ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, act, true)); document.addEventListener('visibilitychange', vis);
    const cleanup = () => { ['pointerdown', 'keydown'].forEach(ev => document.removeEventListener(ev, act, true)); document.removeEventListener('visibilitychange', vis); };
    let i = startAt;
    while (i < steps.length) {
      const s = steps[i];
      rec.step = i; rec.run = run; save();
      // fresh stage element for every step (so going back never mixes old and new activities)
      const old = $('.stage', player); const stage = document.createElement('div'); stage.className = 'stage'; old.replaceWith(stage);
      $('.prog i', app).style.width = (i / steps.length * 100) + '%';
      $('.back', app).disabled = i === 0;
      run.max = Math.max(run.max || 0, i); curSec = s.sec; curI = i;
      $('.psec', app).textContent = '· ' + s.sec;
      $('.resume', app).classList.toggle('hidden', i >= run.max);
      $$('.secbar span', app).forEach(e => { const k = secs.indexOf(e.dataset.s), ck = secs.indexOf(s.sec); e.className = k === ck ? 'on' : k < ck ? 'ok' : ''; if (k === ck) e.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const back = new Promise(res => { navBack = () => res('__back'); navJump = () => res('__jump'); });
      let r;
      try { r = await Promise.race([STEP[s.k](stage, p), back]); } catch (e) { console.error(s.k, e); r = null; }
      navBack = null; navJump = null;
      if (!app.contains(player)) { cleanup(); return; } // user left
      if (r === '__jump') { stop(); const sh0 = $('#sheet'); if (sh0) sh0.remove(); i = run.max; continue; }
      const sh = $('#sheet'); if (sh) sh.remove();
      if (r === '__back') {
        stop();
        // volver a revisar: el resultado anterior se conserva (solo se reemplaza si vuelve a hacer el ejercicio)
        i = Math.max(0, i - 1);
        continue;
      }
      if (r && r.t) {
        const prevR = run.res[i]; if (prevR) { M.addSkill(prevR.skill, -prevR.c, -prevR.t); run.xp -= prevR.c * 10; S.xp -= prevR.c * 10; }
        run.res[i] = { k: s.k, sec: s.sec, ...r, missed: (r.missed || []).map(x => ({ en: x.en || x.w || x.full || x.s, au: x.au })) };
        M.addSkill(r.skill, r.c, r.t); const gain = r.c * 10; run.xp += gain; S.xp += gain; if (gain) M.xpFly(gain); topbar();
      }
      save();
      i++;
    }
    $('.prog i', app).style.width = '100%'; cleanup();
    results(p, run);
  }

  /* ---------- class steps ---------- */
  const STEP = {
    goal: async (stage, p) => {
      const prev = M.prevPart(p);
      stage.innerHTML = `<div class="center">
        <span class="lbl">Topic ${p.topic} · Part ${p.part}</span>
        <h2 style="font-size:28px;margin-top:12px">${esc(p._t.title)}</h2>
        <p class="muted" style="font-size:17px;margin:4px 0 14px">${esc(p.title)} — ${esc(p.es)}</p>
        <div class="mainph" style="max-width:460px">${photo(p._t.cover)}</div>
        <div class="lesson" style="text-align:left;margin-top:6px"><h3>🎯 Goal</h3><p style="font-size:18px;margin:4px 0"><b>${esc(p.goal ? p.goal.en : p.title)}</b></p><p class="muted" style="margin:0">${esc(p.goal ? p.goal.es : p.es)}</p></div>
        ${prev && !(S.parts[prev.id] && S.parts[prev.id].done) ? `<p class="hint" style="margin-top:6px">💡 Te recomendamos completar primero: ${esc(prev._t.title)} · Part ${prev.part}</p>` : ''}
      </div>`;
      await A.waitNext(stage, '¡Empezar clase! 🚀'); return null;
    },

    warm: async (stage, p) => {
      let c = 0;
      for (let i = 0; i < p.warm.length; i++) {
        const q = p.warm[i];
        const body = A.head(stage, { lbl: 'Speaking', title: 'Listen and answer', ins: 'Calentamiento: escucha la pregunta y <b>respóndela en voz alta</b> con tus propias palabras. ¡No hay respuestas incorrectas!', count: `${i + 1} / ${p.warm.length}` });
        const ok = await new Promise(res => {
          const top = h(`<div class="row" style="justify-content:center;align-items:center;gap:16px;margin:6px 0 10px">${M.mascot('mascot', 'welcome')}<div class="bubble" style="font-size:19px">${esc(q.q)}</div></div>`); body.appendChild(top);
          if (q.es) body.appendChild(h(`<p class="center tr-es">${esc(q.es)}</p>`));
          if (q.es) body.appendChild(h(`<div class="warm-es">${q.ex ? `<div class="ex">💡 Puedes responder: <b>${esc(q.ex)}</b></div>` : ''}</div>`));
          const pr = h(`<div class="center"></div>`); pr.appendChild(A.playBtn(q.au)); body.appendChild(pr);
          const mic = h(`<button class="mic">🎤</button>`); body.appendChild(mic);
          const st = h(`<p class="center" style="font-weight:700">${M.canSR ? 'Toca el micrófono y responde en inglés' : 'Escribe tu respuesta en inglés 👇'}</p>`); body.appendChild(st);
          const alt = h(`<div class="${M.canSR ? 'hidden' : ''}"><input class="inp" placeholder="Escribe tu respuesta en inglés…" style="font-size:18px"></div>`); body.appendChild(alt);
          const bar = h(`<div class="actionbar">${M.canSR ? '<button class="btn w" id="ty">⌨️ Prefiero escribir</button>' : ''}<button class="btn w" id="sk">Saltar</button><button class="btn k lg" id="ok">Enviar ✓</button></div>`); body.appendChild(bar);
          setTimeout(() => play(q.au), 400);
          const accept = async (txt) => { const n = M.words(txt).length; if (n >= 2) { sfx('ok'); M.praise(); await sheet({ ok: true, title: good(), msg: `Te escuché: “${esc(txt)}”`, tip: 'Intenta responder con oraciones completas, por ejemplo: <i>I\'m fine, thank you.</i>' }); res(true); } else { st.innerHTML = '❌ Te escuché muy poco. Responde con al menos 2 palabras y toca 🎤 otra vez.'; sfx('bad'); setTimeout(M.encourage, 250); } };
          mic.onclick = async () => { stop(); mic.classList.add('rec'); st.textContent = '🎧 Te escucho…'; const r = await M.listen(8000); mic.classList.remove('rec');
            if (!r.alts.length) { st.textContent = r.error === 'not-allowed' ? 'Permite el micrófono 🎤 o escribe tu respuesta.' : 'No te escuché 🙉 Intenta otra vez.'; if (r.error === 'not-allowed') alt.classList.remove('hidden'); return; } accept(r.alts[0]); };
          if ($('#ty', bar)) $('#ty', bar).onclick = () => { alt.classList.remove('hidden'); $('input', alt).focus(); };
          $('#sk', bar).onclick = () => res(null);
          $('#ok', bar).onclick = () => { const v = $('input', alt).value; if (v.trim()) accept(v); else if (M.canSR) mic.click(); };
          $('input', alt).onkeydown = e => { if (e.key === 'Enter') $('#ok', bar).click(); };
        });
        if (ok) c++;
      }
      return A.result(c, p.warm.length, 'speaking');
    },

    reading: async (stage, p) => {
      const r = p.reading;
      const body = A.head(stage, { lbl: 'Reading', title: `📖 ${r.title}`, ins: 'Escucha y lee al mismo tiempo. Luego responde <b>YES</b> o <b>NO</b>.' });
      const sents = r.text.match(/[^.!?]+[.!?]+["”]?\s*/g) || [r.text];
      const box = h(`<div class="reading">${photo(r.img)}<div><div class="row" style="margin-bottom:10px"><button class="btn k sm" id="rp">▶ Escuchar lectura</button></div><div class="txt">${sents.map(s => `<span class="s">${esc(s)}</span>`).join('')}</div></div></div>`);
      body.appendChild(box);
      // approximate karaoke highlight by character proportion
      const rp = $('#rp', box);
      const karaoke = () => { stop(); const a = M.trackAudio(new Audio(M.audioSrc(r.au))); const spans = $$('.s', box); const lens = sents.map(s => s.length); const tot = lens.reduce((x, y) => x + y, 0);
        a.ontimeupdate = () => { if (!a.duration) return; const f = a.currentTime / a.duration * tot; let acc = 0; spans.forEach((sp, i) => { const on = f >= acc && f < acc + lens[i]; sp.classList.toggle('on', on); acc += lens[i]; }); };
        a.addEventListener('ended', () => { spans.forEach(sp => sp.classList.remove('on')); rp.innerHTML = '▶ Escuchar lectura'; rp.classList.remove('playing'); });
        a.play(); window.__ra = a; rp.innerHTML = '⏹ Detener lectura'; rp.classList.add('playing'); const hideF = M.floatStop(rp); a.addEventListener('ended', hideF); };
      rp.onclick = () => { if (rp.classList.contains('playing')) stop(); else karaoke(); };
      body.appendChild(h(`<h3 style="margin-top:18px">Answer YES or NO</h3>`));
      const qs = r.q.map((q, i) => { const e = h(`<div class="yn"><p>${i + 1}) ${esc(q.s)}</p><div class="b"><button data-v="yes">YES</button><button data-v="no">NO</button></div></div>`); $$('button', e).forEach(b => b.onclick = () => { $$('button', e).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); e._v = b.dataset.v; sfx('tap'); }); body.appendChild(e); return e; });
      const bar = h(`<div class="actionbar"><button class="btn k lg">Comprobar ✓</button></div>`); body.appendChild(bar);
      const c = await new Promise(res => { $('button', bar).onclick = async () => {
        if (qs.some(e => !e._v)) { M.toast('Responde todas las preguntas 😉'); return; }
        stop();
        let c = 0; qs.forEach((e, i) => { const ok = e._v === r.q[i].a; if (ok) c++; e.classList.add(ok ? 'right' : 'wrong'); $$('button', e).forEach(b => b.disabled = true); if (!ok) $('p', e).innerHTML += ` <b>(${r.q[i].a.toUpperCase()})</b>`; });
        bar.remove(); c === qs.length ? sfx('win') : sfx(c >= qs.length / 2 ? 'ok' : 'bad');
        await A.waitNext(stage, `${c}/${qs.length} correctas — Continuar`); res(c); }; });
      stop();
      return A.result(c, r.q.length, 'reading');
    },

    review: async (stage, p) => {
      const pv = M.prevPart(p); const pool = pv.vocab.filter((v, i, a) => a.findIndex(x => x.en === v.en) === i);
      const usePh = pool.filter(x => x.img && !x.img.startsWith('#')).length >= pool.length * .6;
      const items = sample(pool, Math.min(4, pool.length));
      const r = await A.qloop(stage, { lbl: 'Review', title: 'Let\'s remember last class', ins: `Repaso de <b>${esc(pv._t.title)} · Part ${pv.part}</b>. Escucha y elige.` }, items, async (body, it) => {
        body.appendChild(A.playBtn(it.au));
        const opts = shuffle([it, ...sample(pool.filter(x => x.en !== it.en), 3)]); const wrap = h(`<div class="opts" style="margin-top:12px"></div>`); body.appendChild(wrap);
        const btns = opts.map(o => { const b = h(usePh ? `<button class="opt imgopt">${photo(o.img)}<span class="imglbl">${esc(o.en)}</span></button>` : `<button class="opt">${esc(o.en)}</button>`); wrap.appendChild(b); return b; });
        setTimeout(() => play(it.au), 350);
        const i = await A.choose(btns); const ok = opts[i] === it; btns[opts.indexOf(it)].classList.add('right'); if (!ok) btns[i].classList.add('wrong');
        await A.feedback(ok, `${it.en} (${it.es})`, 'Repasa la clase anterior si lo necesitas.'); return ok;
      });
      return A.result(r.c, items.length, 'listening', r.missed);
    },

    keyq: async (stage, p) => {
      const body = A.head(stage, { lbl: 'Listen & practice', title: 'Key questions', ins: 'Para cada pregunta: <b>1)</b> toca 🔊 para escuchar la pregunta, <b>2)</b> toca 🔊 para escuchar la respuesta y <b>3)</b> toca 🎤 y <b>di la respuesta en voz alta</b>.' });
      let c = 0; const done = new Set();
      p.keyq.forEach((k, i) => {
        const ans = k.a.replace(/___/g, '<b>___</b>');
        const e = h(`<div class="kq"><div class="kq-n">Pregunta ${i + 1}</div>
          <div class="kstep q"><span class="kn">1</span><div class="grow"><small>Escucha la pregunta</small><div class="kt">${esc(k.q)}</div>${k.es ? `<div class="qes">${esc(k.es)}</div>` : ''}</div></div>
          <div class="kstep a"><span class="kn">2</span><div class="grow"><small>Escucha la respuesta</small><div class="kt ans">${ans}</div></div></div>
          <div class="kstep k3"><span class="kn">3</span><div class="grow"><small>Ahora di la respuesta en voz alta</small><div class="act"></div></div></div><div class="out"></div></div>`);
        $('.q', e).appendChild(A.playBtn(k.qau, false)); if (k.aau) $('.a', e).appendChild(A.playBtn(k.aau, false));
        const mic = h(`<button class="btn sm k">🎤 Decir la respuesta</button>`); $('.act', e).appendChild(mic);
        if (k.a.includes('___')) $('.act', e).appendChild(h(`<span class="muted" style="font-size:13px">Completa el ___ con tu información personal</span>`));
        mic.onclick = async () => {
          if (!M.canSR) { e.classList.add('done'); if (!done.has(i)) { done.add(i); c++; } M.toast('¡Bien! Repite en voz alta 🗣️'); return; }
          stop(); mic.textContent = '🎧 Te escucho…'; const r = await M.listen(8000); mic.textContent = '🎤 Decir la respuesta';
          if (!r.alts.length) { M.toast('No te escuché 🙉 intenta otra vez'); return; }
          const tgt = k.a.split(' / ')[0].replace(/___/g, ''); const sc = M.speechScore(tgt, r.alts); const okk = k.a.includes('___') ? M.words(r.alts[0]).length >= 2 && sc.score >= 50 : sc.score >= 60;
          $('.out', e).innerHTML = `<div class="heardbox" style="font-size:15px">Escuché: “${esc(sc.heard)}” — ${okk ? '✅ ¡Muy bien! Lo dijiste correctamente.' : '❌ Todavía no. Escucha la respuesta 🔊 y toca 🎤 para intentarlo otra vez.'}</div>`;
          if (okk) { sfx('ok'); M.praise(); e.classList.add('done'); if (!done.has(i)) { done.add(i); c++; } } else { sfx('bad'); setTimeout(M.encourage, 250); }
        };
        body.appendChild(e);
      });
      await A.waitNext(stage, 'Continuar');
      return A.result(c, p.keyq.length, 'speaking');
    },

    speakLetters: async (stage, p) => {
      // Oral task for alphabet: spell your name / words aloud with recording
      const items = [{ en: 'How do you spell your name?', es: '¿Cómo deletreas tu nombre?', au: null }];
      const body = A.head(stage, { lbl: 'Oral task', title: 'Spell it out loud!', ins: 'Graba tu voz deletreando las letras en inglés y compárala con el modelo.' });
      const L = M.D.letters; const letters = p.vocab.map(v => v.en);
      const grid = h(`<div class="tiles"></div>`); body.appendChild(grid);
      letters.forEach(l => { const b = h(`<button class="tile">${l}</button>`); b.onclick = () => play(L[l]); grid.appendChild(b); });
      const nm = (S.name.split(' ')[0] || 'NAME').toUpperCase().replace(/[^A-Z]/g, '');
      body.appendChild(h(`<div class="lesson"><h3>🎤 Tu reto</h3><p>Deletrea tu nombre en inglés: <b style="font-size:22px;letter-spacing:4px">${esc(nm.split('').join('-'))}</b></p><p class="muted">Toca cada letra para escucharla y luego grábate.</p></div>`));
      const sp = h(`<div class="row" style="justify-content:center;margin-top:12px"></div>`); body.appendChild(sp);
      nm.split('').forEach(ch => { const b = h(`<button class="chip">${ch}</button>`); b.onclick = () => play(L[ch]); sp.appendChild(b); });
      const rb = h(`<div class="center" style="margin-top:14px"><button class="btn k">🎙️ Grabar y comprobar</button><p class="muted" style="font-size:14px;margin:6px 0 0">Di cada letra despacio: ${esc(nm.split('').join(' – '))}</p><div class="out"></div></div>`); body.appendChild(rb);
      let did = false, best = 0;
      const playModel = async () => { for (const ch of nm.split('')) { await play(L[ch]); await sleep(180); } };
      const go = async () => { const b = $('button', rb); const secs = Math.min(10, 3 + nm.length * 0.8);
        try { b.disabled = true; stop();
          const r = await M.recordScore(nm, secs * 1000, f => b.textContent = `🔴 Te escucho… ${Math.max(0, Math.ceil(secs * (1 - f)))}s`, M.letterScorer(nm));
          b.disabled = false; b.textContent = '🎙️ Grabar otra vez'; did = true; if (r.score != null) best = Math.max(best, r.score);
          const out = $('.out', rb); M.voiceResult(out, { score: r.score, heard: r.heard, url: r.url, model: playModel, onRetry: go, pass: 75 });
          out.addEventListener('selfok', () => { best = Math.max(best, 80); }, { once: true });
        } catch (err) { b.disabled = false; b.textContent = '🎙️ Grabar y comprobar'; M.toast('Permite el micrófono 🎤'); } };
      $('button', rb).onclick = go;
      void items;
      await A.waitNext(stage, 'Continuar'); return A.result(did && best >= 75 ? 1 : 0, 1, 'speaking');
    },

    music: async (stage, p) => playLearn(stage, p),

    hw: async (stage, p) => homework(stage, p),
  };
  // practice activities map
  ['learn', 'listenChoose', 'pickWord', 'typeWord', 'typeLetter', 'typeNumber', 'phone', 'spellName', 'typeSentence', 'fill', 'unscramble', 'memory', 'sort', 'crossword', 'speed', 'spell', 'plural', 'dialogue', 'speak', 'speakWords', 'wordSearch', 'hangman', 'bubblePop', 'matchLines', 'quizShow', 'oddOneOut', 'catchWord', 'spinWheel', 'raceGame', 'sayPop']
    .forEach(k => { STEP[k] = (stage, p) => A[k](stage, p); });

  /* ---------- MUSIC · PLAY & LEARN (una canción A1 por clase) ---------- */
  function songFor(p) { const SG = window.M1SONGS; if (!SG) return null; const id = SG.map[p.id]; return id ? SG.songs[id] : null; }
  // video con respaldo: si YouTube no permite verlo aquí, prueba automáticamente el siguiente video
  let ytApi = null;
  function loadYT() { if (window.YT && YT.Player) return Promise.resolve(); if (ytApi) return ytApi;
    ytApi = new Promise(r => { const prev = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { prev && prev(); r(); }; const sc = document.createElement('script'); sc.src = 'https://www.youtube.com/iframe_api'; sc.onerror = r; document.head.appendChild(sc); });
    return ytApi; }
  function ytBox(sg, host) {
    const ids = [sg.yt, ...(sg.alt || [])]; let k = 0;
    host.innerHTML = `<div class="ytwrap"><div class="ytp"></div></div><p class="center yt-msg hidden" style="margin:8px 0 0"></p>`;
    const msg = $('.yt-msg', host);
    const showLink = () => { msg.innerHTML = `<a class="btn w sm" href="https://www.youtube.com/watch?v=${esc(ids[0])}" target="_blank" rel="noopener" style="text-decoration:none">▶ Ver la canción en YouTube</a>`; msg.classList.remove('hidden'); };
    loadYT().then(() => {
      if (!(window.YT && YT.Player)) { $('.ytwrap', host).innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${esc(ids[0])}?rel=0&playsinline=1" allowfullscreen></iframe>`; showLink(); return; }
      const player = new YT.Player($('.ytp', host), { videoId: ids[0], width: '100%', height: '100%', playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: { onError: () => { k++; if (k < ids.length) player.loadVideoById(ids[k]); else { $('.ytwrap', host).classList.add('hidden'); showLink(); } } } });
    });
  }
  async function playLearn(stage, p) {
    const sg = songFor(p); if (!sg) return null;
    const lbl = 'Play & Learn';
    let c = 0, t = 0; const missed = [];
    const mark = (ok, it) => { t++; if (ok) c++; else missed.push({ en: it.full || it.en, au: it.au }); };
    // 1) Presentación + palabras clave + predicción
    {
      const body = A.head(stage, { lbl, title: `🎵 ${esc(sg.title)}`, ins: `<b>${esc(sg.artist)}</b> · ${esc(sg.theme)}. Primero descubre de qué trata la canción.` });
      body.appendChild(h(`<div class="row song-intro">${M.mascot('mascot bounce', 'celebrate')}<div class="bubble">Let's learn English with music! 🎶</div></div>`));
      const kw = h(`<div class="kwrow"><b>🔑 Palabras clave (toca para escuchar):</b><div class="row" style="gap:8px;margin-top:8px"></div></div>`); body.appendChild(kw);
      sg.kw.forEach(k => { const b = h(`<button class="chip">🔊 ${esc(k.en)}</button>`); b.onclick = () => { sfx('tap'); M.play(k.au); }; $('.row', kw).appendChild(b); });
      const q = sg.pred;
      body.appendChild(h(`<div class="sent" style="font-size:20px">${esc(q.question)}</div>`));
      const wrap = h(`<div class="opts" style="grid-template-columns:1fr 1fr"></div>`); body.appendChild(wrap);
      const btns = q.options.map(o => { const b = h(`<button class="opt">${esc(o)}</button>`); wrap.appendChild(b); return b; });
      const i = await A.choose(btns); const ok = i === q.correctIndex;
      btns[q.correctIndex].classList.add('right'); if (!ok) btns[i].classList.add('wrong');
      t++; if (ok) c++;
      await A.feedback(ok, q.options[q.correctIndex], q.feedbackIncorrect || '');
    }
    // 2) Escuchar la canción
    {
      const body = A.head(stage, { lbl, title: '🎧 Listen to the song', ins: 'Escucha la canción completa. Fíjate en las <b>palabras clave</b>. ¡Si quieres, canta! Cuando termines, continúa con los retos.' });
      const yh = h('<div></div>'); body.appendChild(yh); ytBox(sg, yh);
      body.appendChild(h(`<div class="row" style="gap:8px;justify-content:center;margin-top:12px">${sg.kw.map(k => `<span class="pill" style="background:var(--y3);color:var(--k);border-color:var(--k)">${esc(k.en)}</span>`).join('')}</div>`));
      await A.waitNext(stage, 'Ya la escuché, ¡a jugar! 🎮');
    }
    // 3) Listen & choose / order (frases inspiradas en la canción)
    const lc = sample(sg.lc.filter(x => x.type === 'blank'), 3);
    for (let n = 0; n < lc.length; n++) {
      if (!stage.isConnected) return A.result(c, t, 'listening', missed);
      const it = lc[n];
      const body = A.head(stage, { lbl, title: it.type === 'order' ? 'Listen and order' : 'Listen and complete', ins: it.type === 'order' ? 'Escucha y ordena las palabras.' : 'Escucha la frase y elige la palabra que falta.', count: `${n + 1} / ${lc.length}` });
      const pb = h('<div class="center"></div>'); pb.appendChild(A.playBtn(it.au)); body.appendChild(pb);
      setTimeout(() => M.play(it.au), 350);
      let ok;
      if (it.type === 'blank') {
        const sent = h(`<div class="sent">${esc(it.s).replace('___', '<span class="blank">&nbsp;</span>')}</div>`); body.appendChild(sent);
        const opts = shuffle(it.o.slice()); const wrap = h(`<div class="opts"></div>`); body.appendChild(wrap);
        const btns = opts.map(o => { const b = h(`<button class="opt">${esc(o)}</button>`); wrap.appendChild(b); return b; });
        const i = await A.choose(btns); ok = opts[i] === it.a;
        btns[opts.indexOf(it.a)].classList.add('right'); if (!ok) btns[i].classList.add('wrong'); $('.blank', sent).textContent = it.a;
      } else ok = await orderQ(body, it.w, it.a);
      mark(ok, it); M.play(it.au);
      await A.feedback(ok, it.full, it.x);
    }
    // 4) Grammar
    const gr = sample(sg.gr, Math.min(2, sg.gr.length));
    for (let n = 0; n < gr.length; n++) {
      if (!stage.isConnected) return A.result(c, t, 'listening', missed);
      const it = gr[n];
      const body = A.head(stage, { lbl, title: 'Grammar with music', ins: 'Elige la palabra correcta.', count: `${n + 1} / ${gr.length}` });
      const sent = h(`<div class="sent">${esc(it.s).replace('___', '<span class="blank">&nbsp;</span>')}</div>`); body.appendChild(sent);
      const opts = shuffle(it.o.slice()); const wrap = h(`<div class="opts" style="grid-template-columns:repeat(${opts.length},1fr)"></div>`); body.appendChild(wrap);
      const btns = opts.map(o => { const b = h(`<button class="opt">${esc(o)}</button>`); wrap.appendChild(b); return b; });
      const i = await A.choose(btns); const ok = opts[i] === it.a;
      btns[opts.indexOf(it.a)].classList.add('right'); if (!ok) btns[i].classList.add('wrong'); $('.blank', sent).textContent = it.a;
      mark(ok, { full: it.s.replace('___', it.a) }); await A.feedback(ok, it.s.replace('___', it.a), it.x);
    }
    // 5) Word order (writing)
    const wo = sample(sg.wo, Math.min(1, sg.wo.length));
    for (let n = 0; n < wo.length; n++) {
      if (!stage.isConnected) return A.result(c, t, 'listening', missed);
      const it = wo[n];
      const body = A.head(stage, { lbl, title: 'Put the words in order', ins: 'Forma la oración tocando las palabras en orden.', count: `${n + 1} / ${wo.length}` });
      const ok = await orderQ(body, it.w, it.a); mark(ok, it); M.play(it.au);
      await A.feedback(ok, it.full, 'Recuerda: <b>Sujeto + Verbo + Complemento</b>.');
    }
    // 6) Sing & speak
    const sp = sample(sg.sp, Math.min(1, sg.sp.length));
    for (let n = 0; n < sp.length; n++) {
      if (!stage.isConnected) return A.result(c, t, 'listening', missed);
      const it = sp[n];
      const body = A.head(stage, { lbl, title: 'Sing & speak', ins: `Completa en voz alta: <b>${esc(it.p)}</b><br>Escucha el modelo y repítelo 🎤.`, count: `${n + 1} / ${sp.length}` });
      const r = await A.speakCard(body, { en: it.en, au: it.au });
      if (r.ok !== null) mark(r.ok, it);
    }
    // cierre
    {
      const pct = t ? Math.round(c / t * 100) : 0;
      stage.innerHTML = `<div class="center"><span class="lbl">${lbl}</span>${M.mascot('mascot bounce', pct >= 70 ? 'celebrate' : 'thumbs')}
        <h2 style="margin:10px 0 4px">🎶 ${esc(sg.title)} — ${pct}%</h2><p class="muted">${pct >= 70 ? '¡Excelente! Ya puedes cantar esta canción entendiendo lo que dice.' : '¡Buen intento! Escucha la canción otra vez y repite las palabras clave.'}</p></div>`;
      await A.waitNext(stage, 'Continuar');
    }
    return A.result(c, t, 'listening', missed);
  }
  function orderQ(body, words, correct) {
    return new Promise(res => {
      const line = h(`<div class="line"></div>`); const bank = h(`<div class="bank"></div>`); body.appendChild(line); body.appendChild(bank);
      let order = shuffle(words.map((t, i) => ({ t, i }))); if (order.length > 1 && order.map(o => o.t).join(' ') === correct.join(' ')) order = order.reverse();
      const picked = [];
      order.forEach(o => {
        const chip = h(`<button class="chip">${esc(o.t)}</button>`); bank.appendChild(chip);
        chip.onclick = () => { if (chip.classList.contains('used')) return; sfx('tap'); chip.classList.add('used'); const c2 = h(`<button class="chip">${esc(o.t)}</button>`); line.appendChild(c2); picked.push(o);
          c2.onclick = () => { sfx('tap'); c2.remove(); chip.classList.remove('used'); picked.splice(picked.indexOf(o), 1); }; };
      });
      const hintP = h(`<p class="center hidden" style="margin:10px 0 0"><span class="hint"></span></p>`); body.appendChild(hintP);
      const bar = h(`<div class="actionbar"><button class="btn w" id="oh">💡 Pista</button><button class="btn k lg" id="oc">Comprobar ✓</button></div>`); body.appendChild(bar);
      // pista: dice qué palabra va después y la hace parpadear (sin ponerla)
      $('#oh', bar).onclick = () => {
        let k = 0; while (k < picked.length && picked[k].t === correct[k]) k++;
        if (k < picked.length) { $('.hint', hintP).innerHTML = '💡 Hay una palabra en el lugar equivocado: tócala arriba para quitarla.'; hintP.classList.remove('hidden'); return; }
        const nxt = correct[k]; $('.hint', hintP).innerHTML = k === 0 ? `💡 La oración empieza con: <b>${esc(nxt)}</b>` : `💡 La siguiente palabra es: <b>${esc(nxt)}</b>`; hintP.classList.remove('hidden');
        const ch = [...bank.children].find(c => !c.classList.contains('used') && c.textContent === nxt); if (ch) { ch.classList.remove('blink'); void ch.offsetWidth; ch.classList.add('blink'); }
      };
      $('#oc', bar).onclick = () => {
        if (picked.length < words.length) { M.toast('Usa todas las palabras 😉'); return; }
        const ok = M.norm(picked.map(o => o.t).join(' '), false) === M.norm(correct.join(' '), false);
        line.classList.add(ok ? 'right' : 'wrong'); bar.remove(); res(ok);
      };
    });
  }

  /* ---------- HOMEWORK (writing with automatic feedback) ---------- */
  async function homework(stage, p) {
    const hw = p.hw; const saved = (S.hw[p.id] || {}).text || '';
    const body = A.head(stage, { lbl: 'Homework', title: '✍️ Writing task', ins: esc(hw.es) });
    body.appendChild(h(`<p><span class="hint">Mínimo ${hw.n} ${/palabras|frutas|objetos|plural/.test(hw.es) && !/oraci/.test(hw.es) ? 'elementos' : 'oraciones'}</span> ${hw.kw.length ? `<span class="hint">Usa: ${hw.kw.map(esc).join(', ')}</span>` : ''}</p>`));
    const ta = h(`<textarea class="hw" placeholder="Escribe aquí en inglés…">${esc(saved)}</textarea>`); body.appendChild(ta);
    const ex = h(`<details style="margin-top:10px"><summary style="cursor:pointer;font-weight:700">👀 Ver un ejemplo</summary><div class="tipbox" style="margin-top:8px">${esc(hw.model)}</div></details>`); body.appendChild(ex);
    const out = h(`<ul class="checks"></ul>`); body.appendChild(out);
    const bar = h(`<div class="actionbar"></div>`); body.appendChild(bar);
    return await new Promise(res => {
      const idle = () => {
        bar.innerHTML = '<button class="btn w" id="skip">Hacerla después</button><button class="btn k lg" id="chk">Revisar mi tarea ✓</button>';
        $('#skip', bar).onclick = () => { S.hw[p.id] = { text: ta.value, at: Date.now() }; save(); res(null); };
        $('#chk', bar).onclick = check;
      };
      const check = () => {
        const txt = ta.value.trim(); if (txt.length < 5) { ta.focus(); M.toast('Escribe tu tarea primero ✍️'); return; }
        const fb = checkWriting(txt, hw); out.innerHTML = '';
        fb.items.forEach(f => out.appendChild(h(`<li class="${f.cls}"><span>${f.cls === 'ok' ? '✅' : f.cls === 'no' ? '❌' : '💡'}</span><span>${f.msg}</span></li>`)));
        S.hw[p.id] = { text: txt, at: Date.now(), score: fb.score }; save();
        const wa = `https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent(`📚 Tarea Módulo 1 — ${p._t.title} Part ${p.part}\n👤 ${S.name}\n\n${txt}`)}`;
        bar.innerHTML = '';
        const again = h(`<button class="btn w">✏️ Corregir</button>`);
        const send = h(`<a class="btn" target="_blank" rel="noopener" style="text-decoration:none;background:#25D366;color:#fff" href="${wa}">💬 Enviar a mi profe</a>`);
        const nx = h(`<button class="btn k lg">Terminar clase →</button>`);
        bar.append(again, send, nx); fb.ok >= fb.total * .7 ? sfx('ok') : sfx('bad');
        out.scrollIntoView({ behavior: 'smooth', block: 'start' });
        again.onclick = () => { out.innerHTML = ''; idle(); ta.focus(); };
        nx.onclick = () => res(A.result(fb.ok, fb.total, 'writing'));
      };
      idle();
    });
  }
  function checkWriting(txt, hw) {
    const items = []; let ok = 0, total = 0;
    const add = (pass, msgOk, msgNo) => { total++; if (pass) { ok++; items.push({ cls: 'ok', msg: msgOk }); } else items.push({ cls: 'no', msg: msgNo }); };
    const sentences = txt.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean);
    const isList = !/oraci/.test(hw.es);
    const count = isList ? Math.max(sentences.length, txt.split(/[,\n]+/).filter(s => s.trim()).length) : sentences.length;
    add(count >= hw.n, `Cantidad: escribiste ${count} ${isList ? 'elementos' : 'oraciones'}. ¡Bien!`, `Escribiste ${count} ${isList ? 'elementos' : 'oraciones'}; se piden al menos <b>${hw.n}</b>.`);
    const low = txt.toLowerCase();
    const missingKw = hw.kw.filter(k => !new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['’]") + '\\b', 'i').test(low));
    if (hw.kw.length) add(!missingKw.length, `Usaste las palabras clave (${hw.kw.map(esc).join(', ')}).`, `Te faltó usar: <b>${missingKw.map(esc).join(', ')}</b>.`);
    if (!isList) {
      const capBad = sentences.filter(s => /^[a-z]/.test(s));
      add(!capBad.length, 'Todas tus oraciones empiezan con mayúscula.', `Empieza cada oración con <b>mayúscula</b>: “${esc(capBad[0] || '')}”`);
      const punBad = sentences.filter(s => !/[.!?]["”]?$/.test(s));
      add(!punBad.length, 'Terminas tus oraciones con punto (o signo).', `Termina cada oración con <b>punto (.)</b> o signo (? !).`);
    }
    // common mistakes of Spanish speakers
    const tips = [];
    if (/(^|\s)i(\s|'|’)/.test(txt)) tips.push('Escribe <b>I</b> (yo) siempre en mayúscula.');
    if (/\bi have \d+ (years|year)\b|\bhave (\w+ )?years\b/i.test(txt)) tips.push('Para la edad usa <b>I\'m ___ years old</b>, no <i>I have ___ years</i>.');
    if (/\b(colombian|mexican|american|spanish|english|french|italian|japanese|chinese|german|brazilian|canadian)\b/.test(txt)) tips.push('Las nacionalidades e idiomas van con <b>mayúscula</b> (Colombian, English).');
    if (/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|june|july|august|september|october|november|december)\b/.test(txt)) tips.push('Los días y meses van con <b>mayúscula</b> (Monday, July).');
    if (/\ba (a|e|i|o|u)\w+/i.test(txt) && !/\ba (uni|use|euro|one)/i.test(txt)) tips.push('Antes de sonido de vocal usa <b>an</b>: <i>an apple, an engineer</i>.');
    if (/\ban (b|c|d|f|g|j|k|l|m|n|p|q|r|s|t|v|w|x|y|z)\w+/i.test(txt) && !/\ban (hour|honest)/i.test(txt)) tips.push('Antes de sonido de consonante usa <b>a</b>: <i>a book, a car</i>.');
    if (/\b(peoples|childs|mans|womans|foots|tooths|informations)\b/i.test(txt)) tips.push('Revisa los plurales irregulares: <i>people, children, men, women, feet, teeth</i>.');
    if (/\b(he|she|it) (are|am)\b|\b(they|we|you) is\b|\bi is\b|\bi are\b/i.test(txt)) tips.push('Verbo to be: <b>I am</b>, <b>he/she/it is</b>, <b>you/we/they are</b>.');
    if (/\b(he|she) (work|like|live|have)\b/i.test(txt)) tips.push('Con <b>he/she</b> el verbo lleva <b>-s</b>: <i>she works, he likes, she has</i>.');
    if (/\bis (a )?(red|blue|green|black|white|yellow) (car|house|dog|cat|dress|shirt)\b/i.test(txt) === false && /\b(car|house|dog|cat|dress|shirt) (red|blue|green|black|white|yellow)\b/i.test(txt)) tips.push('El color va <b>antes</b> del sustantivo: <i>a red car</i>.');
    if (/\s{2,}/.test(txt)) tips.push('Evita los espacios dobles entre palabras.');
    tips.forEach(t => items.push({ cls: 'tip', msg: t }));
    if (!tips.length && ok === total) items.push({ cls: 'ok', msg: '¡Excelente trabajo! No encontré errores comunes. 🌟 Envíala a tu profe para una revisión final.' });
    return { items, ok, total, score: Math.round(ok / total * 100) };
  }

  /* ---------------- RESULTS ---------------- */
  function results(p, run) {
    run.res = Object.values(run.res || {});
    const c = run.res.reduce((a, r) => a + r.c, 0), t = run.res.reduce((a, r) => a + r.t, 0);
    const pct = t ? Math.round(c / t * 100) : 100; const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
    const rec = S.parts[p.id]; const wasDone = rec.done;
    rec.done = true; rec.stars = Math.max(rec.stars || 0, stars); rec.best = Math.max(rec.best || 0, pct); rec.step = 0; rec.run = null; rec.at = Date.now();
    const bonus = wasDone ? 10 : 50; S.xp += bonus; M.touchStreak(); S.last = p.id; save(); topbar();
    // per-skill breakdown in this class
    const sk = {}; run.res.forEach(r => { sk[r.skill] = sk[r.skill] || [0, 0]; sk[r.skill][0] += r.c; sk[r.skill][1] += r.t; });
    const weakest = Object.entries(sk).filter(([, v]) => v[1]).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1])[0];
    const missed = []; run.res.forEach(r => (r.missed || []).forEach(m => { if (m.en && !missed.find(x => x.en === m.en)) missed.push(m); }));
    const nx = M.nextPart(p);
    const head = pct >= 90 ? '¡Clase perfecta! 🏆' : pct >= 70 ? '¡Muy buen trabajo! 💪' : '¡Clase completada! 👏';
    const advice = pct >= 90 ? `¡Lo hiciste increíble, ${esc(S.name.split(' ')[0])}! Ya dominas este tema. Sigue con la próxima clase.` : pct >= 70 ? 'Vas muy bien. Repasa las palabras que te costaron y pasa a la siguiente clase.' : 'Te recomendamos repetir esta clase mañana: la repetición es la clave para aprender. ¡Tú puedes!';
    app.innerHTML = `<div class="player"><div class="card">
      <div class="center">${M.mascot('mascot bounce', pct >= 90 ? 'celebrate' : pct >= 70 ? 'thumbs' : 'smile')}<h2 style="font-size:30px">${head}</h2><p class="muted">${esc(p._t.title)} · Part ${p.part}: ${esc(p.title)}</p></div>
      <div class="res-stars">${[1, 2, 3].map(i => `<span style="${i <= stars ? '' : 'opacity:.2;filter:grayscale(1)'}">⭐</span>`).join('')}</div>
      <div class="stats"><div class="stat"><b>${pct}%</b><small>Precisión</small></div><div class="stat"><b>+${run.xp + bonus}</b><small>XP ganados</small></div><div class="stat"><b>${c}/${t}</b><small>Respuestas</small></div></div>
      <h3 style="margin:18px 0 8px">📊 Tus 4 habilidades en esta clase</h3>
      <div class="skills" style="margin-top:0">${SKILLS.map(([k, ic, nm]) => { const v = sk[k]; const pc = v && v[1] ? Math.round(v[0] / v[1] * 100) : null; return `<div class="skill"><div class="ic">${ic}</div><div class="nm">${nm}</div><div class="bar"><i style="width:${pc || 0}%"></i></div><small class="muted">${pc === null ? '—' : pc + '%'}</small></div>`; }).join('')}</div>
      <div class="lesson"><h3>🧑‍🏫 Consejos del profe</h3><p>${advice}</p>
        ${weakest && weakest[1][0] / weakest[1][1] < .9 ? `<div class="tipbox"><span>🎯</span><span><b>Para mejorar tu ${weakest[0]}:</b> ${SKILL_TIPS[weakest[0]]}</span></div>` : ''}
        ${(p.tips || []).slice(0, 2).map(t => `<div class="tipbox"><span>🗣️</span><span>${t}</span></div>`).join('')}
      </div>
      ${missed.length ? `<h3 style="margin:18px 0 8px">🔁 Palabras para repasar</h3><div class="weak">${missed.slice(0, 12).map((m, i) => `<span>${esc(m.en)} ${m.au ? `<button class="aud sm" data-i="${i}">🔊</button>` : ''}</span>`).join('')}</div>` : ''}
      <div class="row" style="margin-top:22px;justify-content:center">
        <button class="btn w" id="again">🔁 Repetir clase</button><button class="btn w" id="home">🏠 Inicio</button>
        ${nx ? `<button class="btn k lg" id="next">Siguiente: ${esc(nx._t.title)} · Part ${nx.part} →</button>` : `<button class="btn k lg" id="fin">🏆 Examen final →</button>`}
      </div></div></div>`;
    $$('.weak button', app).forEach(b => b.onclick = () => play(missed[+b.dataset.i].au, { btn: b }));
    $('#again').onclick = () => route('class', p.id); $('#home').onclick = () => route('home');
    if ($('#next')) $('#next').onclick = () => M.isUnlocked(nx.topic) ? route('class', nx.id) : (route('home'), unlockModal());
    if ($('#fin')) $('#fin').onclick = () => route('final');
    sfx('win'); M.confetti(stars === 3 ? 3500 : 2000); M.praise();
    checkBadges();
  }

  /* ---------------- BADGES ---------------- */
  const BADGES = [
    ['first', '🚀', 'Primer paso', 'Completa tu primera clase', () => M.allParts().some(p => S.parts[p.id] && S.parts[p.id].done)],
    ['five', '📚', 'Estudiante dedicado', 'Completa 5 clases', () => M.allParts().filter(p => S.parts[p.id] && S.parts[p.id].done).length >= 5],
    ['perfect', '🏆', 'Clase perfecta', 'Obtén 3 estrellas', () => M.allParts().some(p => M.partStars(p.id) === 3)],
    ['streak3', '🔥', 'En racha', 'Estudia 3 días seguidos', () => (S.streak.n || 0) >= 3],
    ['xp1000', '⚡', '1000 XP', 'Acumula 1000 puntos', () => S.xp >= 1000],
    ['speaker', '🎤', 'Gran speaker', 'Speaking por encima de 80%', () => S.skills.speaking[1] >= 10 && M.skillPct('speaking') >= 80],
    ['half', '⭐', 'Mitad del camino', 'Completa 14 clases', () => M.allParts().filter(p => S.parts[p.id] && S.parts[p.id].done).length >= 14],
    ['grad', '🎓', 'Graduado A1', 'Aprueba el examen final', () => S.final && S.final.best >= C.PASS_SCORE],
  ];
  function checkBadges() { S.badges = S.badges || []; BADGES.forEach(([id, e, n]) => { if (!S.badges.includes(id) && BADGES.find(b => b[0] === id)[4]()) { S.badges.push(id); setTimeout(() => M.toast(`🏅 ¡Nueva insignia: ${n} ${e}!`), 1500); } }); save(); }

  /* ---------------- PROGRESS ---------------- */
  function progress() {
    const parts = M.allParts(); const done = parts.filter(p => S.parts[p.id] && S.parts[p.id].done).length;
    const stars = parts.reduce((a, p) => a + M.partStars(p.id), 0);
    const weak = Object.entries(S.weak).sort((a, b) => b[1].n - a[1].n).slice(0, 20);
    S.badges = S.badges || [];
    const sk = SKILLS.map(([k]) => [k, M.skillPct(k), S.skills[k][1]]).filter(x => x[2]);
    const low = sk.sort((a, b) => a[1] - b[1])[0];
    app.innerHTML = `<div class="wrap">
      <div class="card"><div class="row"><div class="ring" style="--p:${M.overallPct()}"><b>${M.overallPct()}%</b></div><div class="grow"><span class="lbl">Mi progreso</span><h1 style="font-size:30px;margin-top:8px">${esc(S.name)}</h1><p class="muted" style="margin:4px 0">Módulo 1 · Nivel A1</p></div></div>
        <div class="stats" style="grid-template-columns:repeat(4,1fr)"><div class="stat"><b>${done}/28</b><small>Clases</small></div><div class="stat"><b>${stars}/84</b><small>Estrellas</small></div><div class="stat"><b>${S.xp}</b><small>XP</small></div><div class="stat"><b>🔥 ${S.streak.n || 0}</b><small>Racha (días)</small></div></div>
        <h3 style="margin:14px 0 8px">Tus 4 habilidades</h3>
        <div class="skills" style="margin-top:0">${SKILLS.map(([k, ic, nm]) => `<div class="skill"><div class="ic">${ic}</div><div class="nm">${nm}</div><div class="bar"><i style="width:${M.skillPct(k)}%"></i></div><small class="muted">${S.skills[k][1] ? M.skillPct(k) + '% · ' + S.skills[k][1] + ' ejercicios' : 'Sin datos aún'}</small></div>`).join('')}</div>
        ${low ? `<div class="tipbox" style="margin-top:12px"><span>🎯</span><span><b>Recomendación:</b> tu habilidad para mejorar es <b>${low[0]}</b>. ${SKILL_TIPS[low[0]]}</span></div>` : ''}
      </div>
      <div class="sect-title"><h2>🏅 Insignias</h2></div>
      <div class="badges">${BADGES.map(([id, e, n, d]) => `<div class="bdg ${S.badges.includes(id) ? '' : 'off'}"><div class="e">${e}</div><b>${n}</b><small>${d}</small></div>`).join('')}</div>
      <div class="sect-title"><h2>🔁 Palabras para repasar</h2>${weak.length ? '<button class="btn sm k" id="pw">🎯 Practicar ahora</button>' : ''}</div>
      <div class="card">${weak.length ? `<div class="weak">${weak.map(([w, v], i) => `<span>${esc(w)} ${v.au ? `<button class="aud sm" data-i="${i}">🔊</button>` : ''}</span>`).join('')}</div>` : '<p class="muted" style="margin:0">¡Aún no hay palabras difíciles! Aquí aparecerán las palabras en las que te equivoques, para que las repases.</p>'}</div>
      <div class="sect-title"><h2>📚 Temas</h2></div>
      <div class="tlist">${D.topics.map(t => `<div class="trow"><span class="n">${t.n}</span><b>${esc(t.title)}${M.isUnlocked(t.n) ? '' : ' 🔒'}</b>${t.parts.map(p => `<span class="stars ${p.part === 2 ? 'hs' : ''}" title="Part ${p.part}">P${p.part} ${[1, 2, 3].map(i => `<span class="${i <= M.partStars(p.id) ? '' : 'off'}">⭐</span>`).join('')}</span>`).join('')}</div>`).join('')}</div>
      <div class="sect-title"><h2>⚙️ Datos</h2></div>
      <div class="card"><p class="muted" style="margin-top:0">Tu progreso se guarda en este dispositivo y navegador. Puedes descargar una copia de respaldo o restaurarla en otro dispositivo.</p>
        <div class="row"><button class="btn sm w" id="exp">⬇️ Descargar respaldo</button><label class="btn sm w" style="cursor:pointer">⬆️ Restaurar respaldo<input type="file" accept=".json" id="imp" hidden></label><button class="btn sm w" id="rst" style="color:var(--bad)">🗑️ Reiniciar progreso</button></div></div>
    </div>`;
    $$('.weak button', app).forEach(b => b.onclick = async () => { await M.loadAudio(['common', ...D.topics.map(t => 't' + t.n)]); play(weak[+b.dataset.i][1].au, { btn: b }); });
    if ($('#pw')) $('#pw').onclick = () => practiceWeak(weak);
    $('#exp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' })); a.download = `progreso-modulo1-${S.name.replace(/\s+/g, '_')}.json`; a.click(); };
    $('#imp').onchange = async (e) => { try { const d = JSON.parse(await e.target.files[0].text()); if (!d.v) throw 0; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, d); save(); M.toast('Progreso restaurado ✅'); route('progress'); } catch (er) { M.toast('Archivo no válido'); } };
    $('#rst').onclick = () => { const m = M.modal(`<h3>¿Reiniciar todo tu progreso?</h3><p class="muted">Se borrarán tus estrellas, XP y clases completadas en este dispositivo. Los códigos de acceso se conservan.</p><div class="row"><button class="btn w" id="n">Cancelar</button><button class="btn k" id="y" style="background:var(--bad);color:#fff">Sí, reiniciar</button></div>`);
      $('#n', m).onclick = () => m.remove(); $('#y', m).onclick = () => { const keep = { name: S.name, unlocked: S.unlocked, all: S.all }; localStorage.removeItem('mra_m1_progress_v1'); Object.keys(S).forEach(k => delete S[k]); Object.assign(S, { v: 1, created: Date.now(), xp: 0, streak: { last: '', n: 0 }, parts: {}, skills: { listening: [0, 0], reading: [0, 0], speaking: [0, 0], writing: [0, 0] }, weak: {}, final: null, hw: {}, sound: true, badges: [] }, keep); save(); m.remove(); route('home'); }; };
  }
  async function practiceWeak(weak) {
    const all = M.allParts().flatMap(p => p.vocab.map(v => ({ ...v })));
    const items = weak.map(([w]) => all.find(v => v.en === w)).filter(Boolean).slice(0, 8);
    if (items.length < 2) { M.toast('Necesitas al menos 2 palabras para practicar'); return; }
    await M.loadAudio(['common', ...D.topics.map(t => 't' + t.n)]);
    app.innerHTML = `<div class="player"><div class="phead"><button class="x">✕</button><div class="prog"><i style="width:0%"></i></div></div><div class="stage"></div></div>`;
    $('.x', app).onclick = () => route('progress');
    const stage = $('.stage', app); const pool = all.filter((v, i, a) => a.findIndex(x => x.en === v.en) === i);
    const r = await A.qloop(stage, { lbl: 'Review', title: 'Practica tus palabras difíciles', ins: 'Escucha y elige la opción correcta.' }, items, async (body, it) => {
      body.appendChild(A.playBtn(it.au)); const opts = shuffle([it, ...sample(pool.filter(x => x.en !== it.en && x.img !== it.img), 3)]);
      const wrap = h(`<div class="opts" style="margin-top:12px"></div>`); body.appendChild(wrap);
      const btns = opts.map(o => { const b = h(`<button class="opt">${esc(o.en)}</button>`); wrap.appendChild(b); return b; }); setTimeout(() => play(it.au), 300);
      const i = await A.choose(btns); const ok = opts[i] === it; btns[opts.indexOf(it)].classList.add('right'); if (!ok) btns[i].classList.add('wrong');
      await A.feedback(ok, `${it.en} (${it.es})`); return ok;
    });
    M.addSkill('listening', r.c, items.length); S.xp += r.c * 5; save();
    await sheet({ ok: true, title: `¡Repaso terminado! ${r.c}/${items.length}`, msg: 'Las palabras que aciertas salen de tu lista de repaso. 💪' });
    route('progress');
  }

  /* ---------------- FINAL TEST ---------------- */
  function finalTest() {
    if (!M.finalUnlocked()) { unlockModal(); return route('home'); }
    window.M1FINAL.run(app, { route, after: () => { checkBadges(); topbar(); } });
  }
  function certificateView() { window.M1FINAL.certificate(app, { route }); }

  /* ---------------- boot ---------------- */
  M.touchStreak();
  route('home');
})();
