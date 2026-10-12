/* =====================================================================
   FESTIVOS DE COLOMBIA + DOMINGOS (días sin clases en mrarrieta.com)
   window.MRFEST.isOff('2026-10-12') → true · MRFEST.name(d) → 'Día de la Raza'
   Ley Emiliani: algunos festivos se pasan al lunes siguiente.
   ===================================================================== */
(function () {
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  const add = (d, n) => new Date(d.getTime() + n * 864e5);
  function easter(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return new Date(Date.UTC(y, mo - 1, da)); }
  const toMon = d => { const w = d.getUTCDay(); return w === 1 ? d : add(d, (8 - w) % 7); };
  const cache = {};
  function year(y) {
    if (cache[y]) return cache[y]; const H = {}; const D = (m, d) => new Date(Date.UTC(y, m - 1, d)); const E = easter(y);
    [[D(1, 1), 'Año Nuevo'], [D(5, 1), 'Día del Trabajo'], [D(7, 20), 'Día de la Independencia'], [D(8, 7), 'Batalla de Boyacá'], [D(12, 8), 'Inmaculada Concepción'], [D(12, 25), 'Navidad'],
     [add(E, -3), 'Jueves Santo'], [add(E, -2), 'Viernes Santo']].forEach(([d, n]) => H[iso(d)] = n);
    [[D(1, 6), 'Reyes Magos'], [D(3, 19), 'San José'], [D(6, 29), 'San Pedro y San Pablo'], [D(8, 15), 'Asunción de la Virgen'], [D(10, 12), 'Día de la Raza'], [D(11, 1), 'Todos los Santos'], [D(11, 11), 'Independencia de Cartagena'],
     [add(E, 39), 'Ascensión del Señor'], [add(E, 60), 'Corpus Christi'], [add(E, 68), 'Sagrado Corazón']].forEach(([d, n]) => H[iso(toMon(d))] = n);
    return (cache[y] = H);
  }
  function name(s) { s = String(s || '').slice(0, 10); const y = +s.slice(0, 4); return y ? (year(y)[s] || '') : ''; }
  function isSunday(s) { return new Date(String(s).slice(0, 10) + 'T12:00:00Z').getUTCDay() === 0; }
  function isOff(s) { return isSunday(s) || !!name(s); }
  function why(s) { return name(s) ? 'festivo (' + name(s) + ')' : isSunday(s) ? 'domingo' : ''; }
  window.MRFEST = { isOff, name, why, year };
})();
