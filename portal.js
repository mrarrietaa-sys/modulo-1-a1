/* =====================================================================
   PORTAL — Perfil del estudiante (inicio de toda la plataforma)
   Ingreso con código → (nombre) → examen de clasificación → módulos
   ===================================================================== */
(function () {
  const M = window.M1, P = window.MRAP, C = window.M1CONFIG;
  const { $, $$, h, esc, sfx } = M;
  const app = $('#app');
  const WA = (t) => `https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent(t)}`;
  const U = (id, w = 800, hh = 450) => `https://images.unsplash.com/${id}?w=${w}&h=${hh}&fit=crop&crop=entropy&q=80&auto=format`;

  function topbar() {
    const p = P.get();
    $('#topbar').innerHTML = `<div class="brand" id="go-home"><span class="logo-pill"><img class="logo" src="mra-brand.png" alt="mrarrieta.com"></span><small>MI PERFIL</small></div><div class="sp"></div>
      ${p ? `<span class="pill hide-s">${p.type === 'staff' ? '👨‍🏫 Profe' : p.type === 'trial' ? '🎁 Cortesía' : '🎓 Estudiante'}</span><button class="iconbtn" id="out" title="Salir">⏻</button>` : ''}`;
    $('#go-home').onclick = () => route('home');
    if ($('#out')) $('#out').onclick = logout;
  }
  function route(r) { M.stop && M.stop(); window.scrollTo(0, 0); topbar(); const p = P.get();
    if (!p) return login();
    if (!p.first) return nameStep();
    if (r === 'placement') return placement();
    return home();
  }

  /* ---------- ingreso con código ---------- */
  function codeType(code) {
    const hh = M.codeHash(code);
    if ((C.REVIEW_CODES || []).includes(hh)) return { type: 'staff' };
    const st = (C.STUDENT_CODES || []).find(x => x.hash === hh); if (st) return { type: 'student', module: st.module || null };
    const tr = (C.TRIAL_CODES || []).find(x => x.hash === hh); if (tr) return { type: 'trial', module: tr.module || null };
    const old = (C.ACCESS_CODES || []).find(x => x.hash === hh); if (old) return { type: 'student', module: null };
    return null;
  }
  function login() {
    app.innerHTML = `<div class="wrap pt-wrap"><div class="card pt-login">
      
      <div class="pt-hello">${M.mascot('pt-mra', 'welcome')}<div class="bubble">Welcome, my friend! 👋<small>Bienvenido(a) a tu plataforma de inglés</small></div></div>
      <h1>Ingresa a tu perfil</h1><p class="muted">Escribe el código que te entregó administración.</p>
      <input class="inp" id="cd" placeholder="Ej: ABC-123" autocapitalize="characters" autocomplete="off">
      <button class="btn k block lg" id="ok">Entrar →</button>
      <div class="pt-or"><span>¿Aún no eres estudiante?</span></div>
      <a class="btn block pt-wa" target="_blank" rel="noopener" href="${WA('¡Hola! 👋 Quiero conocer la plataforma de mrarrieta.com. ¿Me pueden dar un código para mi acceso de cortesía? 🎁')}">🎁 Pide tu acceso de cortesía gratis</a>
      <p class="muted pt-small">Con el código de cortesía tomas el examen de clasificación y vives la experiencia con los 2 primeros temas de tu módulo.</p></div></div>`;
    const i = $('#cd'); setTimeout(() => i.focus(), 200);
    const go = () => { const r = codeType(i.value); if (!r) { i.classList.add('wrong'); sfx('bad'); setTimeout(() => i.classList.remove('wrong'), 500); M.toast('Código no válido 😕'); return; }
      const old = P.get() || {};
      P.save(Object.assign({ created: Date.now() }, old, { type: r.type, codeHash: M.codeHash(i.value), module: r.module || old.module || null, assignedBy: r.module ? 'admin' : (old.assignedBy || null) }));
      sfx('win'); M.confetti(1500); route('home'); };
    $('#ok').onclick = go; i.onkeydown = e => { if (e.key === 'Enter') go(); };
  }
  function nameStep() {
    const s1 = (M.S && M.S.name) || ''; const p = P.get();
    app.innerHTML = `<div class="wrap pt-wrap"><div class="card pt-login"><div class="pt-hello">${M.mascot('pt-mra', 'smile')}<div class="bubble">Nice to meet you! 😊<small>¡Mucho gusto!</small></div></div>
      <h1>¿Cómo te llamas?</h1><p class="muted">Así aparecerá tu nombre en tu perfil, tus reportes y tus certificados.</p>
      <label class="pt-lab">Nombre</label><input class="inp" id="f" value="${esc(s1.split(' ')[0] || '')}" autocomplete="given-name">
      <label class="pt-lab">Apellido</label><input class="inp" id="l" value="${esc(s1.split(' ').slice(1).join(' '))}" autocomplete="family-name">
      <button class="btn k block lg" id="ok" style="margin-top:14px">Continuar →</button></div></div>`;
    $('#ok').onclick = () => { const f = $('#f').value.trim(), l = $('#l').value.trim(); if (!f) return $('#f').classList.add('wrong'); if (!l) return $('#l').classList.add('wrong');
      P.save(Object.assign(p, { first: f, last: l, name: f + ' ' + l }));
      // el nombre también se usa dentro de los módulos
      P.MODS.forEach(m => { try { const s = JSON.parse(localStorage.getItem(m.key) || 'null'); if (s && !s.name) { s.name = f + ' ' + l; localStorage.setItem(m.key, JSON.stringify(s)); } } catch (e) { } });
      route('home'); };
  }
  function logout() {
    const m = M.modal(`<h3>¿Salir de tu perfil?</h3><p class="muted">Tu progreso queda guardado en este dispositivo. Para volver a entrar necesitarás tu código.</p><div class="row"><button class="btn k" id="y">Sí, salir</button><button class="btn w" id="n">Cancelar</button></div>`, { x: true });
    $('#n', m).onclick = () => m.remove(); $('#y', m).onclick = () => { m.remove(); P.clear(); route('home'); };
  }

  /* ---------- perfil ---------- */
  function home() {
    const p = P.get(); const a = P.assigned(); const staff = p.type === 'staff', trial = p.type === 'trial';
    const ini = ((p.first || '?')[0] + (p.last || '')[0]).toUpperCase();
    const pst = window.MRAPLACE ? MRAPLACE.status() : { attempts: 0, max: 2 };
    const pl = p.placement;
    const hr = new Date().getHours(); const greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
    let main = '';
    if (!p.module && !staff) {
      main = `<div class="card pt-step"><div class="pt-stepn">1</div><div><span class="lbl">Primer paso</span><h2>Toma tu examen de clasificación</h2>
        <p>Son <b>45 preguntas</b> (Listening, Reading, Writing y Speaking) que van de fáciles a difíciles. Al terminar, la plataforma te <b>ubica automáticamente</b> en el módulo que te corresponde: A1, A2, B1 o B2-C1.</p>
        <p class="muted">⏱ 45 minutos · ${pst.max} intentos${pst.attempts ? ` · Ya usaste ${pst.attempts}` : ''}${pst.inProgress ? ' · <b>Tienes un examen en progreso</b>' : ''}</p>
        <button class="btn k lg" id="pt">📝 ${pst.inProgress ? 'Continuar' : 'Tomar'} mi examen de clasificación</button></div></div>`;
    } else if (a || staff) {
      const ready = a && a.ready;
      main = `<div class="card pt-mymod">${a ? `<div class="pt-mymod-img" style="background-image:url('${U(a.img)}')"><span>${a.n}</span></div>` : ''}<div><span class="lbl">${staff ? 'Modo profe' : 'Tu módulo'}</span>
        <h2>${staff ? 'Todos los módulos abiertos para revisión' : `${esc(a.name)} · ${esc(a.es)}`}</h2>
        ${a ? `<p class="muted">${pl && p.assignedBy !== 'admin' ? `Ubicado por tu examen de clasificación (${new Date(pl.date).toLocaleDateString('es-CO')}).` : 'Asignado por administración.'}${a.n > (p.module || 1) ? ' ¡Subiste de nivel al aprobar tu módulo anterior! 🎉' : ''}</p>` : ''}
        ${a && ready ? `<div class="pt-bar"><i style="width:${P.progress(a.id).pct}%"></i></div><p class="muted" style="margin:4px 0 10px">${P.progress(a.id).done} de ${trial ? '4 clases de tu acceso de cortesía' : a.classes + ' clases'} completadas</p><a class="btn k lg" href="${a.url}">▶ ${P.progress(a.id).done ? 'Continuar' : 'Empezar'} mi módulo</a>` : ''}
        ${a && !ready && trial && P.trialMod() ? `<p class="pt-soon">🚧 Tu ${esc(a.name)} se está terminando de construir. Mientras tanto, usa tu acceso de cortesía con los 2 primeros temas del <b>${esc(P.trialMod().name)}</b>.</p><a class="btn k lg" href="${P.trialMod().url}">▶ Entrar con mi acceso de cortesía</a>` : ''}
        ${a && !ready && !trial ? `<p class="pt-soon">🚧 Tu ${esc(a.name)} se está terminando de construir. ¡Muy pronto estará listo! Mientras tanto puedes repasar los módulos anteriores.</p>` : ''}</div></div>`;
    }
    app.innerHTML = `<div class="wrap">
      <section class="card pt-head"><div class="pt-av">${esc(ini)}</div><div class="pt-hi"><span class="lbl">${greet}!</span><h1>¡Hola, <span class="nm">${esc(p.first)}</span>! 👋</h1>
        <p class="muted">${staff ? '👨‍🏫 Perfil de profesor — puedes revisar todo.' : trial ? '🎁 Acceso de cortesía — conoce nuestra plataforma.' : '🎓 Estudiante de mrarrieta.com'}</p></div>${M.mascot('pt-headmra', 'welcome')}</section>
      ${trial ? `<div class="pt-trialbar">🎁 <div><b>Estás en tu acceso de cortesía.</b> Tienes acceso al examen de clasificación y a los <b>2 primeros temas</b> de tu módulo. ¿Te gustó? <a target="_blank" rel="noopener" href="${WA(`¡Hola! Soy ${p.name}. Probé el acceso de cortesía en la plataforma y quiero inscribirme 🚀`)}">Inscríbete aquí 💬</a></div></div>` : ''}
      ${main}
      <div class="sect-title"><h2>📚 Mis módulos</h2></div>
      <div class="pt-mods-grid">${P.MODS.map(m => modCard(m)).join('')}</div>
      ${pl ? `<div class="sect-title"><h2>📝 Mi examen de clasificación</h2></div><div class="card pt-plres"><div><b>Resultado:</b> ${esc(P.mod(pl.module).name)} · ${esc(P.mod(pl.module).es)}<br><span class="muted">${new Date(pl.date).toLocaleDateString('es-CO')}${pl.mods ? ' · ' + [1, 2, 3, 4].map(k => `${P.mod(k).id}: ${pl.mods[k]}%`).join(' · ') : ''}</span></div>${pst.attempts < pst.max ? '<button class="btn w sm" id="pt2">🔁 Repetir examen</button>' : ''}</div>` : ''}
      ${staff ? `<div class="sect-title"><h2>📝 Examen de clasificación</h2></div><div class="card pt-plres"><div>Puedes presentar o revisar el examen de clasificación como lo verá el estudiante.</div><button class="btn w sm" id="pt2">📝 Abrir examen</button></div>` : ''}
      ${certs()}
      <p class="center fx-foot" style="margin-top:22px;font-size:13.5px;font-weight:600">mrarrieta.com · ¡Aprende inglés HABLANDO! · WhatsApp ${esc(C.WHATSAPP.replace(/^57/, ''))}</p></div>`;
    if ($('#pt')) $('#pt').onclick = () => route('placement');
    if ($('#pt2')) $('#pt2').onclick = () => { if (staff) return route('placement'); const m = M.modal(`<h3>¿Repetir el examen de clasificación?</h3><p class="muted">Tu nuevo resultado reemplazará la ubicación actual de tu perfil. Usaste ${pst.attempts} de ${pst.max} intentos.</p><div class="row"><button class="btn k" id="y">Sí, repetir</button><button class="btn w" id="n">Cancelar</button></div>`, { x: true }); $('#n', m).onclick = () => m.remove(); $('#y', m).onclick = () => { m.remove(); route('placement'); }; };
    $$('.pt-mod').forEach(el => el.onclick = () => openMod(el.dataset.id));
  }
  function modCard(m) {
    const r = P.role(m.id); const pr = P.progress(m.id); const trial = P.isTrial();
    const chip = { current: '⭐ TU MÓDULO', review: '🔁 REPASO', locked: '🔒 BLOQUEADO', soon: '🚧 PRÓXIMAMENTE' }[r];
    const showBar = (r === 'current' || r === 'review') && m.ready;
    return `<button class="pt-mod ${r}" data-id="${m.id}"><div class="pt-mod-img" style="background-image:url('${U(m.img, 640, 360)}')"><span class="pt-mod-n">${m.n}</span><span class="pt-chip ${r}">${chip}</span></div>
      <div class="pt-mod-bd"><h3>${esc(m.name)} · ${esc(m.id === 'B2' ? 'B2-C1' : m.id)}</h3><div class="es">${esc(m.es)}</div><p>${esc(m.desc)}</p>
      ${showBar ? `<div class="pt-bar"><i style="width:${pr.pct}%"></i></div><small class="muted">${pr.done} de ${r === 'current' && trial ? 4 : m.classes} clases${P.passed(m.id) ? ' · 🎓 Aprobado' : ''}</small>` : ''}
      ${r === 'locked' ? `<small class="muted">${trial ? 'Disponible al inscribirte' : 'Se abre al aprobar tu módulo'}</small>` : ''}</div></button>`;
  }
  function openMod(id) {
    const m = P.mod(id), r = P.role(id), a = P.assigned();
    if (r === 'current' || r === 'review') { location.href = m.url; return; }
    if (r === 'soon') return M.modal(`<div class="center">${M.mascot('mascot', 'think')}</div><h3 class="center">🚧 ${esc(m.name)} · ${esc(m.es)}</h3><p class="center">Este módulo está en construcción. ¡Muy pronto estará disponible en tu perfil!</p>`, { x: true });
    const msg = P.isTrial() ? `Tu acceso de cortesía incluye solo tu módulo asignado. ¡Inscríbete para estudiar todos los módulos!`
      : !a ? 'Primero toma tu examen de clasificación para saber en qué módulo empiezas.'
      : `Para abrir el ${m.name} primero debes <b>terminar y aprobar el examen final del ${esc(a.name)}</b>. ¡Paso a paso! 💪`;
    const mm = M.modal(`<div class="center">${M.mascot('mascot', 'pointside')}</div><h3 class="center">🔒 ${esc(m.name)} bloqueado</h3><p class="center" style="font-size:17px">${msg}</p>
      ${P.isTrial() ? `<a class="btn block pt-wa" target="_blank" rel="noopener" href="${WA('¡Hola! Quiero inscribirme en mrarrieta.com 🚀')}">💬 Quiero inscribirme</a>` : '<button class="btn k block" id="cl">Entendido</button>'}`, { x: true });
    if ($('#cl', mm)) $('#cl', mm).onclick = () => mm.remove();
  }
  function certs() {
    const done = P.MODS.filter(m => m.ready && P.passed(m.id)); if (!done.length) return '';
    return `<div class="sect-title"><h2>🎓 Mis certificados</h2></div><div class="pt-certs">${done.map(m => `<a class="card pt-cert" href="${m.url}#cert">🎓 <div><b>${esc(m.name)} · ${esc(m.level)}</b><small>Nota: ${(P.modState(m.id).final.score || 0).toFixed ? Number(P.modState(m.id).final.score).toFixed(1) : ''}/10 · Ver y descargar</small></div></a>`).join('')}</div>`;
  }
  function placement() {
    window.MRAPLACE.run(app, { route: (r) => route(r || 'home'), after: () => topbar() });
  }
  route('home');
})();
