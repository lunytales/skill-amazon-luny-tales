# Plan Futuro - Catalogo Dinamico y Rotacion con Memoria

Estado: analisis y diseno. No implementado.

## 1. Contexto
La skill hoy funciona con un catalogo hardcodeado dentro de `lambda/index.mjs`.

Estado actual:
- Los cuentos viven en `STORIES`.
- La musica vive en `MUSIC_TRACKS`.
- La seleccion de cuento usa aleatorio puro.
- La asociacion cuento -> cancion esta definida 1:1 en codigo.
- Si se agrega un cuento o una cancion nueva, hoy hay que tocar Lambda.

Senal de producto observada:
- `cuento` gana frente a `musica`.
- La finalizacion de cuentos no es alta.
- Existe una sospecha razonable de repeticion por catalogo pequeno.
- Con solo 3 cuentos, repetir el ultimo cuento puede sentirse como mala UX aunque el contenido sea bueno.

## 2. Problema a resolver
Hay 2 problemas distintos, pero conectados:

1. Seleccion:
- El aleatorio puro no protege al usuario contra repeticiones cercanas.

2. Operacion:
- El catalogo esta acoplado al codigo.
- Eso obliga a editar la skill para agregar contenido.
- Ese flujo no escala bien si se agregan cuentos y canciones cada mes.

## 3. Hoja de ruta por umbrales de catalogo
La evolucion futura queda amarrada al tamaño real del catalogo.

Orden fijo de decision:
1. primero contenido;
2. luego mejora minima de UX;
3. luego observacion;
4. luego operacion escalable.

### Etapa 1 - Catalogo pequeño
Umbral:
- 3 a 5 cuentos totales.

Decisiones:
- mantener la skill como esta;
- seguir actualizando manualmente el catalogo en codigo;
- no implementar todavia memoria por usuario;
- no implementar todavia catalogo dinamico.

Objetivo:
- priorizar produccion de contenido;
- observar metricas con el sistema actual;
- no abrir complejidad antes de que el catalogo lo justifique.

### Etapa 2 - Primer cambio de UX
Umbral:
- 6 cuentos totales.

Decisiones:
- implementar la regla minima `excluir lastStoryId`;
- mantener todavia el catalogo hardcodeado en codigo;
- no introducir todavia catalogo dinamico.

Objetivo:
- mejorar UX sin mezclar demasiadas variables al mismo tiempo;
- convertir esta en la primera fase optima para cambiar logica de seleccion.

### Etapa 3 - Observacion intermedia
Umbral:
- 9 cuentos totales.

Decisiones:
- no meter todavia automatizacion compleja;
- observar si con mas catalogo y exclusion de `lastStoryId` la repeticion percibida baja lo suficiente;
- evaluar si hace falta excluir mas de un cuento reciente.

Objetivo:
- validar si la mejora minima ya basta;
- evitar pasar a una operacion mas compleja antes de comprobar necesidad real.

### Etapa 4 - Operacion escalable
Umbral:
- 12 cuentos totales.

Decisiones:
- evaluar seriamente catalogo dinamico por manifiesto en S3;
- agregar cache del manifiesto;
- agregar fallback seguro;
- dejar de actualizar la skill manualmente por cada alta nueva.

Objetivo:
- entrar en la primera etapa donde ya tiene sentido real desacoplar catalogo y codigo;
- preparar una operacion menos dependiente de redeploy manual.

## 4. Principios de diseno
- No inferir todo solo desde nombres de archivo.
- Separar catalogo, seleccion y reproduccion.
- Mantener una sola fuente de verdad del catalogo.
- Preferir una configuracion ligera sobre infraestructura pesada.
- Diseñar para crecimiento sin reescribir la skill cada mes.
- Mantener fallback seguro si la fuente dinamica falla.

## 5. Recomendacion principal ajustada
La direccion general se mantiene, pero el orden queda subordinado al tamaño del catalogo.

La mejor evolucion no es:
- leer S3 "a pelo" en cada request;
- ni mezclar en una sola fase memoria por usuario y catalogo dinamico;
- ni adelantar infraestructura antes de que el catalogo la necesite.

La recomendacion ajustada es:
1. con 3 a 5 cuentos: priorizar contenido y observacion;
2. con 6 cuentos: implementar solo la mejora minima de UX;
3. con 9 cuentos: medir si esa mejora fue suficiente;
4. con 12 cuentos: pasar a operacion escalable con catalogo dinamico;
5. solo despues automatizar la publicacion del catalogo si sigue valiendo la pena.

Eso permite:
- aislar causa y efecto;
- mantener costos casi cero durante mas tiempo;
- y reducir riesgo antes de tocar la operacion del catalogo.

