# Skill LunyTales (Local)

Este repositorio refleja el código actual de Lambda y el modelo de interacción de Alexa para la skill LunyTales.

## Estructura
- `lambda/index.mjs`: Código del handler de Lambda (Node.js)
- `interaction-model/es-MX.json`: Modelo de interacción (Español MX)

## Notas
- El nombre de marca puede quedar como **Luma Tales**, mientras el invocation name es **cuentos luna** para mejor reconocimiento por voz.
- Runtime de Lambda: **Node.js 22.x** (AWS Lambda)

## Checklist de despliegue (manual)
1. Actualiza `lambda/index.mjs` en la Lambda `LunyTalesSK`.
2. Actualiza el modelo en Alexa Developer Console con `interaction-model/es-MX.json`.
3. Presiona `Save Model` y luego `Build Model`.
