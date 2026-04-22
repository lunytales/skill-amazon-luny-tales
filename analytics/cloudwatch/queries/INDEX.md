# Queries Index

## Queries activas
- `q01_entradas_y_eleccion_inicial.sql`
  - uso: widget `¿Qué eligen al entrar?`
  - salida: `Opcion`, `Elecciones`

- `q02_finalizacion_por_cuento.sql`
  - uso: widget `¿Qué cuentos se terminan más?`
  - salida: `Cuento`, `Se inicio`, `Se termino`, `% que llego al final`

- `q03_continuidad_hacia_la_cancion.sql`
  - uso: validación puntual
  - salida: `Cuentos terminados`, `Pasaron a cancion`, `% que continuo a la musica`

- `q04_fuente_de_verdad_del_flujo_cuento.sql`
  - uso: auditoría puntual
  - salida: `Cuentos iniciados`, `Cuentos terminados`, `% de finalizacion`, `% que continuo a la musica`

## Regla operativa
- Dashboard principal: solo `q01` y `q02`
- Apoyo puntual: `q03` y `q04`
- No agregar más queries al dashboard principal en esta fase

## Queries legacy
- Todas las queries viejas o descartadas se movieron a:
  - `queries/legacy/`
- Se conservan solo como referencia histórica
- No deben recrearse en CloudWatch