## 6. Opciones evaluadas

### Opcion A - Listar objetos de S3 en cada request
Ventajas:
- no hay que actualizar codigo para ver archivos nuevos.

Problemas:
- agrega latencia en tiempo real;
- depende de naming perfecto para inferir metadata;
- no resuelve bien titulos humanos, duraciones, activacion/desactivacion ni reglas de asociacion;
- es fragil si el catalogo necesita mas metadata que solo `id` y `url`.

Veredicto:
- no recomendada como fuente principal.

### Opcion B - Manifiesto de catalogo en S3
Ventajas:
- separa contenido de codigo;
- permite metadata clara;
- soporta crecimiento del catalogo;
- mantiene bajo el costo operativo;
- permite agregar cuentos y canciones sin redeploy si la skill ya sabe leer el manifiesto.

Problemas:
- requiere una fuente de configuracion adicional;
- necesita validacion para no publicar manifiestos rotos.

Veredicto:
- recomendada.

### Opcion C - Catalogo en DynamoDB
Ventajas:
- flexible;
- editable sin tocar Lambda;
- buena opcion si luego quieres panel interno o CMS.

Problemas:
- mas complejidad operativa que la necesaria para la siguiente fase;
- no aporta tanto si el catalogo cambia solo una vez al mes.

Veredicto:
- no es la primera recomendacion.
- podria venir despues si el proyecto exige una capa de gestion mas rica.

## 7. Arquitectura objetivo

### 7.1 Fuente de verdad del catalogo
Usar un archivo JSON versionado en S3.

Ejemplo conceptual:

```json
{
  "version": "2026-05",
  "updatedAt": "2026-05-01T12:00:00Z",
  "stories": [
    {
      "id": "cuento-uno",
      "title": "¿Quién vive en la cueva?",
      "audioKey": "cuento-uno.mp3",
      "active": true,
      "associatedSongIds": ["m-1"],
      "publishedAt": "2026-03-01"
    }
  ],
  "songs": [
    {
      "id": "m-1",
      "audioKey": "m-1.mp3",
      "durationMs": 228911,
      "active": true,
      "publishedAt": "2026-03-01"
    }
  ],
  "selectionRules": {
    "excludeRecentStoriesCount": 1
  }
}
```

Este manifiesto resuelve:
- titulos humanos;
- URLs derivables desde un `audioKey`;
- activacion/desactivacion de contenido;
- asociacion cuento -> cancion;
- duraciones de musica;
- version de catalogo para analytics.

### 7.2 Carga dinamica del catalogo
La skill deberia:
- leer el manifiesto desde S3;
- cachearlo en memoria por un TTL corto;
- reutilizarlo en invocaciones warm;
- volver a pedirlo cuando expire el TTL;
- caer a un ultimo manifiesto valido si el fetch falla.

Recomendacion:
- TTL de 5 a 15 minutos.
- Fallback a snapshot embebido en el repo o ultimo manifiesto valido en memoria.

Eso evita:
- una llamada a S3 en cada request;
- y tambien evita que una caida puntual del manifiesto rompa la skill.

### 7.3 Memoria por usuario
Para evitar repeticion, la skill necesita estado persistente por usuario.

Recomendacion:
- tabla DynamoDB ligera;
- clave primaria: `userId` de Alexa;
- atributos minimos:
  - `lastStoryId`
  - `recentStoryIds`
  - `lastPlayedAt`
  - `updatedAt`

No hace falta una solucion compleja al inicio.

Nota importante:
- en esta fase, `userId` debe entenderse como memoria por cuenta/hogar, no por niño individual.
- eso es aceptable para el objetivo actual de UX.

## 8. Estrategia de seleccion recomendada

### Fase 1 - Regla minima de UX
Regla:
- no repetir el ultimo cuento escuchado por ese usuario.

Comportamiento:
- si hay al menos 2 alternativas, excluir `lastStoryId`;
- si no hay alternativas, usar fallback controlado;
- si `lastStoryId` ya no existe o esta inactivo, ignorarlo sin romper el flujo.

Lectura correcta:
- esta fase es una mejora minima, no una solucion final a la repeticion.

Con 3 cuentos:
- evita repeticion inmediata;
- pero todavia puede producir secuencias como A -> B -> A -> B.

### Fase 2 - Rotacion simple
Cuando haya 6 o mas cuentos:
- excluir los ultimos N cuentos recientes;
- elegir aleatoriamente entre los elegibles.

Regla recomendada:
- `N = 1` con catalogo pequeño;
- `N = 2` o `3` cuando el catalogo crezca.

