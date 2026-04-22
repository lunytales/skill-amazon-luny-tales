# Documentación Técnica Completa - Skill Cuentos Luna (LunyTales)

Actualizado: 2026-03-17

## 1) Estado ejecutivo actual
La skill está funcional en nivel de backend y modelo de interacción, con:
- Flujo por voz operativo (`cuento` / `música`).
- Reproducción AudioPlayer operativa.
- Encadenamiento de pistas operativo.
- Cierre silencioso operativo.
- Widgets implementados y validados por evento técnico (`UserEvent`) para:
  - `MusicWidget`
  - `StoryWidget`
- Build/Validation ejecutado sin errores.
- Envío a revisión de certificación realizado (`Submit for review`).

## 2) Identidad y naming
- Marca/empresa: `LunyTales` (históricamente también `Luma Tales`).
- Nombre de skill mostrado: `Cuentos Luna`.
- Invocation name final en es-MX: `cuentos luna`.

Decisión de invocation:
- Se probaron variantes (`cuentos luny`, nombre de empresa, etc.).
- Por reconocimiento ASR en dispositivos reales, `cuentos luna` resultó más estable.

## 3) Alcance funcional implementado
### Flujo por voz (actual)
1. Usuario: `Alexa, abre cuentos luna`
2. Skill pregunta: cuento o música.
3. Usuario responde.
4. Skill ejecuta reproducción según elección.

### Escenario cuento
- Selecciona aleatoriamente 1 de 3 cuentos.
- Reproduce cuento.
- En `PlaybackNearlyFinished`, encola canción asociada 1:1.
- Termina en silencio (sin outputSpeech final).

### Escenario música
- Selecciona una pista aleatoria.
- Encola pistas hasta aproximar 20 minutos acumulados.
- Termina en silencio.

### Comandos de control
- `AMAZON.StopIntent`
- `AMAZON.CancelIntent`
- `AMAZON.PauseIntent`

## 4) Inventario de audios (S3)
Base URL:
- `https://luma-tales-audio.s3.us-east-2.amazonaws.com/`

Cuentos:
- `cuento-uno.mp3` -> `¿Quién vive en la cueva?`
- `cuento-dos.mp3` -> `Donde florecen los deseos`
- `cuento-tres.mp3` -> `Lira y la lluvia de risas`

Música:
- `m-1.mp3`
- `m-2.mp3`
- `m-3.mp3`
- `m-4.mp3`
- `m-5.mp3`
- `m-6.mp3`
- `m-7.mp3`
- `m-8.mp3`

Mapeo cuento -> canción asociada:
- `cuento-uno` (`¿Quién vive en la cueva?`) -> `m-1`
- `cuento-dos` (`Donde florecen los deseos`) -> `m-2`
- `cuento-tres` (`Lira y la lluvia de risas`) -> `m-3`

## 5) Duraciones reales usadas para el cálculo de ~20 min
- `m-1`: 228911 ms
- `m-2`: 224470 ms
- `m-3`: 233718 ms
- `m-4`: 157597 ms
- `m-5`: 227422 ms
- `m-6`: 233613 ms
- `m-7`: 233796 ms
- `m-8`: 150152 ms

Notas:
- El objetivo es aproximado (no exactitud matemática al segundo).
- Si cambian audios, deben actualizarse estos `ms` en el código.

## 6) UX writing final implementado
- Saludo: `¡Hola! Soy Luny. ¿Qué te apetece hoy: cuento o música?`
- Música: `Perfecto. Empieza la música.`
- Cuento: `Me encanta. Que empiece el cuento.`
- No entiende: `Lo siento, no te entendí. ¿Prefieres cuento o música?`
- Reprompt: `¿Sigues ahí? Elige: cuento o música.`
- Stop/Cancel/Pause: `Hecho.`

Criterio de contenido:
- Tono humano y corto.
- Sin menciones explícitas a niños (alineado con restricciones de publicación/COPPA).

## 7) Modelo de interacción (voz)
Archivo:
- `interaction-model/es-MX.json`

Configuración principal:
- Invocation: `cuentos luna`
- Intent principal de elección por slot: `ElegirAudioIntent`
- Slot: `tipo` de tipo `TIPO_AUDIO`
- Sinónimos cuento: relato, historia, etc.
- Sinónimos música: musica, canciones, etc.

## 8) Backend Lambda (arquitectura final)
Archivo:
- `lambda/index.mjs`

Función activa final:
- Nombre: `LunyTalesSK`
- Región: `us-east-1` (N. Virginia)
- Runtime: `Node.js 22.x`
- Trigger: Alexa Skills Kit (Skill ID enlazado)

