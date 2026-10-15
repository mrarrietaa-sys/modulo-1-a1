/* =====================================================================
   CONFIGURACIÓN — Módulo 1 (A1) · mrarrieta.com
   Este es el ÚNICO archivo que necesitas editar para manejar accesos.
   ===================================================================== */
window.M1CONFIG = {

  // ☁️ NUBE: pega aquí la URL /exec de tu Apps Script (ver LEEME-NUBE.md).
  // Vacío = la plataforma funciona solo en este dispositivo (como antes).
  CLOUD_URL: "https://script.google.com/macros/s/AKfycbzGXtwZH_eBIPz01faL6e8cMydhW-0u2H4UtzdHQYCr8CqMG62Tdp1dNDZ4MY4khE0N/exec",

  // PLANES (se muestran a los estudiantes)
  PLANS: {
    membership: { name: "Membership", price: "$59.900", per: "/mes" },
    premium: { name: "Premium", price: "$349.000", per: "/mes" }
  },

  // MODO REVISIÓN GLOBAL: true = TODAS las clases y el examen abiertos para TODOS (no usar con estudiantes).
  // Los temas se abren en orden: el Topic 2 se abre al terminar Part 1 y Part 2 del Topic 1, etc.
  // El examen final solo se abre cuando el estudiante termina las 28 clases.
  UNLOCK_ALL: false,

  // CÓDIGO DE REVISIÓN DEL PROFE: escríbelo en "🔑 Código de acceso" para abrir todo SOLO en tu dispositivo.
  // Código incluido: PROFE-REVISION  (crea otro en admin.html si quieres cambiarlo)
  REVIEW_CODES: ["h12g15om1sv"],

  // Temas GRATIS (todos los estudiantes pueden entrar sin código).
  // Ejemplo: [1, 2] = The Greetings y The Alphabet son gratis.
  FREE_TOPICS: [1, 2],

  // CÓDIGOS DE ACCESO.
  // Cada código se guarda "cifrado" (hash). Para crear uno nuevo abre admin.html,
  // escribe el código que quieras y copia la línea que te genera aquí abajo.
  //   topics: "all"      → desbloquea TODO el módulo (incluye el examen final)
  //   topics: [3, 4, 5]  → desbloquea solo esos temas
  // Código de ejemplo incluido: MRARRIETA-A1  (cámbialo antes de publicar)
  ACCESS_CODES: [
    { hash: "hawb2iq1c9", topics: "all", note: "Código general de ejemplo (MRARRIETA-A1)" }
  ],

  // ===== PERFIL DEL ESTUDIANTE (index.html) =====
  // Códigos de ESTUDIANTE: entran a su perfil, toman la clasificación y estudian su módulo completo.
  //   module: 1-4 (opcional) = asignarle el módulo directamente sin prueba de clasificación.
  // Código de ejemplo incluido: ESTUDIANTE-DEMO  (crea los tuyos en admin.html)
  STUDENT_CODES: [
    { hash: "h7kthe217u", note: "Estudiante de ejemplo (ESTUDIANTE-DEMO)" },
    { hash: "h1ckadok1j3", module: 4, all: true, note: "Estudiante de REVISIÓN con todo habilitado (REVISION-TOTAL)" }
  ],
  // Códigos de ACCESO GRATUITO ("Empieza gratis"): clasificación + solo los 2 primeros temas.
  // Código de ejemplo incluido: GRATIS-DEMO
  TRIAL_CODES: [
    { hash: "h1hi92961dc", note: "Acceso gratuito de ejemplo (GRATIS-DEMO)" },
    { hash: "hy1dmj81xe", note: "Código de ejemplo anterior" }
  ],
  MODULE_ID: "A1",

  // WhatsApp de la escuela (con indicativo de país, sin + ni espacios)
  WHATSAPP: "573017810841",

  // Mensaje que se envía cuando el estudiante quiere comprar acceso
  BUY_MESSAGE: "¡Hola! Quiero desbloquear el Módulo 1 completo de mrarrieta.com 🚀",

  // Enlaces de MÚSICA ("Play & Learn") por tema. Déjalo vacío "" para ocultar la sección.
  // Por defecto todos los temas abren tu app "Music & English A1" (Play & Learn).
  MUSIC: {
    1: "https://mrarrietaa-sys.github.io/mrarrieta-learningre/", 2: "https://mrarrietaa-sys.github.io/mrarrieta-learningre/",
    3: "https://mrarrietaa-sys.github.io/mrarrieta-learningre/", 4: "https://mrarrietaa-sys.github.io/mrarrieta-learningre/",
    5: "https://mrarrietaa-sys.github.io/mrarrieta-learningre/", 6: "https://mrarrietaa-sys.github.io/mrarrieta-learningre/",
    7: "https://mrarrietaa-sys.github.io/mrarrieta-learningre/", 8: "https://mrarrietaa-sys.github.io/mrarrieta-learningre/",
    9: "https://mrarrietaa-sys.github.io/mrarrieta-learningre/", 10: "https://mrarrietaa-sys.github.io/mrarrieta-learningre/",
    11: "https://mrarrietaa-sys.github.io/mrarrieta-learningre/", 12: "https://mrarrietaa-sys.github.io/mrarrieta-learningre/",
    13: "https://mrarrietaa-sys.github.io/mrarrieta-learningre/", 14: "https://mrarrietaa-sys.github.io/mrarrieta-learningre/"
  },

  // Hora sugerida para el recordatorio diario de tareas (formato 24 h)
  REMINDER_TIME: "19:00",

  // Porcentaje mínimo para aprobar el examen final
  PASS_SCORE: 50,

  // EXAMEN FINAL: códigos para dar un intento adicional (después de los 2 intentos).
  // Crea uno nuevo en admin.html → "Código de intento extra del examen". Cada código sirve una vez por dispositivo.
  // Código de ejemplo: EXAMEN-EXTRA
  EXAM_RETRY_CODES: [
    { hash: "hd0dg6i7qw", note: "EXAMEN-EXTRA (ejemplo)" },
  ],

  // DOCENTES para el chat (vista previa).
  // code = código que le das al estudiante para conectarse con su profe.
  // pin  = clave del docente para entrar a docente.html.
  // ⚠️ En la vista previa esto es visible en el código; cuando conectemos el servidor se volverá privado.
  TEACHERS: [
    { code: "PROFE-DEMO", name: "Mr. Arrieta", pin: "1234" },
  ]
};

