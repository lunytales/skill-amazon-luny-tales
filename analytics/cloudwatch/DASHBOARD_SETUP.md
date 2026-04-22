# Dashboard Setup - LunyTales Product Pulse

## Dashboard
- Nombre: `LunyTales-Product-Pulse`
- Fuente: Logs Insights
- Log group: `/aws/lambda/LunyTalesSK`
- Rango inicial recomendado: `Last 3 days`
- Principio: minimo viable, una pregunta util por widget
- Auto refresh: desactivado

## Guardar queries (una vez)
Guarda estas queries con estos nombres:
- `PP-01 Que eligen al entrar` -> `queries/q01_entradas_y_eleccion_inicial.sql`
- `PP-02 Que cuentos se terminan mas` -> `queries/q02_finalizacion_por_cuento.sql`
- `AUX-03 Continuidad hacia la cancion` -> `queries/q03_continuidad_hacia_la_cancion.sql`
- `AUX-04 Fuente de verdad del flujo del cuento` -> `queries/q04_fuente_de_verdad_del_flujo_cuento.sql`

## Estructura recomendada del dashboard
Fila 1:
- `¿Que eligen al entrar?` usa `PP-01 Que eligen al entrar` (Pie)
- `¿Que cuentos se terminan mas?` usa `PP-02 Que cuentos se terminan mas` (Table)

## Regla de lectura
- `PP-01` responde preferencia.
- `PP-02` responde retencion.
- No agregar widgets de exposicion o diagnostico en esta etapa.
- Si una metrica necesita mucha explicacion, no va en este MVP.
- `AUX-03` y `AUX-04` quedan fuera del dashboard principal.

## Filtros operativos
- Vista diaria barata: `Last 3 days`
- Vista semanal manual: `Last 7 days`
- Vista mensual: `Last 30 days`
- Comparacion: revisar semanal y luego mensual en la misma sesion.
