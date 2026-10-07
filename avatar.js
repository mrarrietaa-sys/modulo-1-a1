/* =====================================================================
   MI MR. ARRIETA — avatar personalizable (pose, ropa, sombrero, fondo)
   Recolorea la camiseta / pantalón / zapatos en un canvas y dibuja el sombrero.
   window.MRAV { POSES, SHIRTS, PANTS, SHOES, HATS, BGS, STICKERS, full(cfg, pose), head(cfg), def, applyGuide }
   ===================================================================== */
(function () {
  const POSES = ['welcome', 'smile', 'thumbs', 'celebrate', 'wink', 'wow', 'idea', 'point', 'pointside', 'present', 'shrug', 'think', 'watch'];
  // ancla del sombrero por pose (x, y en px de la imagen de 800 px de alto; rot en grados)
  const HEAD = { celebrate: [243, 46, 15], idea: [183, 46, 0], point: [182, 44, -3], pointside: [144, 46, 15], present: [95, 46, -10], shrug: [253, 46, 16], smile: [170, 45, 3],
    think: [251, 48, 22], thumbs: [208, 47, 4], watch: [165, 45, 0], welcome: [231, 46, 17], wink: [174, 44, -2], wow: [229, 46, 10] };
  const SHIRTS = [['', 'Negra (original)', '#1b1b1b'], ['#E3242B', 'Roja', '#E3242B'], ['#0B2A5B', 'Azul navy', '#0B2A5B'], ['#f2f2f2', 'Blanca', '#f2f2f2'], ['#FFC21A', 'Amarilla', '#FFC21A'],
    ['#2E9E5B', 'Verde', '#2E9E5B'], ['#3AA0E8', 'Azul cielo', '#3AA0E8'], ['#7B4BC4', 'Morada', '#7B4BC4'], ['#F07AB0', 'Rosada', '#F07AB0'], ['#8A8F98', 'Gris', '#8A8F98'], ['#F27A1A', 'Naranja', '#F27A1A']];
  const PANTS = [['', 'Jean azul (original)', '#3f6fb0'], ['#2a2a2a', 'Negro', '#2a2a2a'], ['#c8a97a', 'Caqui', '#c8a97a'], ['#8a8f98', 'Gris', '#8a8f98'], ['#ececec', 'Blanco', '#ececec'], ['#0B2A5B', 'Navy', '#0B2A5B'], ['#6b4a2e', 'Café', '#6b4a2e']];
  const SHOES = [['', 'Blancos (original)', '#f4f4f4'], ['#222222', 'Negros', '#222'], ['#E3242B', 'Rojos', '#E3242B'], ['#0B2A5B', 'Navy', '#0B2A5B'], ['#FFC21A', 'Amarillos', '#FFC21A'], ['#2E9E5B', 'Verdes', '#2E9E5B']];
  // sombreros: caja de 100 × 70 unidades; (50, 62) se apoya sobre la cabeza
  const HATS = {
    none: { es: 'Sin sombrero', p: [] },
    cap: { cw: 76, f: 1.06, y: 64, es: 'Gorra', p: [['#E3242B', 'M12 62 C10 14 90 14 88 62 Z'], ['#0B2A5B', 'M58 56 C78 52 104 54 112 63 C96 69 70 67 58 63 Z'], ['#0B2A5B', 'M12 58 H88 V63 H12 Z'], ['#ffffff', 'M47 20 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0']] },
    grad: { cw: 60, f: 1.02, y: 62, es: 'Birrete de graduado', p: [['#0B2A5B', 'M20 34 L20 58 C20 66 80 66 80 58 L80 34 L50 44 Z'], ['#13396f', 'M50 8 L104 28 L50 48 L-4 28 Z'], ['#FFC21A', 'M50 27 L88 34 L88 58 L84 58 L84 37 L50 30 Z'], ['#FFC21A', 'M80 56 h12 v12 h-12 z']] },
    beanie: { cw: 76, f: 1.08, y: 70, es: 'Gorro de lana', p: [['#E3242B', 'M12 62 C8 10 92 10 88 62 Z'], ['#0B2A5B', 'M8 50 H92 V64 H8 Z'], ['#ffffff', 'M38 8 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0'], ['#ffffff', 'M8 55 H92 V58 H8 Z']] },
    cowboy: { cw: 52, f: 0.98, y: 66, es: 'Sombrero vaquero', p: [['#8B5A2B', 'M24 54 C20 20 34 8 50 16 C66 8 80 20 76 54 Z'], ['#5a3a1a', 'M24 46 H76 V54 H24 Z'], ['#9c6633', 'M-14 50 C0 70 100 70 114 50 C104 56 90 58 76 54 L24 54 C10 58 -4 56 -14 50 Z']] },
    crown: { cw: 80, f: 0.82, y: 56, es: 'Corona', p: [['#FFC21A', 'M10 62 L8 18 L29 38 L50 6 L71 38 L92 18 L90 62 Z'], ['#e0a400', 'M10 52 H90 V62 H10 Z'], ['#E3242B', 'M44 46 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0'], ['#3AA0E8', 'M22 48 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0'], ['#2E9E5B', 'M70 48 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0']] },
    party: { cw: 60, f: 0.56, y: 50, es: 'Gorro de fiesta', p: [['#3AA0E8', 'M50 -18 L80 62 L20 62 Z'], ['#FFC21A', 'M41 6 L59 6 L63 18 L37 18 Z'], ['#FFC21A', 'M30 36 L70 36 L74 48 L26 48 Z'], ['#E3242B', 'M42 -20 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0']] },
    tophat: { cw: 52, f: 0.86, y: 62, es: 'Sombrero de copa', p: [['#1b1b1b', 'M24 -16 H76 V56 H24 Z'], ['#E3242B', 'M24 38 H76 V48 H24 Z'], ['#1b1b1b', 'M2 54 C2 66 98 66 98 54 C98 50 2 50 2 54 Z']] },
    chef: { cw: 56, f: 0.98, y: 62, es: 'Gorro de chef', p: [['#ffffff', 'M22 62 V36 C0 38 0 6 24 10 C30 -10 70 -10 76 10 C100 6 100 38 78 36 V62 Z'], ['#dddddd', 'M22 50 H78 V62 H22 Z'], ['#cfcfcf', 'M36 36 V50 M50 34 V50 M64 36 V50']] },
    helmet: { cw: 80, f: 1.12, y: 66, es: 'Casco de obra', p: [['#FFC21A', 'M10 60 C8 6 92 6 90 60 Z'], ['#e0a400', 'M44 8 H56 V60 H44 Z'], ['#FFC21A', 'M-2 56 H102 V64 H-2 Z']] },
  };
  const BGS = { red: ['#E3242B', '#ff6b6b'], navy: ['#0B2A5B', '#2f5fa8'], yellow: ['#FFC21A', '#ffe38a'], sky: ['#3AA0E8', '#bfe4ff'], green: ['#2E9E5B', '#a6e3bd'], purple: ['#7B4BC4', '#d3bdf5'], pink: ['#F07AB0', '#ffd3e6'], white: ['#ffffff', '#e9eef6'], usa: ['#0B2A5B', '#E3242B'] };
  const STICKERS = ['', '⭐', '🏆', '📚', '🎸', '⚽', '☕', '❤️', '🇺🇸', '🚀', '🎧', '🔥'];
  const def = () => ({ pose: 'welcome', shirt: '', pants: '', shoes: '', hat: 'none', bg: 'red', sticker: '' });

  const imgs = {};
  const load = (pose) => imgs[pose] || (imgs[pose] = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `mra-${pose}.webp`; }));
  const rgb = (hx) => { const n = parseInt(hx.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const clamp = (v) => v < 0 ? 0 : v > 255 ? 255 : v;
  const key = (c, pose) => [pose || c.pose, c.shirt, c.pants, c.shoes, c.hat].join('|');
  const cache = {};

  const PADY = 110, PADX = 70;
  function drawHat(ctx, hat, pose, scale) {
    const H = HATS[hat]; if (!H || !H.p.length) return; const [x, , r] = HEAD[pose] || [180, 46, 0];
    // el sombrero se ajusta al ancho de la cabeza (~140 px) y baja hasta la línea del cabello
    const ay = H.y + Math.abs(r) * 0.25;
    ctx.save(); ctx.translate((x + PADX) * scale, (ay + PADY) * scale); ctx.rotate(r * Math.PI / 180); const s = (140 * H.f / H.cw) * scale; ctx.scale(s, s); ctx.translate(-50, -62);
    ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 4;
    H.p.forEach(([f, d]) => { const p = new Path2D(d); if (/^M\d+ \d+ V\d+ M/.test(d)) { ctx.strokeStyle = f; ctx.lineWidth = 2; ctx.stroke(p); } else { ctx.fillStyle = f; ctx.fill(p); } });
    ctx.restore();
  }
  // canvas con el personaje vestido (sin fondo)
  async function canvas(c, pose) {
    pose = pose || c.pose || 'welcome'; const im = await load(pose);
    const W = im.naturalWidth, H0 = im.naturalHeight, sc = H0 / 800; const pad = (c.hat && c.hat !== 'none') ? Math.round(PADY * sc) : 0; const px = pad ? Math.round(PADX * sc) : 0; const Hh = H0 + pad;
    const cv = document.createElement('canvas'); cv.width = W + 2 * px; cv.height = Hh; const ctx = cv.getContext('2d'); ctx.drawImage(im, px, pad); cv._pad = pad; cv._px = px;
    if (c.shirt || c.pants || c.shoes) {
      try {
        const CW = cv.width; const d = ctx.getImageData(0, 0, CW, Hh), a = d.data; const S = c.shirt && rgb(c.shirt), P = c.pants && rgb(c.pants), Z = c.shoes && rgb(c.shoes);
        const light = S && (S[0] + S[1] + S[2]) > 600;
        for (let y = Math.round(145 * sc) + pad; y < Hh; y++) {
          const yy = (y - pad) / sc;
          for (let x = 0; x < CW; x++) {
            const i = (y * CW + x) * 4; if (a[i + 3] < 20) continue;
            const r = a[i], g = a[i + 1], b = a[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            if (S && yy < 470 && mx < 118 && mx - mn < 36 && !(b > r + 14)) {
              const t = Math.min(1, mx / 62); const k = light ? .72 + .32 * t : .42 + .78 * t; const hi = t * t * 28;
              a[i] = clamp(S[0] * k + hi); a[i + 1] = clamp(S[1] * k + hi); a[i + 2] = clamp(S[2] * k + hi);
            } else if (P && yy > 360 && yy < 760 && b > r + 18 && b >= g) {
              const t = mx / 150; a[i] = clamp(P[0] * t); a[i + 1] = clamp(P[1] * t); a[i + 2] = clamp(P[2] * t);
            } else if (Z && yy > 540 && mx - mn < 34 && !(b > r + 14) && (yy > 680 ? mn > 70 : mn > 105)) {
              const t = mx / 255; const k = (Z[0] + Z[1] + Z[2]) < 150 ? .35 + .65 * t * t : .55 + .45 * t;
              a[i] = clamp(Z[0] * k + (1 - k) * 30 * t); a[i + 1] = clamp(Z[1] * k + (1 - k) * 30 * t); a[i + 2] = clamp(Z[2] * k + (1 - k) * 30 * t);
            }
          }
        }
        ctx.putImageData(d, 0, 0);
      } catch (e) { /* canvas protegido: se queda con la ropa original */ }
    }
    if (pad) { ctx.save(); ctx.translate(0, 0); drawHat(ctx, c.hat, pose, sc); ctx.restore(); }
    return cv;
  }
  // URL del personaje completo (para la guía y la vista previa)
  function full(c, pose) {
    c = Object.assign(def(), c || {}); const k = key(c, pose);
    return cache[k] || (cache[k] = canvas(c, pose).then(cv => new Promise(res => { try { cv.toBlob(b => res(b ? URL.createObjectURL(b) : cv.toDataURL()), 'image/png'); } catch (e) { res(`mra-${pose || c.pose}.webp`); } })).catch(() => `mra-${pose || c.pose}.webp`));
  }
  // foto de perfil cuadrada (cabeza + fondo) → dataURL JPEG pequeña
  async function head(c, size = 256) {
    c = Object.assign(def(), c || {}); const cv = await canvas(c, c.pose); const sc = cv.height / 800; const [x] = HEAD[c.pose] || [180];
    const o = document.createElement('canvas'); o.width = o.height = size; const ctx = o.getContext('2d');
    const bg = BGS[c.bg] || BGS.red; const g = ctx.createLinearGradient(0, 0, size, size); g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    const box = 330 * sc, top = cv._pad ? (cv._pad - 122 * sc) : 0; // incluye el sombrero
    ctx.drawImage(cv, x * sc + (cv._px || 0) - box / 2, top, box, box, 0, 0, size, size);
    return o.toDataURL('image/jpeg', .86);
  }
  // reemplaza las imágenes de Mr. Arrieta por la versión personalizada del estudiante
  let obs = null;
  function applyGuide(c) {
    if (obs) { obs.disconnect(); obs = null; }
    if (!c) return;
    const swap = (img) => { if (img.closest && img.closest('[data-noguide]')) return; const m = (img.getAttribute('src') || '').match(/^mra-([a-z]+)\.webp$/); if (!m || POSES.indexOf(m[1]) < 0) return; img.dataset.mra = m[1]; full(c, m[1]).then(u => { if (img.dataset.mra === m[1]) img.src = u; }); };
    const scan = (root) => { if (root.tagName === 'IMG') swap(root); root.querySelectorAll && root.querySelectorAll('img[src^="mra-"]').forEach(swap); };
    scan(document.body);
    obs = new MutationObserver(ms => ms.forEach(m => { if (m.type === 'attributes') swap(m.target); else m.addedNodes.forEach(n => n.nodeType === 1 && scan(n)); }));
    obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  }
  // fondo de la floating bubble del diccionario usa background-image? (no) — solo <img>
  window.MRAV = { POSES, SHIRTS, PANTS, SHOES, HATS, BGS, STICKERS, def, full, head, applyGuide };
  // al cargar cualquier página: si el estudiante activó su guía personalizada
  document.addEventListener('DOMContentLoaded', () => { try { const p = JSON.parse(localStorage.getItem('mra_profile_v1') || 'null'); if (p && p.look && p.look.guide && p.look.av) applyGuide(p.look.av); } catch (e) { } });
})();
