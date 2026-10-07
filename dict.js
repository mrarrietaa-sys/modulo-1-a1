/* =====================================================================
   DICCIONARIO INTELIGENTE — siempre visible (botón flotante 📖)
   Escribe o pregunta en voz alta (español o inglés):
   "¿cómo se dice perro?", "qué significa breakfast", "a o an", "there is"...
   1) Mini lecciones de gramática del módulo
   2) Vocabulario de la plataforma (foto + audio natural)
   3) Diccionario en línea (traducción + definición + pronunciación real)
   ===================================================================== */
(function () {
  const M = window.M1; if (!M) return;
  const { S, $, $$, h, esc } = M;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  /* ---------- helpers ---------- */
  const strip = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!.,;:"“”()]/g, ' ').replace(/\s+/g, ' ').trim();
  const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : s;

  // gramática → parte de la clase con su mini lección
  const GRAMMAR = [
    [/\b(verbo )?to be\b|\b(am|is|are)\b|verbo ser|verbo estar/, 't5p1'],
    [/\b(a|an)\b.*\b(a|an)\b|\ba o an\b|\ban o a\b|articulo|\ban\b/, 't5p2'],
    [/negativ|pregunta.*be|isn t|aren t/, 't5p2'],
    [/\bthis\b|\bthat\b|\beste\b|\bese\b|\baquel\b|demostrativ/, 't13p1'],
    [/\bthese\b|\bthose\b|\bestos\b|\besos\b|\baquellos\b/, 't13p2'],
    [/there is|there are|there s|\bhay\b/, 't14p1'],
    [/is there|are there|there isn t|there aren t/, 't14p2'],
    [/irregular|children|people|women|\bmen\b|\bfeet\b|\bteeth\b/, 't12p2'],
    [/plural/, 't12p1'],
    [/alfabeto|abecedario|deletre|spell|letras/, 't2p1'],
    [/numero|number|contar/, 't4p1'],
    [/color/, 't4p2'],
    [/dias de la semana|days of the week|weekday/, 't9p1'],
    [/meses|months/, 't9p2'],
    [/clima|tiempo atmosferico|weather/, 't10p1'],
    [/ropa|clothes/, 't10p2'],
    [/saludo|saludar|greeting|despedi/, 't1p1'],
    [/presentar|nice to meet|presentacion/, 't1p2'],
    [/nacionalidad|nationalit/, 't3p2'],
    [/paises|countries|country/, 't3p1'],
    [/profesion|trabajo|ocupacion|what do you do|jobs?\b/, 't6p2'],
    [/familia|family/, 't7p1'],
    [/animal/, 't7p2'],
    [/comida|food|bebida/, 't8p1'],
    [/fruta|verdura|vegetal/, 't8p2'],
    [/utiles|school supplies/, 't11p1'],
    [/casa|house|partes de la casa/, 't11p2'],
  ];

  // índice de vocabulario de la plataforma
  let IDX = null;
  function buildIndex() {
    IDX = { words: [], sents: [] };
    M.allParts().forEach(p => {
      (p.vocab || []).forEach(v => { if (v.en) IDX.words.push({ en: v.en, es: v.es || '', img: v.img, au: v.au, p }); });
      (p.sentences || []).forEach(s => { if (s.en) IDX.sents.push({ en: s.en, es: s.es || '', au: s.au, p }); });
    });
    IDX.words.forEach(w => { w._en = strip(w.en); w._es = strip(w.es).split(/\s*[\/,]\s*|\s+o\s+/).filter(Boolean); w._es.push(strip(w.es)); });
    IDX.sents.forEach(s => { s._en = ' ' + strip(s.en) + ' '; s._es = strip(s.es); });
  }

  // extrae la palabra/frase que el estudiante pregunta
  function extract(q) {
    const s = strip(q);
    const pats = [
      [/^(?:como|cómo) (?:se dice|digo|se escribe) (.+?)(?: en ingles)?$/, 'es'],
      [/^(?:traduce|traducir|traduccion de|traducción de) (.+)$/, null],
      [/^(?:que|qué) (?:significa|quiere decir) (.+?)(?: en espanol)?$/, 'en'],
      [/^(?:que|qué) es (.+?)(?: en espanol)?$/, 'en'],
      [/^significado de (.+)$/, 'en'],
      [/^(?:como se pronuncia|pronunciacion de) (.+)$/, 'en'],
      [/^what does (.+) mean$/, 'en'], [/^what is (.+?)(?: in spanish)?$/, 'en'],
      [/^how do (?:you|i) say (.+?)(?: in english)?$/, 'es'],
      [/^(.+) en ingles$/, 'es'], [/^(.+) (?:en espanol|in spanish)$/, 'en'], [/^(.+) in english$/, 'es'],
    ];
    for (const [re, lang] of pats) { const m = s.match(re); if (m) return { term: m[1].replace(/^(el|la|los|las|un|una|the) /, '').trim(), lang }; }
    return { term: s.replace(/^(el|la|los|las|un|una|the) /, '').trim(), lang: null };
  }

  /* ---------- online sources (gratuitos, sin clave) ---------- */
  const clean = (x) => String(x || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').replace(/^[\s\-–·:;.,]+|[\s\-–·:;.,]+$/g, '').trim();
  // traductor (Google, con detección de idioma y significados alternativos); respaldo: MyMemory
  async function gtr(text, sl, tl) {
    try {
      const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=bd&q=${encodeURIComponent(text)}`);
      const j = await r.json(); let t = clean((j[0] || []).map(x => x[0]).join('')); if (!t) return null;
      const one = text.trim().split(/\s+/).length <= 2;
      if (one && /^[A-Z]/.test(t) && text[0] === text[0].toLowerCase() && !/^I\b/.test(t)) t = t[0].toLowerCase() + t.slice(1);
      const alts = []; (j[1] || []).forEach(g => (g[1] || []).forEach(w => { w = clean(w); if (w && strip(w) !== strip(t) && strip(w) !== strip(text) && alts.length < 2 && !alts.includes(w)) alts.push(w); }));
      return { t, alts, det: j[2] || sl };
    } catch (e) { return null; }
  }
  async function translate(text, from, to) {
    const g = await gtr(text, from, to); if (g) return g;
    try {
      const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
      const j = await r.json(); const t = clean(j && j.responseData && j.responseData.translatedText);
      if (!t || /MYMEMORY|QUERY LENGTH|INVALID|<|>/i.test(t)) return null;
      return { t, alts: [], det: from };
    } catch (e) { return null; }
  }
  const txt = (html) => { const d = new DOMParser().parseFromString('<div>' + (html || '') + '</div>', 'text/html'); d.querySelectorAll('style,sup').forEach(x => x.remove()); return d.body.textContent.replace(/\s+/g, ' ').trim(); };
  async function define(word) {
    // 1) dictionaryapi.dev (incluye audio de pronunciación real)
    try {
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (r.ok) { const j = await r.json(); if (Array.isArray(j) && j.length) {
        const e = j[0]; const ph = (e.phonetics || []).find(p => p.audio && /-us\.mp3$/.test(p.audio)) || (e.phonetics || []).find(p => p.audio);
        const meanings = (e.meanings || []).slice(0, 2).map(m => ({ pos: m.partOfSpeech, def: (m.definitions[0] || {}).definition, ex: (m.definitions.find(d => d.example) || {}).example }));
        return { word: e.word, phon: e.phonetic || ((e.phonetics || []).find(p => p.text) || {}).text || '', audio: ph ? ph.audio : null, meanings }; } }
    } catch (e) { }
    // 2) Wiktionary (respaldo)
    try {
      const r = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`);
      if (!r.ok) return null; const j = await r.json(); const en = j.en; if (!en || !en.length) return null;
      const meanings = en.filter(x => /noun|verb|adjective|adverb|pronoun|preposition|interjection|determiner|conjunction|phrase/i.test(x.partOfSpeech || '') && !/proper/i.test(x.partOfSpeech || '')).slice(0, 2).map(x => { const d = (x.definitions || []).find(d => txt(d.definition)) || {}; return { pos: (x.partOfSpeech || '').toLowerCase(), def: txt(d.definition), ex: d.examples && d.examples.length ? txt(d.examples[0]) : '' }; }).filter(m => m.def);
      return meanings.length ? { word, phon: '', audio: null, meanings } : null;
    } catch (e) { return null; }
  }

  /* ---------- pronunciación ---------- */
  let ttsVoice = null;
  function pickVoice() {
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    const pref = [/Aria.*Natural|Jenny.*Natural|Guy.*Natural/i, /Google US English/i, /Samantha/i, /Microsoft (Aria|Jenny|Zira)/i, /en[-_]US/i];
    for (const re of pref) { const v = vs.find(v => re.test(v.name) || re.test(v.lang)); if (v) return v; }
    return vs.find(v => /^en/i.test(v.lang)) || null;
  }
  if (window.speechSynthesis) { speechSynthesis.onvoiceschanged = () => { ttsVoice = pickVoice(); }; ttsVoice = pickVoice(); }
  async function say(item) {
    M.stop();
    if (item.au) { if (item.p) await M.loadAudio(['t' + item.p.topic]); return M.play(item.au); }
    if (item.audio) { const a = M.trackAudio(new Audio(item.audio)); window.__ra = a; try { await a.play(); return; } catch (e) { } }
    if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(item.text || item.en); u.lang = 'en-US'; u.rate = 0.95; if (ttsVoice || (ttsVoice = pickVoice())) u.voice = ttsVoice; u.onstart = u.onend = u.onerror = () => setTimeout(M.audioUI, 50); speechSynthesis.cancel(); speechSynthesis.speak(u); setTimeout(M.audioUI, 300); }
  }

  /* ---------- UI ---------- */
  let panel = null;
  // botón flotante: se arrastra; para quitarlo se suelta en la ✕ del centro
  function fab() { M.floatBubble({ id: 'dict-fab', img: 'mra-idea.webp', label: 'Diccionario', posKey: 'dictPos', hiddenKey: 'dictHidden', onOpen: open }); }
  function setHidden(v) { M.setBubbleHidden('dictHidden', v); }
  function open() {
    if (!IDX) buildIndex();
    if (panel) { panel.classList.add('on'); panel._lab && panel._lab(); $('#dq', panel).focus(); return; }
    panel = h(`<div id="dict" class="on"><div class="dict-card">
      <div class="dict-hd"><img src="mra-idea.webp" alt=""><div><h3>📖 Diccionario de Mr. Arrieta</h3><p>Escribe o pregunta en voz alta una palabra o duda <b>de inglés</b>, en español o en inglés.</p></div><button class="dict-x" title="Cerrar">✕</button></div>
      <form class="dict-form"><input id="dq" class="inp" placeholder="Ej: perro, breakfast…" autocomplete="off">
        ${SR ? '<button class="btn w dict-mic" type="button" data-l="es-CO" title="Habla">🎤 Habla</button>' : ''}<button class="btn k" type="submit">Buscar</button></form>
      <div class="dict-out"></div><div class="dict-foot"><button class="linkbtn" id="dhide"></button></div></div></div>`);
    document.body.appendChild(panel);
    panel.addEventListener('click', e => { if (e.target === panel) close(); });
    $('.dict-x', panel).onclick = close;
    $('.dict-form', panel).onsubmit = (e) => { e.preventDefault(); const v = $('#dq', panel).value.trim(); if (v) ask(v); };
    $$('.dict-mic', panel).forEach(b => b.onclick = () => voice(b));
    const dh = $('#dhide', panel); const lab = () => { dh.innerHTML = S.dictHidden ? '📌 Mostrar otra vez el botón flotante' : '💡 Para quitar el botón flotante, arrástralo hasta la <b>✕</b> del centro de la pantalla.'; dh.disabled = !S.dictHidden; };
    lab(); dh.onclick = () => { if (S.dictHidden) { setHidden(false); lab(); } };
    panel._lab = lab;
    setTimeout(() => $('#dq', panel).focus(), 50);
  }
  // al cerrar se borra la búsqueda: queda listo para una nueva
  function close() { if (panel) { panel.classList.remove('on'); $('#dq', panel).value = ''; $('.dict-out', panel).innerHTML = ''; } M.stop(); if (window.speechSynthesis) speechSynthesis.cancel(); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel && panel.classList.contains('on')) close(); });

  function voice(btn) {
    const r = new SR(); r.lang = btn.dataset.l; r.interimResults = true; r.maxAlternatives = 1;
    const old = btn.textContent; btn.textContent = '🔴 Habla…'; btn.disabled = true;
    let final = '';
    r.onresult = (e) => { let t = ''; for (const x of e.results) t += x[0].transcript; $('#dq', panel).value = t; if (e.results[e.results.length - 1].isFinal) final = t; };
    r.onerror = (e) => { if (e.error === 'not-allowed') M.toast('Permite el micrófono 🎤'); };
    r.onend = () => { btn.textContent = old; btn.disabled = false; const v = (final || $('#dq', panel).value).trim(); if (v) ask(v); };
    try { r.start(); } catch (e) { btn.textContent = old; btn.disabled = false; }
  }

  async function ask(q, langHint) {
    const out = $('.dict-out', panel);
    out.innerHTML = `<div class="dict-think"><img src="mra-think.webp" alt=""><div class="dots"><i></i><i></i><i></i></div></div>`;
    const { term, lang } = extract(q); const L = lang || langHint || null; const sq = strip(q);
    // solo inglés: rechaza preguntas de otras materias
    const OFF = /\b(matematica|historia|quimica|fisica|biologia|geografia|filosofia|presidente|capital de|receta|futbol|politica|religion|horoscopo|cuanto es|resultado de|ecuacion|derivada|integral)\b|\d+\s*[+\-x*/÷×]\s*\d+/;
    if (OFF.test(sq)) { out.innerHTML = `<div class="dict-res center"><img src="mra-shrug.webp" alt="" style="height:150px"><p><b>Este diccionario es solo para inglés.</b></p><p class="muted">Pregúntame palabras, frases, pronunciación o gramática en inglés. Ej: <i>¿cómo se dice perro?</i></p></div>`; return; }
    const blocks = [];

    // 1) gramática
    const g = GRAMMAR.find(([re]) => re.test(' ' + sq + ' '));
    const looksGrammar = /cuando|como (se )?usa|diferencia|regla|explica|gramatica|uso de|when do|how do i use|\bo\b/.test(sq) || term.split(' ').length >= 2 || /^(there|this|that|these|those|a|an|am|is|are)\b/.test(term);
    if (g && looksGrammar) {
      const p = M.partById(g[1]);
      if (p && p.tip) blocks.push(`<div class="dict-res"><div class="dict-tag">📘 Mini lección · ${esc(p._t.title)} · Part ${p.part}</div><div class="lesson" style="margin:8px 0 0">${p.tip}</div>
        <button class="btn sm" data-go="${p.id}" style="margin-top:10px">Ir a esta clase →</button></div>`);
    }

    // 2) vocabulario de la plataforma
    const t = strip(term);
    let hits = [];
    if (t) {
      hits = IDX.words.filter(w => w._en === t || w._es.includes(t));
      if (!hits.length && t.length > 3) hits = IDX.words.filter(w => w._en.startsWith(t) || w._es.some(e => e.startsWith(t)) || (t.endsWith('s') && w._en === t.slice(0, -1)));
      const seen = new Set(); hits = hits.filter(w => { const k = w._en; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 4);
    }
    const exs = t && t.length > 1 ? IDX.sents.filter(s => s._en.includes(' ' + (hits[0] ? hits[0]._en : t) + ' ')).slice(0, 3) : [];
    hits.forEach((w, i) => blocks.push(`<div class="dict-res dict-word">${w.img && !String(w.img).startsWith('#') ? `<div class="dict-ph">${M.photo(w.img)}</div>` : ''}
      <div class="grow"><div class="dict-tag">✅ En tu curso · ${esc(w.p._t.title)}</div><div class="dict-en">${esc(w.en)} <button class="aud" data-w="${i}">🔊</button></div><div class="dict-es">${esc(w.es)}</div>
      ${i === 0 && exs.length ? `<div class="dict-ex">${exs.map((s, k) => `<div><button class="aud sm" data-s="${k}">🔊</button> <b>${esc(s.en)}</b><br><span class="muted">${esc(s.es)}</span></div>`).join('')}</div>` : ''}
      <button class="btn w sm" data-say="${i}" style="margin-top:8px">🎤 Practicar pronunciación</button></div></div>`));

    // 3) en línea (si no está en el curso): SIEMPRE responde "cómo se dice en inglés" / "qué significa en español"
    let online = null;
    if (!hits.length && t && !(g && looksGrammar && t.split(' ').length > 2)) {
      if (!lang && t.split(' ').length > 5 && !g) {
        out.innerHTML = `<div class="dict-res center"><img src="mra-think.webp" alt="" style="height:140px"><p><b>Este diccionario es para aprender inglés.</b></p><p class="muted">Escribe una palabra o frase corta, o pregunta así: <i>¿cómo se dice ___?</i> · <i>¿qué significa ___?</i></p></div>`; return;
      }
      let en = null, es = null, def = null, dir = null;
      if (L === 'en') dir = 'en';
      else if (L === 'es' || /[ñáéíóú¿¡]/i.test(term)) dir = 'es';
      else {
        // sin pista de idioma: lo detecta el traductor (si no es inglés, se toma como español)
        const tr = await gtr(term, 'auto', 'en');
        dir = tr && tr.det === 'en' ? 'en' : 'es';
        if (dir === 'es' && tr && tr.det === 'es' && strip(tr.t) !== strip(term)) { en = tr.t; es = { t: term, alts: [] }; online = { alts: tr.alts }; }
      }
      if (dir === 'es' && !en) { const tr = await translate(term, 'es', 'en'); if (tr) { en = tr.t; es = { t: term, alts: [] }; online = { alts: tr.alts }; } }
      if (dir === 'es' && en && en.split(' ').length <= 2) def = await define(en.toLowerCase());
      if (dir === 'en') { def = await define(term.toLowerCase()); const tr = await translate(term, 'en', 'es'); if (tr) { en = def ? def.word : term; es = tr; } else if (def) { en = def.word; } }
      if (en) {
        const alts = dir === 'es' ? ((online && online.alts) || []) : (es && es.alts) || [];
        online = { text: en, audio: def && def.audio };
        const ex0 = def && def.meanings.find(m => m.ex); if (ex0 && ex0.ex.length < 160) { const tr = await translate(ex0.ex, 'en', 'es'); if (tr) ex0.exEs = tr.t; }
        const head = dir === 'es'
          ? `<div class="dict-q">“${esc(term)}” en inglés se dice:</div><div class="dict-en">${esc(en)} <button class="aud" data-o="1">🔊</button>${def && def.phon ? ` <span class="muted" style="font-size:16px">${esc(def.phon)}</span>` : ''}</div>${alts.length ? `<div class="dict-es"><span class="muted">También: ${alts.map(esc).join(', ')}</span></div>` : ''}`
          : `<div class="dict-q">“${esc(en)}” significa:</div><div class="dict-en">${esc(es ? es.t : '')}</div><div class="dict-es">🔊 ${esc(en)} <button class="aud" data-o="1">🔊</button>${def && def.phon ? ` <span class="muted">${esc(def.phon)}</span>` : ''}${alts.length ? ` <span class="muted">· también: ${alts.map(esc).join(', ')}</span>` : ''}</div>`;
        blocks.push(`<div class="dict-res"><div class="dict-tag">📖 Diccionario de inglés</div>${head}
          ${def && def.meanings.length ? `<div class="dict-ex">${def.meanings.slice(0, 1).map(m => `<div><span class="pill" style="background:var(--y3);color:var(--k);border-color:var(--k)">${esc(m.pos || '')}</span> ${m.ex ? `🗨️ <b>${esc(m.ex)}</b>${m.exEs ? `<br><span class="muted">${esc(m.exEs)}</span>` : ''}` : esc(m.def || '')}</div>`).join('')}</div>` : ''}
          <button class="btn w sm" data-say="o" style="margin-top:8px">🎤 Practicar pronunciación</button></div>`);
      }
    }

    if (!blocks.length) {
      out.innerHTML = `<div class="dict-res center"><img src="mra-shrug.webp" alt="" style="height:150px"><p><b>No encontré “${esc(term || q)}”.</b></p><p class="muted">Revisa la ortografía o pregunta de otra forma, por ejemplo: <i>¿cómo se dice ___?</i> o <i>¿qué significa ___?</i>${navigator.onLine === false ? '<br>⚠️ Estás sin internet: solo puedo buscar en el vocabulario del curso.' : ''}</p></div>`;
      return;
    }
    out.innerHTML = `<div class="dict-ans"><img src="mra-point.webp" alt=""><div class="bubble">${hits.length || online ? 'Here you go! 👇' : 'Let me explain 👇'}</div></div>` + blocks.join('');
    // wiring
    $$('[data-w]', out).forEach(b => b.onclick = () => say(hits[+b.dataset.w]));
    $$('[data-s]', out).forEach(b => b.onclick = () => say(exs[+b.dataset.s]));
    $$('[data-o]', out).forEach(b => b.onclick = () => say(online));
    $$('[data-go]', out).forEach(b => b.onclick = () => { close(); location.hash = ''; window.dispatchEvent(new CustomEvent('m1-open-part', { detail: b.dataset.go })); });
    $$('[data-say]', out).forEach(b => b.onclick = () => practice(b, b.dataset.say === 'o' ? online : hits[+b.dataset.say]));
    // auto-pronounce the first answer
    if (hits[0]) say(hits[0]); else if (online) say(online);
  }

  async function practice(btn, item) {
    if (!M.canSR) { M.toast('Tu navegador no reconoce voz. Usa Chrome 🎤'); return; }
    const target = item.en || item.text; btn.disabled = true; btn.textContent = '🔴 Di: ' + target;
    const r = await M.listen(5000); btn.disabled = false; btn.textContent = '🎤 Practicar otra vez';
    if (!r.alts.length) { M.toast('No te escuché 🙉 Intenta otra vez'); return; }
    const sc = M.speechScore(target, r.alts);
    const fb = btn.parentNode.querySelector('.dict-fb') || btn.parentNode.appendChild(h('<div class="dict-fb"></div>'));
    fb.innerHTML = `<div class="meter"><div class="bar"><i style="width:${sc.score}%;background:${sc.score >= 85 ? 'var(--ok)' : sc.score >= 60 ? 'var(--k)' : 'var(--bad)'}"></i></div><b>${sc.score}%</b></div>
      <small>${sc.score >= 85 ? '🌟 ¡Excelente pronunciación!' : sc.score >= 60 ? '👍 ¡Muy bien! Escucha otra vez y repite.' : '💪 Escucha el modelo 🔊 y vuelve a intentarlo.'} · Escuché: “${esc(sc.heard)}”</small>`;
    M.sfx(sc.score >= 60 ? 'ok' : 'bad');
  }

  window.M1DICT = { open, ask, setHidden };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fab); else fab();
})();