// sin emojis en los mensajes de WhatsApp (algunos WhatsApp los muestran como �)
window.MRNE = (t) => String(t == null ? '' : t).replace(/[\u{1F000}-\u{1FAFF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}]/gu, '').replace(/ {2,}/g, ' ').replace(/ ([.,!?)])/g, '$1').trim();
// ✉️ correos de exámenes con el MISMO diseño de los correos de la plataforma (plantilla general de EmailJS)
window.MRMAIL_TEMPLATE = 'template_rid8emw';
window.MRMAILX = function (p) {
  const base = new URL('.', location.href).href, e = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pt = /placement/i.test(p.module || ''), row = (a, b) => `<tr><td style="padding:8px 10px;border:1px solid #dfe3ea;background:#f4f6fa;font-weight:700;color:#0B2A5B;width:55%">${a}</td><td style="padding:8px 10px;border:1px solid #dfe3ea;font-weight:700;text-align:right">${b}</td></tr>`;
  const title = pt ? '📝 Resultado de tu prueba de clasificación' : '🎓 Resultado de tu examen final';
  const body = `<p>Hola <b>${e(p.student_name)}</b>, ya tenemos tu resultado en <b>mrarrieta.com</b>. Aquí está tu resumen completo.</p>
    <div style="border-left:6px solid ${p.result_color || '#0B2A5B'};background:#f4f7fc;border-radius:12px;padding:14px 16px;margin:14px 0"><div style="font-size:12px;letter-spacing:2px;color:#4A5B78;font-weight:700;text-transform:uppercase">${e(p.result_label)}</div><div style="font-size:24px;font-weight:800;color:${p.result_color || '#0B2A5B'};margin:4px 0">${e(p.result_headline)}</div><div style="color:#0B2A5B">${e(p.result_detail)}</div></div>
    <table style="width:100%;border-collapse:collapse;margin:14px 0;font-size:15px">${row('🎧 Listening', p.listening_score + ' / 10.0')}${row('📖 Reading', p.reading_score + ' / 10.0')}${row('✍️ Writing', p.writing_score + ' / 10.0')}${row('🎤 Speaking', p.speaking_score + ' / 10.0')}<tr><td style="padding:10px;border:1px solid #dfe3ea;background:#0B2A5B;color:#fff;font-weight:800">Puntaje general</td><td style="padding:10px;border:1px solid #dfe3ea;font-weight:800;font-size:18px;color:#E3242B;text-align:right">${e(p.final_score)} / 10.0</td></tr></table>
    ${p.feedback ? `<p style="padding:12px 14px;background:#fff6e0;border-left:4px solid #E3242B;border-radius:8px"><b>💬 Comentario:</b> ${e(p.feedback)}</p>` : ''}
    ${p.next_steps_display !== 'none' && p.next_steps_text ? `<p style="padding:12px 14px;background:#eaf1fd;border-left:4px solid #1D5FD1;border-radius:8px"><b>🚀 Próximos pasos:</b><br>${e(p.next_steps_text).replace(/\n/g, '<br>')}</p>` : ''}
    <p style="font-size:13px;color:#667">📅 ${e(p.date)} · ${e(p.time)} · ${e(p.attempt_label)} · ${e(p.status)}</p>
    <p style="text-align:center;margin-top:18px"><a href="${base}" style="display:inline-block;background:#E3242B;color:#fff;text-decoration:none;font-weight:800;padding:12px 22px;border-radius:12px;border:3px solid #0B2A5B">Entrar a mi plataforma →</a></p>`;
  const html = `<div style="background:#f4f6fa;padding:20px 10px;font-family:Arial,Helvetica,sans-serif"><div style="max-width:560px;margin:0 auto;background:#fff;border:3px solid #0B2A5B;border-radius:16px;overflow:hidden"><div style="background:#ffffff;padding:20px 20px 16px;text-align:center;border-bottom:1px solid #e2e8f0"><img src="${base}mra-brand.png" alt="mrarrieta.com" style="height:64px"></div><div style="height:6px;background:#E3242B"></div><div style="padding:22px 22px 10px;color:#1a202c;line-height:1.55"><h1 style="font-size:22px;color:#0B2A5B;margin:0 0 12px">${title}</h1>${body}</div><div style="padding:14px 22px 20px;font-size:12.5px;color:#4a5568;border-top:1px solid #e2e8f0">mrarrieta.com · ¡Aprende inglés HABLANDO! · WhatsApp <a href="https://wa.me/573017810841">3017810841</a></div></div></div>`;
  return { subject: p.subject, message_html: html, bcc: '' };
};
