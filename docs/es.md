# Que faire à Paris

Los **planes de la agenda oficial de la Ciudad de París**, «Que faire à Paris ?»: conciertos,
espectáculos, exposiciones, conferencias, talleres, paseos, para niños o no, gratuitos o no.
Alrededor de su casa, en los distritos que elija o en todo París: cuántos eventos hoy, este fin de
semana y en los próximos 7 días, y el próximo. **Sin cuenta, sin clave.**

Integración no oficial, sin relación con la Ciudad de París. Construida según el modelo de la
integración Toulouse Agenda.

## Lo que obtiene

- Un **dispositivo por zona**: alrededor de la casa ubicada en Gladys (de 500 m a 5 km), toda la
  agenda o cualquiera de los 20 distritos.
- Para cada zona: el número de eventos **hoy**, **este fin de semana** y **en los próximos 7 días**,
  y el **próximo evento** (título, lugar, fecha).
- Sus **filtros** se aplican en todas partes: temas, palabras clave, solo gratuitos, para niños,
  exposiciones y eventos largos incluidos o no.
- Un **widget** «Planes en París»: los próximos eventos de sus zonas, con fecha, lugar y una
  insignia «Gratis»; al pulsar se muestran la descripción y el enlace a paris.fr.
- Dos **disparadores de escena**: se anuncia un nuevo evento, un evento empieza hoy.
- Una **acción de escena**: qué hacer este fin de semana (o esta noche, mañana…) en una frase,
  lista para enviar o decir.

## Requisitos

- Gladys Assistant 5.3.0 o posterior.
- Acceso a Internet desde Gladys (la agenda se lee en opendata.paris.fr).
- Para la zona «Alrededor de la casa»: la casa ubicada en Gladys (Ajustes → Casas).

## Instalación

En Gladys, **Integraciones → Instalar desde GitHub**, e introduzca la dirección del repositorio:
`https://github.com/guim31/gladys-que-faire-a-paris`.

## Configuración

### Ajustes

- **Zonas**: marque «Alrededor de la casa», «Todo París» y/o distritos. Cada zona se convierte en
  un dispositivo ofrecido en la pestaña Descubrir.
- **Alrededor de la casa**: el radio alrededor de la casa (500 m, 1 km, 2 km, 5 km).
- **Temas**: música, espectáculo, exposición, cine, conferencia, taller, paseo, deporte, festival.
  Nada marcado: todos los temas. Provienen de las etiquetas de la agenda.
- **Palabras clave**: separadas por comas; un evento corresponde cuando su título, lugar, calle o
  etiquetas contienen una de ellas (palabras enteras, sin importar acentos ni mayúsculas).
- **Solo eventos gratuitos**: «gratis con condiciones» incluido.
- **Público**: todos, o eventos para niños (etiqueta «Enfants» o público infantil).
- **Incluir exposiciones y eventos largos**: eventos con más de 7 fechas o con una fecha de más de
  14 días (una exposición permanente, una clase semanal). Desactivado por defecto, para que los
  contadores sigan teniendo sentido.
- **Idioma de nombres y mensajes**: nombres de funciones, textos de los disparadores y frase de la
  acción de escena. El widget sigue el idioma de cada usuario.

### Añadir zonas

Guarde, abra la pestaña **Descubrir** de la integración y añada las zonas que desee. Cambiar los
filtros después actualiza los contadores de las zonas ya añadidas; no hace falta añadirlas de
nuevo.

### Comprobar

El botón **Comprobar** muestra la última descarga de la agenda, las zonas ofrecidas y añadidas, y
los contadores de cada zona.

## Dispositivos

Cada zona tiene seis funciones, todas de solo lectura:

| Función                    | Tipo     | Contenido                                |
| -------------------------- | -------- | ---------------------------------------- |
| Eventos hoy                | contador | fechas aún por venir o en curso hoy      |
| Eventos este fin de semana | contador | del viernes 18:00 al domingo medianoche  |
| Eventos en 7 días          | contador | desde ahora hasta el final del 7.º día   |
| Próximo evento             | texto    | el título de la próxima fecha en empezar |
| Lugar del próximo evento   | texto    | su lugar y dirección                     |
| Fecha del próximo evento   | texto    | «mañana, 18:30», «sáb, 31 oct, 20:00»    |