Eventos manejados:
- `LaunchRequest`
- `IntentRequest`
- `AudioPlayer.PlaybackNearlyFinished`
- `AudioPlayer.PlaybackStarted`
- `AudioPlayer.PlaybackStopped`
- `AudioPlayer.PlaybackFinished`
- `Alexa.Presentation.APL.UserEvent` (widgets)

Puntos técnicos clave:
- Tokens codificados en base64url para estado de reproducción.
- Encolado con `ENQUEUE` y `expectedPreviousToken`.
- Respuestas vacías para cierre silencioso cuando corresponde.

## 9) Widgets (implementación completa)
Se implementaron 2 widgets (no 4):
- `MusicWidget`
- `StoryWidget`

Cada widget soporta 2 tamaños:
- `WIDGET_M`
- `WIDGET_XL`

Nota importante:
- `WIDGET_L` genera error de validación en consola actual.
- Valor válido usado: `WIDGET_XL`.

### Estructura local de paquetes
- `dataStorePackages/MusicWidget/manifest.json`
- `dataStorePackages/MusicWidget/presentations/default.tpl`
- `dataStorePackages/MusicWidget/documents/document.json`
- `dataStorePackages/MusicWidget/datasources/default.json`
- `dataStorePackages/StoryWidget/manifest.json`
- `dataStorePackages/StoryWidget/presentations/default.tpl`
- `dataStorePackages/StoryWidget/documents/document.json`
- `dataStorePackages/StoryWidget/datasources/default.json`

### URLs de imágenes de widget (S3)
Music:
- M: `https://luma-tales-audio.s3.us-east-2.amazonaws.com/widgets/widget-music-m.jpg`
- XL: `https://luma-tales-audio.s3.us-east-2.amazonaws.com/widgets/widget-music-l.jpg`

Story:
- M: `https://luma-tales-audio.s3.us-east-2.amazonaws.com/widgets/widget-story-m.jpg`
- XL: `https://luma-tales-audio.s3.us-east-2.amazonaws.com/widgets/widget-story-l.jpg`

### Comportamiento de tap en widget
El tap dispara `SendEvent` y llega como:
- `request.type = "Alexa.Presentation.APL.UserEvent"`
- `arguments[0].action = "launchIntent"`
- `arguments[0].intentName = "PlayMusicIntent" | "PlayStoryIntent"`

Resultado requerido y cumplido:
- Inicia `AudioPlayer.Play` inmediatamente.
- Sin bienvenida.
- Sin reprompt.
- Sin `outputSpeech`.
- `shouldEndSession: true`.

## 10) Interfaces de skill requeridas para widgets
En `Build -> Interfaces` quedaron activas:
- `ALEXA_DATA_STORE`
- `ALEXA_DATASTORE_PACKAGEMANAGER`
- `ALEXA_EXTENSION`

Además:
- `AUDIO_PLAYER`

Manifest local:
- `skill.json` incluye estas interfaces.

## 11) Procedimiento correcto en Developer Console (widgets)
Aprendizaje importante de implementación:
- El botón `Upload` de esa pantalla espera APL/Lottie, no `manifest.json` de package.
- Flujo estable que funcionó:
  1. `Create Widget` -> `Blank Document`
  2. Pegar JSON en pestañas:
     - `APL`
     - `DATA`
     - `MANIFEST`
  3. Guardar nombre del widget.

Widgets guardados:
- `MusicWidget`
- `StoryWidget`

## 12) Validación QA realizada
Sin Echo Show físico disponible, se validó técnicamente en Lambda (`Probar`) con eventos manuales.

Evento `widget_music_tap`:
```json
{
  "request": {
    "type": "Alexa.Presentation.APL.UserEvent",
    "arguments": [
      {
        "action": "launchIntent",
        "intentName": "PlayMusicIntent"
      }
    ]
  }
}
```
Resultado:
- Respuesta con `AudioPlayer.Play`.
- Sin `outputSpeech`.
- `shouldEndSession: true`.

Evento `widget_story_tap`:
```json
{
  "request": {
    "type": "Alexa.Presentation.APL.UserEvent",
    "arguments": [
      {
        "action": "launchIntent",
        "intentName": "PlayStoryIntent"
      }
    ]
  }
}
```
Resultado:
- Respuesta con `AudioPlayer.Play`.
- Sin `outputSpeech`.
- `shouldEndSession: true`.

## 13) Problemas encontrados y resolución
1. Invocation no estable por ASR:
- Variantes previas fallaban.
- Se estabilizó con `cuentos luna`.

2. Confusión de Lambda/región:
- Existían funciones en distintas regiones (`us-east-1` vs `us-east-2`).
- Se unificó endpoint final en `us-east-1` con `LunyTalesSK`.

