/* =====================================================================
   BARRA DEL PROFESOR — escribir y señalar sobre la pantalla (solo perfil profe)
   Lápiz · resaltador · flecha · rectángulo · puntero láser · borrador · colores
   · grosor · deshacer · borrar todo · ocultar trazos · minimizar · quitar barra
   window.MRANN { show(), hide(), isHidden() }
   ===================================================================== */
(function () {
  const KEY = 'mra_teacherbar_v1';
  const isStaff = () => { try { const p = JSON.parse(localStorage.getItem('mra_profile_v1') || 'null'); return !!(p && p.type === 'staff'); } catch (e) { return false; } };
  const st = (() => { try { return Object.assign({ hidden: false, open: false, x: null, y: null, color: '#E3242B', size: 4 }, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return { hidden: false, open: false, color: '#E3242B', size: 4 }; } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };
  const COLORS = ['#E3242B', '#0B2A5B', '#FFC21A', '#22C55E', '#111111', '#FFFFFF'];
  const SIZES = [2, 4, 8, 14];
  const I = { // iconos SVG simples
    cursor: '<svg viewBox="0 0 24 24"><path d="M5 3l14 8-6 2-2 6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    pen: '<svg viewBox="0 0 24 24"><path d="M4 20l4-1 11-11-3-3L5 16z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 6l3 3" stroke="currentColor" stroke-width="2"/></svg>',
    hl: '<svg viewBox="0 0 24 24"><path d="M6 15l7-7 4 4-7 7H6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 21h9" stroke="#FFC21A" stroke-width="3" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M4 20L19 5M19 5h-7M19 5v7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    rect: '<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>',
    laser: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="#E3242B"/><circle cx="12" cy="12" r="8" fill="none" stroke="#E3242B" stroke-width="1.5" opacity=".5"/></svg>',
    eraser: '<svg viewBox="0 0 24 24"><path d="M3 15l9-9 7 7-6 6H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 21h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    undo: '<svg viewBox="0 0 24 24"><path d="M9 7L4 12l5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 12h10a6 6 0 010 12h-2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
    min: '<svg viewBox="0 0 24 24"><path d="M6 12h12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    logo: '<svg viewBox="0 0 24 24"><path d="M12 2c-3 3-5 6-5 9a5 5 0 0010 0c0-3-2-6-5-9z" fill="#fff"/><circle cx="12" cy="12" r="1.8" fill="#0B2A5B"/><path d="M12 14v8" stroke="#fff" stroke-width="2"/></svg>',
  };
  let cv, ctx, bar, fab, drop, tool = 'cursor', strokes = [], cur = null, visible = true, dpr = 1, laserT = null;

  function css() {
    if (document.getElementById('ann-css')) return;
    const s = document.createElement('style'); s.id = 'ann-css';
    s.textContent = `
#ann-cv{position:fixed;inset:0;width:100vw;height:100vh;z-index:9000;pointer-events:none;touch-action:none}
#ann-cv.on{pointer-events:auto;cursor:crosshair}
#ann-fab{position:fixed;left:12px;top:120px;z-index:9002;width:52px;height:52px;border-radius:50%;background:#0B2A5B;border:3px solid #E3242B;display:grid;place-items:center;box-shadow:0 6px 16px rgba(0,0,0,.3);cursor:grab;touch-action:none;padding:0}
#ann-fab svg{width:28px;height:28px}
#ann-fab.drag{cursor:grabbing;transform:scale(1.08)}
#ann-fab.act::after{content:'';position:absolute;right:-2px;top:-2px;width:14px;height:14px;border-radius:50%;background:#22C55E;border:2px solid #fff}
#ann-bar{position:fixed;z-index:9001;background:#fff;border:3px solid #0B2A5B;border-radius:16px;box-shadow:0 10px 28px rgba(11,42,91,.35);padding:6px;display:flex;flex-direction:column;gap:4px;width:54px;max-height:calc(100vh - 24px);overflow-y:auto;scrollbar-width:none}
#ann-bar.hidden,#ann-fab.hidden{display:none}
#ann-bar button{width:38px;height:38px;border-radius:10px;border:2px solid transparent;background:#F2F5FA;color:#0B2A5B;display:grid;place-items:center;cursor:pointer;padding:0;position:relative;flex:none;margin:0 auto}
#ann-bar button svg{width:22px;height:22px}
#ann-bar button:hover{border-color:#0B2A5B}
#ann-bar button.on{background:#0B2A5B;color:#fff}
#ann-bar button.on svg [stroke="#FFC21A"]{stroke:#FFC21A}
#ann-bar .sep{height:2px;background:#E3E8F0;margin:2px 4px;flex:none}
#ann-bar .sw{width:34px;height:20px;border-radius:6px;border:2px solid rgba(0,0,0,.2);flex:none}
#ann-bar .sw.on{outline:3px solid #0B2A5B;outline-offset:1px}
#ann-bar .sz i{display:block;border-radius:50%;background:currentColor}
#ann-bar .tip{position:absolute;left:46px;top:50%;transform:translateY(-50%);background:#0B2A5B;color:#fff;font:700 12px Inter,sans-serif;padding:4px 8px;border-radius:6px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s}
#ann-bar button:hover .tip{opacity:1}
#ann-bar.right .tip{left:auto;right:46px}
#ann-drop{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9003;width:64px;height:64px;border-radius:50%;background:rgba(227,36,43,.9);color:#fff;display:none;place-items:center;font:900 30px sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.3)}
#ann-drop.show{display:grid}#ann-drop.hot{transform:translateX(-50%) scale(1.25)}
body.ann-draw{user-select:none;-webkit-user-select:none}
@media print{#ann-cv,#ann-bar,#ann-fab{display:none!important}}`;
    document.head.appendChild(s);
  }
  function resize() {
    dpr = window.devicePixelRatio || 1; cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); redraw();
  }
  function drawStroke(s) {
    if (!s.pts.length) return; ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = s.color; ctx.lineWidth = s.size; ctx.globalAlpha = 1;
    if (s.tool === 'hl') { ctx.globalAlpha = .35; ctx.lineWidth = s.size * 4 + 8; ctx.lineCap = 'butt'; }
    if (s.tool === 'laser') { ctx.globalAlpha = s.alpha == null ? 1 : s.alpha; ctx.strokeStyle = '#ff2a2a'; ctx.lineWidth = 5; ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 14; }
    const p = s.pts;
    if (s.tool === 'arrow' || s.tool === 'rect') {
      const [a, b] = [p[0], p[p.length - 1]];
      ctx.beginPath();
      if (s.tool === 'rect') ctx.rect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
      else { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 12 + s.size * 2.5;
        ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - L * Math.cos(ang - .45), b[1] - L * Math.sin(ang - .45));
        ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - L * Math.cos(ang + .45), b[1] - L * Math.sin(ang + .45)); }
      ctx.stroke(); ctx.restore(); return;
    }
    ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
    if (p.length === 1) ctx.lineTo(p[0][0] + .1, p[0][1] + .1);
    for (let i = 1; i < p.length - 1; i++) { const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2; ctx.quadraticCurveTo(p[i][0], p[i][1], mx, my); }
    if (p.length > 1) ctx.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
    ctx.stroke(); ctx.restore();
  }
  function redraw() { ctx.clearRect(0, 0, innerWidth, innerHeight); if (!visible) return; strokes.forEach(drawStroke); if (cur) drawStroke(cur); }
  function fadeLaser() {
    if (laserT) return;
    const step = () => { let alive = false; strokes.forEach(s => { if (s.tool === 'laser' && s.done) { s.alpha = (s.alpha == null ? 1 : s.alpha) - .04; if (s.alpha > 0) alive = true; } else if (s.tool === 'laser') alive = true; });
      strokes = strokes.filter(s => s.tool !== 'laser' || s.alpha == null || s.alpha > 0); redraw(); laserT = alive ? requestAnimationFrame(step) : null; };
    laserT = requestAnimationFrame(step);
  }
  function erase(x, y) { const r = 14; const before = strokes.length; strokes = strokes.filter(s => !s.pts.some(([a, b]) => Math.hypot(a - x, b - y) < r + s.size)); if (strokes.length !== before) redraw(); }
  function pointer() {
    cv.addEventListener('pointerdown', e => {
      if (tool === 'cursor') return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { }
      if (!visible) { visible = true; mark(); }
      if (tool === 'eraser') { cur = { tool: 'eraser', pts: [] }; erase(e.clientX, e.clientY); return; }
      cur = { tool, color: st.color, size: st.size, pts: [[e.clientX, e.clientY]] }; redraw();
    });
    cv.addEventListener('pointermove', e => {
      if (!cur) return; e.preventDefault();
      if (cur.tool === 'eraser') { erase(e.clientX, e.clientY); return; }
      const pts = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      if (cur.tool === 'arrow' || cur.tool === 'rect') cur.pts[1] = [e.clientX, e.clientY];
      else pts.forEach(ev => cur.pts.push([ev.clientX, ev.clientY]));
      redraw();
    });
    const end = () => { if (!cur) return; if (cur.tool !== 'eraser') { cur.done = true; strokes.push(cur); if (cur.tool === 'laser') setTimeout(fadeLaser, 700); } cur = null; redraw(); };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  }
  const BTN = [
    ['cursor', 'Cursor (usar la página)'], ['pen', 'Lápiz'], ['hl', 'Resaltador'], ['arrow', 'Flecha'], ['rect', 'Rectángulo'], ['laser', 'Puntero láser'], ['eraser', 'Borrador'],
  ];
  function buildBar() {
    bar = document.createElement('div'); bar.id = 'ann-bar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Barra del profesor');
    bar.innerHTML = BTN.map(([k, t]) => `<button data-t="${k}" aria-label="${t}">${I[k]}<span class="tip">${t}</span></button>`).join('') +
      `<div class="sep"></div><button class="sz" data-a="size" aria-label="Grosor"><i></i><span class="tip">Grosor</span></button>` +
      COLORS.map(c => `<button class="sw" data-c="${c}" style="background:${c}" aria-label="Color ${c}"></button>`).join('') +
      `<div class="sep"></div><button data-a="undo" aria-label="Deshacer">${I.undo}<span class="tip">Deshacer</span></button>` +
      `<button data-a="clear" aria-label="Borrar todo">${I.trash}<span class="tip">Borrar todo</span></button>` +
      `<button data-a="eye" aria-label="Mostrar u ocultar trazos">${I.eye}<span class="tip">Ocultar / mostrar trazos</span></button>` +
      `<div class="sep"></div><button data-a="min" aria-label="Minimizar">${I.min}<span class="tip">Minimizar</span></button>` +
      `<button data-a="close" aria-label="Quitar barra">${I.close}<span class="tip">Quitar la barra</span></button>`;
    document.body.appendChild(bar);
    bar.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.t) { setTool(b.dataset.t); return; }
      if (b.dataset.c) { st.color = b.dataset.c; save(); if (tool === 'cursor' || tool === 'eraser' || tool === 'laser') setTool('pen'); mark(); return; }
      const a = b.dataset.a;
      if (a === 'size') { st.size = SIZES[(SIZES.indexOf(st.size) + 1) % SIZES.length]; save(); mark(); }
      if (a === 'undo') { for (let i = strokes.length - 1; i >= 0; i--) if (strokes[i].tool !== 'laser') { strokes.splice(i, 1); break; } redraw(); }
      if (a === 'clear') { strokes = []; redraw(); }
      if (a === 'eye') { visible = !visible; redraw(); mark(); }
      if (a === 'min') { st.open = false; save(); setTool('cursor'); layout(); }
      if (a === 'close') hide(true);
    });
  }
  function setTool(t) { tool = t; cv.classList.toggle('on', t !== 'cursor'); document.body.classList.toggle('ann-draw', t !== 'cursor'); cv.style.cursor = t === 'eraser' ? 'cell' : t === 'laser' ? 'pointer' : ''; mark(); }
  function mark() {
    if (!bar) return;
    bar.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === tool));
    bar.querySelectorAll('[data-c]').forEach(b => b.classList.toggle('on', b.dataset.c === st.color));
    const z = bar.querySelector('.sz i'); const d = 4 + SIZES.indexOf(st.size) * 4; z.style.width = z.style.height = d + 'px'; z.style.background = st.color === '#FFFFFF' ? '#0B2A5B' : st.color;
    const ey = bar.querySelector('[data-a="eye"]'); ey.classList.toggle('on', !visible);
    fab.classList.toggle('act', tool !== 'cursor');
  }
  function layout() {
    const fx = st.x == null ? 12 : Math.min(Math.max(4, st.x * innerWidth), innerWidth - 56), fy = st.y == null ? 110 : Math.min(Math.max(4, st.y * innerHeight), innerHeight - 56);
    fab.style.left = fx + 'px'; fab.style.top = fy + 'px';
    bar.classList.toggle('hidden', !st.open || st.hidden); fab.classList.toggle('hidden', st.hidden);
    if (st.open && !st.hidden) {
      const right = fx > innerWidth / 2; bar.classList.toggle('right', right);
      const bw = 60, bh = bar.offsetHeight; const top = Math.min(Math.max(8, fy - 6), Math.max(8, innerHeight - bh - 8));
      bar.style.left = (right ? Math.max(4, fx - bw - 6) : Math.min(fx + 58, innerWidth - bw - 4)) + 'px'; bar.style.top = top + 'px';
    }
  }
  function buildFab() {
    fab = document.createElement('button'); fab.id = 'ann-fab'; fab.title = 'Barra del profesor: escribe y señala en la pantalla (arrástrala; suéltala en la ✕ para quitarla)'; fab.setAttribute('aria-label', 'Barra del profesor'); fab.innerHTML = I.logo;
    drop = document.createElement('div'); drop.id = 'ann-drop'; drop.textContent = '✕';
    document.body.appendChild(fab); document.body.appendChild(drop);
    let sx, sy, ox, oy, moved = false, down = false;
    const over = (x, y) => { const r = drop.getBoundingClientRect(); return x > r.left - 20 && x < r.right + 20 && y > r.top - 20 && y < r.bottom + 20; };
    fab.addEventListener('pointerdown', e => { down = true; moved = false; sx = e.clientX; sy = e.clientY; const r = fab.getBoundingClientRect(); ox = r.left; oy = r.top; try { fab.setPointerCapture(e.pointerId); } catch (x) { } });
    fab.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (!moved && Math.hypot(dx, dy) < 8) return;
      if (!moved) { drop.classList.add('show'); bar.classList.add('hidden'); } moved = true; fab.classList.add('drag');
      fab.style.left = Math.min(Math.max(4, ox + dx), innerWidth - 56) + 'px'; fab.style.top = Math.min(Math.max(4, oy + dy), innerHeight - 56) + 'px'; drop.classList.toggle('hot', over(e.clientX, e.clientY)); });
    const up = e => { if (!down) return; down = false; fab.classList.remove('drag');
      if (moved) { drop.classList.remove('show', 'hot'); if (e && over(e.clientX, e.clientY)) { hide(true); return; }
        const r = fab.getBoundingClientRect(); st.x = r.left / innerWidth; st.y = r.top / innerHeight; save(); layout(); } };
    fab.addEventListener('pointerup', up); fab.addEventListener('pointercancel', () => up(null));
    fab.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; return; } st.open = !st.open; save(); if (st.open && tool === 'cursor') setTool('pen'); if (!st.open) setTool('cursor'); layout(); });
  }
  function toast(msg) { if (window.M1 && M1.toast) M1.toast(msg); }
  function hide(fromUser) { st.hidden = true; st.open = false; save(); setTool('cursor'); strokes = []; redraw(); layout(); if (fromUser) toast('Barra del profesor oculta. Puedes volver a mostrarla desde el menú ☰ (o el botón ✏️ del perfil).'); window.dispatchEvent(new Event('mra-ann-change')); }
  function show() { if (!isStaff()) return; init(); st.hidden = false; st.open = true; save(); setTool('pen'); layout(); window.dispatchEvent(new Event('mra-ann-change')); }
  let ready = false;
  function init() {
    if (ready || !isStaff()) return; ready = true; css();
    cv = document.createElement('canvas'); cv.id = 'ann-cv'; document.body.appendChild(cv); ctx = cv.getContext('2d');
    buildFab(); buildBar(); pointer(); resize(); mark(); layout();
    addEventListener('resize', () => { resize(); layout(); });
    addEventListener('keydown', e => { if (tool === 'cursor') return; if (e.key === 'Escape') setTool('cursor'); if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); bar.querySelector('[data-a="undo"]').click(); } });
  }
  function sync() { if (isStaff()) { init(); return; } if (!ready) return; [cv, bar, fab, drop].forEach(el => el && el.remove()); document.body.classList.remove('ann-draw'); strokes = []; ready = false; }
  window.MRANN = { show, hide: () => hide(true), isHidden: () => !!st.hidden, isStaff, init, sync };
  const boot = () => { if (isStaff()) init(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  // si el profe inicia o cierra sesión en el portal
  addEventListener('storage', e => { if (e.key === 'mra_profile_v1' && isStaff()) init(); });
})();
