# Documentación Técnica - Skill LunyTales (Nivel 2)

Actualizado: 2026-02-06

## 1) Resumen
Esta skill reproduce cuentos y música relajante con una experiencia simple:
- Se invoca por voz.
- Pregunta si se quiere "cuento" o "música".
- Reproduce audio con AudioPlayer.
- Cierra en silencio al finalizar (sin despedida).

El nivel 2 agrega:
- Selección aleatoria de cuentos y canciones.
- Encadenamiento automático cuento -> canción asociada.
- Música continua por ~20 minutos.

## 2) Estado Actual (Nivel 2)
Funciona por voz en dispositivos (Echo / app) con el invocation name:
**"cuentos luna"**.

Flujos principales:
1) Cuento:
   - Elige 1 de 3 cuentos de forma aleatoria.
   - Reproduce el cuento.
   - Al terminar, reproduce su canción asociada (mapeo fijo).
   - Termina en silencio.
2) Música:
   - Elige 1 de 8 canciones aleatorias.
   - Encadena canciones hasta ~20 minutos.
   - Termina en silencio.

## 3) Inventario de Audios (S3)
Base:
`https://luma-tales-audio.s3.us-east-2.amazonaws.com/`

### Cuentos
- cuento-uno.mp3
- cuento-dos.mp3
- cuento-tres.mp3

### Música
- m-1.mp3
- m-2.mp3
- m-3.mp3
- m-4.mp3
- m-5.mp3
- m-6.mp3
- m-7.mp3
- m-8.mp3

## 4) Mapeo Cuento -> Canción Asociada
- cuento-uno.mp3 -> m-1.mp3
- cuento-dos.mp3 -> m-2.mp3
- cuento-tres.mp3 -> m-3.mp3

## 5) UX Writing (Mensajes actuales)
- Saludo: "¡Hola! Soy Luny. ¿Qué te apetece hoy: cuento o música?"
- Música: "Perfecto. Empieza la música."
- Cuento: "Me encanta. Que empiece el cuento."
- No entiende: "Lo siento, no te entendí. ¿Prefieres cuento o música?"
- Reprompt: "¿Sigues ahí? Elige: cuento o música."
- Stop: "Hecho."

## 6) Interacción (Modelo de voz)
Modelo recomendado: **un solo intent** con slot:
- Intent: `ElegirAudioIntent`
- Slot: `tipo` (TIPO_AUDIO)
- Sinónimos: cuento, relato, historia / música, canciones, música para dormir.

Esto reduce errores de NLU y evita que "música" dispare el intent de cuento.

## 7) Arquitectura y Archivos Clave
Repositorio local:
- `lambda/index.mjs` (lógica de Lambda)
- `interaction-model/es-MX.json` (modelo de interacción)

AWS:
- Lambda: `LunyTalesSK` (us-east-1)
- Skill: Alexa Developer Console (es-MX)
- Audio: S3 (us-east-2)

## 8) AudioPlayer: Encadenamiento y Cierre Silencioso
Se usa:
- `AudioPlayer.Play` con `REPLACE_ALL` para iniciar audio.
- `AudioPlayer.Play` con `ENQUEUE` para encadenar el siguiente.
- Eventos `AudioPlayer.PlaybackNearlyFinished` para agregar la siguiente pista.
- Respuesta vacía para **cerrar en silencio** (sin outputSpeech).

## 9) Duraciones de Música (para ~20 minutos)
Para aproximar 20 minutos, el sistema usa la duración real de cada pista:
- m-1: 228.911 s -> 228911 ms
- m-2: 224.470 s -> 224470 ms
- m-3: 233.718 s -> 233718 ms
- m-4: 157.597 s -> 157597 ms
- m-5: 227.422 s -> 227422 ms
- m-6: 233.613 s -> 233613 ms
- m-7: 233.796 s -> 233796 ms
- m-8: 150.152 s -> 150152 ms

Nota:
- El tiempo final es **aproximado**. Puede quedar un poco por arriba o abajo.

## 10) Reemplazo de Audios (Importante)
Si reemplazas audios en S3 con el **mismo nombre**:
- La skill **seguirá funcionando**.
- Pero si cambian las duraciones, debes **actualizar los ms** en el código.

### Medir duraciones con ffprobe
Comando recomendado:
```
for u in \
"https://luma-tales-audio.s3.us-east-2.amazonaws.com/m-1.mp3" \
"https://luma-tales-audio.s3.us-east-2.amazonaws.com/m-2.mp3" \
"https://luma-tales-audio.s3.us-east-2.amazonaws.com/m-3.mp3" \
"https://luma-tales-audio.s3.us-east-2.amazonaws.com/m-4.mp3" \
"https://luma-tales-audio.s3.us-east-2.amazonaws.com/m-5.mp3" \
"https://luma-tales-audio.s3.us-east-2.amazonaws.com/m-6.mp3" \
"https://luma-tales-audio.s3.us-east-2.amazonaws.com/m-7.mp3" \
"https://luma-tales-audio.s3.us-east-2.amazonaws.com/m-8.mp3"
do
  echo "$u"
  ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$u"
done
```

Luego actualiza `lambda/index.mjs` en `MUSIC_TRACKS`.

### Cache de Alexa/S3
Si reemplazas un archivo con el mismo nombre, puede haber **cache temporal**.
Si necesitas cambios inmediatos:
- usa un nombre nuevo (ej: `m-1-v2.mp3`) y actualiza la URL en el código.

## 11) Requisitos recomendados de Audio
Formato seguro (alta calidad y compatible):
- MP3
- 44.1 kHz
- 128–192 kbps
- Stereo
- CBR preferible

## 12) Limitaciones conocidas
- No es posible cortar una pista a 20 minutos desde Lambda.
  Si una pista supera 20 min, seguirá hasta terminar.
  Solución: subir pistas recortadas si se requiere precisión absoluta.

## 13) Pasos de despliegue (manual)
1. Actualizar `lambda/index.mjs` en AWS Lambda (`LunyTalesSK`) y presionar **Deploy**.
2. Si cambiaste el modelo:
   - Developer Console -> Build -> JSON Editor
   - **Save Model** y luego **Build Model**.
3. Probar por voz:
   - "Alexa, abre cuentos luna"
   - "cuento"
   - "música"
   - "Alexa, para"

