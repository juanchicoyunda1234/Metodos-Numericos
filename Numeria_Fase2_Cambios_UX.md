# Numeria: cambios de interfaz (fase 2)

Este documento se aplica sobre el proyecto Numeria ya construido y probado (fases 1-9 de `Numeria_ClaudeCode_Prompt.md`, funcionando y validado a mano). No modifica el motor matemático, que ya está correcto y no debe tocarse. Es exclusivamente visualización, estética y UX/navegación.

## 0. Control de versiones (hacer primero, antes de cualquier cambio)

1. Confirmar que el estado actual (MVP funcional de las 9 fases) está commiteado.
2. Crear un repositorio en GitHub si no existe todavía, y subir ese estado actual tal cual.
3. Crear una rama a partir de ahí (ej. `mvp-v1` o un tag) que quede fija como respaldo del MVP que ya funciona.
4. Crear una nueva rama (ej. `ui-v2`) donde se implementen todos los cambios de este documento. Nunca trabajar directamente sobre la rama del MVP.

## 1. Objetivo de esta fase

Llevar la interfaz ya funcional a un nivel profesional. El diferenciador no es agregar más elementos visuales, sino que las vistas que hoy son independientes (tabla, gráfica, procedimiento) compartan un mismo estado y se sientan una sola herramienta, y que las gráficas comuniquen algo matemático real, no solo decoren el resultado.

## 2. Estado compartido: "iteración activa" (arquitectura, hacerlo primero de esta fase)

Antes de tocar timeline, tabla o gráfica por separado: crear un estado a nivel de la vista de método (ej. `activeIteration: number | null`) del que lean las tres piezas:

- La tabla resalta la fila de `activeIteration`.
- La gráfica resalta el punto de esa iteración sobre f(x).
- El Procedimiento se posiciona en esa iteración.

Cualquiera de las tres vistas puede escribir ese estado (click en una fila de la tabla, click en un punto de la gráfica, navegar el timeline del procedimiento) y las otras dos reaccionan. Sin este estado compartido, no implementar las secciones 3, 4 y 5.

## 3. Procedimiento como timeline

Reemplazar la lista actual de "Iteración 1 / Iteración 2 / ..." por un timeline vertical:

```
● ITERACIÓN 0
│ x₀ = 3
│
● ITERACIÓN 1
│ x₁ = x₀ - f(x₀)/f'(x₀)
│ x₁ = 2.166667
│
● ITERACIÓN 2
│ ...
│
● CONVERGENCIA
```

Cada nodo del timeline, al hacer click, escribe `activeIteration` (sección 2).

Para corridas largas (Newton constante puede tardar 10+ iteraciones, un caso sin convergencia llega a 100): mostrar las primeras 5 y las últimas 5, con un botón "Mostrar todas las iteraciones" que expande el resto. No truncar si hay 10 iteraciones o menos.

## 4. Tabla interactiva

- Buscador simple sobre la tabla de iteraciones (TanStack Table ya lo soporta).
- Click en una fila escribe `activeIteration` (sección 2).
- La fila con `activeIteration` queda visualmente resaltada.

## 5. Gráfica

- Al cambiar `activeIteration` (sección 2), resaltar ese punto sobre la curva.
- Controles para mostrar/ocultar capas ya calculadas: mostrar iteraciones, mostrar tangentes, mostrar trayectoria. Son toggles sobre series que ECharts ya dibuja, no cálculo nuevo.
- Reproducción automática: un control de play/pause que recorre las iteraciones en secuencia avanzando `activeIteration` con un temporizador, con un slider de velocidad. No es una animación de transición entre valores, es un recorrido automático punto por punto.

## 6. Banner de estado

Mover el estado (CONVERGIÓ / NO CONVERGIÓ / ERROR NUMÉRICO / DIVERGIÓ) arriba del resultado, con color, ícono, y una explicación de una línea generada con los datos reales de esa corrida (no un texto fijo):

- CONVERGIÓ → "La tolerancia ε = {tolerancia} fue alcanzada en {iteraciones} iteraciones."
- NO CONVERGIÓ → "Se alcanzó el máximo de {maxIteraciones} iteraciones sin cumplir la tolerancia."
- ERROR NUMÉRICO → el mensaje específico ya existente (ej. "No se puede continuar: f'(xₙ) = 0"), solo con más presencia visual.
- DIVERGIÓ → ver sección 9.

## 7. Layouts

- **Pantalla de método (raíces)**: dos zonas lado a lado en pantallas anchas. Izquierda: función, parámetros, botón Ejecutar. Derecha: gráfica. El banner de estado, la tabla y el procedimiento van debajo, a todo el ancho. En pantallas angostas, apilar en una sola columna (izquierda arriba, derecha abajo) en vez de forzar el layout de dos zonas.
- **Interpolación (Newton y Lagrange)**: layout propio, no reutilizar el de raíces. Izquierda: tabla de puntos (xᵢ, yᵢ) con agregar/eliminar y el campo de evaluación. Derecha: gráfica con los puntos originales y la curva interpolante.

## 8. Entrada matemática