### Fase 3 - Rotacion mas estable
Si el catalogo sigue creciendo:
- usar "least recently served" por usuario;
- o una baraja rotativa por usuario que se rehace cuando cambia el catalogo.

Veredicto:
- no empezaria por una baraja completa.
- primero implementaria exclusion del ultimo cuento y una cola corta de recientes.

## 9. Proceso operativo futuro para agregar contenido
Objetivo: no tocar la skill cada vez que subas nuevos audios.

Este objetivo no entra en la primera fase.

Flujo recomendado cuando llegue esa etapa:
1. Subir MP3 nuevos a S3.
2. Validar que los archivos existen y la metadata minima esta completa.
3. Publicar el manifiesto del catalogo.
4. La skill detecta el nuevo catalogo por refresh de cache.
5. No hay que redeployar Lambda solo por dar de alta contenido.

Eso cumple el objetivo central:
- agregar cuentos y canciones sin actualizar la skill cada mes.

Regla importante:
- el manifiesto se publica al final, no al inicio.
- asi se evita que el catalogo apunte a archivos aun no disponibles.

## 10. Automatizacion futura del catalogo
Si mas adelante quieres reducir aun mas trabajo manual, hay 2 caminos razonables.

### Camino A - Manifiesto editado manualmente
Operativamente simple.

Bueno si:
- subes contenido una vez al mes;
- prefieres control total;
- no quieres automatizacion adicional todavia.

### Camino B - Manifiesto generado automaticamente
Usar un script o job que:
- lea archivos de una carpeta o prefijo de S3;
- combine eso con metadata ligera;
- regenere `catalog.json`.

Recomendacion:
- si automatizas, no bases todo solo en filenames.
- usa sidecars JSON o una fuente ligera de metadata.

Ejemplo:
- `cuento-cuatro.mp3`
- `cuento-cuatro.json`

El sidecar deberia incluir:
- `title`
- `associatedSongIds`
- `active`
- `publishedAt`

Veredicto:
- el manifiesto generado automaticamente es viable;
- pero primero conviene implementar el manifiesto dinamico como base;
- y no conviene automatizar nada hasta que el proceso manual ya sea estable.

## 11. Impacto futuro en analytics
Cuando el catalogo sea dinamico, la capa de analytics deberia dejar de depender de mapeos hardcodeados en queries.

Recomendacion futura:
- mantener siempre `storyId` como clave estable;
- emitir tambien `storyTitle`;
- emitir `songTitle` cuando aplique;
- emitir `catalogVersion`;
- emitir `selectionStrategy`;
- emitir `selectionReason`.

Ejemplos:
- `selectionStrategy = "memory_rotation_v1"`
- `selectionReason = "excluded_last_story"`

Esto permite:
- queries legibles sin mantener `if(cuentoId=...)` manuales;
- comparar rendimiento antes y despues de cambiar la logica;
- validar si la rotacion realmente mejora retencion.

Nota:
- `storyTitle` nunca debe reemplazar `storyId`.
- debe convivir con el ID para no romper comparabilidad historica.

## 12. Cambios de codigo recomendados cuando llegue el momento
No implementarlos ahora. Solo dejar claro el corte de responsabilidades.

### Modulos futuros recomendados
- `catalog.mjs`: carga, valida y cachea el manifiesto.
- `selection.mjs`: decide el siguiente cuento o cancion.
- `userState.mjs`: lee y escribe memoria por usuario.

Beneficio:
- `index.mjs` deja de concentrar catalogo, seleccion y reproduccion en un solo archivo.
- la skill queda mas facil de mantener.

## 13. Riesgos y mitigaciones

### Riesgo 1 - Manifiesto roto
Mitigacion:
- validacion antes de publicar;
- fallback al ultimo manifiesto valido.

### Riesgo 2 - Catalogo nuevo sin metadata suficiente
Mitigacion:
- exigir campos minimos;
- no activar contenido incompleto.

### Riesgo 3 - Cache stale
Mitigacion:
- TTL corto;
- `catalogVersion` en logs para saber que version esta usando la skill.

### Riesgo 4 - Repeticion cuando el catalogo es muy pequeno
Mitigacion:
- fallback explicito;
- exclusion adaptable segun tamano real del catalogo.

### Riesgo 5 - Cambiar dos variables al mismo tiempo
Mitigacion:
- no implementar en la misma fase memoria por usuario y catalogo dinamico;
- medir primero la mejora de UX con el catalogo actual.

### Riesgo 6 - Estado de usuario inconsistente
Mitigacion:
- leer estado solo al pedir cuento;
- escribir estado solo cuando se decide el cuento servido;
- no escribir en playback events si no es necesario.

