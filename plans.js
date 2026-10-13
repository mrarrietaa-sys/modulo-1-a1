/* =====================================================================
   PLANES — Acceso gratuito · Membership · Premium (tarjetas y avisos)
   La plataforma es el centro; las clases con profes son un beneficio extra.
   ===================================================================== */
(function () {
  const C = window.M1CONFIG || {};
  const PL = Object.assign({ membership: { name: 'Membership', price: '$59.900', per: '/mes' }, premium: { name: 'Premium', price: '$349.000', per: '/mes' } }, C.PLANS || {});
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const prof = () => (window.MRAP && MRAP.get()) || {};
  const WA = (t) => `https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent(t)}`;
  const who = () => { const p = prof(); return (p.name || p.first || '') + (p.code ? ` (código ${p.code})` : ''); };
  const BEN = {
    free: ['Prueba de clasificación', 'Tu nivel y tu ruta de aprendizaje', 'Los 2 primeros temas de tu módulo'],
    membership: ['Toda la plataforma desbloqueada', 'Ruta completa A1 → A2 → B2 → B2+', 'Actividades, juegos, audios y materiales', 'Progreso guardado en la nube', 'Exámenes y certificados'],
    premium: ['Todo lo de Membership', '2 clases VIP al mes (tú eliges profe, fecha y hora)', 'Clases grupales (clubs) en vivo de tu nivel, sin límite mensual (máx. 10 estudiantes por sesión)', '⚠️ Clases no acumulables: resérvalas durante la vigencia de tu plan'],
  };
  const waMsg = (k, renew) => `¡Hola! 👋 Soy ${who() || 'un estudiante'}. Quiero ${renew ? 'renovar' : 'activar'} el plan ${PL[k].name} (${PL[k].price}${PL[k].per}) en la plataforma de mrarrieta.com 🚀`;
  function card(k, opt) {
    opt = opt || {}; const p = PL[k]; const cur = opt.current === k;
    return `<div class="pl-card ${k}${cur ? ' cur' : ''}">${k === 'premium' ? '<span class="pl-rib">👑 Más completo</span>' : ''}
      <h3>${k === 'premium' ? '👑' : '⭐'} ${esc(p.name)}</h3><div class="pl-price"><b>${esc(p.price)}</b><small>${esc(p.per)}</small></div>
      <p class="pl-tag">${k === 'premium' ? 'Plataforma + clases VIP + clubs en vivo' : 'Plataforma + tu ruta de aprendizaje'}</p>
      <ul>${BEN[k].map(b => `<li>${esc(b)}</li>`).join('')}</ul>
      ${cur && !opt.renew ? '<div class="pl-on">✅ Tu plan actual</div>' : `<a class="btn ${k === 'premium' ? 'k' : 'w'} block pl-go" target="_blank" rel="noopener" href="${WA(waMsg(k, opt.renew && cur))}">${opt.renew && cur ? '🔁 Renovar' : 'Quiero ' + esc(p.name)} →</a>`}</div>`;
  }
  // tarjetas para mejorar el plan (muestra solo las superiores al plan actual)
  function cards(current, renew) {
    const ks = current === 'premium' ? (renew ? ['premium'] : []) : current === 'membership' ? (renew ? ['membership', 'premium'] : ['premium']) : ['membership', 'premium'];
    if (!ks.length) return '';
    return `<div class="pl-grid n${ks.length}">${ks.map(k => card(k, { current, renew })).join('')}</div><p class="pl-note">💳 Pagas por transferencia o Nequi y administración activa tu plan el mismo día. Escríbenos por WhatsApp. <a href="politica.html" target="_blank" rel="noopener">📌 Política de reservas y cancelaciones</a></p>`;
  }
  // aviso cuando el contenido está bloqueado (fin del acceso gratuito o plan vencido)
  function modal(M, why) {
    const pl = window.MRAP && MRAP.plan ? MRAP.plan() : {};
    const exp = pl.expired;
    const m = M.modal(`<div class="center">${M.mascot('mascot', 'present')}</div>
      <h3 class="center">${exp ? '⏰ Tu plan venció' : '🔓 Desbloquea toda tu ruta'}</h3>
      <p class="center" style="font-size:16.5px">${exp ? `Tu plan <b>${esc(PL[pl.plan] ? PL[pl.plan].name : '')}</b> venció${pl.end ? ' el ' + new Date(pl.end + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }) : ''}. <b>Tu progreso sigue guardado</b>: renueva y continúa justo donde ibas.` : (why || 'Tu acceso gratuito incluye los <b>2 primeros temas</b> de tu ruta. Activa tu plan y sigue aprendiendo con todos los temas, exámenes y certificados 🎓')}</p>
      ${cards(exp ? pl.plan : 'free', exp)}<button class="btn w block" style="margin-top:8px" id="pl-cl">Seguir explorando</button>`, { x: true });
    const b = m.querySelector('#pl-cl'); if (b) b.onclick = () => m.remove();
    return m;
  }
  function badge() { const pl = window.MRAP && MRAP.plan ? MRAP.plan() : {}; if (pl.eff === 'staff') return '👨‍🏫 Profe'; if (pl.expired) return '⏰ Plan vencido'; return { premium: '👑 Premium', membership: '⭐ Membership', free: '🟢 Acceso gratuito', legacy: '🎓 Estudiante' }[pl.eff] || '🟢 Acceso gratuito'; }
  window.MRPLANS = { PL, BEN, card, cards, modal, badge, WA, waMsg };
})();
