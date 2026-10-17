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
