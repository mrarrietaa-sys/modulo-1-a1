/* =====================================================================
   💳 COMPRAS desde el perfil: membresías y clases adicionales
   · Tarjeta → Mercado Pago (se confirma solo y se habilita de una)
   · Transferencia (Nequi / Llave Breve-B) → sube el comprobante → administración aprueba → se habilita de una
   ===================================================================== */
(function () {
  const M = new Proxy({}, { get: (o, k) => (window.M1 || {})[k] }); // core.js carga después
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const PLS = () => window.MRPLANS || {}; const fmt = (n) => (PLS().fmt || String)(n);
  const ERR = { ref: 'El código de referido no es válido.', mp_off: 'El pago con tarjeta aún no está activo. Usa transferencia o escríbenos por WhatsApp.', mp_error: 'Mercado Pago no respondió. Inténtalo de nuevo en un momento.', proof: 'Adjunta la foto o el PDF de tu comprobante.', big: 'El archivo es muy pesado (máx. 8 MB).', too_many: 'Ya tienes comprobantes pendientes por revisar. Espera la aprobación.', not_premium: 'Las clases adicionales son para planes Premium activos.', plan: 'Plan no válido.' };
  const CODE = () => (window.MRAC && MRAC.code && MRAC.code()) || window.__buyCode || (() => { try { return localStorage.getItem('mra_buy_code') || ''; } catch (e) { return ''; } })();
  let catOk = false;
  async function cat() { if (catOk) return; try { const r = await MRAC.call('plans', {}); if (r && r.ok) { PLS().applyCat && PLS().applyCat(r.cat); window.__mpOn = !!r.mp; catOk = true; } } catch (e) { } }
  function payBlock(id) {
    return `<div class="by-pay"><p class="by-st"><b>¿Cómo quieres pagar?</b></p>
      <button class="btn k block lg by-paybtn" data-m="mp" id="${id}-mp">${MRI('card')}<span><b>Pagar con tarjeta</b><small>Mercado Pago · débito o crédito</small></span></button>
      <p class="muted center" style="font-size:13px;margin:4px 0 10px">Se habilita apenas se apruebe el pago</p>
      <button class="btn w block by-paybtn" data-m="tr" id="${id}-tr">${MRI('bank')}<span><b>Pagar por transferencia</b><small>Nequi o Llave (Breve-B)</small></span></button>
      <div class="by-tr hidden" id="${id}-trbox"><div class="by-acc"><b>Paga en cualquiera de estas cuentas:</b><div><span>NEQUI</span><b>3017810841</b></div><div><span>LLAVE (BREVE-B)</span><b>1047374279</b></div></div>
        <label class="by-file" for="${id}-file">${MRI('clip')}<span id="${id}-fn">Adjunta tu comprobante de pago</span><small>Foto o PDF</small></label><input type="file" id="${id}-file" accept="image/*,application/pdf" class="by-filein">
        <button class="btn k block lg" id="${id}-send" style="margin-top:10px">${MRI('send')} Enviar comprobante</button>
        <p class="muted center" style="font-size:13px">Administración lo revisa y, al aprobarlo, se habilita de inmediato en tu perfil.</p></div></div>`;
  }
  function readFile(f) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); }); }
  async function shrink(f) { // fotos grandes → JPG de máx. 1600 px (los PDF se envían tal cual)
    if (!/^image\//.test(f.type)) return { data: await readFile(f), mime: f.type || 'application/pdf', name: f.name };
    const url = await readFile(f); const img = new Image(); await new Promise(r => { img.onload = r; img.onerror = r; img.src = url; });
    const sc = Math.min(1, 1600 / Math.max(img.width || 1, img.height || 1)); const c = document.createElement('canvas'); c.width = Math.round(img.width * sc) || 1; c.height = Math.round(img.height * sc) || 1;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return { data: c.toDataURL('image/jpeg', .85), mime: 'image/jpeg', name: (f.name || 'comprobante').replace(/\.\w+$/, '') + '.jpg' };
  }
  function wire(m, id, payload) {
    m.querySelector(`#${id}-mp`).onclick = async (e) => { const b = e.currentTarget; b.disabled = true; b.textContent = '⏳ Abriendo Mercado Pago…';
      const r = await MRAC.call('buyStart', Object.assign({ code: CODE(), method: 'mp' }, payload)).catch(() => ({ ok: false }));
      if (r && r.ok && r.url) { try { localStorage.setItem('mra_buy_last', r.id); localStorage.setItem('mra_buy_code', CODE()); } catch (er) { } location.href = r.url; return; }
      b.disabled = false; b.innerHTML = MRI('card') + '<span><b>Pagar con tarjeta</b><small>Mercado Pago · débito o crédito</small></span>'; M.toast(ERR[r && r.err] || 'No se pudo iniciar el pago.'); };
    m.querySelector(`#${id}-tr`).onclick = () => m.querySelector(`#${id}-trbox`).classList.remove('hidden');
    m.querySelector(`#${id}-file`).onchange = (e) => { const f = e.target.files[0]; const l = m.querySelector(`#${id}-fn`); l.textContent = f ? f.name : 'Adjunta tu comprobante de pago'; l.parentNode.classList.toggle('on', !!f); };
    m.querySelector(`#${id}-send`).onclick = async (e) => { const f = m.querySelector(`#${id}-file`).files[0]; if (!f) return M.toast(ERR.proof);
      const b = e.currentTarget; b.disabled = true; b.textContent = '⏳ Enviando…';
      let file; try { file = await shrink(f); } catch (er) { b.disabled = false; b.innerHTML = MRI('send') + ' Enviar comprobante'; return M.toast('No se pudo leer el archivo.'); }
      const r = await MRAC.call('buyStart', Object.assign({ code: CODE(), method: 'tr', data: file.data, mime: file.mime, fname: file.name }, payload)).catch(() => ({ ok: false }));
      if (!r || !r.ok) { b.disabled = false; b.innerHTML = MRI('send') + ' Enviar comprobante'; return M.toast(ERR[r && r.err] || 'No se pudo enviar. Revisa tu conexión.'); }
      m.querySelector('.card').innerHTML = `<div class="center">${M.mascot('mascot', 'thumbs')}</div><h3 class="center">¡Recibimos tu comprobante!</h3><p class="center" style="font-size:16px">Administración lo revisará pronto. <b>Apenas lo apruebe, se habilita de inmediato</b> en tu perfil y te avisamos en la campanita 🔔 y por correo.</p><button class="btn k block" id="by-x">Entendido</button>`;
      m.querySelector('#by-x').onclick = () => m.remove(); };
  }
  async function plan(k) {
    await cat(); const p = (PLS().PL || {})[k]; if (!p) return; const nm = (PLS().noEmo || String)(p.name);
    const m = M.modal(`<h3 class="by-h">${MRI('card')} ${esc(nm)}</h3>
      <table class="by-sum"><tr><td>Plan</td><td><b>${esc(nm)}</b></td></tr><tr><td>Precio</td><td><b>${esc(p.price)}</b> COP</td></tr><tr><td>Periodicidad</td><td>Mensual (se renueva solo si vuelves a pagar)</td></tr>
        <tr><td>Clases incluidas</td><td>${p.classes ? p.classes + ' clases individuales de 50 minutos por mes' : 'No incluye clases individuales'}</td></tr><tr id="by-disc" class="hidden"><td>Descuento referido</td><td id="by-dv"></td></tr><tr><td><b>Total a pagar</b></td><td><b id="by-tot">${esc(p.price)} COP</b></td></tr></table>
      <div class="${firstBuy() ? '' : 'hidden'}"><label class="ad-lab" style="display:block;margin-top:8px"><b>¿Te recomendó un amigo?</b> Código de referido (opcional)</label><div class="by-ref"><input class="inp" id="by-ref" placeholder="Ej.: LAURA-123" value="${esc(refSaved())}"><button class="btn w" id="by-refok">Aplicar</button></div><p class="muted" id="by-refmsg" style="font-size:13px;margin:0 0 6px"></p></div>
      ${p.classes ? '<p class="muted" style="font-size:13.5px">Las clases incluidas son del periodo mensual y no se acumulan. Reserva con mínimo 4 horas de anticipación; cancela gratis hasta 2 horas antes.</p>' : ''}
      ${payBlock('bp')}`, { x: true });
    const pay = { kind: 'plan', plan: k }; wire(m, 'bp', pay);
    const apply = async () => { const v = m.querySelector('#by-ref').value.trim().toUpperCase(), msg = m.querySelector('#by-refmsg');
      if (!v) { delete pay.ref; m.querySelector('#by-disc').classList.add('hidden'); m.querySelector('#by-tot').textContent = fmt(p.n) + ' COP'; msg.textContent = ''; return; }
      msg.textContent = '⏳ Revisando…'; const r = await MRAC.call('refCheck', { code: CODE(), ref: v }).catch(() => null);
      if (r && r.ok) { const d = Math.round(p.n * r.pct / 100 / 100) * 100; pay.ref = v; m.querySelector('#by-disc').classList.remove('hidden'); m.querySelector('#by-dv').textContent = '−' + fmt(d) + ' COP (' + r.pct + '%)'; m.querySelector('#by-tot').textContent = fmt(p.n - d) + ' COP'; msg.innerHTML = '✅ Código de <b>' + esc(r.name) + '</b> aplicado. Paga el total con descuento.'; }
      else { delete pay.ref; m.querySelector('#by-disc').classList.add('hidden'); m.querySelector('#by-tot').textContent = fmt(p.n) + ' COP'; msg.textContent = '⚠️ Código no válido. El descuento aplica solo en tu primer mes y no con tu propio código.'; } };
    m.querySelector('#by-refok').onclick = apply; if (refSaved() && firstBuy()) apply();
    else MRAC.call('myCoupon', { code: CODE() }).then(r => { if (!r || !r.pct || pay.ref) return; const d = Math.round(p.n * r.pct / 100 / 100) * 100; m.querySelector('#by-disc').classList.remove('hidden'); m.querySelector('#by-disc td').textContent = r.why || 'Descuento'; m.querySelector('#by-dv').textContent = '−' + fmt(d) + ' COP (' + r.pct + '%)'; m.querySelector('#by-tot').textContent = fmt(p.n - d) + ' COP'; const f = m.querySelector('#by-ref'); if (f) f.closest('div.by-ref').parentNode.classList.add('hidden'); }).catch(() => { });
  }
  function firstBuy() { const q = (window.MRAP && MRAP.get()) || {}; return !q.planStart; }
  function refSaved() { try { return localStorage.getItem('mra_ref') || ''; } catch (e) { return ''; } }
  async function extra(cycleEnd) {
    await cat(); const unit = PLS().extra ? PLS().extra() : 39900;
    const m = M.modal(`<h3 class="by-h">${MRI('plus')} Clases individuales adicionales</h3>
      <p class="muted">Cada clase dura 50 minutos y se reserva igual que las de tu plan.</p>
      <div class="by-qty"><span>Cantidad de clases</span><div class="by-step"><button type="button" id="bq-m" aria-label="Quitar una">${MRI('minus')}</button><b id="bq-n">1</b><button type="button" id="bq-p" aria-label="Agregar una">${MRI('plus')}</button></div></div>
      <table class="by-sum"><tr><td>Precio por clase</td><td><b>${fmt(unit)}</b> COP</td></tr><tr><td>Cantidad</td><td id="bq-c">1</td></tr><tr><td><b>Total</b></td><td><b id="bq-t">${fmt(unit)}</b> COP</td></tr>
        <tr><td>Vigencia</td><td>Dentro de tu plan vigente${cycleEnd ? ' (hasta el ' + new Date(cycleEnd + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }) + ')' : ''}. No acumulables.</td></tr></table>
      <p class="muted" style="font-size:13.5px">Comprar clases adicionales no cambia ni renueva tu membresía. Se suman a tu saldo solo cuando el pago queda confirmado.</p>
      ${payBlock('bx')}`, { x: true });
    let n = 1; const pay = { kind: 'extra', n: 1 };
    const upd = () => { m.querySelector('#bq-n').textContent = n; m.querySelector('#bq-c').textContent = n; m.querySelector('#bq-t').textContent = fmt(unit * n); pay.n = n; };
    m.querySelector('#bq-m').onclick = () => { n = Math.max(1, n - 1); upd(); }; m.querySelector('#bq-p').onclick = () => { n = Math.min(10, n + 1); upd(); };
    wire(m, 'bx', pay);
  }
  // al volver de Mercado Pago (index.html?compra=ID): confirmar el pago y habilitar de una
  async function back() {
    const q = new URLSearchParams(location.search); const id = q.get('compra'); if (!id || !window.MRAC || !CODE()) return;
    history.replaceState(null, '', location.pathname);
    const w = M.modal(`<div class="center">${M.mascot('mascot', 'watch')}</div><h3 class="center">⏳ Confirmando tu pago…</h3><p class="center muted">Un momento, estamos verificando con Mercado Pago.</p>`, {});
    let st = 'pendiente', mv = false;
    for (let i = 0; i < 6 && st === 'pendiente'; i++) { const r = await MRAC.call('buyCheck', { code: CODE(), id }).catch(() => null); st = r && r.ok ? r.status : st; if (r && r.moved) mv = true; if (st === 'pendiente') await M.sleep(3000); }
    w.remove();
    if (st === 'aprobado') { try { sessionStorage.removeItem('mra_me_cache'); } catch (e) { } M.confetti && M.confetti(1800);
      const m = M.modal(`<div class="center">${M.mascot('mascot bounce', 'celebrate')}</div><h3 class="center">🎉 ¡Pago confirmado!</h3><p class="center" style="font-size:16px">Ya está todo habilitado.${mv ? ' Te enviamos tu <b>código de acceso nuevo</b> a tu correo: entra con ese.' : MRAC.code() ? '' : /^PG-/.test(CODE()) ? ' Te enviamos tu código de acceso a tu correo.' : ' Ingresa con tu código <b>' + esc(CODE()) + '</b>.'}</p><button class="btn k block lg" id="by-ok">¡Vamos!</button>`, { x: true });
      m.querySelector('#by-ok').onclick = () => { if (mv && window.MRAC && MRAC.code()) { try { MRAC.wipeLocal(true); localStorage.removeItem('mra_profile_v1'); localStorage.removeItem('mra_buy_code'); sessionStorage.removeItem('mra_me_cache'); } catch (e) { } } location.href = 'index.html'; }; return; }
    M.modal(`<h3 class="center">${st === 'pendiente' ? '⏳ Tu pago está en proceso' : '⚠️ El pago no se completó'}</h3><p class="center">${st === 'pendiente' ? 'Mercado Pago aún no lo confirma. Apenas lo haga, se habilita solo (lo revisamos cada hora) y te avisamos.' : 'No se realizó el cobro. Puedes intentarlo de nuevo o pagar por transferencia.'}</p>`, { x: true });
  }
  window.MRBUY = { plan, extra, back };
  setTimeout(back, 1500);
})();
