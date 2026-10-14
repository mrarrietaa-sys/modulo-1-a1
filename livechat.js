// 💬 Chat en vivo profe ↔ estudiante, con el estilo de WhatsApp. Los mensajes viven en la nube (hoja "Chat").
(function () {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (t) => esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>');
  const hm = (ts) => new Date(ts).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
  const dayKey = (ts) => new Date(ts).toDateString();
  const dayLbl = (ts) => { const d = new Date(ts), t = new Date(), y = new Date(Date.now() - 864e5); if (d.toDateString() === t.toDateString()) return 'Hoy'; if (d.toDateString() === y.toDateString()) return 'Ayer'; return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }); };
  const ini = (n) => String(n || '?').replace(/^(Mrs?\.)\s*/, '').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();
  const TICK1 = '<svg viewBox="0 0 16 11" width="16" height="11"><path fill="currentColor" d="M11.07.66 4.4 7.33 1.93 4.86.52 6.27l3.88 3.88 8.08-8.08z"/></svg>';
  const TICK2 = '<svg viewBox="0 0 16 11" width="16" height="11"><path fill="currentColor" d="M11.07.66 4.4 7.33 1.93 4.86.52 6.27l3.88 3.88 8.08-8.08zM15.48.66 8.81 7.33l-.6-.6-1.41 1.41 2.01 2.01 8.08-8.08z"/></svg>';
  const SEND = '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M1.1 21.8 23 12 1.1 2.2 1 9.8l15.6 2.2L1 14.2z"/></svg>';
  const CLIP = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M16.5 6v11.5a4 4 0 0 1-8 0V5a2.5 2.5 0 0 1 5 0v10.5a1 1 0 0 1-2 0V6H10v9.5a2.5 2.5 0 0 0 5 0V5a4 4 0 0 0-8 0v12.5a5.5 5.5 0 0 0 11 0V6z"/></svg>';
  const BACK = '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z"/></svg>';
  let W = null;
  function open(opts) {
    if (W) close();
    const o = Object.assign({ title: 'Chat', empty: '' }, opts || {});
    const el = document.createElement('div'); el.className = 'wa-wrap'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Chat');
    el.innerHTML = `<div class="wa">
      <aside class="wa-side"><header class="wa-h"><b>💬 ${esc(o.title)}</b><button class="wa-x" aria-label="Cerrar chat">✕</button></header><div class="wa-list"><p class="wa-note">⏳ Cargando…</p></div></aside>
      <section class="wa-main"><div class="wa-blank"><div><b>mrarrieta.com</b><p>Elige una conversación para empezar a chatear.</p></div></div></section></div>`;
    document.body.appendChild(el); document.documentElement.classList.add('wa-lock');
    W = { el, o, room: null, me: '', msgs: [], timers: [], rooms: [] };
    el.querySelector('.wa-x').onclick = close;
    el.addEventListener('click', (e) => { if (e.target === el) close(); });
    loadRooms(true);
    W.timers.push(setInterval(() => !document.hidden && loadRooms(false), 12000));
    W.timers.push(setInterval(() => !document.hidden && W.room && loadMsgs(), 4000));
  }
  function close() { if (!W) return; W.timers.forEach(clearInterval); W.el.remove(); document.documentElement.classList.remove('wa-lock'); W = null; }
  async function loadRooms(first) {
    const r = await W.o.call(W.o.roomsAction, {}).catch(() => null); if (!W) return;
    const list = W.el.querySelector('.wa-list');
    if (!r || !r.ok) { if (first) list.innerHTML = '<p class="wa-note">No se pudo cargar el chat. Revisa tu conexión.</p>'; return; }
    W.me = r.me; W.rooms = r.rooms || [];
    list.innerHTML = W.rooms.length ? W.rooms.map((x) => `<button class="wa-room${W.room === x.room ? ' on' : ''}${x.locked ? ' locked' : ''}" data-room="${esc(x.room)}"${x.locked ? ' data-locked="1"' : ''}><span class="wa-av">${esc(ini(x.title))}</span><span class="wa-rt"><b>${esc(x.title)}</b><small>${x.last ? (x.last.from === W.me ? '✓ ' : '') + esc(String(x.last.text).slice(0, 60)) : esc(x.sub || 'Toca para escribir')}</small></span><span class="wa-rm">${x.last ? `<small>${hm(x.last.ts)}</small>` : ''}${x.unread ? `<i>${x.unread}</i>` : ''}</span></button>`).join('')
      : `<p class="wa-note">${esc(W.o.empty || 'Todavía no tienes conversaciones.')}</p>`;
    list.querySelectorAll('[data-room]').forEach((b) => b.onclick = () => { if (b.dataset.locked) { const n = b.querySelector('small'); if (n) { n.textContent = '🔒 Solo puedes chatear con el profe con quien reservaste tu clase'; b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 500); } return; } openRoom(b.dataset.room); });
    if (first) { const want = W.o.room && W.rooms.find((x) => x.room === W.o.room); const open1 = W.rooms.filter((x) => !x.locked); const one = open1.length === 1 && W.o.autoOpenSingle && window.innerWidth > 700; if (want && !want.locked) openRoom(want.room); else if (one) openRoom(open1[0].room); }
  }
  function openRoom(room) {
    const info = W.rooms.find((x) => x.room === room) || { title: '' }; W.room = room; W.msgs = [];
    W.el.querySelector('.wa').classList.add('in-room');
    W.el.querySelectorAll('.wa-room').forEach((b) => b.classList.toggle('on', b.dataset.room === room));
    const main = W.el.querySelector('.wa-main');
    main.innerHTML = `<header class="wa-h wa-ch"><button class="wa-back" aria-label="Volver">${BACK}</button><span class="wa-av">${esc(ini(info.title))}</span><span class="wa-rt"><b>${esc(info.title)}</b><small>${esc(info.sub || '')}</small></span><button class="wa-x wa-x2" aria-label="Cerrar chat">✕</button></header>
      <div class="wa-msgs" aria-live="polite"><p class="wa-note">⏳ Cargando mensajes…</p></div>
      ${W.o.readOnly ? '<div class="wa-ro">👁️ Solo lectura · administración</div>' : `<form class="wa-bar"><button type="button" class="wa-clip" aria-label="Adjuntar imagen o documento">${CLIP}</button><input type="file" class="wa-file" hidden accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"><textarea rows="1" maxlength="1500" placeholder="Escribe un mensaje" aria-label="Mensaje"></textarea><button class="wa-send" aria-label="Enviar">${SEND}</button></form>`}`;
    main.querySelector('.wa-back').onclick = () => { W.room = null; W.el.querySelector('.wa').classList.remove('in-room'); loadRooms(false); };
    main.querySelector('.wa-x2').onclick = close;
    if (W.o.readOnly) { loadMsgs(true); return; }
    const ta = main.querySelector('textarea'), form = main.querySelector('form'), fi = main.querySelector('.wa-file');
    main.querySelector('.wa-clip').onclick = () => fi.click();
    fi.onchange = () => { const f = fi.files && fi.files[0]; fi.value = ''; if (f) sendFile(f, ta); };
    ta.oninput = () => { ta.style.height = 'auto'; ta.style.height = Math.min(120, ta.scrollHeight) + 'px'; };
    ta.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 700) { e.preventDefault(); form.requestSubmit(); } };
    form.onsubmit = (e) => { e.preventDefault(); const t = ta.value.trim(); if (!t) return; ta.value = ''; ta.oninput(); send(t); ta.focus(); };
    setTimeout(() => ta.focus(), 50);
    loadMsgs(true).then(() => W && loadRooms(false));
  }
  async function loadMsgs(first) {
    const room = W.room; const r = await W.o.call(W.o.getAction || 'chatGet', { room }).catch(() => null); if (!W || W.room !== room) return;
    if (!r || !r.ok) { if (first) W.el.querySelector('.wa-msgs').innerHTML = '<p class="wa-note">No se pudieron cargar los mensajes.</p>'; return; }
    W.me = r.me || W.me; const pend = W.msgs.filter((m) => m.pending);
    const sig = JSON.stringify(r.msgs.map((m) => [m.id, m.read]));
    if (!first && sig === W.sig && !pend.length) return; W.sig = sig;
    W.msgs = r.msgs.concat(pend.filter((p) => !r.msgs.some((m) => m.text === p.text && m.from === p.from && Math.abs(m.ts - p.ts) < 60000 && !!m.file === !!(p.localImg || p.uploading))));
    render(first);
  }
  function render(forceBottom) {
    const box = W.el.querySelector('.wa-msgs'); if (!box) return;
    const atBottom = forceBottom || box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    let last = '';
    box.innerHTML = W.msgs.length ? W.msgs.map((m) => { const mine = m.from === W.me; const dk = dayKey(m.ts); const sep = dk !== last ? `<div class="wa-day"><span>${esc(dayLbl(m.ts))}</span></div>` : ''; last = dk;
      return `${sep}<div class="wa-m ${mine ? 'me' : 'them'}"><div class="wa-b">${W.o.readOnly ? `<span class="wa-who">${esc(m.name || '')}</span>` : ''}${fileHTML(m)}${fmt(m.text)}<span class="wa-meta">${hm(m.ts)}${mine ? `<i class="wa-tk${m.read ? ' read' : ''}">${m.pending ? '🕓' : m.read ? TICK2 : TICK1}</i>` : ''}</span></div></div>`; }).join('')
      : '<div class="wa-day"><span>🔒 Escribe tu primer mensaje. Esta conversación puede ser revisada por administración para cuidar la calidad del servicio.</span></div>';
    if (atBottom) box.scrollTop = box.scrollHeight;
  }
  function fileHTML(m) {
    if (m.localImg) return `<img class="wa-img" src="${m.localImg}" alt="">`;
    if (m.uploading) return `<div class="wa-doc">📎 ${esc(m.fname || 'Archivo')} · enviando…</div>`;
    if (!m.file) return '';
    const view = 'https://drive.google.com/file/d/' + encodeURIComponent(m.file) + '/view';
    if (/^image\//.test(m.fmime)) return `<a href="${view}" target="_blank" rel="noopener"><img class="wa-img" loading="lazy" src="https://drive.google.com/thumbnail?id=${encodeURIComponent(m.file)}&sz=w800" alt="${esc(m.fname)}" onerror="this.outerHTML='<span class=&quot;wa-doc&quot;><span>🖼️</span><b>${esc(m.fname || 'Imagen')}</b><small>Ver</small></span>'"></a>`;
    const ic = /pdf/.test(m.fmime) ? '📕' : /sheet|excel/.test(m.fmime) ? '📗' : /presentation|powerpoint/.test(m.fmime) ? '📙' : /audio/.test(m.fmime) ? '🎵' : '📘';
    return `<a class="wa-doc" href="${view}" target="_blank" rel="noopener"><span>${ic}</span><b>${esc(m.fname || 'Documento')}</b><small>Abrir</small></a>`;
  }
  // 📎 adjuntar: las imágenes se reducen (máx. 1600 px) para que suban rápido; documentos hasta 10 MB
  function shrink(file) { return new Promise((res) => { if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return res(null); const img = new Image(); const u = URL.createObjectURL(file); img.onload = () => { const k = Math.min(1, 1600 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c.toDataURL('image/jpeg', 0.82)); }; img.onerror = () => res(null); img.src = u; }); }
  const toB64 = (file) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(file); });
  async function sendFile(file, ta) {
    if (file.size > 10 * 1024 * 1024) return alertBar('El archivo pesa más de 10 MB. Envía uno más liviano.');
    const room = W.room; const caption = ta ? ta.value.trim() : ''; if (ta) { ta.value = ''; ta.oninput && ta.oninput(); }
    let data = await shrink(file), mime = data ? 'image/jpeg' : (file.type || 'application/octet-stream'), fname = file.name || 'archivo';
    if (data) fname = fname.replace(/\.[^.]+$/, '') + '.jpg'; else data = await toB64(file).catch(() => '');
    if (!data) return alertBar('No se pudo leer el archivo.');
    const tmp = { id: 'tmp' + Date.now(), from: W.me, text: caption, ts: Date.now(), pending: true, uploading: !/^image\//.test(mime), localImg: /^image\//.test(mime) ? data : '', fname };
    W.msgs.push(tmp); render(true);
    const r = await W.o.call('chatSend', { room, text: caption, b64: data.split(',')[1], mime, fname }).catch(() => null); if (!W || W.room !== room) return;
    const i = W.msgs.indexOf(tmp);
    if (r && r.ok) { if (i >= 0) W.msgs[i] = r.msg; } else { if (i >= 0) W.msgs.splice(i, 1); alertBar(r && r.err === 'type' ? 'Ese tipo de archivo no se permite. Envía imágenes, PDF, Word, Excel o PowerPoint.' : r && r.err === 'size' ? 'El archivo es muy pesado.' : 'No se pudo enviar el archivo. Inténtalo de nuevo.'); }
    render(true);
  }
  async function send(text) {
    const room = W.room; const tmp = { id: 'tmp' + Date.now(), from: W.me, text, ts: Date.now(), pending: true }; W.msgs.push(tmp); render(true);
    const r = await W.o.call('chatSend', { room, text }).catch(() => null); if (!W || W.room !== room) return;
    const i = W.msgs.indexOf(tmp);
    if (r && r.ok) { if (i >= 0) W.msgs[i] = r.msg; } else { if (i >= 0) W.msgs.splice(i, 1); const ta = W.el.querySelector('textarea'); if (ta) ta.value = text; alertBar('No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.'); }
    render(true);
  }
  function alertBar(t) { const box = W && W.el.querySelector('.wa-msgs'); if (box) box.insertAdjacentHTML('beforeend', `<div class="wa-day err"><span>${esc(t)}</span></div>`); }
  // estudiante: chat con su(s) profe(s)
  function openStudent(extra) {
    const A = window.MRAC; if (!A || !A.code || !A.code()) { alert('Entra con tu código para chatear con tu profe.'); return; }
    open(Object.assign({ title: 'Chat con mi profe', roomsAction: 'chatRooms', autoOpenSingle: true, empty: 'Cuando tengas tu primera clase con un profe, podrás chatear con él o ella aquí.', call: (a, d) => A.call(a, Object.assign({ code: A.code() }, d || {})) }, extra || {}));
  }
  // "Atrás" con el chat abierto: solo cierra el chat
  document.addEventListener('click', (e) => { if (!W) return; const b = e.target.closest && e.target.closest('.tb-back'); if (!b) return; e.preventDefault(); e.stopImmediatePropagation(); close(); }, true);
  window.MRLIVE = { open, close, openStudent };
  // abrir directo desde el enlace del correo (#chat)
  if (/#chat\b/.test(location.hash) && !/profesores/.test(location.pathname)) { const go = (n) => { if (window.MRAC && MRAC.code && MRAC.code()) { history.replaceState(null, '', location.pathname + location.search); openStudent(); } else if (n < 15) setTimeout(() => go(n + 1), 800); }; setTimeout(() => go(0), 1200); }
})();
