# Playbook Semanal - Cuentos Luna

Duracion total: 5-10 minutos.

## 1) Abrir dashboard
- Dashboard: `LunyTales-Product-Pulse`
- Rango: `Last 7 days`

## 2) Responder 2 preguntas de producto
1. ¿Que prefieren al entrar? (`¿Que eligen al entrar?`)
2. ¿Que cuentos se terminan mas? (`¿Que cuentos se terminan mas?`)

## 3) Tomar decisiones semanales
- Si la preferencia por musica cambia fuerte: revisar si fue una anomalia o si el comportamiento esta cambiando.
- Si un cuento queda claramente por debajo en `% que llego al final`: revisar arranque, duracion o ritmo.
- Si todos los cuentos muestran finalizacion alta: hay senal real para seguir apostando por audio.

## 4) Registrar conclusiones
Guardar en una nota semanal:
- Semana
- Reparto cuento vs musica
- Cuento con mayor finalizacion
- Cuento con menor finalizacion
- Decision de producto para la semana

## 4.1) Lectura rapida recomendada
- Si el dashboard no se entiende en menos de 5 segundos, algo esta sobrando.
- `¿Que eligen al entrar?` debe leerse como preferencia.
- `¿Que cuentos se terminan mas?` debe leerse como retencion.

## 5) Revision mensual
Una vez por mes repetir con `Last 30 days` para validar tendencia real y no ruido semanal.

## 6) Nota de interpretacion
- La skill elige cuentos de forma aleatoria.
- Por eso este MVP evita medir exposicion y se concentra en finalizacion.
- `story_completed` es una mejor senal de retencion del cuento que los conteos brutos de reproduccion.

## 7) Si necesitas validar una hipotesis
- `queries/q03_continuidad_hacia_la_cancion.sql` sirve para ver cuántos cuentos terminados pasan a canción.
- `queries/q04_fuente_de_verdad_del_flujo_cuento.sql` sirve para revisar inicio, finalizacion y paso a canción en la misma base.
