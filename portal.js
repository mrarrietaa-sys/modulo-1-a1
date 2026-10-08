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
    $('#topbar').innerHTML = `<div class="brand" id="go-home"><span class="logo-pill"><img class="logo" src="mra-brand.png" alt="mrarrieta.com"></span></div><div class="sp"></div><span class="tb-tag">MI PERFIL</span>
      ${p ? `<span class="pill hide-s">${p.type === 'staff' ? '👨‍🏫 Profe' : p.type === 'trial' ? '🟢 Acceso gratis' : '🎓 Estudiante'}</span>${p.type === 'staff' && window.MRANN && MRANN.isHidden() ? '<button class="iconbtn" id="ann-b" title="Mostrar la barra del profesor">✏️</button>' : ''}${p.first ? `<button class="tb-avbtn" id="me-b" title="Personaliza tu perfil">${P.avHTML('tb-av')}</button>` : ''}<button class="iconbtn" id="out" title="Salir">⏻</button>` : ''}`;
    $('#go-home').onclick = () => route('home');
    if ($('#me-b')) $('#me-b').onclick = () => route('me');
    if ($('#ann-b')) $('#ann-b').onclick = () => { MRANN.show(); topbar(); };
    if (window.MRANN) MRANN.sync();
    if ($('#out')) $('#out').onclick = logout;
  }
  function route(r) { M.stop && M.stop(); window.scrollTo(0, 0); topbar(); const p = P.get();
    if (!p) return login();
    if (!p.first) return nameStep();
    if (r === 'placement') return placement();
    if (r === 'me' || r === 'me-photo' || r === 'me-av' || r === 'me-plat') return personalize(r === 'me' ? 'av' : r.slice(3));
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
      
      ${(() => { const lu = P.lastUser(); return lu && lu.first ? `<div class="pt-hello">${lu.pic ? `<span class="pt-av big pt-lu has"><img src="${lu.pic}" alt=""></span>` : M.mascot('pt-mra', 'wink')}<div class="bubble">Welcome back, ${esc(lu.first)}! 👋</div></div>`
        : `<div class="pt-hello">${M.mascot('pt-mra', 'welcome')}<div class="bubble">Welcome, my friend! 👋<small>Bienvenido(a) a tu plataforma de inglés</small></div></div>`; })()}
      <h1>Ingresa a tu perfil</h1><p class="muted">Escribe el código que te entregó administración.</p>
      <input class="inp" id="cd" placeholder="Ej: ABC-123" autocapitalize="characters" autocomplete="off">
      <button class="btn k block lg" id="ok">Entrar →</button>
      <div class="pt-or"><span>¿Aún no eres estudiante?</span></div>
      <div class="pt-free"><h2>🟢 EMPIEZA GRATIS</h2>
        <p><b>Crea tu acceso gratuito y descubre tu ruta de aprendizaje.</b></p>
        <p class="muted">Realiza nuestro examen de clasificación y explora los primeros temas de tu módulo.</p>
        <a class="btn block lg pt-wa" target="_blank" rel="noopener" href="${WA('¡Hola! 👋 Quiero EMPEZAR GRATIS en la plataforma de mrarrieta.com y descubrir mi ruta de aprendizaje. ¿Me envían mi código de acceso gratuito? 🟢')}">EMPEZAR GRATIS →</a></div></div></div>`;
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
    $('#n', m).onclick = () => m.remove(); $('#y', m).onclick = () => { m.remove(); const cur = P.get(); if (cur && cur.first) P.save(cur); P.clear(); route('home'); };
  }

  /* ---------- perfil ---------- */
  function home() {
    const p = P.get(); const a = P.assigned(); const staff = p.type === 'staff', trial = p.type === 'trial';
    const ini = ((p.first || '?')[0] + (p.last || '')[0]).toUpperCase();
    const pst = window.MRAPLACE ? MRAPLACE.status() : { attempts: 0, max: 2 };
    const pl = p.placement;
    const hr = new Date().getHours(); const back = P.isBack(); const greet = back ? 'Welcome back' : hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
    let main = '';
    if (!p.module && !staff) {
      main = `<div class="card pt-step"><div class="pt-stepn">1</div><div><span class="lbl">Primer paso</span><h2>Toma tu examen de clasificación</h2>
        <p>Son <b>40 preguntas</b> (Listening, Reading, Writing y Speaking) que van de fáciles a difíciles. Al terminar, la plataforma te <b>ubica automáticamente</b> en el módulo que te corresponde: A1, A2, B2 o B2+.</p>
        <p class="muted">⏱ 45 minutos · ${pst.rounds || 1} oportunidades de 2 intentos${pst.attempts ? ` · Ya usaste ${pst.attempts}` : ''}${pst.inProgress ? ' · <b>Tienes un examen en progreso</b>' : ''}</p>
        <button class="btn k lg" id="pt">📝 ${pst.inProgress ? 'Continuar' : 'Tomar'} mi examen de clasificación</button></div></div>`;
    } else if (a || staff) {
      const ready = a && a.ready;
      main = `<div class="card pt-mymod">${a ? `<div class="pt-mymod-img" style="background-image:url('${U(a.img)}')"><span>${a.n}</span></div>` : ''}<div><span class="lbl">${staff ? 'Modo profe' : '🧭 Tu ruta de aprendizaje'}</span>
        <h2>${staff ? 'Todos los módulos abiertos para revisión' : `<small class="pt-here">📍 Estás aquí</small>${esc(a.name)} · ${esc(a.es)}`}</h2>
        ${a ? `<p class="muted">${pl && p.assignedBy !== 'admin' ? `Tu ruta se creó con tu examen de clasificación (${new Date(pl.date).toLocaleDateString('es-CO')}).` : 'Tu ruta fue asignada por administración.'}${a.n > (p.module || 1) ? ' ¡Avanzaste en tu ruta al aprobar el módulo anterior! 🎉' : ''}</p>` : ''}
        ${a && ready ? `<div class="pt-bar"><i style="width:${P.progress(a.id).pct}%"></i></div><p class="muted" style="margin:4px 0 10px">${P.progress(a.id).done} de ${trial ? '4 clases de tu acceso gratuito' : a.classes + ' clases'} completadas</p><a class="btn k lg" href="${a.url}">▶ ${P.progress(a.id).done ? 'Continuar' : 'Empezar'} mi ruta</a>` : ''}
        ${a && !ready && trial && P.trialMod() ? `<p class="pt-soon">🚧 Tu ${esc(a.name)} se está terminando de construir. Mientras tanto, usa tu acceso gratuito con los 2 primeros temas del <b>${esc(P.trialMod().name)}</b>.</p><a class="btn k lg" href="${P.trialMod().url}">▶ Entrar con mi acceso gratuito</a>` : ''}
        ${a && !ready && !trial ? `<p class="pt-soon">🚧 Tu ${esc(a.name)} se está terminando de construir. ¡Muy pronto estará listo! Mientras tanto puedes repasar los módulos anteriores.</p>` : ''}</div></div>`;
    }
    app.innerHTML = `<div class="wrap">
      <section class="card pt-head ban-${esc(P.look().banner || 'w')}"><button class="pt-avwrap" id="me-av" title="Personaliza tu foto">${P.avHTML('pt-av')}<i class="pt-pen">✏️</i></button><div class="pt-hi"><span class="lbl">${greet}!</span><h1>${back ? '¡Hola de nuevo' : '¡Hola'}, <span class="nm">${esc(P.look().nick || p.first)}</span>! 👋</h1>
        <p class="muted">${staff ? '👨‍🏫 Perfil de profesor — puedes revisar todo.' : trial ? '🟢 Acceso gratuito — descubre tu ruta de aprendizaje.' : '🎓 Estudiante de mrarrieta.com'}</p></div>${M.mascot('pt-headmra', 'welcome')}</section>
      ${trial ? `<div class="pt-trialbar">🟢 <div><b>Estás en tu acceso gratuito.</b> Tienes acceso al examen de clasificación y a los <b>2 primeros temas</b> de tu módulo. ¿Te gustó? <a target="_blank" rel="noopener" href="${WA(`¡Hola! Soy ${p.name}. Empecé gratis en la plataforma y quiero inscribirme 🚀`)}">Inscríbete aquí 💬</a></div></div>` : ''}
      ${main}
      ${P.look().pic ? '' : `<div class="card pt-perso"><div class="pt-perso-img">${M.mascot('', 'wink')}</div><div><span class="lbl">Nuevo ✨</span><h2>Personaliza tu perfil</h2><p class="muted">Tómate una foto o crea <b>tu propio Mr. Arrieta</b>: vístelo, ponle sombrero y elige su fondo. ¡Haz tu plataforma más tuya!</p><button class="btn k" id="me-go">🎨 Personalizar ahora</button></div></div>`}
      <div class="sect-title"><h2>🧭 Mi ruta de aprendizaje</h2></div>
      ${routeBar()}
      <div class="pt-mods-grid pt-route">${P.MODS.map(m => modCard(m)).join('')}</div>
      ${pl ? `<div class="sect-title"><h2>📝 Mi examen de clasificación</h2></div><div class="card pt-plres"><div><b>Resultado:</b> ${esc(P.mod(pl.module).name)} · ${esc(P.mod(pl.module).es)}<br><span class="muted">${new Date(pl.date).toLocaleDateString('es-CO')}${pl.mods ? ' · ' + [1, 2, 3, 4].map(k => `${P.mod(k).id}: ${pl.mods[k]}%`).join(' · ') : ''}</span></div>${(pst.attempts < pst.max || (pst.round || 1) < (pst.rounds || 1)) ? '<button class="btn w sm" id="pt2">🔁 Repetir examen</button>' : ''}</div>` : ''}
      ${staff ? `<div class="sect-title"><h2>📝 Examen de clasificación</h2></div><div class="card pt-plres"><div>Puedes presentar o revisar el examen de clasificación como lo verá el estudiante.</div><button class="btn w sm" id="pt2">📝 Abrir examen</button></div>` : ''}
      ${certs()}
      <p class="center fx-foot" style="margin-top:22px;font-size:13.5px;font-weight:600">mrarrieta.com · ¡Aprende inglés HABLANDO! · WhatsApp ${esc(C.WHATSAPP.replace(/^57/, ''))}</p></div>`;
    if ($('#pt')) $('#pt').onclick = () => route('placement');
    // bienvenida de regreso (una vez por sesión)
    try { if (back && !sessionStorage.getItem('mra_wb')) { sessionStorage.setItem('mra_wb', '1'); const pr = a && a.ready ? P.progress(a.id) : null;
      const wm = M.modal(`<div class="center wb">${P.pic() ? P.avHTML('pt-av big') : M.mascot('mascot bounce', 'wink')}<h2>Welcome back, ${esc(P.look().nick || p.first)}! 👋</h2><p style="font-size:17px">¡Qué bueno verte de nuevo! ${pr && pr.done ? `Llevas <b>${pr.done} clase(s)</b> en tu ruta. ¡Sigamos!` : 'Hoy es un gran día para avanzar en tu ruta de aprendizaje.'}</p>
        ${a && a.ready && !staff ? `<a class="btn k block lg" style="text-decoration:none" href="${a.url}">▶ Continuar mi ruta</a>` : ''}<button class="btn w block" id="wbx" style="margin-top:8px">Ir a mi perfil</button></div>`, { x: true });
      $('#wbx', wm).onclick = () => wm.remove(); M.confetti && M.confetti(900); } } catch (e) { }
    if (!p.tourDone && !$('.modal')) setTimeout(portalTour, 700);
    $('#me-av').onclick = () => route('me'); if ($('#me-go')) $('#me-go').onclick = () => route('me');
    if ($('#pt2')) $('#pt2').onclick = () => { if (staff) return route('placement'); const m = M.modal(`<h3>¿Repetir el examen de clasificación?</h3><p>¿No te sentiste a gusto con tu resultado? Puedes repetirlo: <b>tu ruta de aprendizaje se actualizará con el nuevo resultado</b>.</p><p class="muted">Tienes ${pst.rounds || 1} oportunidades de 2 intentos cada una. Llevas ${pst.attempts} intento(s)${pst.attempts >= pst.max && (pst.round || 1) < (pst.rounds || 1) ? ' — se activará tu <b>segunda oportunidad</b>' : ''}.</p><div class="row"><button class="btn k" id="y">Sí, repetir</button><button class="btn w" id="n">Cancelar</button></div>`, { x: true }); $('#n', m).onclick = () => m.remove(); $('#y', m).onclick = () => { m.remove(); route('placement'); }; };
    $$('.pt-mod').forEach(el => el.onclick = () => openMod(el.dataset.id));
  }
  function routeBar() {
    return `<div class="pt-routebar">${P.MODS.map((m, i) => { const r = P.role(m.id); return `${i ? `<i class="ln ${r === 'locked' || r === 'soon' ? '' : 'on'}"></i>` : ''}<div class="st ${r}${P.passed(m.id) ? ' ok' : ''}"><b>${P.passed(m.id) ? '✓' : r === 'current' ? '📍' : m.n}</b><small>${esc(m.id)}</small></div>`; }).join('')}</div>`;
  }
  function modCard(m) {
    const r = P.role(m.id); const pr = P.progress(m.id); const trial = P.isTrial();
    const chip = { current: '📍 ESTÁS AQUÍ', review: P.passed(m.id) ? '✅ SUPERADO' : '🔁 REPASO', locked: '🔒 PRÓXIMA ETAPA', soon: '🚧 PRÓXIMAMENTE' }[r];
    const showBar = (r === 'current' || r === 'review') && m.ready;
    return `<button class="pt-mod ${r}" data-id="${m.id}"><div class="pt-mod-img" style="background-image:url('${U(m.img, 640, 360)}')"><span class="pt-mod-n">${m.n}</span><span class="pt-chip ${r}">${chip}</span></div>
      <div class="pt-mod-bd"><h3>${esc(m.name)} · ${esc(m.id)}</h3><div class="es">${esc(m.es)}</div><p>${esc(m.desc)}</p>
      ${showBar ? `<div class="pt-bar"><i style="width:${pr.pct}%"></i></div><small class="muted">${pr.done} de ${r === 'current' && trial ? 4 : m.classes} clases${P.passed(m.id) ? ' · 🎓 Aprobado' : ''}</small>` : ''}
      ${r === 'locked' ? `<small class="muted">${trial ? 'Disponible al inscribirte' : 'Se abre cuando avances en tu ruta'}</small>` : ''}</div></button>`;
  }
  function openMod(id) {
    const m = P.mod(id), r = P.role(id), a = P.assigned();
    if (r === 'current' || r === 'review') { location.href = m.url; return; }
    if (r === 'soon') return M.modal(`<div class="center">${M.mascot('mascot', 'think')}</div><h3 class="center">🚧 ${esc(m.name)} · ${esc(m.es)}</h3><p class="center">Este módulo está en construcción. ¡Muy pronto estará disponible en tu perfil!</p>`, { x: true });
    const msg = P.isTrial() ? `Tu acceso gratuito incluye solo el inicio de tu ruta. ¡Inscríbete para estudiar todos los módulos!`
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
  /* ---------- tour guiado del perfil (primera vez de cualquier estudiante) ---------- */
  function portalTour() {
    if ($('#tour')) return; const p = P.get(); if (!p) return;
    const fn = esc(P.look().nick || p.first || ''); const a = P.assigned();
    const all = [
      { mood: 'welcome', t: `¡Hola, ${fn}! 👋`, d: 'Soy Mr. Arrieta, tu profe. Te muestro en 1 minuto cómo funciona tu plataforma.' },
      { sel: '.pt-avwrap', mood: 'point', t: 'Tu perfil', d: 'Toca tu foto para <b>personalizar tu perfil</b>: tómate una foto o crea <b>tu propio Mr. Arrieta</b>.' },
      { sel: '.pt-step', mood: 'idea', t: 'Primer paso: tu examen de clasificación', d: 'Son 40 preguntas de Listening, Reading, Writing y Speaking. Con tu resultado se crea <b>tu ruta de aprendizaje</b>.' },
      { sel: '.pt-mymod', mood: 'pointside', t: 'Tu ruta de aprendizaje', d: 'Aquí ves <b>en qué punto de tu ruta estás</b> y entras a tus clases.' },
      { sel: '.pt-trialbar', mood: 'present', t: 'Tu acceso gratuito', d: 'Puedes tomar el examen de clasificación y explorar los <b>2 primeros temas</b> de tu ruta. ¡Disfrútalo!' },
      { sel: '.pt-routebar', mood: 'present', t: 'Tu camino', d: 'Tu ruta va de A1 a B2+. Cada etapa se abre cuando <b>apruebas el examen final</b> de la anterior.' },
      { sel: '.pt-perso', mood: 'wink', t: 'Hazla tuya', d: 'Viste a tu Mr. Arrieta, ponle sombrero, elige colores y fondo. ¡Tu plataforma, a tu estilo!' },
      { sel: '#out', mood: 'watch', t: 'Salir', d: 'Con este botón cierras tu sesión. Tu progreso queda guardado.' },
      { mood: 'thumbs', t: '¡Listo! 🚀', d: p.module ? '¡Vamos a tu ruta de aprendizaje!' : 'Empieza con tu examen de clasificación para crear tu ruta.', last: true },
    ];
    const steps = all.filter(x => !x.sel || $(x.sel));
    const ov = h(`<div id="tour"><div class="tour-hole"></div><div class="tour-card"></div></div>`); document.body.appendChild(ov);
    const hole = $('.tour-hole', ov), card = $('.tour-card', ov); let i = 0;
    const end = (go) => { ov.remove(); window.removeEventListener('resize', place); window.removeEventListener('scroll', place); const q = P.get(); if (q) { q.tourDone = true; P.save(q); }
      if (go) { M.confetti && M.confetti(1500); if (!q.module && q.type !== 'staff') route('placement'); else if (a && a.ready) location.href = a.url; } };
    function place() {
      const st = steps[i]; const el = st.sel && $(st.sel);
      if (!el) { hole.style.cssText = 'left:50%;top:40%;width:0;height:0'; card.classList.add('center'); card.style.cssText = ''; return; }
      card.classList.remove('center'); const r = el.getBoundingClientRect(), pad = 8;
      hole.style.cssText = `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
      const cw = Math.min(380, innerWidth - 24); const ch = card.offsetHeight || 220;
      let top = r.bottom + 16; if (top + ch > innerHeight - 10) top = Math.max(10, r.top - ch - 16);
      const left = Math.min(Math.max(12, r.left + r.width / 2 - cw / 2), innerWidth - cw - 12);
      card.style.cssText = `left:${left}px;top:${top}px;width:${cw}px`;
    }
    function show() {
      const st = steps[i]; const el = st.sel && $(st.sel);
      card.innerHTML = `<div class="tour-in">${M.mascot('tour-mra', st.mood)}<div><div class="tour-n">${i + 1} / ${steps.length}</div><h3>${st.t}</h3><p>${st.d}</p></div></div>
        <div class="tour-bar"><button class="btn w sm" id="tskip">${st.last ? 'Cerrar' : 'Saltar tour'}</button><div class="grow"></div>${i ? '<button class="btn w sm" id="tprev">←</button>' : ''}<button class="btn k" id="tnext">${st.last ? (p.module || p.type === 'staff' ? '¡Vamos! →' : '📝 Tomar mi examen →') : 'Siguiente →'}</button></div>`;
      $('#tskip', card).onclick = () => end(false);
      if (i) $('#tprev', card).onclick = () => { i--; show(); };
      $('#tnext', card).onclick = () => { if (st.last) end(true); else { i++; show(); } };
      if (el) { el.scrollIntoView({ block: 'center' }); setTimeout(place, 80); } else place();
      sfx('tap');
    }
    window.addEventListener('resize', place); window.addEventListener('scroll', place, { passive: true });
    show();
  }
  /* ---------- personalización del perfil ---------- */
  const EN = { '': 'Original', '#E3242B': 'Red', '#0B2A5B': 'Navy blue', '#f2f2f2': 'White', '#FFC21A': 'Yellow', '#2E9E5B': 'Green', '#3AA0E8': 'Light blue', '#7B4BC4': 'Purple', '#F07AB0': 'Pink', '#8A8F98': 'Gray', '#8a8f98': 'Gray', '#F27A1A': 'Orange',
    '#2a2a2a': 'Black', '#222222': 'Black', '#c8a97a': 'Khaki', '#ececec': 'White', '#6b4a2e': 'Brown' };
  const POSE_EN = { welcome: 'Welcome!', smile: 'Smile', thumbs: 'Thumbs up', celebrate: 'Celebrate', wink: 'Wink', wow: 'Wow!', idea: 'Idea', point: 'Number one', pointside: 'Look!', present: 'Present', shrug: 'I don\'t know', think: 'Think', watch: 'Time!' };
  const HAT_EN = { none: ['🚫', 'No hat'], cap: ['🧢', 'Cap'], grad: ['🎓', 'Graduation cap'], beanie: ['🧶', 'Beanie'], cowboy: ['🤠', 'Cowboy hat'], crown: ['👑', 'Crown'], party: ['🥳', 'Party hat'], tophat: ['🎩', 'Top hat'], chef: ['👨‍🍳', 'Chef\'s hat'], helmet: ['⛑️', 'Hard hat'] };
  const BG_EN = { red: 'Red', navy: 'Navy', yellow: 'Yellow', sky: 'Sky blue', green: 'Green', purple: 'Purple', pink: 'Pink', white: 'White', usa: 'USA' };
  const BANNERS = [['w', 'White', '#fff'], ['red', 'Red', '#E3242B'], ['navy', 'Navy', '#0B2A5B'], ['yellow', 'Yellow', '#FFC21A'], ['green', 'Green', '#2E9E5B'], ['sky', 'Sky blue', '#3AA0E8'], ['purple', 'Purple', '#7B4BC4']];
  function squareJPEG(src, size = 320) {
    const cv = document.createElement('canvas'); cv.width = cv.height = size; const ctx = cv.getContext('2d');
    const w = src.videoWidth || src.naturalWidth || src.width, hh = src.videoHeight || src.naturalHeight || src.height, m = Math.min(w, hh);
    ctx.drawImage(src, (w - m) / 2, (hh - m) / 2, m, m, 0, 0, size, size); return cv.toDataURL('image/jpeg', .85);
  }
  function personalize(tab) {
    const p = P.get(); const L = P.look(); let av = Object.assign(MRAV.def(), L.av || {});
    app.innerHTML = `<div class="wrap me-wrap">
      <div class="me-top"><button class="btn w sm" id="back">← Mi perfil</button><div><h1>🎨 Personaliza tu perfil</h1><p class="muted">Customize your profile · Haz tu plataforma más tuya</p></div></div>
      <div class="me-tabs"><button data-t="av">🧑‍🏫 Mi Mr. Arrieta</button><button data-t="photo">📸 Mi foto</button><button data-t="plat">✨ Mi plataforma</button></div>
      <div id="me-body"></div></div>`;
    $('#back').onclick = () => route('home');
    $$('.me-tabs button').forEach(b => b.onclick = () => show(b.dataset.t));
    const done = (msg) => { sfx('win'); M.toast(msg); topbar(); };
    function show(t) {
      $$('.me-tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
      const body = $('#me-body'); const L = P.look();
      if (t === 'photo') {
        body.innerHTML = `<div class="card me-photo"><div class="me-ph">${L.photo ? `<img src="${L.photo}" alt="">` : `<span>${esc(P.initials())}</span>`}</div>
          <h2>My photo · Mi foto</h2><p class="muted">Tómate una selfie o sube una foto. Se recorta en círculo y se guarda solo en tu perfil.</p>
          <div class="me-btns"><button class="btn k" id="cam">📸 Tomar foto</button><button class="btn w" id="up">🖼️ Subir foto</button>${L.photo ? '<button class="btn w" id="rm">🗑️ Quitar</button>' : ''}</div>
          ${L.photo ? `<label class="me-chk"><input type="checkbox" id="usep" ${L.pic === 'photo' ? 'checked' : ''}><span>Usar mi foto como foto de perfil</span></label>` : ''}
          <input type="file" id="fi" accept="image/*" hidden><input type="file" id="fc" accept="image/*" capture="user" hidden></div>`;
        const setPhoto = (u) => { P.setLook({ photo: u, pic: 'photo' }); done('¡Foto guardada! 📸'); show('photo'); };
        const fromFile = (f) => { if (!f) return; const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => setPhoto(squareJPEG(im)); im.src = r.result; }; r.readAsDataURL(f); };
        $('#fi').onchange = e => fromFile(e.target.files[0]); $('#fc').onchange = e => fromFile(e.target.files[0]);
        $('#up').onclick = () => $('#fi').click();
        $('#cam').onclick = async () => {
          if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return $('#fc').click();
          let st; try { st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 640 }, audio: false }); } catch (e) { return $('#fc').click(); }
          const m = M.modal(`<h3 class="center">📸 Say cheese! · ¡Sonríe!</h3><div class="me-cam"><video autoplay playsinline muted></video><i class="me-ring"></i></div><div class="row"><button class="btn k" id="snap">📸 Tomar foto</button><button class="btn w" id="cx">Cancelar</button></div>`, { x: true });
          const v = $('video', m); v.srcObject = st; const stop = () => st.getTracks().forEach(t => t.stop());
          const close = () => { stop(); m.remove(); }; $('#cx', m).onclick = close; const mx = $('.mx', m); if (mx) mx.addEventListener('click', stop);
          $('#snap', m).onclick = () => { const cv = document.createElement('canvas'); cv.width = v.videoWidth; cv.height = v.videoHeight; const c = cv.getContext('2d'); c.translate(cv.width, 0); c.scale(-1, 1); c.drawImage(v, 0, 0); close(); setPhoto(squareJPEG(cv)); };
        };
        if ($('#rm')) $('#rm').onclick = () => { P.setLook({ photo: '', pic: L.pic === 'photo' ? (L.head ? 'avatar' : '') : L.pic }); done('Foto eliminada'); show('photo'); };
        if ($('#usep')) $('#usep').onchange = e => { P.setLook({ pic: e.target.checked ? 'photo' : (L.head ? 'avatar' : '') }); done(e.target.checked ? 'Tu foto es tu foto de perfil ✅' : 'Listo'); };
      } else if (t === 'av') {
        const cur = (k) => { const v = av[k]; if (k === 'pose') return POSE_EN[v]; if (k === 'hat') return HAT_EN[v].join(' '); if (k === 'bg') return BG_EN[v]; if (k === 'sticker') return v || '—'; const L2 = { shirt: MRAV.SHIRTS, pants: MRAV.PANTS, shoes: MRAV.SHOES }[k]; const it = L2.find(x => x[0] === v) || L2[0]; return `<i class="me-dot" style="background:${it[2]}"></i>${EN[v] || it[1]}`; };
        const acc = (k, t, inner, open) => `<details class="card me-acc" data-sec="${k}" ${open ? 'open' : ''}><summary><span>${t}</span><em class="me-cur" data-cur="${k}">${cur(k)}</em><b class="me-chev">▾</b></summary><div class="me-accb">${inner}</div></details>`;
        const sw = (k, list) => list.map(([hx, es, col]) => `<button class="me-sw${av[k] === hx ? ' on' : ''}" data-k="${k}" data-v="${hx}" title="${es}"><i style="background:${col}"></i><small>${EN[hx] || es}</small></button>`).join('');
        body.innerHTML = `<div class="me-av">
          <div class="me-prev card"><div class="me-stage" id="stage"><img id="pv" alt="Mi Mr. Arrieta"><b class="me-stk" id="stk"></b></div>
            <button class="btn w block" id="rnd">🎲 Surprise me! · Sorpréndeme</button>
            <button class="btn k block lg" id="sv">✅ Guardar mi Mr. Arrieta</button>
            <label class="me-chk"><input type="checkbox" id="guide" ${L.guide ? 'checked' : ''}><span>Que <b>mi Mr. Arrieta</b> me acompañe en todas mis clases</span></label></div>
          <div class="me-opts">
            ${acc('pose', '👤 Pose · Postura', `<div class="me-poses" data-noguide>${MRAV.POSES.map(x => `<button class="me-pose${av.pose === x ? ' on' : ''}" data-k="pose" data-v="${x}"><img src="mra-${x}.webp" alt="" loading="lazy"><small>${POSE_EN[x]}</small></button>`).join('')}</div>`, true)}
            ${acc('shirt', '👕 Shirt · Camiseta', `<div class="me-sws">${sw('shirt', MRAV.SHIRTS)}</div>`)}
            ${acc('pants', '👖 Pants · Pantalón', `<div class="me-sws">${sw('pants', MRAV.PANTS)}</div>`)}
            ${acc('shoes', '👟 Shoes · Zapatos', `<div class="me-sws">${sw('shoes', MRAV.SHOES)}</div>`)}
            ${acc('hat', '🎩 Hat · Sombrero', `<div class="me-hats">${Object.keys(MRAV.HATS).map(x => `<button class="me-hat${av.hat === x ? ' on' : ''}" data-k="hat" data-v="${x}"><b>${HAT_EN[x][0]}</b><small>${HAT_EN[x][1]}</small></button>`).join('')}</div>`)}
            ${acc('bg', '🖼️ Background · Fondo', `<div class="me-sws">${Object.keys(MRAV.BGS).map(x => `<button class="me-sw${av.bg === x ? ' on' : ''}" data-k="bg" data-v="${x}"><i style="background:linear-gradient(135deg,${MRAV.BGS[x][0]},${MRAV.BGS[x][1]})"></i><small>${BG_EN[x]}</small></button>`).join('')}</div>`)}
            ${acc('sticker', '⭐ Sticker', `<div class="me-hats">${MRAV.STICKERS.map(x => `<button class="me-hat stk${av.sticker === x ? ' on' : ''}" data-k="sticker" data-v="${x}"><b>${x || '🚫'}</b></button>`).join('')}</div>`)}
          </div></div>`;
        let tok = 0;
        const paint = () => { const bg = MRAV.BGS[av.bg] || MRAV.BGS.red; $('#stage').style.background = `linear-gradient(135deg,${bg[0]},${bg[1]})`; $('#stk').textContent = av.sticker || '';
          const my = ++tok; $('#stage').classList.add('busy'); MRAV.full(av).then(u => { if (my !== tok) return; $('#pv').src = u; $('#stage').classList.remove('busy'); }); };
        const mark = () => { $$('[data-k]', body).forEach(b => b.classList.toggle('on', av[b.dataset.k] === b.dataset.v)); $$('[data-cur]', body).forEach(e => e.innerHTML = cur(e.dataset.cur)); };
        $$('.me-acc', body).forEach(d => d.addEventListener('toggle', () => { if (d.open) { $$('.me-acc', body).forEach(o => { if (o !== d) o.open = false; }); if (window.innerWidth < 720) setTimeout(() => d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60); } }));
        $$('[data-k]', body).forEach(b => b.onclick = () => { av[b.dataset.k] = b.dataset.v; sfx('tap'); mark(); paint(); });
        $('#rnd').onclick = () => { const pick = (a) => a[Math.floor(Math.random() * a.length)]; av = { pose: pick(MRAV.POSES), shirt: pick(MRAV.SHIRTS)[0], pants: pick(MRAV.PANTS)[0], shoes: pick(MRAV.SHOES)[0], hat: pick(Object.keys(MRAV.HATS)), bg: pick(Object.keys(MRAV.BGS)), sticker: pick(MRAV.STICKERS) }; mark(); paint(); };
        $('#sv').onclick = async () => { const b = $('#sv'); b.disabled = true; b.textContent = 'Guardando…'; let head = ''; try { head = await MRAV.head(av); } catch (e) { }
          const guide = $('#guide').checked; P.setLook({ av: Object.assign({}, av), head, pic: head ? 'avatar' : (L.pic || ''), guide });
          MRAV.applyGuide(guide ? av : null); M.confetti(1200); done('¡Tu Mr. Arrieta quedó genial! 🎉'); b.disabled = false; b.textContent = '✅ Guardar mi Mr. Arrieta';
          const m = M.modal(`<div class="center">${P.avHTML('pt-av big')}<h3>Looking good! 😎</h3><p>Tu Mr. Arrieta ahora es tu <b>foto de perfil</b>${guide ? ' y te acompañará en tus clases' : ''}.</p><button class="btn k block" id="ok">Ver mi perfil</button><button class="btn w block" id="st" style="margin-top:8px">Seguir personalizando</button></div>`, { x: true });
          $('#ok', m).onclick = () => { m.remove(); route('home'); }; $('#st', m).onclick = () => m.remove(); };
        $('#guide').onchange = e => { if (L.av || P.look().av) { P.setLook({ guide: e.target.checked }); MRAV.applyGuide(e.target.checked ? (P.look().av || av) : null); M.toast(e.target.checked ? 'Tu Mr. Arrieta te acompañará en las clases 🙌' : 'Volverá el Mr. Arrieta original'); } };
        paint();
      } else {
        const opt = (v, lbl, dis) => `<label class="me-radio${dis ? ' dis' : ''}"><input type="radio" name="pic" value="${v}" ${(L.pic || '') === v ? 'checked' : ''} ${dis ? 'disabled' : ''}> ${lbl}</label>`;
        body.innerHTML = `<div class="card me-plat">
          <h3>🖼️ Profile picture · Foto de perfil</h3>
          <div class="me-radios">${opt('', `<span class="pt-av sm">${esc(P.initials())}</span> Mis iniciales`)}${opt('photo', `${L.photo ? `<span class="pt-av sm has"><img src="${L.photo}"></span>` : '📸'} Mi foto`, !L.photo)}${opt('avatar', `${L.head ? `<span class="pt-av sm has"><img src="${L.head}"></span>` : '🧑‍🏫'} Mi Mr. Arrieta`, !L.head)}</div>
          <h3>👋 Nickname · ¿Cómo quieres que te salude?</h3><input class="inp" id="nick" maxlength="20" placeholder="${esc(p.first)}" value="${esc(L.nick || '')}">
          <p class="muted pt-small">Tu nombre completo se sigue usando en certificados y reportes.</p>
          <h3>🎨 My color · Color de mi perfil</h3><div class="me-sws">${BANNERS.map(([k, en, c]) => `<button class="me-sw${(L.banner || 'w') === k ? ' on' : ''}" data-b="${k}"><i style="background:${c}"></i><small>${en}</small></button>`).join('')}</div>
          <label class="me-chk"><input type="checkbox" id="guide2" ${L.guide ? 'checked' : ''} ${L.av ? '' : 'disabled'}><span>Que <b>mi Mr. Arrieta personalizado</b> me acompañe en todas mis clases${L.av ? '' : ' <small class="muted">(primero crea tu Mr. Arrieta)</small>'}</span></label>
          <button class="btn k block lg" id="svp">✅ Guardar</button></div>`;
        let ban = L.banner || 'w';
        $$('[data-b]', body).forEach(b => b.onclick = () => { ban = b.dataset.b; $$('[data-b]', body).forEach(x => x.classList.toggle('on', x === b)); sfx('tap'); });
        $('#svp').onclick = () => { const r = $('input[name=pic]:checked', body); const guide = $('#guide2').checked;
          P.setLook({ pic: r ? r.value : '', nick: $('#nick').value.trim(), banner: ban, guide: !!(guide && L.av) }); MRAV.applyGuide(guide && L.av ? L.av : null); done('¡Cambios guardados! ✅'); route('home'); };
      }
    }
    show(tab || 'av');
  }
  function placement() {
    window.MRAPLACE.run(app, { route: (r) => route(r || 'home'), after: () => topbar() });
  }
  route('home');
})();
