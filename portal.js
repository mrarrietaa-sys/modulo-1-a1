/* =====================================================================
   PORTAL — Perfil del estudiante (inicio de toda la plataforma)
   Ingreso con código → (nombre) → prueba de clasificación → módulos
   ===================================================================== */
(function () {
  const M = window.M1, P = window.MRAP, C = window.M1CONFIG;
  const { $, $$, h, esc, sfx } = M;
  const app = $('#app');
  const WA = (t) => `https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent((window.MRNE || String)(t))}`;
  const U = (id, w = 800, hh = 450) => `https://images.unsplash.com/${id}?w=${w}&h=${hh}&fit=crop&crop=entropy&q=80&auto=format`;

  function topbar() {
    const p = P.get();
    $('#topbar').innerHTML = `<div class="brand" id="go-home"><span class="logo-pill"><img class="logo" src="mra-brand.png" alt="mrarrieta.com"></span></div><div class="sp"></div><button class="tb-back" type="button" id="tb-back" title="Regresar">← Atrás</button><span class="tb-tag">MI PERFIL</span>
      ${p ? `<span class="pill hide-s">${window.MRPLANS ? MRPLANS.badge() : p.type === 'staff' ? '👨‍🏫 Profe' : p.type === 'trial' ? '🟢 Acceso gratis' : '🎓 Estudiante'}</span>${p.type === 'staff' && window.MRANN && MRANN.isHidden() ? '<button class="iconbtn" id="ann-b" title="Mostrar la barra del profesor">✏️</button>' : ''}${p.first ? `<button class="tb-avbtn" id="me-b" title="Personaliza tu perfil">${P.avHTML('tb-av')}</button>` : ''}<a class="iconbtn" href="juegos.html" title="Zona de juegos">🎮</a><button class="iconbtn" id="snd-b" title="Activar / quitar la voz de bienvenida">${voiceOn() ? '🔊' : '🔇'}</button><button class="iconbtn" id="out" title="Salir" aria-label="Salir"><svg class="pw-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 3v8"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/></svg></button>` : ''}`;
    $('#go-home').onclick = () => route('home');
    if (!P.get() && $('#tb-back')) $('#tb-back').remove(); // en la pantalla de ingreso no hay a dónde regresar
    if ($('#tb-back')) $('#tb-back').onclick = () => { if (curRoute && curRoute !== 'home') return route('home'); const r = document.referrer; if (r && r.indexOf(location.origin) === 0 && !/\/(index\.html)?(\?|#|$)/.test(r.replace(location.origin, '').replace(/^\/[^/]*\//, '/')) && history.length > 1) history.back(); else { route('home'); window.scrollTo(0, 0); } };
    if ($('#me-b')) $('#me-b').onclick = () => route('me');
    if ($('#ann-b')) $('#ann-b').onclick = () => { MRANN.show(); topbar(); };
    if (window.MRANN) MRANN.sync();
    if ($('#out')) $('#out').onclick = logout;
    if ($('#snd-b')) $('#snd-b').onclick = () => { const on = !voiceOn(); try { localStorage.setItem(VKEY, on ? '0' : '1'); } catch (e) { } if (!on) M.stop(); $('#snd-b').textContent = on ? '🔊' : '🔇'; M.toast(on ? '🔊 Voz de bienvenida activada' : '🔇 Voz de bienvenida desactivada'); };
  }
  let curRoute = 'home';
  function route(r) { curRoute = r || 'home'; M.stop && M.stop(); window.scrollTo(0, 0); topbar(); const p = P.get();
    if (!p) return login();
    if (!p.first || (p.cloud && p.type === 'student' && !p.birth)) return nameStep(); // nombre + fecha de nacimiento obligatorios
    if (r === 'placement') return placement();
    if (r === 'me' || r === 'me-photo' || r === 'me-av' || r === 'me-plat') return personalize(r === 'me' ? 'av' : r.slice(3));
    return home();
  }

  /* ---------- bienvenida en voz: "Welcome / Welcome back, Nombre!" ---------- */
  function sayHi(text) {
    try {
      if (!window.speechSynthesis) return; sessionStorage.setItem('mra_said', '1');
      const go = () => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.95; u.pitch = 1.05;
        const vs = speechSynthesis.getVoices().filter(v => /^en(-|_)US/i.test(v.lang)); const pref = vs.find(v => /Google US English|Samantha|Aria|Jenny|Natural/i.test(v.name)) || vs[0]; if (pref) u.voice = pref;
        window.__mraGreet = true; u.onend = u.onerror = () => { window.__mraGreet = false; }; setTimeout(() => { window.__mraGreet = false; }, 6000);
        speechSynthesis.speak(u); } catch (e) { } };
      // si aún no hubo ningún toque en la página, habla con el primer toque
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) { const once = () => { removeEventListener('pointerdown', once, true); go(); }; addEventListener('pointerdown', once, true); return; }
      go(); // de inmediato, dentro del mismo toque de "Entrar" (necesario en iPhone)
    } catch (e) { }
  }
  const hiName = () => { const p = P.get() || {}; const lu = P.lastUser() || {}; return (p.look && p.look.nick) || p.first || lu.first || ''; };
  // saludo en voz natural (voz masculina americana pregrabada): "Good morning / afternoon / evening, Nombre!"
  const VKEY = 'mra_voice_off';
  const voiceOn = () => { try { return localStorage.getItem(VKEY) !== '1'; } catch (e) { return true; } };
  const slugN = (n) => String(n || '').split(/\s+/)[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
  // voz al ingresar el código (voz masculina americana pregrabada): "Welcome back, Nombre!" o "Welcome! Nice to meet you!"
  const greetVoice = () => {
    if (!voiceOn()) return; try { sessionStorage.setItem('mra_said', '1'); } catch (e) { }
    const p = P.get() || {}, lu = P.lastUser() || {}; const nm = (p.look && p.look.nick) || p.first || lu.first || '';
    const sl = slugN(nm); const known = !!p.first; // si aún no tiene nombre verá "Nice to meet you!" → la voz dice lo mismo
    const go = () => M.loadAudio(['wb_' + (sl[0] || 'x')]).then(() => { if (!voiceOn()) return; const k = known && window.AUD && window.AUD['wb_' + sl] ? 'wb_' + sl : 'wb_'; M.play(k); }); // siempre: "Welcome, Nombre!" (o "Welcome!")
    go();
  };
  /* ---------- ingreso con código ---------- */
  function codeType(code) {
    const hh = M.codeHash(code);
    if ((C.REVIEW_CODES || []).includes(hh)) return { type: 'staff' };
    const st = (C.STUDENT_CODES || []).find(x => x.hash === hh); if (st) return { type: 'student', module: st.module || null, demo: !!st.all };
    const tr = (C.TRIAL_CODES || []).find(x => x.hash === hh); if (tr) return { type: 'trial', module: tr.module || null };
    const old = (C.ACCESS_CODES || []).find(x => x.hash === hh); if (old) return { type: 'student', module: null };
    return null;
  }
  // 📣 visitante nuevo: "¿Vienes por primera vez?" → guarda nombre y correo en Interesados (una sola vez)
  function leadPop() {
    let seen = null; try { seen = localStorage.getItem('mra_lead'); } catch (e) { }
    if (seen || P.lastUser() || !(window.MRAC && MRAC.on)) return;
    setTimeout(() => {
      if (document.querySelector('.modal') || P.get()) return;
      const m = M.modal(`<div class="center"><img class="mascot bounce mra" src="mra-x-wave.webp" alt="Mr. Arrieta" draggable="false" style="height:170px;width:auto"></div><h3 class="center">¿Vienes por primera vez? 👋</h3>
        <p class="center" style="font-size:16px">Déjanos tu nombre y tu correo y conoce cómo aprender inglés <b>HABLANDO</b> con mrarrieta.com.</p>
        <input class="inp" id="ld-n" placeholder="Tu nombre" autocomplete="name" style="margin:6px 0 8px"><input class="inp" id="ld-e" type="email" placeholder="Tu correo" autocomplete="email">
        <label style="display:flex;gap:8px;align-items:flex-start;font-size:13px;margin:10px 0;color:#4A5B78"><input type="checkbox" id="ld-c" checked style="margin-top:3px">Acepto recibir correos de mrarrieta.com con información de la escuela. Puedo darme de baja cuando quiera.</label>
        <button class="btn k block lg" id="ld-ok">Quiero conocerlos →</button><button class="btn w block" id="ld-no" style="margin-top:8px">Ahora no</button>`, { x: true });
      const mark = (v) => { try { localStorage.setItem('mra_lead', v); } catch (e) { } };
      const no = () => { mark('no'); m.remove(); };
      $('#ld-no', m).onclick = no; const mx = $('.mx', m); if (mx) mx.addEventListener('click', () => mark('no'));
      $('#ld-ok', m).onclick = async () => {
        const name = $('#ld-n', m).value.trim(), email = $('#ld-e', m).value.trim();
        if (!name) return M.toast('Escribe tu nombre 🙂'); if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return M.toast('Revisa tu correo 🙂');
        if (!$('#ld-c', m).checked) return M.toast('Marca la casilla para poder enviarte la información');
        const b = $('#ld-ok', m); b.disabled = true; b.textContent = 'Guardando…';
        const r = await MRAC.call('leadAdd', { name, email, consent: true }).catch(() => ({ ok: false }));
        if (!r || !r.ok) { b.disabled = false; b.textContent = 'Quiero conocerlos →'; return M.toast('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.'); }
        mark('ok'); m.querySelector('.card').innerHTML = `<div class="center">${M.mascot('mascot', 'celebrate')}</div><h3 class="center">¡Gracias, ${esc(name.split(' ')[0])}! 🎉</h3><p class="center" style="font-size:16px">Revisa tu correo: te enviamos la bienvenida. Si quieres empezar ya, pide tu acceso gratuito.</p><a class="btn block lg pt-wa" target="_blank" rel="noopener" href="${WA('¡Hola! Soy ' + name + ' y quiero mi acceso gratuito a la plataforma de mrarrieta.com (plan Gratuito)')}">🎁 Pedir mi acceso gratuito</a><button class="btn w block" style="margin-top:8px" id="ld-x">Cerrar</button>`;
        $('#ld-x', m).onclick = () => m.remove();
      };
    }, 1500);
  }
  // 🌟 página de entrada: hero con el ingreso, planes, testimonios, beneficios y cómo funciona
  function landing() {
    const card = $('.pt-login'); if (!card || !window.MRI) return;
    const tb = $('#topbar .tb-tag'); if (tb) tb.outerHTML = `<nav class="ld-nav"><a href="#ld-planes">Planes</a><a href="#ld-ganas">Beneficios</a><a href="#ld-testimonios">Testimonios</a><button class="btn r sm" data-trial>Empieza gratis</button></nav>`;
    const PL = window.MRPLANS || {}; const T = window.MRTESTIMONIOS || []; const pp = (k) => (PL.PL || {})[k] || {};
    const CARDS = [
      { id: 'free', icon: '🎁', name: 'ACCESO GRATUITO', price: '$0', per: 'sin costo', tag: 'Para empezar · 5 días', perks: ['Acceso temporal a la plataforma', 'Prueba de clasificación y tu ruta de aprendizaje', 'Los 2 primeros temas de tu ruta'], note: 'No incluye clases individuales.', btn: 'Empezar gratis' },
      { id: 'membership', icon: '🖥️', name: 'PLATAFORMA', price: pp('membership').price || '$59.900', per: '/mes', tag: 'Toda la plataforma', perks: (PL.BEN || {}).membership ? PL.BEN.membership.filter(b => !/^No incluye/.test(b)) : [], note: 'No incluye clases individuales.' },
      { id: 'premium', icon: '🎓', name: 'PREMIUM · 4 CLASES', price: pp('premium').price || '$169.900', per: '/mes', tag: 'Plataforma + 4 clases', perks: (PL.BEN || {}).premium || [] },
      { id: 'premium8', icon: '🏅', name: 'PREMIUM · 8 CLASES', price: pp('premium8').price || '$289.900', per: '/mes', tag: 'Plataforma + 8 clases', perks: (PL.BEN || {}).premium8 || [], best: true }];
    const GAN = [['mra-present.webp', 'r', 'Clases 1 a 1', 'Con profes reales, a tu ritmo'], ['mra-thumbs.webp', 'b', '100% online', 'Desde tu celular o computador'], ['mra-celebrate.webp', 'g', 'Certificados', 'Al terminar cada módulo'], ['mra-watch.webp', 'y', 'A tu ritmo', 'Estudia cuando quieras'], ['mra-x-travel.webp', 'b', 'Ruta A1 → B2+', 'Sabes qué estudiar cada día'], ['mra-wow.webp', 'r', 'Te escucha y te corrige', 'La plataforma escucha tu pronunciación y te corrige al instante']];
    const wrap = document.createElement('div'); wrap.className = 'ld';
    wrap.innerHTML = `<section class="ld-hero"><div class="ld-copy"><h1>Aprende inglés <em>HABLANDO</em></h1><p class="ld-lead">Plataforma que escucha tu pronunciación, ruta personalizada del A1 al B2+ y clases individuales con profes reales. 100% online.</p>
        <div class="ld-cta"><button class="btn k lg" data-trial>${MRI('gift')} Prueba gratis 5 días</button><a class="btn w lg" href="#ld-planes">${MRI('crown')} Ver planes</a></div>
        <img class="ld-hero-mra" src="mra-x-wave.webp" alt="Mr. Arrieta"></div><div class="ld-login"></div></section>
      <section class="ld-sec" id="ld-planes"><h2>Elige tu plan</h2><p class="ld-sub">Pagos mes a mes · tarjeta o transferencia</p><div class="in-plans ld-inplans">
        ${CARDS.map(c => `<a class="in-plan${c.best ? ' best' : ''}" ${c.id === 'free' ? 'href="#" data-trial' : `href="inscripcion.html?plan=${c.id}"`}>${c.best ? '<span class="in-ribbon">⭐ Más completo</span>' : ''}<span class="in-plan-ic" aria-hidden="true">${c.icon}</span><span class="in-plan-name">${esc(c.name)}</span><span class="in-plan-price"><b>${esc(c.price)}</b><small>${esc(c.per)}</small></span><span class="in-plan-tag">${esc(c.tag)}</span><ul>${c.perks.map(k => `<li>${esc(String(k).replace(/^[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9]+/, ''))}</li>`).join('')}</ul>${c.note ? `<span class="in-plan-note">${esc(c.note)}</span>` : ''}<span class="in-plan-pick">${c.btn || 'Elegir este plan'}</span></a>`).join('')}</div></section>
      ${T.length ? `<section class="ld-sec ld-tesbox card" id="ld-testimonios"><h2>Lo que dicen nuestros estudiantes</h2><p class="ld-sub">Testimonios reales en video</p><div class="ld-tes">${T.map(t => `<div class="card ld-t"><video src="${esc(t.video)}" ${t.poster ? `poster="${esc(t.poster)}"` : ''} controls preload="none" playsinline></video><b>${esc(t.name)} 🙏💙</b></div>`).join('')}</div></section>` : ''}
      <section class="ld-sec" id="ld-ganas"><h2>¿Qué ganas con nosotros?</h2><p class="ld-sub">Todo lo que necesitas para hablar inglés con confianza</p><div class="ld-ben">${GAN.map(([img, c, t, d]) => `<div class="card ld-be"><div class="ld-be-img ${c}"><img src="${img}" alt="" loading="lazy"></div><b>${t}</b><small>${d}</small></div>`).join('')}</div></section>
      <section class="ld-sec" id="ld-como"><h2>Cómo funciona</h2><div class="ld-steps">${['Pide tu acceso gratuito', 'Haz tu prueba de clasificación', 'Sigue tu ruta', 'Elige tu plan'].map((t, n) => `<div class="card"><b class="ld-n">${n + 1}</b><h3>${t}</h3></div>`).join('')}</div></section>
      <section class="ld-final card"><div><h2>¿Listo para hablar inglés?</h2><p>Empieza hoy tu prueba gratis de 5 días. Sin tarjeta, sin compromiso.</p></div><button class="btn r lg" data-trial>${MRI('gift')} Empezar gratis</button></section>`;
    const pw = card.closest('.pt-wrap'); if (pw) pw.classList.add('ld-on');
    card.parentNode.insertBefore(wrap, card); wrap.querySelector('.ld-login').appendChild(card);
    const free = $('.pt-free'); if (free) free.remove();
    const or = $('.pt-or'); if (or) or.innerHTML = `<span>¿Aún no eres estudiante? <a href="#" data-trial>Prueba gratis 5 días</a></span>`;
    const links = $('.pt-links'); if (links) links.remove();
    const WAN = (C.WHATSAPP || '573017810841');
    wrap.insertAdjacentHTML('afterend', `<footer class="ld-foot"><div class="ld-foot-in"><div><h4>mrarrieta.com</h4><p>Aprende inglés HABLANDO con la metodología RealTalk®. Clases 100% online.</p></div>
      <div><h4>Escuela</h4><a href="#ld-planes">Planes</a><a href="recomienda.html">Recomienda y gana</a><a href="politica.html">Política de reservas</a></div>
      <div><h4>Equipo</h4><a href="reclutamiento.html">Trabaja con nosotros</a><a href="profesores.html">Soy profesor</a><a href="administracion.html">Administración</a></div>
      <div><h4>Contacto</h4><a target="_blank" rel="noopener" href="https://wa.me/${WAN}">WhatsApp ${esc(WAN.replace(/^57/, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3'))}</a><span>Lun–vie 7 a. m.–9 p. m. · Sáb 7 a. m.–5 p. m.</span><span>Pagos: tarjeta (Mercado Pago), Nequi y Llave (Breve-B)</span></div></div>
      <p class="ld-copy-r">© ${new Date().getFullYear()} mrarrieta.com · Todos los derechos reservados</p></footer>
      <div class="ld-wawrap" id="ld-wa"><button class="ld-wax" aria-label="Ocultar">✕</button><a class="ld-wa" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp" href="${WA('¡Hola! Quiero información sobre las clases de inglés de mrarrieta.com')}"><svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path fill="#fff" d="M16 3C8.8 3 3 8.6 3 15.6c0 2.5.8 4.9 2.1 6.9L3.6 28l5.7-1.5c2 1.1 4.3 1.7 6.7 1.7 7.2 0 13-5.6 13-12.6S23.2 3 16 3zm6.3 17.6c-.3.8-1.6 1.5-2.2 1.6-.6.1-1.3.1-2.1-.1-.5-.2-1.1-.4-1.9-.7-3.3-1.4-5.5-4.7-5.6-4.9-.2-.2-1.3-1.8-1.3-3.4s.8-2.4 1.1-2.7c.3-.3.6-.4.8-.4h.6c.2 0 .5-.1.7.6.3.7.9 2.3 1 2.5.1.2.1.4 0 .6-.1.2-.2.4-.3.6l-.5.6c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.9 1.8.4.2.6.1.8-.1.2-.2.9-1 1.1-1.4.2-.4.5-.3.8-.2.3.1 2 .9 2.3 1.1.3.2.6.3.7.4.1.3.1 1-.2 1.8z"/></svg></a></div>`);
    waDrag();
    if (!window.__trialWired) { window.__trialWired = true; document.addEventListener('click', trialClick); }
  }
  // 💬 botón flotante de WhatsApp: se puede arrastrar a cualquier lado y ocultar con la X
  function waDrag() {
    const w = $('#ld-wa'); if (!w) return; const K = 'mra_wa_pos';
    try { if (sessionStorage.getItem('mra_wa_off')) { w.remove(); return; } const p = JSON.parse(localStorage.getItem(K) || 'null'); if (p) { w.style.left = Math.min(p.x, innerWidth - 70) + 'px'; w.style.top = Math.min(p.y, innerHeight - 70) + 'px'; w.style.right = 'auto'; w.style.bottom = 'auto'; } } catch (e) { }
    w.querySelector('.ld-wax').onclick = (e) => { e.preventDefault(); e.stopPropagation(); w.remove(); try { sessionStorage.setItem('mra_wa_off', '1'); } catch (er) { } };
    let sx, sy, ox, oy, moved = false;
    const down = (e) => { if (e.target.closest('.ld-wax')) return; const t = e.touches ? e.touches[0] : e; const r = w.getBoundingClientRect(); sx = t.clientX; sy = t.clientY; ox = r.left; oy = r.top; moved = false;
      const mv = (ev) => { const q = ev.touches ? ev.touches[0] : ev; const dx = q.clientX - sx, dy = q.clientY - sy; if (!moved && Math.abs(dx) + Math.abs(dy) < 6) return; moved = true; ev.preventDefault();
        w.style.left = Math.max(4, Math.min(innerWidth - 68, ox + dx)) + 'px'; w.style.top = Math.max(60, Math.min(innerHeight - 68, oy + dy)) + 'px'; w.style.right = 'auto'; w.style.bottom = 'auto'; };
      const up = () => { removeEventListener('mousemove', mv); removeEventListener('touchmove', mv); removeEventListener('mouseup', up); removeEventListener('touchend', up); if (moved) { try { localStorage.setItem(K, JSON.stringify({ x: parseInt(w.style.left), y: parseInt(w.style.top) })); } catch (er) { } } };
      addEventListener('mousemove', mv); addEventListener('touchmove', mv, { passive: false }); addEventListener('mouseup', up); addEventListener('touchend', up); };
    w.addEventListener('mousedown', down); w.addEventListener('touchstart', down, { passive: true });
    w.querySelector('.ld-wa').addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } });
  }
  function trialClick(e) { const b = e.target.closest && e.target.closest('[data-trial]'); if (!b || !$('.ld')) return; e.preventDefault(); trialForm(); }
  // 🎁 acceso gratuito automático: nombre, WhatsApp y correo → se crea el código y entra de una
  function trialForm() {
    const m = M.modal(`<div class="center"><div class="to-ic">${MRI('gift')}</div><h3>Prueba gratis 5 días</h3><p class="muted">Crea tu acceso en segundos. Sin tarjeta, sin compromiso.</p></div>
      <div class="tf"><input class="inp" id="tf-n" placeholder="Nombre y apellido" autocomplete="name"><input class="inp" id="tf-w" type="tel" placeholder="WhatsApp" autocomplete="tel"><input class="inp" id="tf-e" type="email" placeholder="Correo" autocomplete="email">
      <label class="tf-ok"><input type="checkbox" id="tf-c"> Acepto recibir mi código e información de mrarrieta.com por correo y WhatsApp.</label>
      <button class="btn r block lg" id="tf-go">Crear mi acceso gratis →</button><p class="muted center" id="tf-msg" style="font-size:13.5px;margin:0"></p></div>`, { x: true });
    const msg = (t) => { $('#tf-msg', m).textContent = t; };
    $('#tf-go', m).onclick = async () => {
      const name = $('#tf-n', m).value.trim(), whatsapp = $('#tf-w', m).value.trim(), email = $('#tf-e', m).value.trim();
      if (name.split(/\s+/).length < 2) return msg('Escribe tu nombre y apellido.');
      if (whatsapp.replace(/\D/g, '').length < 7) return msg('Revisa tu número de WhatsApp.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return msg('Revisa tu correo.');
      if (!$('#tf-c', m).checked) return msg('Marca la casilla para continuar.');
      const b = $('#tf-go', m); b.disabled = true; b.textContent = '⏳ Creando tu acceso…';
      const r = await MRAC.call('trialSignup', { name, whatsapp, email }).catch(() => null);
      if (!r || !r.ok) { b.disabled = false; b.textContent = 'Crear mi acceso gratis →'; return msg(r && r.err === 'busy' ? 'Hay muchas solicitudes en este momento. Inténtalo en unos minutos.' : 'No se pudo crear tu acceso. Revisa tus datos e inténtalo de nuevo.'); }
      if (r.exists) { m.querySelector('.card').innerHTML = `<div class="center"><div class="to-ic">${MRI('check')}</div><h3>¡Ya tienes una cuenta, ${esc(r.first || '')}!</h3><p>Te enviamos tu código de acceso a tu correo. Escríbelo en "Ingresa a tu perfil" para entrar.</p><button class="btn k block" id="tf-x">Entendido</button></div>`; $('#tf-x', m).onclick = () => m.remove(); return; }
      m.querySelector('.card').innerHTML = `<div class="center">${M.mascot('mascot bounce', 'celebrate')}<h3>¡Listo, ${esc(r.first)}! 🎉</h3><p>Tu código de acceso es</p><div class="rc-code" style="font:800 28px Poppins,sans-serif;color:#0B2A5B;letter-spacing:.06em;background:#EEF3FB;border:2px dashed #9fb3d6;border-radius:14px;padding:8px 18px;display:inline-block;margin:6px 0">${esc(r.code)}</div><p class="muted">También te lo enviamos al correo. Guárdalo para entrar después.</p><button class="btn r block lg" id="tf-in">Entrar a mi prueba gratis →</button></div>`;
      $('#tf-in', m).onclick = () => { m.remove(); const i = $('#cd'); if (i) { i.value = r.code; $('#ok').click(); } };
    };
  }
  function login() {
    app.innerHTML = `<div class="wrap pt-wrap"><div class="card pt-login">
      
      ${(() => { const lu = P.lastUser(); return lu && lu.first ? `<div class="pt-hello">${lu.pic ? `<span class="pt-av big pt-lu has"><img src="${lu.pic}" alt=""></span>` : M.mascot('pt-mra', 'wink')}<div class="bubble">Welcome! 👋</div></div>`
        : `<div class="pt-hello">${M.mascot('pt-mra', 'welcome')}<div class="bubble">Welcome! 👋</div></div>`; })()}
      <h1>Ingresa a tu perfil</h1><p class="muted">Escribe el código que te entregó administración.</p>
      <input class="inp" id="cd" placeholder="Ej: ABC-123" autocapitalize="characters" autocomplete="off">
      <button class="btn k block lg" id="ok">Entrar →</button>
      <div class="pt-or"><span>¿Aún no eres estudiante?</span></div>
      <div class="pt-free"><h2>🟢 EMPIEZA GRATIS</h2>
        <p><b>Crea tu acceso gratuito y descubre tu ruta de aprendizaje.</b></p>
        <p class="muted">Realiza nuestra prueba de clasificación y explora los primeros temas de tu módulo.</p>
        <a class="btn block lg pt-wa" target="_blank" rel="noopener" href="${WA('¡Hola! 👋 Quiero EMPEZAR GRATIS en la plataforma de mrarrieta.com y descubrir mi ruta de aprendizaje. ¿Me envían mi código de acceso gratuito? 🟢')}">EMPEZAR GRATIS →</a>
        <a class="btn w block pt-insc" href="inscripcion.html">📝 Formulario de inscripción</a></div></div>
      <p class="center pt-links"><a href="recomienda.html"><b>🤝 Recomienda y gana</b></a> · <a href="reclutamiento.html">👩‍🏫 Trabaja con nosotros</a> · <a href="profesores.html">🧑‍🏫 Soy profesor</a> · <a href="administracion.html">🔐 Administración</a></p></div>`;
    landing();
    const i = $('#cd'); setTimeout(() => { if (window.innerWidth > 900) i.focus(); }, 200);
    leadPop();
    const bad = (msg) => { i.classList.add('wrong'); sfx('bad'); setTimeout(() => i.classList.remove('wrong'), 500); M.toast(msg || 'Código no válido 😕'); };
    const go = async () => { try { if (window.speechSynthesis) { const w = new SpeechSynthesisUtterance(' '); w.volume = 0; speechSynthesis.speak(w); } } catch (e) { } // desbloquea la voz en iPhone
      const v = i.value.trim(); if (!v) return bad('Escribe tu código 🙂');
      // 1) códigos de la nube (planes Acceso gratuito / Membership / Premium)
      if (window.MRAC && MRAC.on && !codeType(v)) {
        const b = $('#ok'); b.disabled = true; b.textContent = 'Entrando…';
        const r = await MRAC.login(v); b.disabled = false; b.textContent = 'Entrar →';
        if (r.ok) { sfx('win'); M.confetti(1500); try { sessionStorage.removeItem('mra_back'); } catch (e) { } greetVoice(); return route('home'); }
        if (r.err === 'inactive') return bad('Tu acceso está inactivo. Escríbenos por WhatsApp 🙏');
        if (r.err === 'trial_over') { b.disabled = false; return trialOver(v); }
        if (r.err === 'network' || r.err === 'offline') return bad('No hay conexión con la nube. Revisa tu internet e inténtalo de nuevo.');
        return bad();
      }
      // 2) códigos guardados en config.js (modo sin nube / profes)
      const r = codeType(v); if (!r) return bad();
      const old = P.get() || {};
      P.save(Object.assign({ created: Date.now() }, old, { type: r.type, demo: !!r.demo, codeHash: M.codeHash(i.value), module: r.module || old.module || null, assignedBy: r.module ? 'admin' : (old.assignedBy || null) }));
      sfx('win'); M.confetti(1500); greetVoice(); route('home'); };
    $('#ok').onclick = go; i.onkeydown = e => { if (e.key === 'Enter') go(); };
  }
  function nameStep() {
    const s1 = (M.S && M.S.name) || ''; const p = P.get();
    app.innerHTML = `<div class="wrap pt-wrap"><div class="card pt-login"><div class="pt-hello">${M.mascot('pt-mra', 'smile')}<div class="bubble">Nice to meet you! 😊<small>¡Mucho gusto!</small></div></div>
      <h1>${p.first ? 'Completa tu perfil' : '¿Cómo te llamas?'}</h1><p class="muted">Así aparecerá tu nombre en tu perfil, tus reportes y tus certificados.</p>
      <label class="pt-lab">Nombre</label><input class="inp" id="f" value="${esc(s1.split(' ')[0] || '')}" autocomplete="given-name">
      <label class="pt-lab">Apellido</label><input class="inp" id="l" value="${esc(s1.split(' ').slice(1).join(' ') || p.last || '')}" autocomplete="family-name">
      ${p.type === 'staff' ? '' : `${p.type === 'student' && !p.demo ? `<label class="pt-lab">🎂 Fecha de nacimiento</label><input class="inp" id="bd" type="date" max="${P.todayISO()}" min="1930-01-01" value="${esc(p.birth || '')}">
      <small class="pt-hint">¡Queremos celebrar tu cumpleaños contigo! 🎉</small>` : ''}
      <label class="pt-lab">Correo electrónico</label><input class="inp" id="em" type="email" inputmode="email" autocomplete="email" placeholder="tucorreo@gmail.com" value="${esc(p.email || '')}">
      <small class="pt-hint">Aquí te llegan tus resultados, avisos de tus clases y tu saludo de cumpleaños.</small>`}
      <button class="btn k block lg" id="ok" style="margin-top:14px">Continuar →</button></div></div>`;
    if ($('#f').value === '' && p.first) $('#f').value = p.first;
    $('#ok').onclick = () => { const f = $('#f').value.trim(), l = $('#l').value.trim(); if (!f) return $('#f').classList.add('wrong'); if (!l) return $('#l').classList.add('wrong');
      const extra = {};
      if (p.type !== 'staff') { const bd = $('#bd') ? $('#bd').value : '', em = $('#em').value.trim();
        if ($('#bd') && (!bd || bd > P.todayISO() || bd < '1930-01-01')) { $('#bd').classList.add('wrong'); return M.toast('Escribe tu fecha de nacimiento 🎂'); }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { $('#em').classList.add('wrong'); return M.toast('Escribe un correo válido 📧'); }
        if (bd) extra.birth = bd; extra.email = em; }
      P.save(Object.assign(p, { first: f, last: l, name: f + ' ' + l }, extra));
      if (window.MRAC && MRAC.code()) { MRAC.saveProfile(Object.assign({ first: f, last: l }, extra)); MRAC.sync(true); }
      // el nombre también se usa dentro de los módulos
      P.MODS.forEach(m => { try { const s = JSON.parse(localStorage.getItem(m.key) || 'null'); if (s) { s.name = f + ' ' + l; localStorage.setItem(m.key, JSON.stringify(s)); } } catch (e) { } });
      route('home'); };
  }
  // el acceso gratuito (5 días) terminó → invitación a inscribirse
  function trialOver(code) {
    window.__buyCode = code || ''; // permite pagar desde aquí aunque el acceso gratuito haya terminado
    const PL = window.MRPLANS;
    M.modal(`<div class="center"><div class="to-ic">${MRI('gift')}</div><h3>Tu acceso gratuito terminó</h3><p>Gracias por conocer <b>mrarrieta.com</b>. Tu progreso está guardado: <b>elige tu plan</b> y continúa justo donde lo dejaste.</p></div>
      ${PL ? PL.cards('free') : ''}
      <div class="to-pay"><b>Formas de pago</b><div><span>${MRI('card')} Tarjeta débito o crédito (Mercado Pago) · se habilita de inmediato</span><span>${MRI('bank')} Transferencia: Nequi 3017810841 · Llave (Breve-B) 1047374279</span></div></div>
      <a class="btn wa-btn block" target="_blank" rel="noopener" href="${WA('¡Hola! Mi código es ' + (code || '') + ', terminó mi acceso gratuito y quiero inscribirme en mrarrieta.com')}" style="margin-top:12px">Escríbenos por WhatsApp</a>`, { x: true });
  }
  function logout() {
    const m = M.modal(`<h3>¿Salir de tu perfil?</h3><p class="muted">Tu progreso queda guardado${window.MRAC && MRAC.code() ? ' en la nube: puedes continuar desde cualquier dispositivo' : ' en este dispositivo'}. Para volver a entrar necesitarás tu código.</p><div class="row"><button class="btn k" id="y">Sí, salir</button><button class="btn w" id="n">Cancelar</button></div>`, { x: true });
    $('#n', m).onclick = () => m.remove(); $('#y', m).onclick = async () => { const cur = P.get(); if (window.MRAC && MRAC.code()) { $('#y', m).disabled = true; $('#y', m).textContent = 'Guardando…'; const ok = await (MRAC.signOut ? MRAC.signOut() : MRAC.sync(true)); if (!ok) { $('#y', m).disabled = false; $('#y', m).textContent = 'Sí, salir'; M.toast('No se pudo guardar en la nube. Revisa tu internet e inténtalo de nuevo.'); return; } } m.remove(); if (cur && cur.first) P.save(cur); P.clear(); try { sessionStorage.removeItem('mra_me_cache'); } catch (e) { } route('home'); };
  }

  /* ---------- perfil ---------- */
  function home() {
    const p = P.get(); const a = P.assigned(); const staff = p.type === 'staff', trial = P.isTrial();
    const ini = ((p.first || '?')[0] + (p.last || '')[0]).toUpperCase();
    const pst = window.MRAPLACE ? MRAPLACE.status() : { attempts: 0, max: 2 };
    const pl = p.placement;
    const hr = new Date().getHours(); const back = P.isBack(); const greet = back ? 'Welcome back' : hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
    const newbie = !p.module && !staff; // estudiante nuevo: solo la prueba de clasificación
    let main = '';
    if (!p.module && !staff) {
      main = `<div class="card pt-step"><div class="pt-stepn">1</div><div><span class="lbl">Primer paso</span><h2>Toma tu prueba de clasificación</h2>
        <p>Solo <b>10 minutos</b>. Se adapta a tu nivel y al terminar empiezas de una vez tu ruta de aprendizaje.</p>
        <p class="muted">⏱ Unos 10 minutos · ${pst.rounds || 1} oportunidades de 2 intentos${pst.attempts ? ` · Ya usaste ${pst.attempts}` : ''}${pst.inProgress ? ' · <b>Tienes una prueba en progreso</b>' : ''}</p>
        <button class="btn k lg" id="pt">📝 ${pst.inProgress ? 'Continuar' : 'Tomar'} mi prueba de clasificación</button></div></div>`;
    } else if (a && P.isExpired()) {
      main = `<div class="card pt-mymod"><div class="pt-mymod-img" style="background-image:url('${U(a.img)}')"><span>🔒</span></div><div><span class="lbl">⏰ Plan vencido</span>
        <h2>Tu contenido está bloqueado</h2><p>Tu plan venció el <b>${esc(new Date(P.plan().end + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }))}</b>. Tus módulos, juegos y clases quedan bloqueados hasta que renueves.</p>
        <p class="muted">Tranquilo: tu progreso está guardado. Cuando administración confirme tu renovación, todo se desbloquea solo y sigues justo donde ibas.</p>
        <a class="btn block pt-wa" target="_blank" rel="noopener" href="${WA('¡Hola! Soy ' + (p.first || '') + ' ' + (p.last || '') + ' (código ' + (p.code || '') + ') y quiero renovar mi plan 🚀')}">💬 Renovar mi plan</a></div></div>`;
    } else if (a && a.ready && !staff) {
      const pr = P.progress(a.id), tot = trial ? 4 : a.classes;
      main = `<div class="card pt-mymod db-hero"><div class="db-hero-tx"><span class="lbl db-red">${pr.done ? 'Tu siguiente paso' : 'Empieza tu ruta'}</span>
        <h2><small class="pt-here">📍 Estás aquí</small>${esc(a.name)} · ${esc(a.es)}</h2>
        <p class="db-sub">${pr.done} de ${trial ? '4 clases de tu acceso gratuito' : tot + ' clases'} completadas${a.n > (p.module || 1) ? ' · ¡Avanzaste en tu ruta! 🎉' : ''}</p>
        <div class="db-bar"><i style="width:${pr.pct}%"></i></div>
        <div class="db-hero-b"><a class="btn db-wbtn lg" href="${a.url}">${MRI('video')} ${pr.done ? 'Continuar mi ruta' : 'Empezar mi ruta'}</a><button class="btn db-gbtn sm" id="pt3">¿No estás a gusto con tu nivel?</button></div></div>
        <img class="db-hero-mra" src="mra-x-wave.webp" alt="Mr. Arrieta"></div>`;
    } else if (a) {
      const ready = a && a.ready;
      main = `<div class="card pt-mymod">${a ? `<div class="pt-mymod-img" style="background-image:url('${U(a.img)}')"><span>${a.n}</span></div>` : ''}<div><span class="lbl">${staff ? 'Modo profe' : '🧭 Tu ruta de aprendizaje'}</span>
        <h2>${staff ? 'Todos los módulos abiertos para revisión' : `<small class="pt-here">📍 Estás aquí</small>${esc(a.name)} · ${esc(a.es)}`}</h2>
        ${a ? `<p class="muted">${pl && p.assignedBy !== 'admin' ? `Tu ruta se creó con tu prueba de clasificación (${new Date(pl.date).toLocaleDateString('es-CO')}).` : 'Tu ruta fue asignada por administración.'}${a.n > (p.module || 1) ? ' ¡Avanzaste en tu ruta al aprobar el módulo anterior! 🎉' : ''}</p>` : ''}
        ${a && ready ? `<div class="pt-bar"><i style="width:${P.progress(a.id).pct}%"></i></div><p class="muted" style="margin:4px 0 10px">${P.progress(a.id).done} de ${trial ? '4 clases de tu acceso gratuito' : a.classes + ' clases'} completadas</p><a class="btn k lg" href="${a.url}">▶ ${P.progress(a.id).done ? 'Continuar' : 'Empezar'} mi ruta</a>` : ''}
        ${a && !ready && trial && P.trialMod() ? `<p class="pt-soon">🚧 Tu ${esc(a.name)} se está terminando de construir. Mientras tanto, usa tu acceso gratuito con los 2 primeros temas del <b>${esc(P.trialMod().name)}</b>.</p><a class="btn k lg" href="${P.trialMod().url}">▶ Entrar con mi acceso gratuito</a>` : ''}
        ${a && !staff ? `<p style="margin:12px 0 0"><button class="btn w sm" id="pt3">🔁 ¿No estás a gusto con tu nivel?</button></p>` : ''}
        ${a && !ready && !trial ? `<p class="pt-soon">🚧 Tu ${esc(a.name)} se está terminando de construir. ¡Muy pronto estará listo! Mientras tanto puedes repasar los módulos anteriores.</p>` : ''}</div></div>`;
    }
    const curMod = a && a.ready && !staff ? P.progress(a.id) : null;
    const plNow = P.plan(); const plName = staff ? 'Profesor' : P.isExpired() ? 'Plan vencido' : (plNow.plan === 'premium8' && plNow.eff === 'premium' ? 'Premium · 8 clases' : { free: 'Acceso gratuito', membership: 'Plataforma', premium: 'Premium · 4 clases' }[plNow.eff] || 'Acceso gratuito');
    const plIc = staff ? 'user' : P.isExpired() ? 'clock' : plNow.plan === 'premium8' && plNow.eff === 'premium' ? 'gem' : ({ free: 'gift', membership: 'monitor', premium: 'crown' }[plNow.eff] || 'gift');
    const pct = curMod ? curMod.pct : 0;
    const side = `<aside class="db-side card">
        <div class="db-me"><button class="pt-avwrap" id="me-av" title="Personaliza tu foto">${P.avHTML('pt-av')}<i class="pt-pen">✏️</i></button>
          <div class="db-me-tx"><span class="db-greet">${greet}!</span><h2>${esc(P.look().nick || p.first)} ${esc(p.last || '')}</h2><span class="db-chip ${plNow.eff}">${MRI(plIc)} ${plName}</span>${plNow.end && plNow.paid && !P.isExpired() ? `<small class="muted">Activo hasta el ${fmtD(plNow.end, { day: 'numeric', month: 'long' })}</small>` : ''}</div></div>
        ${curMod ? `<div class="db-ring" style="--p:${pct}"><div><b>${pct}%</b><small>de tu módulo</small></div></div><small class="muted db-modtx">${esc(a.name)} · ${esc(a.id)} · ${curMod.done} de ${trial ? 4 : a.classes} clases</small>` : ''}
        <nav class="db-qa">${staff ? '' : `<button class="btn w" id="pt-plans">${MRI('crown')} Mi plan</button>`}${!staff && P.plan().premium ? `<button class="btn w" data-go="#pt-live">${MRI('calendar')} Mis clases</button>` : ''}${!staff && P.plan().paid ? `<button class="btn w" data-go="#pt-ref">${MRI('gift')} Invita a un amigo</button>` : ''}${!staff && P.plan().premium ? `<button class="btn w pt-polb">${MRI('file')} Política de reservas</button>` : ''}<button class="btn w" id="me-go2">${MRI('user')} Personalizar perfil</button><button class="btn w" id="pt-tour">${MRI('compass')} Ver el tour</button></nav></aside>`;
    app.innerHTML = `<div class="wrap db">${side}<div class="db-main">

      ${birthdayBanner()}
      <div id="pt-ann"></div>
      ${P.isExpired() || (trial && !(window.MRAC && MRAC.code())) ? `<div class="pt-trialbar">${P.isExpired() ? `⏰ <div><b>Tu plan venció.</b> Todo tu contenido está bloqueado, pero tu progreso sigue guardado. Apenas renueves, se desbloquea todo. <a href="#" class="tb-up">Ver planes →</a></div>` : `🟢 <div><b>Acceso gratuito:</b> la prueba de clasificación y los <b>2 primeros temas</b> de tu módulo. <a href="#" class="tb-up">Ver planes →</a></div>`}</div>` : ''}
      ${main}
      ${newbie ? '' : `
      <div id="pt-live"></div><div id="pt-ref"></div>
      <div class="sect-title"><h2>🧭 Mi ruta de aprendizaje</h2></div>
      ${routeBar()}
      <div class="pt-mods-grid pt-route">${P.MODS.map(m => modCard(m)).join('')}</div>
      ${courseCard()}
      ${birthAsk()}
      ${P.look().pic || !(a && a.ready && P.progress(a.id).done) ? '' : `<div class="card pt-perso"><div class="pt-perso-img">${M.mascot('', 'wink')}</div><div><h2>Personaliza tu perfil</h2><p class="muted">Tómate una foto o crea <b>tu propio Mr. Arrieta</b>: vístelo, ponle sombrero y elige su fondo. ¡Haz tu plataforma más tuya!</p><button class="btn k" id="me-go">🎨 Personalizar ahora</button></div></div>`}
      ${pl ? `<div class="sect-title"><h2>📝 Mi prueba de clasificación</h2></div><div class="card pt-plres"><div><b>Resultado:</b> ${esc(P.mod(pl.module).name)} · ${esc(P.mod(pl.module).es)}<br><span class="muted">${new Date(pl.date).toLocaleDateString('es-CO')}${pl.mods ? ' · ' + [1, 2, 3, 4].map(k => `${P.mod(k).id}: ${pl.mods[k]}%`).join(' · ') : ''}</span></div>${!P.isExpired() && (pst.attempts < pst.max || (pst.round || 1) < (pst.rounds || 1)) ? '<button class="btn w sm" id="pt2">🔁 Repetir prueba</button>' : ''}</div>` : ''}
      ${staff ? `<div class="sect-title"><h2>📝 Prueba de clasificación</h2></div><div class="card pt-plres"><div>Puedes presentar o revisar la prueba de clasificación como lo verá el estudiante.</div><button class="btn w sm" id="pt2">📝 Abrir prueba</button></div>` : ''}
      ${certs()}`}
      </div>
      <p class="center fx-foot db-foot" style="margin-top:22px;font-size:13.5px;font-weight:600">mrarrieta.com · ¡Aprende inglés HABLANDO! · WhatsApp ${esc(C.WHATSAPP.replace(/^57/, ''))}</p></div>
      <nav class="db-tabbar">${[['compass', 'Inicio', 'top'], P.plan().premium ? ['video', 'Clases', '#pt-live'] : ['award', 'Mi ruta', '.pt-routebar'], ['crown', 'Mi plan', 'plans'], P.plan().paid ? ['gift', 'Invita', '#pt-ref'] : ['file', 'Política', 'pol'], ['user', 'Perfil', 'me']].map(([i, t, g], k) => `<button class="${k ? '' : 'on'}" data-tab="${g}">${MRI(i)}<span>${t}</span></button>`).join('')}</nav>`;
    if ($('#pt')) $('#pt').onclick = () => route('placement');
    const plans = (e) => { if (e) e.preventDefault(); M.modal(`<div class="pt-plmodal">${planSection()}</div>`, { x: true }); };
    $$('.tb-up').forEach(x => x.onclick = plans); if ($('#pt-tour')) $('#pt-tour').onclick = () => { window.scrollTo(0, 0); portalTour(true); }; if ($('#pt-plans')) $('#pt-plans').onclick = plans;
    wireBirth(); live(); birthdayParty();
    const goTo = (sel) => { const el = $(sel); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    $$('[data-go]').forEach(b => b.onclick = () => goTo(b.dataset.go));
    if ($('#me-go2')) $('#me-go2').onclick = () => route('me');
    $$('.db-tabbar button').forEach(b => b.onclick = () => { $$('.db-tabbar button').forEach(x => x.classList.toggle('on', x === b)); const g = b.dataset.tab;
      if (g === 'top') window.scrollTo({ top: 0, behavior: 'smooth' }); else if (g === 'plans') plans(); else if (g === 'me') route('me'); else if (g === 'pol') { if (window.MRPOLICY) MRPOLICY.show(); } else goTo(g); });
    $$('.pt-polb').forEach(x => x.onclick = () => window.MRPOLICY && MRPOLICY.show());
    setTimeout(policyFirst, 400);
    // bienvenida de regreso (una vez por sesión)
    try { if (P.isBirthday()) sessionStorage.setItem('mra_wb', '1'); // en su cumpleaños el saludo es la fiesta 🎂
      if (back && !sessionStorage.getItem('mra_wb')) { sessionStorage.setItem('mra_wb', '1'); const pr = a && a.ready ? P.progress(a.id) : null;
      const wm = M.modal(`<div class="center wb">${P.pic() ? P.avHTML('pt-av big') : M.mascot('mascot bounce', 'wink')}<h2>Welcome, ${esc(P.look().nick || p.first)}! 👋</h2><p style="font-size:17px">¡Qué bueno verte de nuevo! ${P.isExpired() ? '' : pr && pr.done ? `Llevas <b>${pr.done} clase(s)</b> en tu ruta. ¡Sigamos!` : 'Hoy es un gran día para avanzar en tu ruta de aprendizaje.'}</p>
        ${P.isExpired() ? `<p style="font-size:16px">⏰ Tu plan venció y tu contenido está bloqueado. Renuévalo para seguir justo donde ibas.</p><a class="btn block lg pt-wa" target="_blank" rel="noopener" style="text-decoration:none" href="${WA('¡Hola! Quiero renovar mi plan en mrarrieta.com 🚀')}">💬 Renovar mi plan</a>` : a && a.ready && !staff ? `<a class="btn k block lg" style="text-decoration:none" href="${a.url}">▶ Continuar mi ruta</a>` : ''}<button class="btn w block" id="wbx" style="margin-top:8px">Ir a mi perfil</button></div>`, { x: true });
      $('#wbx', wm).onclick = () => wm.remove(); M.confetti && M.confetti(900); } } catch (e) { }
    if (!tourSeenK(tourKind())) setTimeout(portalTour, 900);
    $('#me-av').onclick = () => route('me'); if ($('#me-go')) $('#me-go').onclick = () => route('me');
    const retake = () => { if (staff) return route('placement'); const m = M.modal(`<h3>¿No estás a gusto con tu nivel?</h3><p>Si gustas, puedes <b>volver a tomar la prueba de clasificación</b>. Tu ruta de aprendizaje se actualizará con el nuevo resultado.</p><p class="muted">Tienes ${pst.rounds || 1} oportunidades de 2 intentos cada una. Llevas ${pst.attempts} intento(s)${pst.attempts >= pst.max && (pst.round || 1) < (pst.rounds || 1) ? ' — se activará tu <b>segunda oportunidad</b>' : ''}.</p><div class="row"><button class="btn k" id="y">Sí, repetir</button><button class="btn w" id="n">Cancelar</button></div>`, { x: true }); $('#n', m).onclick = () => m.remove(); $('#y', m).onclick = () => { m.remove(); route('placement'); }; };
    ['#pt2', '#pt3'].forEach(id => { if ($(id)) $(id).onclick = retake; });
    $$('.pt-mod').forEach(el => el.onclick = () => openMod(el.dataset.id));
  }
  function routeBar() {
    const fin = courseOpen(), fdone = !!(courseState().final && courseState().final.passed);
    return `<div class="pt-routebar">${P.MODS.map((m, i) => { const r = P.role(m.id); return `${i ? `<i class="ln ${r === 'locked' || r === 'soon' ? '' : 'on'}"></i>` : ''}<div class="st ${r}${P.passed(m.id) ? ' ok' : ''}"><b>${P.passed(m.id) ? '✓' : r === 'current' ? '📍' : m.n}</b><small>${esc(m.id)}</small></div>`; }).join('')}<i class="ln ${fin ? 'on' : ''}"></i><div class="st fin ${fdone ? 'ok' : fin ? 'current' : 'locked'}"><b>${fdone ? '🎓' : '🏆'}</b><small>Final</small></div></div>`;
  }
  function modCard(m) {
    const r = P.role(m.id); const pr = P.progress(m.id); const trial = P.isTrial();
    const chip = { current: '📍 ESTÁS AQUÍ', review: P.passed(m.id) ? '✅ SUPERADO' : '🔁 REPASO', locked: P.isExpired() ? '🔒 BLOQUEADO' : '🔒 PRÓXIMA ETAPA', soon: '🚧 PRÓXIMAMENTE' }[r];
    const showBar = (r === 'current' || r === 'review') && m.ready;
    return `<button class="pt-mod ${r}" data-id="${m.id}"><div class="pt-mod-img" style="background-image:url('${U(m.img, 640, 360)}')"><span class="pt-mod-n">${m.n}</span><span class="pt-chip ${r}">${chip}</span></div>
      <div class="pt-mod-bd"><h3>${esc(m.name)} · ${esc(m.id)}</h3><div class="es">${esc(m.es)}</div><p>${esc(m.desc)}</p>
      ${showBar ? `<div class="pt-bar"><i style="width:${pr.pct}%"></i></div><small class="muted">${pr.done} de ${r === 'current' && trial ? 4 : m.classes} clases${P.passed(m.id) ? ' · 🎓 Aprobado' : ''}</small>` : ''}
      ${r === 'locked' ? `<small class="muted">${P.isExpired() ? '🔒 Se abre al renovar tu plan' : trial ? 'Disponible con Plataforma o Premium' : 'Se abre cuando avances en tu ruta'}</small>` : ''}</div></button>`;
  }
  function openMod(id) {
    const m = P.mod(id), r = P.role(id), a = P.assigned();
    if (r === 'current' || r === 'review') { location.href = m.url; return; }
    if (P.isExpired()) { const mm = M.modal(`<div class="center">${M.mascot('mascot', 'pointside')}</div><h3 class="center">⏰ Tu plan venció</h3><p class="center" style="font-size:17px">Todo tu contenido está bloqueado hasta que renueves. Tu progreso está guardado y se desbloquea apenas administración confirme tu renovación.</p><a class="btn block pt-wa" target="_blank" rel="noopener" href="${WA('¡Hola! Quiero renovar mi plan en mrarrieta.com 🚀')}">💬 Renovar mi plan</a>`, { x: true }); return; }
    if (r === 'soon') return M.modal(`<div class="center">${M.mascot('mascot', 'think')}</div><h3 class="center">🚧 ${esc(m.name)} · ${esc(m.es)}</h3><p class="center">Este módulo está en construcción. ¡Muy pronto estará disponible en tu perfil!</p>`, { x: true });
    if (P.isTrial() && window.MRPLANS && a) return MRPLANS.modal(M);
    const msg = P.isTrial() ? `Tu acceso gratuito incluye solo el inicio de tu ruta. ¡Inscríbete para estudiar todos los módulos!`
      : !a ? 'Primero toma tu prueba de clasificación para saber en qué módulo empiezas.'
      : `Para abrir el ${m.name} primero debes <b>terminar y aprobar el examen final del ${esc(a.name)}</b>. ¡Paso a paso! 💪`;
    const mm = M.modal(`<div class="center">${M.mascot('mascot', 'pointside')}</div><h3 class="center">🔒 ${esc(m.name)} bloqueado</h3><p class="center" style="font-size:17px">${msg}</p>
      ${P.isTrial() ? `<a class="btn block pt-wa" target="_blank" rel="noopener" href="${WA('¡Hola! Quiero inscribirme en mrarrieta.com 🚀')}">💬 Quiero inscribirme</a>` : '<button class="btn k block" id="cl">Entendido</button>'}`, { x: true });
    if ($('#cl', mm)) $('#cl', mm).onclick = () => mm.remove();
  }
  const courseState = () => { try { return JSON.parse(localStorage.getItem('mra_final_progress_v1') || '{}'); } catch (e) { return {}; } };
  const courseOpen = () => { const p = P.get(); return !!p && !P.isExpired() && (p.type === 'staff' || p.demo || ['A1', 'A2', 'B2', 'B2+'].every(id => P.passed(id))); };
  function courseCard() {
    const p = P.get(); if (!p || P.isTrial()) return '';
    const open = courseOpen(), st = courseState(), passed = !!(st.final && st.final.passed);
    const n = ['A1', 'A2', 'B2', 'B2+'].filter(id => P.passed(id)).length;
    return `<a class="card pt-course ${open ? 'open' : ''} ${passed ? 'done' : ''}" href="examen-final.html${passed ? '#cert' : ''}"><div class="pt-course-ic">🏆</div><div><span class="lbl">Meta final de tu ruta</span><h3>Examen final del curso</h3>
      <p class="muted">${passed ? '🎓 ¡Aprobado! Ver mi certificado de ruta completa' : open ? '50 preguntas · 4 habilidades · 2 intentos · certificado de toda tu ruta' : `🔒 Se habilita al aprobar los 4 módulos (${n} de 4 aprobados)`}</p></div><b class="pt-course-go">${passed ? '🎓' : open ? '▶' : '🔒'}</b></a>`;
  }
  function certs() {
    const cs = courseState(); const course = cs.final && cs.final.passed ? `<a class="card pt-cert gold" href="examen-final.html#cert">🏆 <div><b>Ruta completa A1 → B2+</b><small>Examen final del curso · ${Number(cs.final.score || 0).toFixed(1)}/10 · Ver y descargar</small></div></a>` : '';
    const done = P.MODS.filter(m => m.ready && P.passed(m.id)); if (!done.length && !course) return '';
    return `<div class="sect-title"><h2>🎓 Mis certificados</h2></div><div class="pt-certs">${course}${done.map(m => `<a class="card pt-cert" href="${m.url}#cert">🎓 <div><b>${esc(m.name)} · ${esc(m.level)}</b><small>Nota: ${(P.modState(m.id).final.score || 0).toFixed ? Number(P.modState(m.id).final.score).toFixed(1) : ''}/10 · Ver y descargar</small></div></a>`).join('')}</div>`;
  }
  /* ---------- tour guiado del perfil (primera vez de cualquier estudiante) ---------- */
  // el tour sale solo UNA vez por código (queda marcado en este dispositivo y en la nube)
  const TOURK = () => { const p = P.get() || {}; return 'mra_tourseen_' + ((window.MRAC && MRAC.code && MRAC.code()) || p.codeHash || p.first || 'x'); };
  function tourSeen() { try { return !!localStorage.getItem(TOURK()); } catch (e) { return false; } }
  // 2 tours, cada uno UNA sola vez: 'start' (recién llega: prueba, acceso gratuito, planes) y 'profile' (ya tiene su ruta)
  const tourKind = () => { const p = P.get() || {}; return !p.module && p.type !== 'staff' ? 'start' : 'profile'; };
  function tourSeenK(kind) { const p = P.get() || {}; if (p.tourDone) return true; /* tour antiguo: ya lo vio */ if (kind === 'start' ? p.tour1 : p.tour2) return true; try { return !!localStorage.getItem(TOURK() + '_' + kind); } catch (e) { return false; } }
  // 📌 política: emergente la PRIMERA vez que un estudiante pago entra (una sola vez, guardada en la nube)
  function polPending() { const p = P.get() || {}; return !!window.MRPOLICY && p.type !== 'staff' && P.plan().eff === 'premium' && !p.pol1; }
  function policyFirst() {
    if (!polPending() || $('.pol-modal')) return; if ($('.modal')) return setTimeout(policyFirst, 800);
    MRPOLICY.show({ first: true, onClose: () => { const p = P.get(); if (p && !p.pol1) { p.pol1 = Date.now(); P.save(p); try { window.MRAC && MRAC.code() && MRAC.sync(true); } catch (e) { } } } });
  }
  function portalTour(force) {
    const kind = tourKind();
    if ($('#tour')) return; const p = P.get(); if (!p || (tourSeenK(kind) && !force)) return;
    if ($('.modal') || (!force && polPending())) return setTimeout(() => portalTour(force), 800); // espera a que cierre el saludo y la política
    try { localStorage.setItem(TOURK() + '_' + kind, '1'); } catch (e) { } const fk = kind === 'start' ? 'tour1' : 'tour2';
    if (!p[fk]) { p[fk] = true; P.save(p); try { window.MRAC && MRAC.code() && MRAC.sync(true); } catch (e) { } } // marcado desde que empieza
    const fn = esc(P.look().nick || p.first || ''); const a = P.assigned(); const pl = P.plan();
    const all = kind === 'start' ? [
      { mood: 'welcome', t: `¡Welcome, ${fn}! 👋`, d: 'Soy Mr. Arrieta, tu profe. Te muestro en 30 segundos cómo empezar en <b>mrarrieta.com</b>.' },
      { sel: '.pt-step', mood: 'idea', t: '1️⃣ Tu primer paso', d: 'Haz tu <b>prueba de clasificación</b>: solo 10 minutos. Se adapta a tu nivel y evalúa tu Listening, Reading, Writing y Speaking. Al terminar, la plataforma te ubica en tu módulo y <b>empiezas tu ruta de inmediato</b>.' },
      { sel: '.pt-trial, .pt-trialbar', mood: 'present', t: '🎁 Tu acceso gratuito', d: 'Tienes la prueba de clasificación y los <b>2 primeros temas</b> de tu módulo para que conozcas la plataforma.' },
      { sel: '#pt-plans', mood: 'pointside', t: '💳 Los planes', d: '<b>Plataforma</b>: toda la plataforma y tu ruta completa A1 → B2+.<br><b>Premium</b>: además, <b>4 u 8 clases individuales</b> al mes con profes. Toca aquí cuando quieras verlos.' },
      { sel: '.pt-avwrap', mood: 'point', t: '😎 Tu perfil', d: 'Toca tu foto para personalizarlo: tómate una foto o crea <b>tu propio Mr. Arrieta</b>.' },
      { sel: '#pt-tour', mood: 'wink', t: '🧭 ¿Lo quieres ver otra vez?', d: 'Con este botón puedes repetir este recorrido cuando quieras.' },
      { mood: 'thumbs', t: '¡Vamos! 🚀', d: 'Empieza ahora con tu prueba de clasificación.', last: true },
    ] : [
      { mood: 'welcome', t: `¡Muy bien, ${fn}! 🎉`, d: 'Ya tienes tu ruta de aprendizaje. Te muestro tu perfil en 1 minuto.' },
      { sel: '.pt-mymod', mood: 'pointside', t: '📍 Tu ruta', d: 'Aquí ves <b>en qué módulo estás</b>, tu avance y el botón para <b>continuar tu clase</b>.' },
      { sel: '.lv-wrap', mood: 'present', t: '👩‍🏫 Clases con profes', d: 'Reserva tus <b>clases individuales</b> mínimo 4 horas antes. Cancela sin penalización hasta 2 horas antes.' },
      { sel: '.pt-routebar', mood: 'present', t: '🧭 Tu camino', d: 'Tu ruta va de A1 a B2+. Cada módulo se abre cuando <b>apruebas el examen final</b> del anterior.' },
      { sel: '#pt-plans', mood: 'idea', t: '💳 Tu plan', d: pl.premium ? 'Tienes <b>Premium</b>: toda la plataforma + clases individuales con profes.' : pl.paid ? 'Tienes <b>Plataforma</b>: toda la plataforma. Si quieres clases con profes, pásate a Premium.' : 'Aquí ves los planes para <b>desbloquear toda tu ruta</b>.' },
      { sel: '#out', mood: 'watch', t: '⏻ Salir', d: 'Con este botón cierras tu sesión. Tu progreso queda guardado en la nube.' },
      { mood: 'thumbs', t: '¡Listo! 🚀', d: '¡Vamos a tu ruta de aprendizaje!', last: true },
    ];
    const steps = all.filter(x => !x.sel || $(x.sel));
    const ov = h(`<div id="tour"><div class="tour-hole"></div><div class="tour-card"></div></div>`); document.body.appendChild(ov);
    const hole = $('.tour-hole', ov), card = $('.tour-card', ov); let i = 0;
    const end = (go) => { ov.remove(); window.removeEventListener('resize', place); window.removeEventListener('scroll', place); const q = P.get();
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

  /* ---------- planes y clases con profes (nube) ---------- */
  const fmtD = (iso, o) => { try { return new Date(String(iso).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CO', o || { weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return iso; } };
  const fmtT = (t) => { const [hh, mm] = String(t || '00:00').split(':').map(Number); const ap = hh >= 12 ? 'p. m.' : 'a. m.'; return `${((hh + 11) % 12) + 1}:${String(mm || 0).padStart(2, '0')} ${ap}`; };
  function planSection() {
    const p = P.get(); if (!p || p.type === 'staff' || !window.MRPLANS) return '';
    const pl = P.plan(); if (pl.legacy && !P.isTrial()) return '';
    const name = (pl.plan === 'premium8' && pl.eff === 'premium' ? 'Premium · 8 clases' : { free: 'Acceso gratuito', membership: 'Plataforma', premium: 'Premium · 4 clases' }[pl.eff]) || 'Acceso gratuito';
    const ic = MRI(pl.plan === 'premium8' && pl.eff === 'premium' ? 'gem' : ({ free: 'gift', membership: 'monitor', premium: 'crown' }[pl.eff] || 'gift'));
    const end = pl.end ? fmtD(pl.end, { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const sub = pl.expired ? `Tu plan ${esc(MRPLANS.PL[pl.plan] ? MRPLANS.PL[pl.plan].name : '')} venció el ${end}. Tu progreso sigue guardado.`
      : pl.eff === 'free' ? 'Prueba de clasificación, tu ruta de aprendizaje y los 2 primeros temas.'
      : `Activo hasta el <b>${end}</b>${pl.daysLeft !== null && pl.daysLeft <= 5 ? ` · <b class="pl-warn">vence en ${pl.daysLeft} día${pl.daysLeft === 1 ? '' : 's'}</b>` : ''}`;
    const renew = pl.expired || (pl.paid && pl.daysLeft !== null && pl.daysLeft <= 5);
    return `<div class="sect-title" id="pt-plan"><h2>${MRI('crown')} Mi plan</h2></div>
      <div class="card pl-mine ${pl.eff}${pl.expired ? ' exp' : ''}"><div class="pl-mine-ic">${pl.expired ? MRI('clock') : ic}</div><div class="grow"><span class="lbl">Tu plan actual</span><h2>${pl.expired ? 'Plan vencido' : name}</h2><p class="muted">${sub}</p></div></div>
      ${pl.plan === 'premium8' && pl.eff !== 'free' && !renew ? '' : MRPLANS.cards(pl.expired ? pl.plan : (pl.plan === 'premium8' && pl.eff !== 'free' ? 'premium8' : pl.eff), renew)}`;
  }
  // sección Premium: grupo, créditos VIP, próximas clases, club — se llena con datos de la nube
  async function live() {
    if (!window.MRAC || !MRAC.code()) return;
    const box = $('#pt-live'); const sig = () => { const q = P.get() || {}; return [q.plan, q.planEnd, q.type, q.module, q.expired].map(x => String(x == null ? '' : x)).join('|'); }; const before = sig();
    if (box && P.plan().premium) box.innerHTML = '<div class="sect-title"><h2>' + MRI('video') + ' Mis clases con profes</h2></div><div class="card lv-load">⏳ Cargando tus clases…</div>';
    const r = await MRAC.me(); if (!r || (box && !document.body.contains(box)) || !$('#pt-ann')) return;
    if (r.ok === false && r.err === 'trial_over') { const c = MRAC.code(); P.clear(); try { sessionStorage.removeItem('mra_me_cache'); } catch (e) { } route('home'); return trialOver(c); }
    if (r.ok === false && (r.err === 'notfound' || r.err === 'inactive')) { M.toast('Tu acceso ya no está activo. Escríbenos por WhatsApp.'); return; }
    if (before !== sig()) { topbar(); return home(); } // el plan cambió en la nube → actualizar perfil
    const ann = r.conf && r.conf.announcement; if (ann && $('#pt-ann')) $('#pt-ann').innerHTML = `<div class="pt-ann">📣 ${esc(ann)}</div>`;
    if (r.trialLeft != null && r.trialLeft > 0 && $('#pt-ann')) $('#pt-ann').insertAdjacentHTML('afterbegin', `<div class="pt-ann pt-trial"><span>🎁 ${r.trialLeft === 1 ? '<b>Hoy es tu último día</b> de acceso gratuito.' : 'Te quedan <b>' + r.trialLeft + ' días</b> de acceso gratuito.'}</span><a class="btn k sm" target="_blank" rel="noopener" href="${WA('¡Hola! Soy ' + (P.get().first || '') + ' ' + (P.get().last || '') + ' (código ' + MRAC.code() + ' · plan Gratuito) y quiero inscribirme en mrarrieta.com 🚀')}">💬 Quiero inscribirme</a></div>`);
    refCard();
    if (!r.premium) { if (box) box.innerHTML = ''; return; }
    if (box) renderLive(box, r);
  }
  const ICO = { cam: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 6h11a2 2 0 0 1 2 2v1.6l3.4-2.3A1 1 0 0 1 22 8.1v7.8a1 1 0 0 1-1.6.8L17 14.4V16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/></svg>', mic: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11z"/></svg>' };
  const TOPICS = {"1":[["The Greetings","Los saludos"],["The Alphabet","El abecedario"],["The Nationalities","Países y nacionalidades"],["Numbers and Colors","Números y colores"],["Verb To Be and A / An","Verbo To Be y A / An"],["Jobs and Occupations","Profesiones y ocupaciones"],["Family and Animals","La familia y los animales"],["The Food vs. The Fruit and Vegetables","Comida, frutas y verduras"],["Weekdays and Months of the Year","Días de la semana y meses"],["The Weather Forecast and the Clothes","El clima y la ropa"],["School Supplies and Parts of the House","Útiles escolares y partes de la casa"],["The Singular and the Plural Nouns","Singular y plural"],["Demonstrative Pronouns","This, that, these, those"],["There is and There are","Hay (singular vs. plural)"]],"2":[["Telling the Time","Decir la hora"],["The Simple Present","El presente simple"],["The Human Body","El cuerpo humano"],["Physical Appearance Vocabulary","La apariencia física"],["Personalities Adjectives","Adjetivos de personalidad"],["The Simple Past Tense (She was... I went...)","El pasado simple"],["Present/Past Continuous","Presente y pasado continuo"],["Adverbs of Frequency","Adverbios de frecuencia"],["Modal Verbs","Verbos modales"],["Reflexive Pronouns","Pronombres reflexivos"],["Phrasal Verbs","Verbos frasales"]],"3":[["Will and Going To","Will y going to"],["Possessive Adjectives","Adjetivos posesivos"],["Possessive Pronouns","Pronombres posesivos"],["The Present Perfect","El presente perfecto"],["The Past Perfect","El pasado perfecto"],["Prepositions of Time","Preposiciones de tiempo"],["Prepositions of Place","Preposiciones de lugar"],["Comparatives and Superlatives","Comparativos y superlativos"],["Used To and Be/Get Used To","Used to y be/get used to"],["Enough and Wish","Enough y wish"],["Un/Countable Nouns","Sustantivos contables e incontables"],["A Few / Few / Little / A Little","A few, few, little, a little"],["Linking Words","Conectores"]],"4":[["First Conditionals","Primer condicional"],["Second Conditionals","Segundo condicional"],["Third Conditionals","Tercer condicional"],["Verbs + Infinitive or Gerund","Verbos + infinitivo o gerundio"],["So, Neither, Either","So, neither, either"],["Present/Past Perfect Continuous","Presente y pasado perfecto continuo"],["Relative Clauses","Cláusulas relativas"],["Tag Questions","Preguntas coletilla"],["Reported Speech","Estilo indirecto"],["Direct and Indirect Questions","Preguntas directas e indirectas"],["Passive and Active Voice","Voz pasiva y activa"],["Have Something Done","Have/get something done"],["Future Perfect and Continuous","Futuro perfecto y futuro continuo"],["The Future Perfect Continuous","El futuro perfecto continuo"],["Artificial Intelligence and Employment","La inteligencia artificial y el empleo"],["Globalization: Benefits vs. Drawbacks","Globalización: beneficios y desventajas"],["The Impact of Social Media on Mental Health","El impacto de las redes sociales en la salud mental"],["Justice and Fairness (Are we in a fair society?)","Justicia y equidad: ¿vivimos en una sociedad justa?"],["Traditional Education vs. Online Learning","Educación tradicional vs. aprendizaje en línea"],["The Future of Democracy","El futuro de la democracia"],["Space Exploration: Progress or Vanity?","Exploración espacial: ¿progreso o vanidad?"]]};
  // 🎁 Invita a un amigo (referidos) — solo planes pagos activos
  async function refCard() {
    const el = $('#pt-ref'); if (!el) return;
    const r = await MRAC.call('refInfo', { code: MRAC.code() }).catch(() => null); if (!r || !r.ok || !r.eligible || !document.body.contains(el)) return;
    const link = location.href.replace(/[^/]*$/, '') + 'inscripcion.html?ref=' + encodeURIComponent(r.code);
    const prem = P.plan().premium; const n = r.count || 0;
    const msg = `¡Hola! Estoy aprendiendo inglés HABLANDO en mrarrieta.com y me encanta. Inscríbete con mi código *${r.code}* y obtienes ${r.pct}% de descuento en tu primer mes: ${link}`;
    el.innerHTML = `<div class="sect-title"><h2>${MRI('gift')} Invita a un amigo</h2></div><div class="card lv-card pt-refc">
      <p style="margin-top:0">Comparte tu código. Tu amigo(a) recibe <b>${r.pct}% de descuento</b> en su primer mes y tú ganas <b>${prem ? '1 clase individual' : '3 días más de Plataforma'}</b> cuando su pago quede confirmado.</p>
      <div class="pt-refcode"><b>${esc(r.code)}</b><button class="btn w sm" id="rf-cp">${MRI('copy')} Copiar enlace</button><a class="btn sm wa-btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent((window.MRNE || String)(msg))}">💬 Compartir por WhatsApp</a></div>
      <div class="pt-refgoal"><div class="bar"><i style="width:${Math.min(100, n / 5 * 100)}%"></i></div><small><b>${n}</b> referido${n === 1 ? '' : 's'} confirmado${n === 1 ? '' : 's'} · 🏆 3 → 1 mes gratis de Plataforma · 🏅 5 → certificado de Embajador</small></div>
      ${n >= 5 ? `<button class="btn k" id="rf-cert">${MRI('award')} Ver mi certificado de Embajador</button>` : ''}</div>`;
    $('#rf-cp').onclick = () => { try { navigator.clipboard.writeText(link); M.toast('✅ Enlace copiado'); } catch (e) { prompt('Copia tu enlace:', link); } };
    if ($('#rf-cert')) $('#rf-cert').onclick = () => ambassador();
  }
  function ambassador() {
    const p = P.get() || {}; const name = ((p.first || '') + ' ' + (p.last || '')).trim(); const w = window.open('', '_blank'); if (!w) return M.toast('Permite las ventanas emergentes para ver tu certificado');
    const base = location.href.replace(/[^/]*$/, ''); const d = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Certificado de Embajador · ${esc(name)}</title><style>@page{size:landscape;margin:0}body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#fff}.c{box-sizing:border-box;width:100vw;height:100vh;padding:40px;display:flex;align-items:center;justify-content:center}.in{border:10px solid #0B2A5B;outline:4px solid #E3242B;outline-offset:-22px;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px;box-sizing:border-box}img{height:80px}h1{color:#0B2A5B;font-size:40px;margin:18px 0 6px;letter-spacing:.04em}h2{color:#E3242B;font-size:20px;margin:0 0 20px;letter-spacing:.2em}.n{font-size:38px;font-weight:800;color:#0B2A5B;border-bottom:3px solid #E3242B;padding:0 30px 6px;margin:6px 0 16px}p{font-size:17px;color:#333;max-width:640px;line-height:1.5}.f{margin-top:26px;font-size:14px;color:#333}.f b{display:block;font-size:16px;color:#0B2A5B}</style></head><body><div class="c"><div class="in"><img src="${base}mra-brand.png" alt="mrarrieta.com"><h1>CERTIFICADO</h1><h2>EMBAJADOR MRARRIETA.COM</h2><p>Se otorga a</p><div class="n">${esc(name)}</div><p>por recomendar mrarrieta.com y ayudar a otras personas a aprender inglés HABLANDO. ¡Gracias por ser parte de nuestra comunidad! 🏅</p><div class="f"><b>John Jairo Arrieta Jaramillo</b>Director de mrarrieta.com · ${esc(d)}</div></div></div><script>setTimeout(()=>print(),600)<\/script></body></html>`); w.document.close();
  }
  // 🧾 estado de mis compras (pendiente / aprobado / rechazado / cancelado)
  async function myBuys() {
    const el = $('#lv-buys'); if (!el) return;
    const r = await MRAC.call('myBuys', { code: MRAC.code() }).catch(() => null); if (!r || !r.ok || !(r.buys || []).length || !document.body.contains(el)) return;
    const ST = { pendiente: '⏳ Pendiente', aprobado: '✅ Aprobado', rechazado: '❌ Rechazado', cancelado: '🚫 Cancelado' };
    el.innerHTML = `<details class="lv-buys" style="margin-top:12px"><summary><b>${MRI('receipt')} Mis compras</b></summary><div class="lv-list">${r.buys.slice(0, 8).map(b => `<div class="lv-cl"><div class="grow"><b>${b.kind === 'extra' ? '➕ ' + b.n + ' clase' + (b.n == 1 ? '' : 's') + ' adicional' + (b.n == 1 ? '' : 'es') : esc((window.MRPLANS && MRPLANS.PL[b.plan] || {}).name || b.plan)}</b><small>${fmtD(String(b.date).slice(0, 10))} · ${window.MRPLANS ? MRPLANS.fmt(b.amount) : b.amount} COP · ${b.method === 'mercadopago' ? 'Mercado Pago' : 'Transferencia'}</small></div><span class="lv-${b.status === 'aprobado' ? 'ok' : 'pend'}">${ST[b.status] || esc(b.status)}</span></div>`).join('')}</div></details>`;
  }
  function renderLive(box, r) {
    const pr = r.premium, cr = pr.credits, g = pr.group;
    const up = pr.upcoming || [];
    const today = P.todayISO();
    const pend = (pr.requests || []).find(q => q.status === 'pendiente');
    box.innerHTML = `<div class="sect-title"><h2>${MRI('video')} Mis clases con profes</h2></div><div class="lv-wrap">
      <div class="lv-stats2">
        <div class="lv-s2 s-red"><span class="lv-s2i">${MRI('calendar')}</span><div class="lv-s2t"><small>Clases disponibles</small><b>${cr.vipLeft}<em>/ ${cr.vipTotal}</em></b><div class="lv-s2bar"><i style="width:${cr.vipTotal ? Math.round(cr.vipLeft / cr.vipTotal * 100) : 0}%"></i></div><span>Periodo: ${fmtD(cr.cycleStart, { day: 'numeric', month: 'short' })} – ${fmtD(cr.cycleEnd, { day: 'numeric', month: 'short' })}</span></div></div>
        <div class="lv-s2 s-blue"><span class="lv-s2i">${MRI('check')}</span><div class="lv-s2t"><small>Clases usadas</small><b>${cr.vipUsed}</b><span>Incluidas en tu plan: ${cr.vipIncluded || 0}${cr.vipBonus ? ' · + ' + cr.vipBonus + ' adicional' + (cr.vipBonus === 1 ? '' : 'es') : ''}</span></div></div>
        <div class="lv-s2 s-green"><span class="lv-s2i">${MRI('award')}</span><div class="lv-s2t"><small>Clases asistidas</small><b>${r.attendedTotal || 0}</b><span>Desde que empezaste</span></div></div></div>
      <div class="card lv-card lv-vip"><div class="lv-h"><span class="lv-ic ic-vip">${MRI('user')}</span><div><span class="lbl">Clases individuales · 50 min</span><h3>Reserva tu clase individual</h3></div></div>
        <p class="muted">Elige <b>profesor, fecha y hora</b> entre los espacios disponibles. Reserva con mínimo <b>4 horas</b> de anticipación.</p><p class="lv-noacum">⚠️ Tus clases <b>no son acumulables</b>: resérvalas antes del <b>${fmtD(cr.cycleEnd, { day: 'numeric', month: 'long' })}</b>: después se vencen y no se recuperan.</p>
        <button class="btn k lg" id="lv-book" ${cr.vipLeft ? '' : 'disabled'}>${cr.vipLeft ? MRI('calendar') + ' Reservar clase individual' : MRI('check') + ' Ya reservaste todas tus clases de este periodo'}</button>
        <button class="btn w" id="lv-extra">${MRI('plus')} Comprar clases adicionales</button>
        <div id="lv-buys"></div></div>
      <div class="card lv-card lv-next"><div class="lv-h"><span class="lv-ic ic-cal">${MRI('calendar')}</span><div><span class="lbl">Agenda</span><h3>Mis próximas clases</h3></div></div>
        ${up.length ? `<div class="lv-list">${up.map(c => `<div class="lv-cl ${c.type}${c.date === today ? ' hoy' : ''}"><div class="lv-dt"><b>${fmtD(c.date, { day: 'numeric' })}</b><small>${fmtD(c.date, { month: 'short' })}</small></div>
          <div class="grow"><b>${c.type === 'vip' ? '🎯 Clase individual' : c.type === 'club' ? esc(c.club || '🎙️ Club') : '👥 Clase grupal'}${c.date === today ? ' <i class="lv-today">HOY</i>' : ''}</b><small>${fmtD(c.date, { weekday: 'long' })} · ${fmtT(c.time)} · ${esc(c.teacher || '')}${c.topic ? ' · ' + esc(c.topic) : ''}</small></div>
          <div class="lv-act">${c.type === 'club' ? (c.confirmed ? '<span class="lv-ok">✅ Reservada</span>' : c.full ? '<span class="lv-pend">🚫 Cupos llenos (10/10)</span>' : c.canConfirm ? `<button class="btn k sm" data-conf="${esc(c.id)}">✅ Reservar cupo</button><small class="lv-spots">${c.spots} cupo${c.spots === 1 ? '' : 's'} libre${c.spots === 1 ? '' : 's'}</small>` : '<span class="lv-pend">⏰ Reservas cerradas (3 h antes)</span>') : ''}${c.meet && (c.type !== 'club' || c.confirmed) ? `<a class="btn k sm" target="_blank" rel="noopener" href="${esc(c.meet)}">${ICO.cam} Entrar</a>` : ''}${c.canCancel ? `<button class="btn w sm" data-cancel="${esc(c.id)}" data-kind="${c.type}" data-late="${c.lateCancel ? 1 : ''}">Cancelar</button>` : ''}</div></div>`).join('')}</div>` : '<p class="muted">No tienes clases programadas todavía. Aquí aparecerán las clases individuales que reserves.</p>'}${up.some(c => c.type === 'club') ? '<p class="muted lv-note">🎙️ Reserva tu cupo en las clases grupales mínimo <b>3 horas antes</b>. El enlace aparece al reservar.</p>' : ''}</div>
      ${`<div class="card lv-card lv-claim"><div class="lv-h"><span class="lv-ic ic-flag">${MRI('flag')}</span><div><span class="lbl">Reportes</span><h3>¿Tu profe no se conectó?</h3></div></div>
        ${(pr.claimable || []).length ? `<p class="muted">Repórtalo apenas empiece la clase y hasta 24 horas después. Si se confirma, <b>la clase vuelve a tu saldo</b>.</p><div class="lv-list">${pr.claimable.map(c => `<div class="lv-cl"><div class="grow"><b>${fmtD(c.date, { weekday: 'long', day: 'numeric', month: 'short' })} · ${fmtT(c.time)}</b><small>${esc(c.teacher || '')}</small></div><button class="btn w sm" data-claim="${esc(c.id)}">${MRI('flag')} Mi profe no se conectó</button></div>`).join('')}</div>` : ''}
        ${(pr.claims || []).length ? `<div class="lv-list" style="margin-top:8px">${pr.claims.map(c => `<div class="lv-cl"><div class="grow"><b>${fmtD(c.date, { day: 'numeric', month: 'short' })} · ${fmtT(c.time)} · ${esc(c.teacher || '')}</b><small>${c.status === 'aprobado' ? '✅ Aprobado · la clase volvió a tu saldo' : c.status === 'rechazado' ? '❌ No se confirmó' : '⏳ En revisión (máx. 24 h)'}</small></div></div>`).join('')}</div>` : ''}${!(pr.claimable || []).length ? '<p class="muted" style="margin:0">Si tu profe no se conecta a una clase, aquí aparecerá el botón <b>"Mi profe no se conectó"</b> apenas empiece la clase. Si se confirma, la clase vuelve a tu saldo.</p>' : ''}</div>`}
      <div class="lv-duo"><div class="card lv-card lv-msg"><div class="lv-h"><span class="lv-ic ic-wa"><svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path fill="#fff" d="M16 3C8.8 3 3 8.6 3 15.6c0 2.5.8 4.9 2.1 6.9L3.6 28l5.7-1.5c2 1.1 4.3 1.7 6.7 1.7 7.2 0 13-5.6 13-12.6S23.2 3 16 3zm6.3 17.6c-.3.8-1.6 1.5-2.2 1.6-.6.1-1.3.1-2.1-.1-.5-.2-1.1-.4-1.9-.7-3.3-1.4-5.5-4.7-5.6-4.9-.2-.2-1.3-1.8-1.3-3.4s.8-2.4 1.1-2.7c.3-.3.6-.4.8-.4h.6c.2 0 .5-.1.7.6.3.7.9 2.3 1 2.5.1.2.1.4 0 .6-.1.2-.2.4-.3.6l-.5.6c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.9 1.8.4.2.6.1.8-.1.2-.2.9-1 1.1-1.4.2-.4.5-.3.8-.2.3.1 2 .9 2.3 1.1.3.2.6.3.7.4.1.3.1 1-.2 1.8z"/></svg></span><div><span class="lbl">Tu profe</span><h3>Escríbele a tu profe</h3></div></div>
        <p class="muted">Chatea en vivo con tu profe, como en WhatsApp. Le avisamos cuando le escribas.</p><button class="btn wa-btn" id="lv-msg"><span class="wa-dot"><svg viewBox="0 0 32 32" width="18" height="18" aria-hidden="true"><path fill="#fff" d="M16 3C8.8 3 3 8.6 3 15.6c0 2.5.8 4.9 2.1 6.9L3.6 28l5.7-1.5c2 1.1 4.3 1.7 6.7 1.7 7.2 0 13-5.6 13-12.6S23.2 3 16 3zm6.3 17.6c-.3.8-1.6 1.5-2.2 1.6-.6.1-1.3.1-2.1-.1-.5-.2-1.1-.4-1.9-.7-3.3-1.4-5.5-4.7-5.6-4.9-.2-.2-1.3-1.8-1.3-3.4s.8-2.4 1.1-2.7c.3-.3.6-.4.8-.4h.6c.2 0 .5-.1.7.6.3.7.9 2.3 1 2.5.1.2.1.4 0 .6-.1.2-.2.4-.3.6l-.5.6c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.9 1.8.4.2.6.1.8-.1.2-.2.9-1 1.1-1.4.2-.4.5-.3.8-.2.3.1 2 .9 2.3 1.1.3.2.6.3.7.4.1.3.1 1-.2 1.8z"/></svg></span> Abrir chat con mi profe</button></div>
      ${(pr.history || []).length ? `<details class="card lv-card lv-hist"><summary>${MRI('file')} Historial de clases (${pr.history.length})</summary><div class="lv-list">${pr.history.map(c => `<div class="lv-cl ${c.type}"><div class="grow"><b>${c.type === 'vip' ? '🎯 Clase individual' : '👥 Clase grupal'} · ${fmtD(c.date)} ${fmtT(c.time)}</b><small>${esc(c.teacher || '')} · ${c.type === 'vip' ? (c.status === 'done' ? (c.attended ? '✅ Dictada · 1 clase descontada de tu paquete' : '❌ No asististe · 1 clase descontada de tu paquete') : c.status === 'noshow' ? '❌ No asististe · 1 clase descontada de tu paquete' : c.status === 'latecancel' ? 'Cancelación tardía · 1 clase descontada de tu paquete' : c.status === 'tnoshow' ? '🚩 Tu profe no se conectó · la clase volvió a tu saldo' : c.status === 'cancelled' ? 'Cancelada a tiempo · sin descuento' : esc(c.status)) : (c.status === 'done' && c.attended ? '✅ Asististe' : c.status === 'cancelled' ? 'Cancelada' : 'No asististe · sin penalización')}</small></div></div>`).join('')}</div></details>` : ''}</div>
    </div>`;
    if ($('#lv-book')) $('#lv-book').onclick = () => { const mm = M.modal(`<h3>🎯 Antes de reservar tu clase individual</h3><ul class="lv-rules">
        <li><span>📅</span><div><b>Reserva:</b> mínimo <b>4 horas</b> antes de la clase.</div></li>
        <li><span>✅</span><div><b>Cancelación sin penalización:</b> hasta <b>2 horas</b> antes de la clase.</div></li>
        <li><span>⚠️</span><div><b>Cancelación tardía o inasistencia:</b> la clase se descuenta de tu paquete y no será repuesta.</div></li>
        <li><span>⏱️</span><div>Todas las clases duran <b>50 minutos</b>.</div></li></ul><button class="btn k block lg" id="vb-go">Entendido, reservar →</button>`, { x: true }); $('#vb-go', mm).onclick = () => { mm.remove(); vipBooking(); }; };
    $$('[data-claim]', box).forEach(b => b.onclick = () => { const mm = M.modal(`<h3>🚩 ¿Tu profe no se conectó?</h3><p>Cuéntanos qué pasó (opcional). Administración lo revisa y, si se confirma, la clase vuelve a tu saldo.</p><textarea class="inp" id="cl-n" rows="3" placeholder="Ej.: esperé 15 minutos en el enlace y nadie se conectó"></textarea><button class="btn k block lg" id="cl-go" style="margin-top:10px">Enviar reporte</button>`, { x: true });
      $('#cl-go', mm).onclick = async (e) => { e.currentTarget.disabled = true; const res = await MRAC.call('claim', { code: MRAC.code(), classId: b.dataset.claim, note: $('#cl-n', mm).value }).catch(() => ({ ok: false })); mm.remove();
        if (res.ok) { M.toast(res.status === 'aprobado' ? '✅ Listo: la clase volvió a tu saldo' : '📩 Recibimos tu reporte. Te avisamos en máximo 24 horas'); live(); }
        else M.toast({ window: 'Ese reporte ya no se puede enviar (solo hasta 24 horas después de la clase).', exists: 'Ya enviaste un reporte de esta clase.' }[res.err] || 'No se pudo enviar. Inténtalo de nuevo.'); }; });
    if ($('#lv-extra')) $('#lv-extra').onclick = () => window.MRBUY ? MRBUY.extra(cr.cycleEnd) : M.toast('Recarga la página e inténtalo de nuevo.');
    myBuys();
    $$('[data-cancel]', box).forEach(b => b.onclick = () => cancelVip(b.dataset.cancel, b.dataset.kind, !!b.dataset.late));
    $$('[data-conf]', box).forEach(b => b.onclick = async () => { b.disabled = true; b.textContent = '⏳…';
      const res = await MRAC.call('groupConfirm', { code: MRAC.code(), classId: b.dataset.conf });
      if (res.ok) { M.toast('✅ ¡Cupo reservado! Tu profe ya sabe que vas.'); live(); }
      else { b.disabled = false; b.textContent = '✅ Reservar cupo'; M.toast(res.err === 'too_late' ? '⏰ Ya pasó el límite: se reserva mínimo 3 horas antes.' : res.err === 'full' ? '🚫 Esta sesión ya tiene 10 estudiantes. Reserva en el siguiente horario de tu nivel.' : 'No se pudo reservar. Intenta de nuevo.'); if (res.err === 'full') live(); } });
    $$('.lv-polk', box).forEach(a => a.onclick = (e) => { e.preventDefault(); window.MRPOLICY && MRPOLICY.show(); });
    if ($('#lv-msg')) $('#lv-msg').onclick = () => window.MRLIVE ? MRLIVE.openStudent() : teacherMsg();
  }
  function teacherMsg() {
    const m = M.modal(`<div class="vb"><h3>✉️ Escribir a mi profe</h3><textarea class="inp" id="tm-t" rows="5" maxlength="1500" placeholder="Hola profe, …" style="width:100%"></textarea><button class="btn k block lg" id="tm-ok" style="margin-top:10px">📨 Enviar</button></div>`, { x: true });
    $('#tm-ok', m).onclick = async () => { const text = $('#tm-t', m).value.trim(); if (!text) return M.toast('Escribe tu mensaje'); $('#tm-ok', m).disabled = true;
      const res = await MRAC.call('stuMsg', { code: MRAC.code(), text }); if (res.ok) { m.remove(); M.toast('✅ Mensaje enviado a tu profe'); } else { $('#tm-ok', m).disabled = false; M.toast(res.err === 'noteacher' ? 'Aún no tienes un profe asignado.' : 'No se pudo enviar. Intenta de nuevo.'); } };
  }
  function addDay(iso, n) { const d = new Date(String(iso) + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  async function vipBooking() {
    const m = M.modal(`<div class="vb"><h3>📅 Reserva tu clase individual</h3><div id="vb-b" class="center">⏳ Buscando espacios disponibles…</div></div>`, { x: true });
    const r = await MRAC.call('vipOptions', { code: MRAC.code() }); const b = $('#vb-b', m); if (!b) return;
    if (!r.ok) { b.innerHTML = `<p>${r.err === 'not_premium' ? 'Las clases individuales son parte de los planes Premium.' : 'No pudimos cargar los espacios. Revisa tu conexión.'}</p>`; return; }
    if (!r.teachers.length) { b.innerHTML = `<p class="muted">Por ahora no hay espacios disponibles en los próximos días. Los profes publican nuevos horarios cada semana: vuelve pronto o escríbenos.</p><a class="btn w block" target="_blank" rel="noopener" href="${WA('¡Hola! Soy ' + P.get().name + ' (Premium) y no encuentro espacios para mi clase VIP 🙏')}">💬 Escribir a la escuela</a>`; return; }
    let T = null, D = null, S = null, TP = null, OT = '';
    const MN = (P.assigned() || {}).n || +(P.get() || {}).module || 1; const tops = TOPICS[MN] || TOPICS[1];
    const step = () => {
      if (!T) { b.innerHTML = `<p class="vb-st">1️⃣ Elige tu profesor</p><div class="vb-teachers">${r.teachers.map(t => `<button class="vb-t" data-t="${esc(t.id)}"><span class="vb-av">${esc((t.name || '?').split(' ').map(x => x[0]).slice(0, 2).join(''))}</span><div><b>${esc(t.name)}</b><small>${esc(t.bio || '')}</small><em>${t.slots.length} espacio${t.slots.length === 1 ? '' : 's'} disponible${t.slots.length === 1 ? '' : 's'}</em></div></button>`).join('')}</div><p class="muted vb-cr">Te quedan <b>${r.credits.vipLeft}</b> clase(s) VIP este mes. Cancelas sin penalidad hasta 2 horas antes.</p>`;
        $$('.vb-t', b).forEach(x => x.onclick = () => { T = r.teachers.find(t => t.id === x.dataset.t); sfx('tap'); step(); }); return; }
      const dates = [...new Set(T.slots.map(s => s.date))];
      if (!D) D = dates[0];
      const times = T.slots.filter(s => s.date === D);
      b.innerHTML = `<button class="btn w sm" id="vb-back">← Profes</button><p class="vb-st">2️⃣ ${esc(T.name)}: elige fecha y hora <small>(hora Colombia)</small></p>
        <div class="vb-dates">${dates.map(d => `<button class="vb-d${d === D ? ' on' : ''}" data-d="${d}"><small>${fmtD(d, { weekday: 'short' })}</small><b>${fmtD(d, { day: 'numeric' })}</b><small>${fmtD(d, { month: 'short' })}</small></button>`).join('')}</div>
        <div class="vb-times">${times.map(s => `<button class="vb-h${S && S.id === s.id ? ' on' : ''}" data-s="${esc(s.id)}">${fmtT(s.time)}<small>50 min</small></button>`).join('')}</div>
        <p class="vb-st">3️⃣ ¿Qué quieres practicar? <small>(tu profe lo recibe antes de la clase)</small></p>
        <div class="vb-topics">${tops.map((t, i) => `<button type="button" class="vb-tp${TP === i ? ' on' : ''}" data-tp="${i}"><b>${i + 1}. ${esc(t[0])}</b><small>${esc(t[1])}</small></button>`).join('')}<button type="button" class="vb-tp vb-other${TP === 'o' ? ' on' : ''}" data-tp="o"><b>✏️ Otro tema</b><small>Algo diferente</small></button></div>
        <input class="inp${TP === 'o' ? '' : ' hidden'}" id="vb-topic" maxlength="180" placeholder="Ej: entrevista de trabajo en inglés" value="${esc(OT)}">
        <button class="btn k block lg vb-ok" id="vb-ok" ${S && TP != null ? '' : 'disabled'}>${S && TP == null ? '👆 Elige el tema de tu clase' : S ? `✅ Reservar · ${fmtD(S.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${fmtT(S.time)}` : 'Elige una hora'}</button>`;
      $('#vb-back', b).onclick = () => { T = null; D = null; S = null; step(); };
      $$('.vb-d', b).forEach(x => x.onclick = () => { D = x.dataset.d; S = null; step(); });
      $$('.vb-h', b).forEach(x => x.onclick = () => { S = T.slots.find(s => s.id === x.dataset.s); sfx('tap'); OT = $('#vb-topic', b).value; step(); });
      $$('.vb-tp', b).forEach(x => x.onclick = () => { OT = $('#vb-topic', b).value; TP = x.dataset.tp === 'o' ? 'o' : +x.dataset.tp; sfx('tap'); step(); if (TP === 'o') $('#vb-topic', b).focus(); });
      $('#vb-ok', b).onclick = async () => { const ok = $('#vb-ok', b);
        if (TP == null) return M.toast('Elige el tema que quieres practicar 🙂');
        if (TP === 'o' && !$('#vb-topic', b).value.trim()) { $('#vb-topic', b).focus(); return M.toast('Escribe qué tema quieres practicar 🙂'); }
        ok.disabled = true; ok.textContent = 'Reservando…';
        const other = $('#vb-topic', b).value.trim(); const topic = TP === 'o' ? (other ? 'Otro tema: ' + other : 'Otro tema') : TP != null ? `Módulo ${MN} · Tema ${TP + 1}: ${tops[TP][0]} (${tops[TP][1]})` : '';
        const res = await MRAC.call('vipBook', { code: MRAC.code(), slotId: S.id, topic });
        if (res.ok) { m.remove(); sfx('win'); M.confetti(1800); M.modal(`<div class="center">${M.mascot('mascot bounce', 'celebrate')}<h3>¡Clase reservada! 🎉</h3><p style="font-size:17px">${esc(T.name)} · <b>${fmtD(S.date, { weekday: 'long', day: 'numeric', month: 'long' })}</b> · ${fmtT(S.time)} (hora Colombia)</p><p class="muted">Te enviamos la confirmación a tu correo. El enlace de la clase aparece en “Mis próximas clases”.</p></div>`, { x: true }); await MRAC.me(true); live(); }
        else { M.toast({ taken: 'Ese espacio acaba de ser reservado. Elige otro 🙏', no_credits: 'Ya reservaste todas tus clases de este periodo.', holiday: 'Ese día es domingo o festivo en Colombia: no hay clases. Elige otro día 🙏', too_late: 'Ese espacio ya no se puede reservar (muy pronto).' }[res.err] || 'No se pudo reservar. Inténtalo de nuevo.');
          if (res.err === 'taken') { const rr = await MRAC.call('vipOptions', { code: MRAC.code() }); if (rr.ok) { r.teachers = rr.teachers; T = r.teachers.find(t => t.id === T.id) || null; S = null; D = null; } step(); } else { ok.disabled = false; ok.textContent = 'Reintentar'; } } };
    };
    step();
  }
  function changeModal(g) {
    const m = M.modal(`<h3>🔁 ${g ? 'Solicitar cambio de horario' : 'Mi horario preferido'}</h3>${g ? `<p class="muted">Grupo actual: <b>${esc(g.name)}</b> · ${esc(g.days || '')} ${g.time ? fmtT(g.time) : ''}</p>` : ''}
      <label class="pt-lab">¿Qué horario te funciona mejor?</label><input class="inp" id="cq-p" maxlength="200" placeholder="Ej: lunes y miércoles después de las 7 p. m.">
      <label class="pt-lab">Motivo <small class="muted">(opcional)</small></label><textarea class="inp" id="cq-r" rows="3" maxlength="500" placeholder="Cuéntanos brevemente"></textarea>
      <p class="muted" style="font-size:14px">Administración revisa tu solicitud y te avisa por correo.</p><button class="btn k block" id="cq-ok">Enviar solicitud</button>`, { x: true });
    $('#cq-ok', m).onclick = async () => { const pf = $('#cq-p', m).value.trim(); if (!pf) { $('#cq-p', m).classList.add('wrong'); return; }
      const b = $('#cq-ok', m); b.disabled = true; b.textContent = 'Enviando…';
      const r = await MRAC.call('changeReq', { code: MRAC.code(), preferred: pf, reason: $('#cq-r', m).value.trim() });
      if (r.ok) { m.remove(); sfx('win'); M.toast('✅ Solicitud enviada. Te avisaremos por correo.'); await MRAC.me(true); live(); }
      else { b.disabled = false; b.textContent = 'Enviar solicitud'; M.toast(r.err === 'pending' ? 'Ya tienes una solicitud en revisión.' : 'No se pudo enviar. Inténtalo de nuevo.'); } };
  }
  function cancelVip(id, kind, late) {
    const club = kind === 'club', what = club ? 'tu cupo en la clase grupal' : 'tu clase individual'; if (club) late = false;
    const m = M.modal(`<h3>¿Cancelar ${what}?</h3>${late ? `<p class="lv-noacum">⚠️ Faltan <b>menos de 2 horas</b>. Si cancelas ahora, ${club ? 'esta sesión <b>se vence</b>' : 'esta clase <b>se descuenta de tu paquete y no será repuesta</b>'}.</p>` : `<p>${club ? 'En las clases grupales <b>no hay penalidad</b>: puedes seguir asistiendo a las demás de tu nivel.' : 'Estás a tiempo: cancelas <b>sin penalización</b> y la clase vuelve a tu paquete.'}</p>`}<p class="muted">Tu profe recibe el aviso.</p><div class="row"><button class="btn k" id="y">Sí, cancelar</button><button class="btn w" id="n">No</button></div>`, { x: true });
    $('#n', m).onclick = () => m.remove();
    $('#y', m).onclick = async () => { $('#y', m).disabled = true; const r = await MRAC.call(club ? 'groupCancel' : 'vipCancel', { code: MRAC.code(), classId: id }); m.remove();
      if (r.ok) { M.toast(r.late ? (club ? 'Cancelaste tu cupo ✅' : 'Clase cancelada. Se descontó de tu paquete (menos de 2 horas).') : (club ? 'Cancelaste tu cupo ✅' : 'Clase cancelada sin penalidad. La clase volvió a tu plan ✅')); await MRAC.me(true); live(); }
      else M.toast(r.err === 'started' ? 'La clase ya empezó: no se puede cancelar.' : 'No se pudo cancelar.'); };
  }
  /* ---------- cumpleaños ---------- */
  const bdKey = () => 'mra_bday_' + P.todayISO();
  const bdaySeen = () => { try { return !!localStorage.getItem(bdKey()); } catch (e) { return true; } };
  let BD_FIRST = null; const bdFirst = () => { if (BD_FIRST === null) BD_FIRST = !bdaySeen(); return BD_FIRST; }; // el saludo sale solo la primera vez que entra ese día
  function birthdayBanner() { const p = P.get(); if (!P.isBirthday() || !bdFirst()) return ''; return `<div class="pt-bday" id="pt-bday"><span class="bd-cake">🎂</span><div><b>Happy Birthday, ${esc(P.look().nick || p.first)}! 🎉</b><small>¡Feliz cumpleaños! Todo el equipo de mrarrieta.com te desea un año increíble.</small></div><button class="btn w sm" id="bd-again">🎉</button></div>`; }
  // 🎂 cumpleaños: se marca por año (también en la nube) para no repetir el saludo atrasado
  const bdYear = () => P.todayISO().slice(0, 4);
  const bdMark = () => { try { localStorage.setItem('mra_bday_y_' + bdYear(), '1'); } catch (e) { } const p = P.get(); if (p && p.bdY !== bdYear()) { p.bdY = bdYear(); P.save(p); try { window.MRAC && MRAC.code() && MRAC.sync(true); } catch (e) { } } };
  const bdYearSeen = () => { const p = P.get() || {}; if (p.bdY === bdYear()) return true; try { return !!localStorage.getItem('mra_bday_y_' + bdYear()); } catch (e) { return true; } };
  // si no entró el día de su cumpleaños, lo felicitamos cuando entre en los 7 días siguientes (una sola vez)
  function belatedBirthday() {
    const p = P.get(); if (!p || !p.birth || p.type === 'staff' || bdYearSeen()) return;
    const y = bdYear(), bd = y + '-' + p.birth.slice(5, 10), t = P.todayISO(); if (bd >= t) return;
    const days = Math.round((new Date(t + 'T12:00:00') - new Date(bd + 'T12:00:00')) / 864e5); if (days < 1 || days > 7) return;
    bdMark(); const when = new Date(bd + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    setTimeout(() => { M.confetti(3500); sfx('win');
      const m = M.modal(`<div class="center bd-modal"><img src="mra-bday.webp" alt="Mr. Arrieta" class="bd-mra"><h2>Happy belated birthday, ${esc(P.look().nick || p.first)}! 🎂</h2>
        <p style="font-size:18px">Sabemos que ${days === 1 ? '<b>ayer</b>' : 'el'} <b>${esc(when)}</b> cumpliste años. ¡Muchas felicidades! Todo el equipo de mrarrieta.com te desea un año lleno de alegría, salud y muchos logros… ¡también en inglés! 🥳</p>
        <button class="btn k block lg" id="bd-ok">Thank you! 💛</button></div>`, { x: true });
      $('#bd-ok', m).onclick = () => m.remove(); }, 600);
  }
  function birthdayParty(force) {
    if (!P.isBirthday()) { belatedBirthday(); const b = $('#bd-again'); if (b) b.onclick = () => birthdayParty(true); return; }
    bdMark();
    if (bdaySeen() && !force) { const b = $('#bd-again'); if (b) b.onclick = () => birthdayParty(true); return; }
    try { localStorage.setItem(bdKey(), '1'); } catch (e) { }
    const p = P.get(); const age = p.birth ? (+P.todayISO().slice(0, 4) - +p.birth.slice(0, 4)) : 0;
    setTimeout(() => { M.confetti(5000); sfx('win');
      const m = M.modal(`<div class="center bd-modal"><img src="mra-bday.webp" alt="Mr. Arrieta" class="bd-mra"><h2>Happy Birthday, ${esc(P.look().nick || p.first)}! 🥳</h2>
        <p style="font-size:18px"><b>Today is your special day!</b><br>¡Hoy es tu día especial! Te deseamos un año lleno de alegría, salud y muchos logros… ¡también en inglés!</p>
        ${age > 0 && age < 110 ? `<p class="bd-age">🎉 ${age} years young! 🎉</p>` : ''}<button class="btn k block lg" id="bd-ok">Thank you! 💛</button></div>`, { x: true });
      $('#bd-ok', m).onclick = () => m.remove();
      try { const u = new SpeechSynthesisUtterance(`Happy birthday, ${p.first}!`); u.lang = 'en-US'; speechSynthesis.speak(u); } catch (e) { } }, 500);
    const b = $('#bd-again'); if (b) b.onclick = () => birthdayParty(true);
  }
  // perfiles antiguos sin fecha de nacimiento: la pedimos una vez
  function birthAsk() { const p = P.get(); if (!p || p.type !== 'student' || p.demo || p.birth || !p.first) return ''; return `<div class="card pt-bask"><span class="bd-cake">🎂</span><div class="grow"><b>¿Cuándo es tu cumpleaños?</b><small>Queremos felicitarte ese día 🎉</small><div class="row"><input class="inp" id="bq-d" type="date" max="${P.todayISO()}" min="1930-01-01">${p.email ? '' : '<input class="inp" id="bq-e" type="email" placeholder="tu correo">'}<button class="btn k" id="bq-ok">Guardar</button></div></div></div>`; }
  function wireBirth() {
    const ok = $('#bq-ok'); if (!ok) return;
    ok.onclick = () => { const d = $('#bq-d').value; const e = $('#bq-e') ? $('#bq-e').value.trim() : ''; if (!d) return $('#bq-d').classList.add('wrong');
      if ($('#bq-e') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return $('#bq-e').classList.add('wrong');
      const p = P.get(); p.birth = d; if (e) p.email = e; P.save(p); if (window.MRAC && MRAC.code()) MRAC.saveProfile(Object.assign({ birth: d }, e ? { email: e } : {}));
      sfx('win'); M.toast('¡Gracias! 🎂 Lo tendremos presente.'); home(); };
  }
  function placement() {
    window.MRAPLACE.run(app, { route: (r) => route(r || 'home'), after: () => topbar() });
  }
  route('home');
})();
