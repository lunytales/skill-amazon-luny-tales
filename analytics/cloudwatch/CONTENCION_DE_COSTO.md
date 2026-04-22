# Contencion de costo - Analytics y CloudWatch

Objetivo: dejar analytics en modo casi cero sin perder la lectura minima de producto.

## Corte inmediato recomendado
1. Dejar el dashboard principal con solo 2 widgets:
- `¿Que eligen al entrar?`
- `¿Que cuentos se terminan mas?`

2. Sacar del dashboard:
- `Fuente de verdad del flujo del cuento`
- cualquier widget auxiliar de continuidad a cancion

3. Usar por defecto:
- `Last 3 days`
- auto refresh desactivado

4. Dejar `q03` y `q04` solo para auditoria manual.

5. Bajar retencion del log group `/aws/lambda/LunyTalesSK` a 7 o 14 dias.

## Instrumentacion barata recomendada
Configurar Lambda con:
- `ANALYTICS_MODE=cheap`
- `RAW_EVENT_LOG_ENABLED=false`

Eso deja vivos solo estos eventos:
- `choice_selected`
- `story_started`
- `story_completed`
- `story_song_playback_started`

## Por que esto baja costo
- elimina el log completo del request de Alexa;
- reduce mucho el tamano de cada `ANALYTICS_EVENT`;
- baja la cantidad total de eventos emitidos;
- reduce el volumen que Logs Insights tiene que escanear;
- y baja almacenamiento historico en CloudWatch Logs.

## Que no hacer
- no leer Logs Insights a diario;
- no dejar dashboards con mas widgets de los necesarios;
- no usar `Last 30 days` como vista normal;
- no mantener queries legacy en uso activo;
- no volver a habilitar raw event logs salvo debugging puntual.

## Operacion recomendada
- mirar dashboard solo cuando haga falta;
- usar `Last 3 days` para chequeo rapido;
- cambiar a `Last 7 days` solo en revision semanal;
- usar `q04` solo si hay una duda real de consistencia.
