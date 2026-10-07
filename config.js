/* =====================================================================
   CONFIGURACIÓN — Módulo 1 (A1) · mrarrieta.com
   Este es el ÚNICO archivo que necesitas editar para manejar accesos.
   ===================================================================== */
window.M1CONFIG = {

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
  //   module: 1-4 (opcional) = asignarle el módulo directamente sin examen de clasificación.
  // Código de ejemplo incluido: ESTUDIANTE-DEMO  (crea los tuyos en admin.html)
  STUDENT_CODES: [
    { hash: "h7kthe217u", note: "Estudiante de ejemplo (ESTUDIANTE-DEMO)" }
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
