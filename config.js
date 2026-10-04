/* =====================================================================
   CONFIGURACIÓN — Módulo 1 (A1) · mrarrieta.com
   Este es el ÚNICO archivo que necesitas editar para manejar accesos.
   ===================================================================== */
window.M1CONFIG = {

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

  // WhatsApp de la escuela (con indicativo de país, sin + ni espacios)
  WHATSAPP: "573017810841",

  // Mensaje que se envía cuando el estudiante quiere comprar acceso
  BUY_MESSAGE: "¡Hola! Quiero desbloquear el Módulo 1 completo de mrarrieta.com 🚀",

  // Enlaces de MÚSICA ("Play & Learn") por tema. Déjalo vacío "" para ocultar la sección.
  // Ejemplo: 1: "https://mrarrieta.com/music-greetings"
  MUSIC: {
    1: "", 2: "", 3: "", 4: "", 5: "", 6: "", 7: "",
    8: "", 9: "", 10: "", 11: "", 12: "", 13: "", 14: ""
  },

  // Porcentaje mínimo para aprobar el examen final
  PASS_SCORE: 70
};
