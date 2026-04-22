# Product Pulse - CloudWatch (MVP)

Objetivo: pasar de logs a lectura de producto sin convertir CloudWatch en una consola de debugging ni en una fuente innecesaria de costo.

## Log group
- `/aws/lambda/LunyTalesSK`

## Dashboard principal
- Nombre: `LunyTales-Product-Pulse`
- Ventana por defecto recomendada: `Last 3 days`
- Auto refresh: desactivado
- Regla: solo 2 widgets vivos
  - `¿Que eligen al entrar?`
  - `¿Que cuentos se terminan mas?`

## Queries activas
- `queries/q01_entradas_y_eleccion_inicial.sql`
- `queries/q02_finalizacion_por_cuento.sql`
- `queries/q03_continuidad_hacia_la_cancion.sql`
- `queries/q04_fuente_de_verdad_del_flujo_cuento.sql`

## Paso rapido
1. Ir a CloudWatch -> Logs Insights.
2. Seleccionar `/aws/lambda/LunyTalesSK`.
3. Guardar `q01` y `q02`.
4. Montar el dashboard con esos 2 widgets.
5. Dejar `q03` y `q04` fuera del panel principal.

## Resultado esperado
Con una sola vista semanal deberias poder responder:
- que prefieren al entrar
- que cuentos se terminan mas

## Criterio de producto
- La skill elige cuentos de forma aleatoria.
- Por eso las metricas de exposicion pueden ser engañosas en esta etapa.
- El foco actual es retencion: empezar un cuento y llegar al final.

## Nota de lenguaje
- CloudWatch no ofrece tarjetas narrativas reales en Logs Insights.
- Por eso la capa base busca lo mas cercano a una lectura humana: titulos claros, columnas legibles y una pregunta clara por widget.

## Queries auxiliares
- `queries/q03_continuidad_hacia_la_cancion.sql`
  - valida si quien termina cuento realmente pasa a canción
- `queries/q04_fuente_de_verdad_del_flujo_cuento.sql`
  - valida inicio, finalización y continuidad en la misma lectura

## Modo barato recomendado
- dashboard principal con solo 2 widgets
- `Last 3 days` por defecto
- `Last 7 days` solo para revisión semanal
- `q03` y `q04` fuera del panel principal
- ver `CONTENCION_DE_COSTO.md`

## Si luego necesitas escalar
- `analytics/cloudwatch/NEXT_STEP_MINIMO_VIABLE.md`
