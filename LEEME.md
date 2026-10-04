# Módulo 1 (A1) — mrarrieta.com

Plataforma interactiva del Módulo 1: 14 temas × 2 partes = 28 clases + examen final con certificado.

## Cómo publicarla (GitHub Pages)
1. En tu repositorio de GitHub (por ejemplo `mrarrieta-learning`) crea una carpeta, p. ej. `modulo-1/`.
2. Sube **todo el contenido** de esta carpeta (index.html, admin.html, css/, js/) respetando las subcarpetas. Son menos de 30 archivos, así que GitHub los acepta en una sola subida.
   - Consejo: en GitHub → *Add file → Upload files* → arrastra las carpetas completas.
3. Quedará en: `https://mrarrietaa-sys.github.io/mrarrieta-learning/modulo-1/`
4. Enlázala desde mrarrieta.com (botón o iframe a pantalla completa).

> Importante: ábrela siempre desde la URL de GitHub Pages (https). El micrófono y el reconocimiento de voz no funcionan si abres el archivo directamente desde tu computador.

## Bloquear / desbloquear temas
Todo se maneja en **js/config.js**:
- `FREE_TOPICS: [1, 2]` → temas gratis.
- `ACCESS_CODES` → códigos que desbloquean temas. Créalos con **admin.html** (te genera la línea para pegar).
- Código de ejemplo incluido: **MRARRIETA-A1** (desbloquea todo). Cámbialo o bórralo antes de publicar.
- `MUSIC` → enlaces "Play & Learn" por tema (vacío = la sección no aparece).
- `WHATSAPP`, `PASS_SCORE` (nota mínima del examen final).

## Estructura de cada clase (igual a tus clases)
GOAL → SPEAKING (listen and answer) → READING (listen and read + YES/NO) → REVIEW (clase anterior) → EXPLANATION (vocabulario + mini lección + tips de pronunciación) → LISTEN & PRACTICE (key questions) → PRACTICE (4–5 actividades) → ORAL TASK (reconocimiento de voz + grabación) → MUSIC (opcional) → HOMEWORK (escritura con corrección automática y envío por WhatsApp).

## Actividades incluidas
Listen and choose · Choose and listen · Listen and type (palabras, oraciones, letras, números, teléfonos, nombres deletreados) · Complete the sentence · Put the words in order · Memory game · Classify (sort) · Crossword · Speed challenge · Spell with tiles · Plurals · Dialogues (chat animado) · Voice recognition · Voice recording (compara tu voz con el nativo) · Reading con resaltado karaoke · Writing con feedback automático.

## Progreso
Se guarda en el dispositivo del estudiante (navegador). Incluye XP, racha de días, estrellas por clase, las 4 habilidades (listening, reading, speaking, writing), insignias y "palabras para repasar". Desde *Mi progreso* el estudiante puede descargar/restaurar un respaldo. Todo está en un solo objeto JSON, listo para conectarlo a la nube más adelante.

## Audios e imágenes
- 800+ audios con voces neuronales de inglés americano (femenina y masculina), empaquetados por tema en `js/audio/` (se cargan solo cuando el estudiante abre una clase).
- Fotos reales de Unsplash (se cargan desde images.unsplash.com, recortadas para encajar en cada recuadro) y banderas de flagcdn.com.

## Reconocimiento de voz
Funciona en Chrome y Edge (computador y Android). En Safari/iPhone o Firefox la plataforma cambia automáticamente a "grabar y comparar tu voz".
