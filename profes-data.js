/* 👩‍🏫 Profes que aparecen en la página de entrada (agregar o quitar aquí) */
window.MRPROFES = [
  { name: 'Natalia López', title: 'Mrs.', img: 'prof-natalia.jpg', info: ['Licenciada en lengua inglesa', 'Amplia experiencia en la enseñanza del inglés'] },
  { name: 'Mayra Reyes', title: 'Mrs.', img: 'prof-mayra.jpg', info: ['Licenciada en lenguas modernas con énfasis en inglés y francés', 'Más de 3 años con nosotros'] },
  { name: 'Javier Marrugo', title: 'Mr.', img: 'prof-javier.jpg', info: ['Licenciado en lenguas modernas', 'Excelentes habilidades comunicativas'] },
  { name: 'Mirley Bolívar', title: 'Mrs.', img: 'prof-mirley.jpg', info: ['Licenciada en lenguas modernas con énfasis en inglés y francés', 'Apasionada por la enseñanza y la investigación'] },
  { name: 'Yolizeth Coneo', title: 'Mrs.', img: 'prof-yolizeth.jpg', info: ['Licenciada en educación con énfasis en inglés', 'Liderazgo y compromiso'] },
  { name: 'Jennifer Vargas', title: 'Mrs.', img: 'prof-jennifer.jpg', info: ['Licenciada con nivel C1 en todas las habilidades del idioma'] },
];
/* 📸 foto del profe por su nombre (para que el estudiante reconozca a su profe) */
window.MRPROFPIC = function (name) {
  const n = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^(mr|mrs|ms|teacher)\.?\s+/, '').trim();
  const t = n(name); if (!t) return '';
  const p = (window.MRPROFES || []).find(x => { const k = n(x.name), f = k.split(' ')[0], l = k.split(' ').slice(-1)[0]; return t === k || (t.indexOf(f) >= 0 && t.indexOf(l) >= 0) || t.split(' ')[0] === f; });
  return p ? p.img : '';
};
/* 🔄 Los profes se crean en Administración (con foto opcional) y aparecen en toda la plataforma.
   Esta lista de arriba solo se usa mientras carga o si no hay conexión. */
(function () {
  const STATIC = (window.MRPROFES || []).slice();
  const n = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^(mr|mrs|ms|teacher)\.?\s+/, '').trim();
  const byName = (name) => { const t = n(name); return STATIC.find(x => { const k = n(x.name), f = k.split(' ')[0], l = k.split(' ').slice(-1)[0]; return t === k || (t.indexOf(f) >= 0 && t.indexOf(l) >= 0) || t.split(' ')[0] === f; }); };
  const ini = (name) => { const i = String(name || '?').split(/\s+/).map(w => w[0] || '').slice(0, 2).join('').toUpperCase(); return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#0B2A5B"/><text x="50" y="62" font-family="Arial" font-weight="700" font-size="38" fill="#fff" text-anchor="middle">${i}</text></svg>`); };
  const apply = (list) => {
    if (!Array.isArray(list) || !list.length) return;
    window.MRPROFES = list.map(t => { const st = byName(t.name) || {}; const bio = String(t.bio || '').split(/\n|·|•/).map(x => x.trim()).filter(Boolean);
      return { id: t.id, name: t.name, title: t.title || st.title || 'Mrs.', img: t.photo || st.img || ini(t.name), photo: t.photo || '', info: bio.length ? bio : (st.info || []) }; });
  };
  try { apply(JSON.parse(localStorage.getItem('mra_profes') || 'null')); } catch (e) { }
  const base = window.MRPROFPIC;
  window.MRPROFPIC = function (name) { const t = n(name); if (!t) return ''; const p = (window.MRPROFES || []).find(x => { const k = n(x.name), f = k.split(' ')[0], l = k.split(' ').slice(-1)[0]; return t === k || (t.indexOf(f) >= 0 && t.indexOf(l) >= 0) || t.split(' ')[0] === f; }); return p ? p.img : (base ? base(name) : ''); };
  window.MRPROFREADY = (window.MRAC && MRAC.on ? MRAC.call('profes', {}) : Promise.resolve(null)).then(r => { if (r && r.ok && r.profes && r.profes.length) { apply(r.profes); try { localStorage.setItem('mra_profes', JSON.stringify(r.profes)); } catch (e) { } } }).catch(() => { });
})();