### Riesgo 7 - Dependencia excesiva de titulos humanos
Mitigacion:
- usar `storyId` como clave estable;
- usar `storyTitle` solo para lectura humana.

## 14. Guardrails de costo
Objetivo: mantener costo casi cero y evitar configuraciones que disparen consumo en AWS.

Reglas:
- no leer S3 en cada request;
- no hacer `ListObjects` en runtime;
- no usar scans en DynamoDB;
- no escribir estado por usuario en cada evento de audio;
- no enriquecer logs con payloads grandes;
- no agregar pipelines nuevos para esta fase.

Aplicacion practica:
- DynamoDB se usa solo al elegir cuento;
- S3 se usa solo cuando llegue la fase de catalogo dinamico;
- analytics solo agrega campos pequenos y utiles.

## 15. Cuellos de botella reales

### Cuello 1 - Semantica del estado
Hay que decidir bien cuando se actualiza `lastStoryId`.

Recomendacion:
- guardar el ultimo cuento cuando se decide servirlo, no en cada playback event.

Si esta decision se toma mal:
- la memoria del usuario se vuelve poco confiable;
- y la mejora de UX se contamina.

### Cuello 2 - Medicion del impacto
Si no marcas la estrategia de seleccion en analytics, no sabras si la mejora vino de la rotacion o del ruido normal.

### Cuello 3 - Publicacion del catalogo
Cuando llegue esa fase, el cuello no sera tecnico sino operativo:
- publicar assets y manifiesto en el orden correcto;
- validar consistencia antes de activar catalogo.

### Cuello 4 - Catalogo pequeno
Con pocos cuentos, incluso una logica correcta puede seguir sintiendose repetitiva.
- no es necesariamente un bug;
- es un limite real del catalogo.

### Cuello 5 - Adelantar fases antes de tiempo
Si se mete memoria o catalogo dinamico antes de que el tamaño del catalogo lo justifique:
- aumenta la complejidad;
- baja la claridad sobre impacto real;
- y el costo operativo crece antes de aportar suficiente valor.

## 16. Condiciones para pasar de etapa

### Paso de Etapa 1 a Etapa 2
Condicion principal:
- alcanzar 6 cuentos totales publicados.

Condicion de criterio:
- seguir viendo señales de repeticion o desgaste de UX con el catalogo pequeño.

### Paso de Etapa 2 a Etapa 3
Condicion principal:
- alcanzar 9 cuentos totales publicados.

Condicion de criterio:
- dejar correr la mejora minima el tiempo suficiente para observar impacto real.

### Paso de Etapa 3 a Etapa 4
Condicion principal:
- alcanzar 12 cuentos totales publicados.

Condicion de criterio:
- que el mantenimiento manual del catalogo ya empiece a sentirse costoso o propenso a error.

## 17. Roadmap de implementacion futura

### Fase 0 - Preparacion
Sin tocar UX todavia:
- definir contrato del selector;
- definir estado minimo por usuario;
- definir eventos y campos minimos para medir impacto;
- decidir la semantica exacta de `lastStoryId`.

### Fase 1 - Cambio minimo de producto
Implementar solo:
- memoria minima;
- exclusion de `lastStoryId`;
- analytics con `selectionStrategy` y `selectionReason`.

Mantener:
- catalogo actual hardcodeado;
- infraestructura actual casi intacta.

### Fase 2 - Medicion
Dejar correr 2 a 4 semanas y revisar:
- finalizacion general;
- finalizacion por cuento;
- repeticion observada;
- diferencia antes y despues del cambio.

### Fase 3 - Operacion del catalogo
Solo despues:
- manifiesto en S3;
- cache con fallback;
- proceso de publicacion de catalogo.

### Fase 4 - Automatizacion parcial
Solo si sigue haciendo falta:
- generacion asistida del manifiesto;
- validaciones previas a publicacion.

## 18. Recomendacion concreta
La direccion correcta sigue siendo la misma, pero la hoja de ruta cambia.

No empezaria por:
- manifiesto dinamico;
- ni automatizacion del catalogo.

Empezaria por esto:
1. producir contenido hasta llegar al primer umbral util;
2. implementar `excluir lastStoryId` recien al llegar a 6 cuentos;
3. medir impacto real;
4. luego externalizar el catalogo al llegar a 12 cuentos;
5. despues automatizar solo si sigue valiendo la pena.

Ese camino es el mejor equilibrio entre:
- UX;
- limpieza tecnica;
- riesgo bajo;
- costo casi cero;
- y claridad para saber que mejoro de verdad.
