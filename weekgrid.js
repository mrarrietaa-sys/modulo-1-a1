/* =====================================================================
   CUADRÍCULA DE DISPONIBILIDAD SEMANAL (lunes a sábado, por horas)
   MRWG.render(el, value, opts) → { get(), set(v) }
   value = { "1": ["07:00", "08:00"], ..., "6": [...] }  (1 = lunes … 6 = sábado)
   ===================================================================== */
(function () {
  const DAYS = [['1', 'Lun', 'Lunes'], ['2', 'Mar', 'Martes'], ['3', 'Mié', 'Miércoles'], ['4', 'Jue', 'Jueves'], ['5', 'Vie', 'Viernes'], ['6', 'Sáb', 'Sábado']];
  const HOURS = []; for (let h = 7; h <= 20; h++) HOURS.push((h < 10 ? '0' : '') + h + ':00');
  const SAT_MAX = '16:00';
  const h12 = (t) => { const h = +t.slice(0, 2); return ((h + 11) % 12 + 1) + ':00 ' + (h < 12 ? 'AM' : 'PM'); };
  const ok = (d, t) => !(d === '6' && t > SAT_MAX);
  let css = false;
  function addCss() {
    if (css) return; css = true; const st = document.createElement('style');
    st.textContent = `.wg{overflow-x:auto;-webkit-overflow-scrolling:touch;border:3px solid #0B2A5B;border-radius:14px;background:#fff}
.wg table{border-collapse:collapse;width:100%;min-width:300px;font-family:Inter,system-ui,sans-serif}
.wg th{background:#E3242B;color:#fff;font:800 13px Poppins,sans-serif;padding:7px 2px;cursor:pointer;user-select:none;border-left:2px solid #0B2A5B}
.wg th:first-child{background:#0B2A5B;cursor:default;border-left:0}
.wg td{border-top:1px solid #d6dde8;border-left:2px solid #0B2A5B;text-align:center;padding:0}
.wg td.h{font-weight:700;font-size:12px;color:#0B2A5B;white-space:nowrap;padding:0 6px;border-left:0;background:#f3f6fb}
.wg button{width:100%;height:30px;border:0;background:#f7f9fc;cursor:pointer;font-size:16px;color:#0B2A5B}
.wg button.on{background:#0B2A5B;color:#fff}.wg button.on::after{content:"✓";font-weight:900}
.wg button:disabled{background:#e9edf3;cursor:not-allowed}
.wg-tools{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;align-items:center;font-size:13px;color:#4a5568}
.wg-tools button{border:2px solid #0B2A5B;background:#fff;color:#0B2A5B;border-radius:10px;padding:4px 10px;font:700 13px Inter,sans-serif;cursor:pointer}
.wg-sum{font-size:13px;color:#0B2A5B;margin-top:6px}`;
    document.head.appendChild(st);
  }
  function render(el, value, opts) {
    addCss(); opts = opts || {};
    const v = {}; DAYS.forEach(([d]) => v[d] = ((value && value[d]) || []).filter(t => HOURS.includes(t) && ok(d, t)));
    el.innerHTML = `<div class="wg-tools"><span>Toca las horas en que estás disponible (hora Colombia). Toca el día para marcarlo completo.</span><button type="button" data-a="wk">Lun–Vie igual al lunes</button><button type="button" data-a="clr">Borrar todo</button></div>
      <div class="wg"><table><thead><tr><th>Hora</th>${DAYS.map(([d, s, l]) => `<th data-d="${d}" title="Marcar todo el ${l}">${s}</th>`).join('')}</tr></thead>
      <tbody>${HOURS.map(t => `<tr><td class="h">${h12(t)}</td>${DAYS.map(([d, , l]) => `<td><button type="button" data-d="${d}" data-t="${t}" aria-label="${l} ${h12(t)}" ${ok(d, t) ? '' : 'disabled'} class="${v[d].includes(t) ? 'on' : ''}"></button></td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="wg-sum"></div>`;
    const sum = () => { const n = DAYS.reduce((a, [d]) => a + v[d].length, 0); el.querySelector('.wg-sum').textContent = n ? `✅ ${n} hora${n > 1 ? 's' : ''} disponible${n > 1 ? 's' : ''} por semana` : 'Aún no marcas ninguna hora.'; opts.onChange && opts.onChange(get()); };
    const paint = () => el.querySelectorAll('tbody button').forEach(b => b.classList.toggle('on', v[b.dataset.d].includes(b.dataset.t)));
    el.querySelectorAll('tbody button').forEach(b => b.onclick = () => { const d = b.dataset.d, t = b.dataset.t, i = v[d].indexOf(t); i >= 0 ? v[d].splice(i, 1) : v[d].push(t); b.classList.toggle('on', i < 0); sum(); });
    el.querySelectorAll('th[data-d]').forEach(th => th.onclick = () => { const d = th.dataset.d, all = HOURS.filter(t => ok(d, t)); v[d] = v[d].length === all.length ? [] : all.slice(); paint(); sum(); });
    el.querySelector('[data-a=wk]').onclick = () => { ['2', '3', '4', '5'].forEach(d => v[d] = v['1'].slice()); paint(); sum(); };
    el.querySelector('[data-a=clr]').onclick = () => { DAYS.forEach(([d]) => v[d] = []); paint(); sum(); };
    function get() { const o = {}; DAYS.forEach(([d]) => { if (v[d].length) o[d] = v[d].slice().sort(); }); return o; }
    sum();
    return { get, count: () => DAYS.reduce((a, [d]) => a + v[d].length, 0) };
  }
  // resumen de texto: "Lun 7:00 AM–12:00 PM, 2:00 PM–6:00 PM; Mar …"
  function summary(w) {
    return DAYS.filter(([d]) => w && w[d] && w[d].length).map(([d, s]) => {
      const hs = w[d].slice().sort().map(t => +t.slice(0, 2)); const rs = []; let a = hs[0], b = hs[0];
      for (let i = 1; i <= hs.length; i++) { if (hs[i] === b + 1) b = hs[i]; else { rs.push(h12((a < 10 ? '0' : '') + a + ':00') + '–' + h12(((b + 1) < 10 ? '0' : '') + (b + 1) + ':00')); a = b = hs[i]; } }
      return s + ' ' + rs.join(', ');
    }).join('; ');
  }
  window.MRWG = { render, summary, DAYS, HOURS };
})();