## Widget del panel

**Planes en París** lista los próximos eventos de sus zonas (todas, o las que elija), 8 como
máximo, los más cercanos primero: título, fecha y lugar, insignia «Gratis». Ajustes: el periodo
(hoy, esta noche, mañana, este fin de semana, próximos 7 días, próximos 30 días), mostrar u ocultar
la línea de periodo y número, mostrar u ocultar la insignia «Gratis».

## Disparadores de escena

- **Nuevo evento anunciado**: un evento nunca visto, que corresponde a sus filtros, aparece en una
  zona seguida (comprobado en cada descarga).
- **Evento que empieza hoy**: cada mañana hacia las 8 (antes de las 8:10), por cada evento de una zona seguida
  con una fecha que empieza ese día.

Ambos se filtran por zona, tema principal y precio, y dan como variables la zona, el título, la
fecha, el lugar, el tema, el precio, la descripción, el enlace y la hora de inicio.

## Acción de escena

**Qué hacer en París** devuelve una frase, por ejemplo «Este fin de semana: 34 eventos, entre ellos
X (sáb, 31 oct, 20:00, Le Trianon), Y (…) y 31 más.», el número de eventos, y el título y el enlace
del primero. Campos: zonas, periodo (este fin de semana por defecto), número de eventos citados
(1 a 10).

## Ejemplos de escenas

- Cada viernes a las 18:00, enviar la frase de «Qué hacer en París» (este fin de semana, gratis)
  por Telegram.
- Cuando un evento empieza hoy alrededor de la casa y su tema es «Música», enviar una notificación
  con su título y enlace.
- Continuar solo si el número de eventos del fin de semana es mayor que 0.

## Datos y actualización

- Fuente: el conjunto de datos
  [Que faire à Paris ?](https://opendata.paris.fr/explore/dataset/que-faire-a-paris-/) de la
  Ciudad de París, Open Database License (ODbL), unos 3.300 eventos, actualizado a diario.
- La agenda se descarga **cada 8 horas** (tres veces al día como máximo, unos 1,2 MB comprimidos),
  y los contadores se recalculan cada 10 minutos sin descarga. Una descarga fallida se reintenta una hora
  después; mientras tanto se conservan los últimos eventos conocidos.
- Las fechas del conjunto de datos llevan un desfase horario erróneo: la integración las lee como
  horas de París.
- 50 eventos de escena por pasada como máximo (Gladys acepta 300 por minuto): primero la casa,
  luego los distritos, luego todo París, los más próximos primero en cada zona.
- Lo ya anunciado se guarda en `/data`: un reinicio no anuncia nada dos veces.

## Solución de problemas

- **No hay zona «Alrededor de la casa» en la pestaña Descubrir**: ubique la casa en Gladys y guarde
  de nuevo la configuración. El botón Comprobar lo indica.
- **Todos los contadores a 0**: sus filtros quizá sean demasiado estrechos (una palabra clave, solo
  gratis, niños), o la agenda aún no se ha podido descargar: consulte Comprobar y los registros.
- **«Sin valor reciente»**: Gladys no ha recibido estados desde hace 48 horas: la integración está
  detenida o no alcanza Gladys.
- Más detalles en los registros con `LOG_LEVEL=debug`.

## Limitaciones

- Solo los eventos publicados en «Que faire à Paris ?»: no todos los lugares de París publican
  allí. Algunos eventos están en las afueras; «Todo París» los incluye.
- Los eventos sin coordenadas no se cuentan alrededor de la casa; los que no tienen código postal
  de París no están en ningún distrito.
- Los títulos, lugares y descripciones quedan en francés, como se publican.
- El widget muestra 8 eventos como máximo (límite de Gladys).

## Créditos

- Datos: Ciudad de París, «Que faire à Paris ?», Open Database License (ODbL).
- Estructura y filtros adaptados de la integración Toulouse Agenda (guim31/gladys-toulouse-agenda).
