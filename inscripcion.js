/* =====================================================================
   FORMULARIO DE INSCRIPCIÓN (público) · mrarrieta.com
   · Elige plan (Acceso gratuito / Membership / Premium) + datos.
   · Envía a la nube: MRAC.call('enroll', {...}).
   · Sin nube o con error: ofrece enviar los datos por WhatsApp.
   · ?plan=premium | membership | free  → preselecciona el plan.
   ===================================================================== */
(function () {
  const C = window.M1CONFIG || {}, MR = window.MRAC || { on: false, call: async () => ({ ok: false, err: 'offline' }) };
  const P = C.PLANS || {}, WA = C.WHATSAPP || '573017810841';
  const app = document.getElementById('in-app');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const PLANS = [
    { id: 'free', name: 'Acceso gratuito', price: '$0', per: '', tag: 'Para empezar', icon: '🟢',
      perks: ['Código de acceso entregado por la escuela', 'Prueba de clasificación', 'Tu nivel y tu ruta de aprendizaje', 'Los 2 primeros temas gratis'] },
    { id: 'membership', name: (P.membership && P.membership.name) || 'Membership', price: (P.membership && P.membership.price) || '$59.900', per: (P.membership && P.membership.per) || '/mes', tag: 'Toda la plataforma', icon: '🚀',
      perks: ['Toda la plataforma: ruta A1 → A2 → B2 → B2+', 'Tu progreso guardado en la nube', 'Todas las actividades y materiales', 'Estudia a tu ritmo, desde cualquier dispositivo'], note: 'No incluye clases con profe.' },
    { id: 'premium', name: (P.premium && P.premium.name) || 'Premium', price: (P.premium && P.premium.price) || '$349.000', per: (P.premium && P.premium.per) || '/mes', tag: 'Plataforma + clases', icon: '⭐', best: true,
      perks: ['Todo lo de Membership', '2 clases VIP al mes: tú las reservas según la disponibilidad real de los profes', 'Clubs de conversación y fonética en vivo', '⚠️ Clases no acumulables: resérvalas durante la vigencia de tu plan'] },
  ];
  const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const SCHED = [['Mañana', '🌅', '6:00 a. m. – 12:00 m.'], ['Tarde', '☀️', '12:00 m. – 6:00 p. m.'], ['Noche', '🌙', '6:00 p. m. – 9:00 p. m.']];
  const PAY = ['Transferencia bancaria', 'Nequi', 'Daviplata', 'Tarjeta', 'Otro'];
  const SRC = ['Instagram', 'Facebook', 'TikTok', 'Google', 'Recomendación', 'Otro'];
  const LEVELS = [['No sé', 'No sé mi nivel'], ['Básico', 'Básico'], ['Intermedio', 'Intermedio'], ['Avanzado', 'Avanzado']];

  const qs = new URLSearchParams(location.search);
  const st = { plan: ['free', 'membership', 'premium'].indexOf(qs.get('plan')) >= 0 ? qs.get('plan') : '', schedule: '', days: [], level: '', source: '', busy: false };
  const planOf = (id) => PLANS.find((p) => p.id === id);

  /* ---------------- vista principal ---------------- */
  function render() {
    app.innerHTML = `
    <section class="in-hero">
      <div class="in-hero-txt">
        <span class="lbl">Inscripciones abiertas</span>
        <h1>Aprende inglés <span class="in-hl">HABLANDO</span>, a tu ritmo y con tu propia ruta.</h1>
        <p>Una plataforma completa para niños, jóvenes y adultos hispanohablantes: prueba de clasificación, ruta de aprendizaje del A1 al B2+, actividades interactivas y, si lo quieres, clases en vivo con profes.</p>
        <ul class="in-hero-pts"><li>✅ 100 % en línea</li><li>✅ Metodología RealTalk®</li><li>✅ Tu progreso siempre guardado</li></ul>
      </div>
      <img class="in-hero-img" src="mra-welcome.webp" alt="Mr. Arrieta te da la bienvenida" width="300" height="300">
    </section>

    <form id="in-form" class="in-form" novalidate>
      <h2 class="in-step"><span>1</span> Elige tu plan</h2>
      <div class="in-plans" role="radiogroup" aria-label="Plan">
        ${PLANS.map((p) => `
        <button type="button" class="in-plan${p.best ? ' best' : ''}${st.plan === p.id ? ' on' : ''}" role="radio" aria-checked="${st.plan === p.id}" data-plan="${p.id}">
          ${p.best ? '<span class="in-ribbon">⭐ Más completo</span>' : ''}
          <span class="in-plan-ic" aria-hidden="true">${p.icon}</span>
          <span class="in-plan-name">${esc(p.name)}</span>
          <span class="in-plan-price"><b>${esc(p.price)}</b><small>${esc(p.per || (p.id === 'free' ? 'sin costo' : ''))}</small></span>
          <span class="in-plan-tag">${esc(p.tag)}</span>
          <ul>${p.perks.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>
          ${p.note ? `<span class="in-plan-note">${esc(p.note)}</span>` : ''}
          <span class="in-plan-pick">${st.plan === p.id ? '✓ Seleccionado' : 'Elegir este plan'}</span>
        </button>`).join('')}
      </div>
      <p class="in-err" id="err-plan" hidden>Elige un plan para continuar.</p>

      <h2 class="in-step"><span>2</span> Tus datos</h2>
      <div class="card in-card">
        <div class="in-grid">
          ${field('first', 'Nombre', 'text', 'given-name', 'Ej: Laura')}
          ${field('last', 'Apellido', 'text', 'family-name', 'Ej: Gómez')}
          ${field('email', 'Correo electrónico', 'email', 'email', 'tucorreo@ejemplo.com')}
          ${field('whatsapp', 'WhatsApp (con indicativo)', 'tel', 'tel', 'Ej: +1 305 555 0123')}
          <div class="in-f">
            <label for="in-birth">Fecha de nacimiento</label>
            <input class="inp" id="in-birth" name="birth" type="date" autocomplete="bday" required max="${isoToday()}" min="1930-01-01">
            <small class="muted">🎂 ¡Para felicitarte en tu cumpleaños!</small>
            <p class="in-err" hidden>Escribe tu fecha de nacimiento.</p>
          </div>
          ${field('city', 'Ciudad y país', 'text', 'address-level2', 'Ej: Miami, Estados Unidos')}
        </div>

        <fieldset class="in-fs">
          <legend>¿Cuál crees que es tu nivel de inglés?</legend>
          <div class="in-chips" data-group="level">${LEVELS.map(([v, t]) => chip('level', v, t)).join('')}</div>
          <small class="muted">No te preocupes: con la prueba de clasificación confirmamos tu nivel.</small>
        </fieldset>

        <div id="in-premium" class="in-cond" hidden>
          <fieldset class="in-fs">
            <legend>Horario preferido para tus clases <small class="muted">(hora Colombia)</small></legend>
            <div class="in-chips" data-group="schedule">${SCHED.map(([v, i, h]) => chip('schedule', v, `${i} ${v}<small>${h}</small>`)).join('')}</div>
          </fieldset>
          <fieldset class="in-fs">
            <legend>Días que te funcionan <small class="muted">(puedes elegir varios)</small></legend>
            <div class="in-chips" data-group="days">${DAYS.map((d) => chip('days', d, d)).join('')}</div>
          </fieldset>
          <p class="in-tip">💡 La escuela te asigna tu grupo según tu nivel y horario. Tus 2 clases VIP las reservas tú desde tu perfil.</p>
        </div>

        <div id="in-pay" class="in-f in-cond" hidden>
          <label for="in-payment">Medio de pago preferido</label>
          <select class="inp" id="in-payment" name="payment">
            <option value="">Selecciona una opción</option>${PAY.map((x) => `<option>${x}</option>`).join('')}
          </select>
          <small class="muted">No pagas nada ahora: te escribimos por WhatsApp para activar tu plan.</small>
        </div>

        <fieldset class="in-fs">
          <legend>¿Cómo nos conociste?</legend>
          <div class="in-chips" data-group="source">${SRC.map((s) => chip('source', s, s)).join('')}</div>
        </fieldset>

        <div class="in-f">
          <label for="in-comments">Comentarios o preguntas <small class="muted">(opcional)</small></label>
          <textarea class="inp" id="in-comments" name="comments" rows="3" maxlength="1500" placeholder="Cuéntanos tus metas: viajar, trabajo, entrevistas…"></textarea>
        </div>

        <label class="in-consent"><input type="checkbox" id="in-ok" required>
          <span>Autorizo a <b>mrarrieta.com</b> a tratar mis datos personales para gestionar mi inscripción y comunicarse conmigo por WhatsApp y correo, conforme a la <b>Ley 1581 de 2012</b> (Colombia). Puedo consultar, actualizar o pedir la eliminación de mis datos en cualquier momento.</span></label>
        <p class="in-err" id="err-ok" hidden>Debes autorizar el tratamiento de datos para continuar.</p>

        <div class="in-summary" id="in-summary"></div>
        <button class="btn k lg block" id="in-send" type="submit">Enviar mi inscripción 🚀</button>
        <p class="muted center in-small">¿Prefieres hablar con alguien? <a href="https://wa.me/${WA}?text=${encodeURIComponent((window.MRNE || String)('¡Hola! Quiero información sobre los planes de mrarrieta.com'))}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a></p>
      </div>
    </form>`;
    bind(); syncPlan();
  }
  function field(id, label, type, ac, ph) {
    return `<div class="in-f"><label for="in-${id}">${label}</label>
      <input class="inp" id="in-${id}" name="${id}" type="${type}" autocomplete="${ac}" placeholder="${esc(ph)}" required maxlength="${id === 'email' ? 120 : 80}"${type === 'tel' ? ' inputmode="tel"' : ''}>
      <p class="in-err" hidden>${{ first: 'Escribe tu nombre.', last: 'Escribe tu apellido.', email: 'Escribe un correo válido.', whatsapp: 'Escribe un número de WhatsApp válido.', city: 'Escribe tu ciudad y país.' }[id]}</p></div>`;
  }
  function chip(group, val, html) { return `<button type="button" class="in-chip" data-g="${group}" data-v="${esc(val)}" aria-pressed="false">${html}</button>`; }
  function isoToday() { const d = new Date(Date.now() - 5 * 36e5); return d.toISOString().slice(0, 10); }

  function bind() {
    $$('.in-plan').forEach((b) => b.onclick = () => { st.plan = b.dataset.plan; syncPlan(); $('#err-plan').hidden = true; });
    $$('.in-chip').forEach((b) => b.onclick = () => {
      const g = b.dataset.g, v = b.dataset.v;
      if (g === 'days') { const i = st.days.indexOf(v); i >= 0 ? st.days.splice(i, 1) : st.days.push(v); }
      else st[g] = st[g] === v ? '' : v;
      syncChips();
    });
    $('#in-form').onsubmit = (e) => { e.preventDefault(); send(); };
    $$('#in-form input, #in-form select, #in-form textarea').forEach((el) => el.addEventListener('input', () => { const er = el.closest('.in-f') && el.closest('.in-f').querySelector('.in-err'); if (er) er.hidden = true; el.classList.remove('in-bad'); summary(); }));
    $('#in-ok').onchange = () => { $('#err-ok').hidden = true; };
  }
  function syncPlan() {
    $$('.in-plan').forEach((b) => { const on = b.dataset.plan === st.plan; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); b.querySelector('.in-plan-pick').textContent = on ? '✓ Seleccionado' : 'Elegir este plan'; });
    $('#in-premium').hidden = st.plan !== 'premium';
    $('#in-pay').hidden = !(st.plan === 'membership' || st.plan === 'premium');
    summary();
  }
  function syncChips() {
    $$('.in-chip').forEach((b) => { const g = b.dataset.g, v = b.dataset.v; const on = g === 'days' ? st.days.indexOf(v) >= 0 : st[g] === v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  }
  function summary() {
    const p = planOf(st.plan), el = $('#in-summary'); if (!el) return;
    el.innerHTML = p ? `Plan elegido: <b>${esc(p.name)}</b> · ${esc(p.price)}${esc(p.per || '')}` : 'Aún no has elegido un plan.';
  }

  /* ---------------- validación y envío ---------------- */
  function data() {
    const v = (id) => ($('#in-' + id) ? $('#in-' + id).value.trim() : '');
    const premium = st.plan === 'premium', paid = premium || st.plan === 'membership';
    return { first: v('first'), last: v('last'), email: v('email'), whatsapp: v('whatsapp'), birth: v('birth'), city: v('city'), plan: st.plan, level: st.level,
      schedule: premium ? st.schedule : '', days: premium ? DAYS.filter((d) => st.days.indexOf(d) >= 0).join(', ') : '', payment: paid ? v('payment') : '', source: st.source, comments: v('comments') };
  }
  function validate(d) {
    let first = null;
    const bad = (id, ok) => { const el = $('#in-' + id); const er = el.closest('.in-f').querySelector('.in-err'); er.hidden = ok; el.classList.toggle('in-bad', !ok); if (!ok && !first) first = el; };
    if (!d.plan) { $('#err-plan').hidden = false; first = first || $('.in-plans'); }
    bad('first', d.first.length >= 2); bad('last', d.last.length >= 2);
    bad('email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email));
    bad('whatsapp', d.whatsapp.replace(/\D/g, '').length >= 7);
    bad('birth', /^\d{4}-\d{2}-\d{2}$/.test(d.birth) && d.birth <= isoToday() && d.birth >= '1930-01-01');
    bad('city', d.city.length >= 2);
    const ok = $('#in-ok').checked; $('#err-ok').hidden = ok; if (!ok && !first) first = $('#in-ok');
    if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (first.focus) setTimeout(() => first.focus({ preventScroll: true }), 300); }
    return !first;
  }
  function waText(d) {
    const p = planOf(d.plan);
    return ['¡Hola! Quiero inscribirme en mrarrieta.com 🙌', '', `• Plan: ${p ? p.name : d.plan}`, `• Nombre: ${d.first} ${d.last}`, `• Correo: ${d.email}`, `• WhatsApp: ${d.whatsapp}`, `• Nacimiento: ${d.birth}`, `• Ciudad: ${d.city}`,
      d.level && `• Nivel: ${d.level}`, d.schedule && `• Horario: ${d.schedule}`, d.days && `• Días: ${d.days}`, d.payment && `• Pago: ${d.payment}`, d.source && `• Nos conoció por: ${d.source}`, d.comments && `• Comentarios: ${d.comments}`].filter(Boolean).join('\n');
  }
  async function send() {
    if (st.busy) return;
    const d = data(); if (!validate(d)) return;
    const btn = $('#in-send'); st.busy = true; btn.disabled = true; btn.textContent = 'Enviando…';
    let r = { ok: false, err: 'offline' };
    if (MR.on) { try { r = await MR.call('enroll', d); } catch (e) { r = { ok: false, err: 'network' }; } }
    st.busy = false; btn.disabled = false; btn.textContent = 'Enviar mi inscripción 🚀';
    if (r && r.ok) success(d); else fallback(d, r && r.err);
  }
  function fallback(d, err) {
    const box = document.createElement('div'); box.className = 'in-modal'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    const why = err === 'offline' ? 'En este momento el formulario no puede guardar tu inscripción en línea.' : 'No pudimos enviar tu inscripción (revisa tu conexión a internet).';
    box.innerHTML = `<div class="in-modal-card card center"><img src="mra-shrug.webp" alt="" class="in-modal-img"><h3>¡Ups! Algo no salió bien</h3>
      <p>${why} <b>No pierdas tus datos:</b> envíanoslos por WhatsApp con un clic y te inscribimos de inmediato.</p>
      <a class="btn k block" href="https://wa.me/${WA}?text=${encodeURIComponent((window.MRNE || String)(waText(d)))}" target="_blank" rel="noopener">💬 Enviar mis datos por WhatsApp</a>
      <div class="row" style="justify-content:center;margin-top:10px">${err !== 'offline' ? '<button class="btn w sm" data-a="retry">Intentar de nuevo</button>' : ''}<button class="btn w sm" data-a="close">Cerrar</button></div></div>`;
    document.body.appendChild(box);
    box.onclick = (e) => { const a = e.target.closest('[data-a]'); if (e.target === box || (a && a.dataset.a === 'close')) box.remove(); if (a && a.dataset.a === 'retry') { box.remove(); send(); } };
  }
  function success(d) {
    const p = planOf(d.plan), paid = d.plan !== 'free';
    const msg = paid ? `¡Hola! Acabo de inscribirme en mrarrieta.com con el plan ${p.name} 🙌 Mi nombre es ${d.first} ${d.last} (${d.email}). ¿Cómo activo mi plan?` : `¡Hola! Acabo de inscribirme en mrarrieta.com (Acceso gratuito) 🙌 Mi nombre es ${d.first} ${d.last} (${d.email}). Quiero mi código de acceso.`;
    app.innerHTML = `<section class="card in-done center">
      <img src="mra-celebrate.webp" alt="Mr. Arrieta celebrando" class="in-done-img" width="240" height="240">
      <span class="lbl">Inscripción recibida</span>
      <h1>¡Bienvenido(a), ${esc(d.first)}! 🎉</h1>
      <p>Recibimos tus datos para el plan <b>${esc(p.name)}</b>. Te enviamos un correo de confirmación a <b>${esc(d.email)}</b> y muy pronto te escribiremos por WhatsApp con tu <b>código de acceso</b>.</p>
      <ol class="in-next"><li><b>Recibe tu código</b> por WhatsApp.</li><li><b>Toma tu prueba de clasificación</b> y conoce tu nivel.</li><li><b>Empieza tu ruta</b> de aprendizaje${d.plan === 'premium' ? ' y reserva tus clases VIP' : ''}.</li></ol>
      <a class="btn k lg block in-wa" href="https://wa.me/${WA}?text=${encodeURIComponent((window.MRNE || String)(msg))}" target="_blank" rel="noopener">💬 ${paid ? 'Escríbenos para activar tu plan' : 'Escríbenos para recibir tu código'}</a>
      <a class="btn w block" href="index.html" style="margin-top:12px">Ir a la plataforma</a>
    </section>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    confetti();
  }
  /* confeti propio (sin dependencias) */
  function confetti() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = document.createElement('canvas'); cv.className = 'in-confetti'; document.body.appendChild(cv);
    const ctx = cv.getContext('2d'); const W = cv.width = innerWidth, H = cv.height = innerHeight;
    const cols = ['#E3242B', '#0B2A5B', '#FFD23F', '#1D5FD1', '#ffffff'];
    const ps = Array.from({ length: 160 }, () => ({ x: Math.random() * W, y: -20 - Math.random() * H * 0.5, w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, vx: -2 + Math.random() * 4, vy: 2 + Math.random() * 4, r: Math.random() * 6, vr: -0.2 + Math.random() * 0.4, c: cols[(Math.random() * cols.length) | 0] }));
    const t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, W, H);
      ps.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.strokeStyle = '#0B2A5B'; ctx.lineWidth = 1; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); });
      if (t - t0 < 3500) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }

  render();
  if (st.plan) setTimeout(() => { const el = $('.in-plan.on'); if (el && innerWidth < 700) el.scrollIntoView({ block: 'center' }); }, 200);
})();