- Botones de inserción rápida sobre el campo MathLive: x, x², √, π, sin, cos, ln.
- Tooltip al pasar el mouse sobre las etiquetas de parámetros (ε, x₀, etc.) con una explicación breve de qué es cada uno.
- Validación de la expresión con un pequeño retraso (300-500 ms sin que el usuario escriba) antes de mostrar "Expresión matemática no válida", no en cada tecla presionada.
- Atajos de teclado: Enter dentro del campo MathLive ejecuta el método actual. Ctrl+Enter ejecuta desde cualquier parte de la pantalla de método. Escape cierra cualquier diálogo (dejar el listener preparado aunque hoy no haya diálogos que cerrar).

## 9. Manejo de divergencia

En Newton-Raphson y Newton constante: si el valor absoluto de x crece de forma sostenida durante varias iteraciones seguidas (indicando que se está alejando en vez de converger, en lugar de forzar las 100 iteraciones hasta notación científica extrema), cortar la ejecución antes y reportar estado DIVERGIÓ con una explicación (ej. "El método está divergiendo: |x| creció sostenidamente durante N iteraciones").

## 10. Comportamiento al cambiar de método

Decidir a propósito en vez de dejarlo accidental:

- Entre Newton-Raphson ↔ Newton-Raphson constante: limpiar f(x) y x₀ al cambiar (cada método suele probarse con su propio caso).
- Entre Interpolación de Newton ↔ Lagrange: mantener los puntos (xᵢ, yᵢ) al cambiar (mismo tipo de dato, útil para comparar ambos métodos con el mismo conjunto).

## 11. Modo comparación (rediseño)

- Reemplazar la tabla comparativa actual por dos tarjetas lado a lado (Newton clásico / Newton constante), cada una con: valor final, estado, iteraciones, evaluaciones de derivada.
- Agregar una gráfica de Error vs Iteración en escala logarítmica, con una serie por método. Esta gráfica es nueva, complementa a "Trayectorias superpuestas" (que muestra dónde cae cada punto sobre f(x)); no la reemplaza. El objetivo es que se vea visualmente la diferencia entre convergencia cuadrática (Newton clásico) y lineal (Newton constante).
- Agregar una conclusión de una línea generada con los datos reales de esa corrida (ej. "Newton clásico alcanzó la tolerancia en {n1} iteraciones con {n1} evaluaciones de derivada; Newton constante tardó {n2} iteraciones con 1 sola evaluación.").

## 12. Estética

- Radio de bordes pequeño (4-6px) en toda la interfaz, no los bordes muy redondeados de un dashboard genérico.
- Tema claro/oscuro: agregar un toggle junto al selector de "PRECISIÓN" que ya existe arriba. Definir una paleta clara equivalente a la oscura actual, sin reutilizar los mismos valores de gris invertidos sin revisar contraste.

## 13. Fuera de esta fase

- Estado "Calculando..." en el botón Ejecutar: descartado. Los tiempos de ejecución medidos son de milisegundos (0.2 a 25 ms), nunca sería perceptible.
- Formato condicional de color en la tabla (degradado en la columna Error, fila de convergencia resaltada en verde): no decidido todavía, no implementar hasta una siguiente ronda.
- El contexto de una línea bajo el título de cada método ya existe en el MVP actual, no requiere cambios.

## 14. Plan de construcción sugerido para esta fase

10. Exportación: CSV para tablas de iteraciones, PDF con informe del cálculo (método, función, parámetros, resultado, tabla, gráfica, estado). Ver sección 15 de `Numeria_ClaudeCode_Prompt.md`.
11. Estado compartido de "iteración activa" (sección 2) + timeline de Procedimiento (sección 3) + tabla interactiva (sección 4) + resaltado en gráfica (parte de sección 5), ya que las cuatro dependen del mismo estado.
12. Gráfica: capas configurables y reproducción automática (resto de la sección 5).
13. Banner de estado dinámico (sección 6).
14. Layouts: dos zonas para raíces, layout propio para interpolación (sección 7).
15. Entrada matemática: atajos rápidos, tooltips, validación con debounce, atajos de teclado (sección 8).
16. Detección de divergencia (sección 9).
17. Comportamiento de campos al cambiar de método (sección 10).
18. Modo comparación rediseñado: tarjetas, gráfica de error logarítmico, conclusión dinámica (sección 11).
19. Tema claro/oscuro y pulido de estética (secciones 12).

**Empaquetado con Tauri: pospuesto.** Aunque la Fase 9 del documento original (`Numeria_ClaudeCode_Prompt.md`) lo listaba como último paso, el empaquetado a aplicación de escritorio no se hace todavía. Se hace una sola vez, al final, cuando las fases 10 a 19 de este documento estén completas y la aplicación se considere terminada. Si la Fase 9 original ya se ejecutó, no hace falta repetirla; si no se ha ejecutado, queda fuera del alcance de este documento.

## 15. Instrucción final

Trabajar sobre la rama `ui-v2` creada en la sección 0, nunca sobre la rama del MVP. Seguir el orden de la sección 14. No empaquetar con Tauri en esta ronda (ver nota al final de la sección 14); eso ocurre en una fase aparte, posterior, cuando se confirme que la aplicación está terminada. Antes de avanzar de fase, verificar que el motor matemático (fases 1-9 ya construidas) siga produciendo los mismos resultados que antes; ninguna fase de este documento debe cambiar un valor calculado, solo cómo se presenta. No agregar librerías nuevas: todo lo descrito aquí se resuelve con React, Tailwind, shadcn/ui, ECharts y TanStack Table, que ya están en el proyecto.
