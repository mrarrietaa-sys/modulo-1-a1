/* =====================================================================
   CHAT DOCENTE ↔ ESTUDIANTE  (VISTA PREVIA)
   ---------------------------------------------------------------------
   Hoy los mensajes se guardan en ESTE navegador (modo demostración).
   Así puedes probarlo: escribe como estudiante y responde desde docente.html
   en el mismo computador. Para que funcione entre distintos dispositivos hay
   que conectar un servidor (por ejemplo Firebase); solo se cambia "store".
   ===================================================================== */
(function () {
  const KEY = 'mra_chat_v1';
  const C = window.M1CONFIG || {};
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { rooms: {} }; } catch (e) { return { rooms: {} }; } };
  const write = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { } };
  const subs = new Set();
  window.addEventListener('storage', (e) => { if (e.key === KEY) [...subs].forEach(f => f()); });

  // ---- "store": la única parte que cambia cuando conectemos un servidor ----
  const store = {
    mode: 'demo',
    room(teacher, sid) { return teacher.toUpperCase() + '|' + sid; },
    get(roomId) { return read().rooms[roomId] || null; },
    rooms(teacher) { const r = read().rooms; return Object.entries(r).filter(([k]) => k.startsWith(teacher.toUpperCase() + '|')).map(([id, v]) => ({ id, ...v })); },
    ensure(roomId, info) { const d = read(); d.rooms[roomId] = Object.assign({ msgs: [] }, d.rooms[roomId] || {}, info); write(d); },
    send(roomId, from, text) {
      const d = read(); const r = d.rooms[roomId] || (d.rooms[roomId] = { msgs: [] });
      r.msgs.push({ from, text: String(text).slice(0, 2000), ts: Date.now() });
      r['seen_' + from] = Date.now(); write(d); [...subs].forEach(f => f());
    },
    seen(roomId, who) { const d = read(); const r = d.rooms[roomId]; if (!r) return; const last = (r.msgs.slice(-1)[0] || {}).ts || 0; if ((r['seen_' + who] || 0) >= last) return; r['seen_' + who] = Date.now(); write(d); },
    unread(roomId, who) { const r = this.get(roomId); if (!r) return 0; const s = r['seen_' + who] || 0; return r.msgs.filter(m => m.from !== who && m.ts > s).length; },
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
  };
  const teachers = () => C.TEACHERS || [];
  const findTeacher = (code) => teachers().find(t => t.code.toUpperCase() === String(code || '').trim().toUpperCase());

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const time = (ts) => { const d = new Date(ts); const today = new Date().toDateString() === d.toDateString(); return (today ? '' : d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) + ' · ') + d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }); };

  // ---- ventana de conversación reutilizable (estudiante y docente) ----
  function thread(host, roomId, me, otherName) {
    host.innerHTML = `<div class="chat-thread"><div class="chat-msgs"></div>
      <form class="chat-form"><textarea class="inp" rows="1" placeholder="Escribe tu mensaje…" maxlength="2000"></textarea><button class="btn k" type="submit">Enviar ➤</button></form></div>`;
    const box = host.querySelector('.chat-msgs'), ta = host.querySelector('textarea');
    const draw = () => {
      const r = store.get(roomId); const msgs = (r && r.msgs) || [];
      box.innerHTML = msgs.length ? msgs.map(m => `<div class="cm ${m.from === me ? 'me' : 'them'}"><div class="bub">${esc(m.text).replace(/\n/g, '<br>')}</div><small>${m.from === me ? 'Tú' : esc(otherName)} · ${time(m.ts)}</small></div>`).join('')
        : `<div class="chat-empty">Aún no hay mensajes. ¡Escribe el primero! 👋</div>`;
      box.scrollTop = box.scrollHeight; store.seen(roomId, me);
    };
    const send = () => { const v = ta.value.trim(); if (!v) return; store.send(roomId, me, v); ta.value = ''; ta.style.height = ''; draw(); };
    host.querySelector('.chat-form').onsubmit = (e) => { e.preventDefault(); send(); };
    ta.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
    ta.oninput = () => { ta.style.height = 'auto'; ta.style.height = Math.min(140, ta.scrollHeight) + 'px'; };
    const off = store.subscribe(() => { if (host.isConnected) draw(); else off(); });
    draw(); return { refresh: draw };
  }

  window.M1CHAT = { store, thread, findTeacher, teachers, esc, demo: store.mode === 'demo' };
})();
