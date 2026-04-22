# Siguiente paso minimo viable (cuando CloudWatch ya no alcance)

Usar solo si el volumen sube y quieres historico sin depender de ventanas de Logs Insights.

## Propuesta
1. Lambda diaria (EventBridge, 1 vez al dia).
2. Ejecuta las queries clave de Logs Insights.
3. Guarda un resumen diario en S3 (`analytics/daily/date=YYYY-MM-DD/*.json`).
4. Consultar resumen en Athena o una hoja conectada a S3.

## Ventajas
- Costo bajo.
- Sin rehacer la skill.
- Mantiene instrumentacion actual.
- Facil de escalar a mas cuentos.

## No hacer aun
- No agregar Kinesis, Firehose, Redshift, pipelines complejos.
