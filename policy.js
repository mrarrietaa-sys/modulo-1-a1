// 📌 Política de reservas y cancelaciones — un solo texto para toda la plataforma
(function () {
  const HTML = `<div class="pol">
  <p class="pol-k">MRARRIETA.COM – RealTalk®</p>
  <h2 class="pol-t">📌 Política de reservas y cancelaciones</h2>
  <p class="pol-only">Aplica para estudiantes <b>Premium</b>: las clases VIP y las clases grupales son exclusivas de este plan.</p>
  <section><h3>1. Clases VIP</h3><ul>
    <li><b>Reserva:</b> mínimo <b>4 horas</b> antes de la clase.</li>
    <li><b>Cancelación sin penalización:</b> mínimo <b>2 horas</b> antes de la clase.</li>
    <li><b>Cancelación tardía o inasistencia:</b> la clase se descontará del paquete y no será repuesta.</li></ul></section>
  <section><h3>2. Clases grupales</h3><ul>
    <li><b>Reserva tu cupo:</b> en <b>Mis próximas clases</b>, mínimo <b>3 horas</b> antes de la clase.</li>
    <li><b>Cancelaciones:</b> puedes cancelar hasta <b>2 horas</b> antes de la clase.</li>
    <li><b>Cancelación tardía o inasistencia:</b> no recibirás ninguna penalización ni perderás el acceso a futuras clases grupales.</li></ul></section>
  <section><h3>3. Acceso y cupos de clases grupales</h3><ul>
    <li><b>Clases grupales ilimitadas:</b> asiste a todas las clases grupales de tu nivel que quieras, sin límite mensual, mientras tu plan <b>Premium</b> esté activo.</li>
    <li><b>Cupo máximo:</b> cada sesión admite máximo <b>10 estudiantes</b>; si se llena, se cierran las reservas y deberás elegir otro horario disponible de tu nivel.</li>
    <li>Es <b>obligatorio reservar con anticipación</b> para asistir a las clases grupales.</li></ul></section>
  <section><h3>4. Duración de las clases</h3><p>Todas las clases de la escuela (VIP y grupales) duran <b>50 minutos</b>.</p></section>
  <section><h3>5. Cancelaciones por parte de MRARRIETA.COM</h3>
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
