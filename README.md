# Skill LunyTales (Cuentos Luna)

Repositorio local de la skill Alexa.

## Estructura
- `lambda/index.mjs`: Runtime principal de la skill.
- `lambda/analytics.mjs`: Capa de instrumentación analítica.
- `interaction-model/es-MX.json`: Modelo de interacción.
- `dataStorePackages/`: Paquetes de widgets.
- `analytics/cloudwatch/`: queries, playbooks y documentación del dashboard.

## Estado actual de analytics
La instrumentación ya quedó en modo barato para producción:
- mantiene solo la señal mínima útil de producto;
- reduce el tamaño de cada log;
- y evita imprimir el request completo de Alexa en CloudWatch.

### Variables de entorno
- `ANALYTICS_ENABLED=true`
- `ANALYTICS_MODE=cheap`
- `ANALYTICS_SALT=<valor de produccion>`
- `RAW_EVENT_LOG_ENABLED=false`
- `SKILL_STAGE=live`

### Eventos vivos en modo barato
- `choice_selected`
- `story_started`
- `story_completed`
- `story_song_playback_started`

### Dashboard actual
- Dashboard: `LunyTales-Product-Pulse`
- Vista principal: 2 widgets
  - `¿Qué eligen al entrar?`
  - `¿Qué cuentos se terminan más?`
- Rango recomendado: `Last 3 days`
- Auto refresh: desactivado

### Fuente de verdad operativa
- Lambda: `LunyTalesSK`
- Región: `us-east-1`
- Log group: `/aws/lambda/LunyTalesSK`
- Retención de logs recomendada: `7 días`

## Queries activas
- `analytics/cloudwatch/queries/q01_entradas_y_eleccion_inicial.sql`
- `analytics/cloudwatch/queries/q02_finalizacion_por_cuento.sql`
- `analytics/cloudwatch/queries/q03_continuidad_hacia_la_cancion.sql`
- `analytics/cloudwatch/queries/q04_fuente_de_verdad_del_flujo_cuento.sql`

## Documentación operativa
- `analytics/cloudwatch/README.md`: inicio rapido.
- `analytics/cloudwatch/DASHBOARD_SETUP.md`: armado del dashboard.
- `analytics/cloudwatch/PLAYBOOK_SEMANAL.md`: rutina de decision semanal.
- `analytics/cloudwatch/CONTENCION_DE_COSTO.md`: modo barato y guardrails.
- `analytics/cloudwatch/ESTADO_ACTUAL.md`: estado final y criterios de uso.
- `analytics/cloudwatch/queries/`: queries activas y legacy.
