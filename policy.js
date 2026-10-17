// 📌 Política de reservas y cancelaciones — un solo texto para toda la plataforma
(function () {
  const HTML = `<div class="pol">
  <p class="pol-k">MRARRIETA.COM – RealTalk®</p>
  <h2 class="pol-t">Política de reservas y cancelaciones</h2>
  <p class="pol-only">Aplica para estudiantes <b>Premium</b> (4 u 8 clases al mes): las clases individuales son exclusivas de estos planes.</p>
  <section><h3>1. Reservas</h3><ul>
    <li><b>Reserva:</b> mínimo <b>4 horas</b> antes de la clase, eligiendo profe, fecha y hora desde tu perfil.</li>
    <li>Las clases de tu plan <b>no son acumulables</b>: úsalas dentro de tu periodo mensual; las que no uses se vencen y no se recuperan.</li>
    <li>Las <b>clases adicionales</b> que compres valen solo dentro de tu plan vigente.</li></ul></section>
  <section><h3>2. Cancelaciones</h3><ul>
    <li><b>Cancelación sin penalización:</b> mínimo <b>2 horas</b> antes de la clase. La clase vuelve a tu saldo.</li>
    <li><b>Cancelación tardía o inasistencia:</b> la clase se descuenta de tu plan y no será repuesta.</li></ul></section>
  <section><h3>3. Si tu profe no se conecta</h3><ul>
    <li>Puedes reportarlo desde tu perfil apenas empiece la clase y hasta 24 horas después.</li>
    <li>Administración lo revisa en máximo 24 horas y, si se confirma, <b>la clase vuelve a tu saldo</b>.</li></ul></section>
  <section><h3>4. Horario de la escuela</h3><p><b>Lunes a viernes:</b> 7:00 a. m. a 9:00 p. m. (jornada continua) · <b>Sábados:</b> 7:00 a. m. a 5:00 p. m. · <b>Domingos y festivos de Colombia:</b> no hay clases ni atención por chat. (Hora Colombia)</p></section>
  <section><h3>5. Duración de las clases</h3><p>Todas las clases individuales duran <b>50 minutos</b>.</p></section>
  <section><h3>6. Cancelaciones por parte de MRARRIETA.COM</h3>
    <p>Si MRARRIETA.COM cancela una clase, esta será reprogramada sin costo para el estudiante.</p></section>
  <p class="pol-imp"><b>Importante:</b> los tiempos mínimos de reserva y cancelación se cuentan hacia atrás desde la hora de inicio de cada clase.</p>
</div>`;
  function show(opts) {
    opts = opts || {};
    const m = document.createElement('div'); m.className = 'modal pol-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<div class="modal-card card pol-card">${opts.first ? '<p class="pol-first">👋 Antes de empezar, lee nuestra política. La encuentras siempre en tu perfil.</p>' : ''}${HTML}<button class="btn k block lg" id="pol-ok">${opts.first ? '✅ Entendido, acepto' : 'Cerrar'}</button></div>`;
    document.body.appendChild(m);
    const close = () => { m.remove(); opts.onClose && opts.onClose(); };
    m.querySelector('#pol-ok').onclick = close;
    if (!opts.first) m.addEventListener('click', e => { if (e.target === m) close(); });
    return m;
  }
  window.MRPOLICY = { html: HTML, show, url: 'politica.html' };
})();
