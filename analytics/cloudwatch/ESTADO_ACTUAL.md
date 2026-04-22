# Estado Actual - Analytics y Dashboard

Fecha de cierre de esta fase: 2026-04-21

## Objetivo de esta fase
Dejar la analítica de la skill en un punto útil, legible y barato.

Eso significa:
- leer producto sin entrar a debugging;
- mantener CloudWatch como solución suficiente;
- y reducir el costo operativo al mínimo razonable.

## Estado final del dashboard principal
Dashboard:
- `LunyTales-Product-Pulse`

Widgets vivos:
1. `¿Qué eligen al entrar?`
2. `¿Qué cuentos se terminan más?`

Decisiones aplicadas:
- se eliminó el widget auxiliar de continuidad a canción del dashboard principal;
- se sacó la tabla redundante de elección inicial;
- se dejó `q04` fuera del panel principal;
- el dashboard quedó pensado para revisión rápida, no para exploración constante.

Configuración operativa recomendada:
- rango por defecto: `Last 3 days`
- auto refresh: desactivado
- revisión normal: 1 a 2 veces por semana
- Logs Insights manual: solo cuando haya una duda real

## Queries activas
Las queries activas y soportadas en esta fase son:
- `q01_entradas_y_eleccion_inicial.sql`
- `q02_finalizacion_por_cuento.sql`
- `q03_continuidad_hacia_la_cancion.sql`
- `q04_fuente_de_verdad_del_flujo_cuento.sql`

Uso esperado:
- `q01` y `q02` para dashboard principal
- `q03` y `q04` solo como apoyo puntual

## Estructura del directorio de queries
Directorio principal:
- `analytics/cloudwatch/queries/`

Regla:
- en la raíz solo viven las queries activas de esta fase;
- las queries viejas o descartadas se movieron a:
  - `analytics/cloudwatch/queries/legacy/`

Motivo:
- evitar confusión al guardar queries en CloudWatch;
- dejar el repo legible sin tener que adivinar cuál query sigue viva.

## Modo barato de analytics
Variables recomendadas en Lambda:
- `ANALYTICS_ENABLED=true`
- `ANALYTICS_MODE=cheap`
- `ANALYTICS_SALT=<valor de produccion>`
- `RAW_EVENT_LOG_ENABLED=false`
- `SKILL_STAGE=live`

Con esto:
- ya no se imprime el request completo de Alexa;
- el payload de analytics es corto;
- y solo se emiten estos eventos:
  - `choice_selected`
  - `story_started`
  - `story_completed`
  - `story_song_playback_started`

## Retención y costo
Decisión aplicada:
- retención del log group `/aws/lambda/LunyTalesSK` reducida a `7 días`

Lectura práctica:
- la mayor amenaza de costo no era abrir una vez el dashboard;
- era combinar logs grandes, retención infinita y queries frecuentes.

Con la configuración final:
- el riesgo de costo de CloudWatch baja mucho;
- y el uso pasa a ser suficientemente austero para esta fase.

## Qué quedó documentado
- setup del dashboard
- queries activas
- modo barato
- contención de costo
- roadmap futuro de catálogo y selección

## Qué no se debe hacer ahora
- no volver a activar `RAW_EVENT_LOG_ENABLED=true` salvo debugging puntual;
- no dejar `ANALYTICS_MODE=full` en producción si el objetivo es costo bajo;
- no recrear las queries legacy en CloudWatch;
- no usar `Last 30 days` como vista normal del dashboard.
