/* =====================================================================
   EXAMEN FINAL DEL CURSO — se habilita al aprobar los 4 módulos (A1, A2, B2, B2+)
   ===================================================================== */
(function () {
  const M = window.M1, P = window.MRAP, C = window.M1CONFIG;
  const { $, esc } = M; const app = $('#app');
  const REQ = ['A1', 'A2', 'B2', 'B2+'];
  function topbar() {
    $('#topbar').innerHTML = `<div class="brand" id="go-home"><span class="logo-pill"><img class="logo" src="mra-brand.png" alt="mrarrieta.com"></span></div><div class="sp"></div><span class="tb-tag">EXAMEN FINAL DEL CURSO</span><a class="iconbtn" href="index.html" title="Mi perfil">👤</a>`;
    $('#go-home').onclick = () => location.href = 'index.html';
  }
  const route = () => { location.href = 'index.html'; };
  function lockedView() {
    app.innerHTML = `<div class="wrap"><div class="card center" style="max-width:640px;margin:20px auto">${M.mascot('mascot', 'pointside')}
      <h2>🔒 Examen final del curso</h2><p style="font-size:17px">Se habilita cuando apruebes el <b>examen final de los 4 módulos</b> de tu ruta de aprendizaje.</p>
      <div class="cx-list">${REQ.map(id => { const m = P.mod(id); const ok = P.passed(id); return `<div class="cx-row ${ok ? 'ok' : ''}"><b>${ok ? '✅' : '⏳'}</b><span>${esc(m.name)} · ${esc(m.id)}</span><small>${ok ? 'Aprobado' : 'Pendiente'}</small></div>`; }).join('')}</div>
      <a class="btn k lg" style="text-decoration:none;margin-top:12px" href="index.html">← Volver a mi ruta</a></div></div>`;
  }
  function boot() {
    topbar();
    const p = P.get(); if (!p) { location.href = 'index.html'; return; }
    const open = p.type === 'staff' || REQ.every(id => P.passed(id));
    if (!open) return lockedView();
    if (location.hash === '#cert' && M.S.final && M.S.final.passed) return window.M1FINAL.certificate(app, { route });
    window.M1FINAL.run(app, { route, after: () => { } });
  }
  boot();
})();