3. Error de viewport en manifest:
- `WIDGET_L` inválido en validación.
- Corrección a `WIDGET_XL`.

4. Preview de imagen con recorte/líneas:
- Ajustes en proporciones de artes M/XL.
- Control de cache con query param en datasource (`?v=20260316`) cuando aplica.

5. Error de invocación vacía en JSON Editor:
- Ocurrió al mezclar tipo de JSON (manifest vs interaction model).
- Se corrigió pegando `interaction-model/es-MX.json` en el editor correcto.

## 14) Calidad de audio y reemplazos futuros
Recomendación técnica:
- MP3, 44.1kHz, 128-192 kbps, stereo, CBR preferible.

Si reemplazas archivos con el mismo nombre:
- La lógica seguirá funcionando.
- Debes revisar duraciones y actualizar `MUSIC_TRACKS.ms`.
- Puede existir cache temporal en Alexa/S3.

## 15) Publicación y visibilidad a usuarios
Estado:
- Se completó validación y envío: `Submit for review`.

Para que usuarios finales vean cambios:
- Debe aprobar certificación de Amazon.
- En Development solo lo ven desarrollador/testers autorizados.

Preferencia recomendada usada:
- `Certify and publish now`.

## 16) Repositorio y control de versiones
Repositorio:
- `https://github.com/lunytales/skill-amazon-luny-tales.git`

Commit relevante del trabajo de widgets:
- `c9ac881` -> `Implementa widgets Music/Story con deep-link y soporte M/XL`

Incluye en Git:
- `lambda/index.mjs`
- `skill.json`
- `dataStorePackages/`
- imágenes locales de widget
- documentación actualizada

## 17) Pendientes y siguiente iteración
Pendiente validación física:
- Prueba en dispositivo Echo Show real cuando esté disponible.

Posibles siguientes mejoras:
- Revisión visual final de artes para zona segura M/XL.
- Internacionalización en inglés como skill separada (decisión estratégica previa).
- Ajustes de metadata de Distribution si se modifica branding público.

## 18) Checklist operativo rápido
Antes de cualquier release:
1. Confirmar Lambda activa `LunyTalesSK` en `us-east-1`.
2. Confirmar runtime `Node.js 22.x`.
3. Confirmar Build del modelo sin errores.
4. Confirmar `MusicWidget` y `StoryWidget` guardados.
5. Confirmar manifest de widgets con `WIDGET_M` y `WIDGET_XL`.
6. Ejecutar pruebas Lambda `widget_music_tap` y `widget_story_tap`.
7. Enviar a certificación.


## 19) Analytics V1 (2026-04-02)

Objetivo:
- Medir comportamiento real sin romper UX ni degradar performance.

Arquitectura actual:
- Capa de analytics desacoplada en `lambda/analytics.mjs`.
- Emisión de eventos JSON por `console.log` a CloudWatch con prefijo `ANALYTICS_EVENT`.
- Sin llamadas externas en runtime.
- Sin almacenamiento de datos personales.
- Modo barato activo como configuración recomendada de producción.

Variables de entorno:
- `ANALYTICS_ENABLED=true`
- `ANALYTICS_MODE=cheap`
- `ANALYTICS_SALT=<valor de producción>`
- `RAW_EVENT_LOG_ENABLED=false`
- `SKILL_STAGE=live`

Eventos vivos en modo barato:
- `choice_selected`
- `story_started`
- `story_completed`
- `story_song_playback_started`

Resultado práctico:
- ya no se imprime el request completo de Alexa en logs;
- el payload por evento es mucho más corto;
- y CloudWatch escanea mucho menos información.

Queries activas del repositorio:
- `analytics/cloudwatch/queries/q01_entradas_y_eleccion_inicial.sql`
- `analytics/cloudwatch/queries/q02_finalizacion_por_cuento.sql`
- `analytics/cloudwatch/queries/q03_continuidad_hacia_la_cancion.sql`
- `analytics/cloudwatch/queries/q04_fuente_de_verdad_del_flujo_cuento.sql`

Nota de estructura:
- las queries viejas o descartadas se movieron a `analytics/cloudwatch/queries/legacy/`.

Notas de interpretación:
- en la fase actual no se prioriza exposición, sino señal de retención;
- `story_completed` sigue siendo la mejor señal simple de valor del cuento;
- `q03` y `q04` quedan como apoyo manual, no como dashboard diario.

### Product Pulse MVP actual
- Dashboard principal:
  - `¿Qué eligen al entrar?`
  - `¿Qué cuentos se terminan más?`
- Configuración recomendada:
  - `Last 3 days`
  - auto refresh desactivado
  - retención del log group en `7 días`
- `q04` queda fuera del dashboard principal y se usa solo para auditoría puntual.
