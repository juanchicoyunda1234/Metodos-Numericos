# Numeria: prompt de construcción para Claude Code

Laboratorio interactivo de métodos numéricos. Proyecto individual para puntos extra en Métodos Numéricos, Nivel III B, Ing. Peñafiel Gaibor.

## 1. Objetivo del producto

No es una simple calculadora de métodos numéricos. Es una herramienta donde el usuario escribe una expresión matemática de forma natural, ejecuta el método, y ve el cálculo, la convergencia y el procedimiento paso a paso. El diferenciador es la combinación de: entrada matemática real + cálculo numérico + visualización + procedimiento paso a paso.

## 2. Métodos y aclaración importante

1. Newton-Raphson clásico
2. Newton-Raphson con derivada constante
3. Interpolación de Newton (diferencias divididas)
4. Interpolación de Lagrange

Aclaración: inicialmente el método 2 se nombró "Von Mises". NO es el criterio de Von Mises de resistencia de materiales/plasticidad, ni el método de la potencia para autovalores. Es una variante de Newton-Raphson donde `f'(x₀)` se calcula una sola vez, al inicio, y se reutiliza en todas las iteraciones en vez de recalcular la derivada en cada paso.

## 3. Definiciones matemáticas exactas

### 3.1 Newton-Raphson clásico
```
x(n+1) = x(n) - f(x(n)) / f'(x(n))
```
En cada iteración se vuelve a evaluar la derivada. Entradas: f(x), x₀, tolerancia ε. Opcional: máximo de iteraciones (default 100). La derivada se obtiene automáticamente a partir de la expresión (Math.js), no se le pide al usuario que la escriba.

### 3.2 Newton-Raphson con derivada constante
```
d = f'(x₀)              (una sola vez)
x(n+1) = x(n) - f(x(n)) / d
```
Entradas: f(x), x₀, tolerancia ε, máximo de iteraciones. La interfaz debe mostrar explícitamente el valor de `d = f'(x₀)` calculado, para que quede claro que no cambia entre iteraciones.

### 3.3 Interpolación de Newton (diferencias divididas)
Entradas: conjunto de puntos (xᵢ, yᵢ), valor x a interpolar. Construir la tabla de diferencias divididas y el polinomio de Newton. Validar: al menos los puntos necesarios para el orden deseado, sin valores xᵢ duplicados.

### 3.4 Interpolación de Lagrange
Entradas: conjunto de puntos (xᵢ, yᵢ), valor x a interpolar. Validar xᵢ sin duplicados.
```
P(x) = Σ yᵢ·Lᵢ(x)     para i = 0..n
```

### 3.5 Criterio de parada (métodos 1 y 2)
```
|x(n+1) - x(n)| < ε
```
Registrar también `|f(xₙ)|` como residuo. Estados posibles: CONVERGIÓ (alcanzó la tolerancia), NO CONVERGIÓ (alcanzó el máximo de iteraciones), ERROR NUMÉRICO (condición que impide continuar, ej. derivada cero).

## 4. Stack tecnológico

- React + TypeScript: estructura de componentes y tipado
- Tailwind CSS + shadcn/ui: diseño y componentes reutilizables (botones, paneles, tablas, diálogos)
- MathLive: entrada y edición de expresiones matemáticas con `<math-field>`, licencia MIT (https://github.com/arnog/mathlive)
- Math.js: parsing, derivación y evaluación numérica de las expresiones
- Apache ECharts: gráficas interactivas (función, convergencia, comparación)
- TanStack Table: tablas de iteraciones y de interpolación
- Tauri (fase final): empaqueta la misma app web como aplicación de escritorio nativa

## 5. Arquitectura (4 capas)

```
┌──────────────────────────────────────┐
│ PRESENTACIÓN                         │
│ React + MathLive + ECharts + UI      │
└──────────────────┬───────────────────┘
                    │
┌──────────────────▼───────────────────┐
│ APLICACIÓN                           │
│ Validación + servicios + resultados  │
└──────────────────┬───────────────────┘
                    │
┌──────────────────▼───────────────────┐
│ MOTOR NUMÉRICO                       │
│ Newton / Newton Cte. / Lagrange      │
│ Newton Interpolación                 │
└──────────────────┬───────────────────┘
                    │
┌──────────────────▼───────────────────┐
│ MATEMÁTICA                            │
│ Parser / evaluación / derivación      │
│ (Math.js)                             │
└──────────────────────────────────────┘
```
La interfaz nunca calcula directamente: siempre pasa por el motor numérico.

## 6. Estructura de carpetas

```
src/
  engine/
    parser.ts                    (envuelve Math.js: parseo, derivación, evaluación)
    newtonRaphson.ts
    newtonRaphsonConstante.ts
    newtonInterpolation.ts
    lagrangeInterpolation.ts
    types.ts                     (NumericalResult, Iteration)
  components/
    MethodSelector/
    MathInput/                   (wrapper de MathLive)
    ParamsForm/
    ResultSummary/
    IterationTable/              (TanStack Table)
    ConvergenceChart/            (ECharts)
    ComparisonView/
    ProcedureView/
  App.tsx
  main.tsx
```
Cada función de `engine/` recibe los datos de entrada y devuelve un resultado estructurado; no sabe nada de React ni de la UI.

## 7. Estructura de resultados

```
NumericalResult
  status            CONVERGIÓ | NO_CONVERGIO | ERROR_NUMERICO
  finalValue
  iterations
  tolerance
  error
  residual
  executionTime
  iterationData     : Iteration[]
  equation / polynomial

Iteration
  n
  x
  fx
  derivative
  xNext
  error
```
No todos los campos se usan en todos los métodos (por ejemplo, `derivative` no aplica a interpolación).

## 8. Tablas por método

**Newton-Raphson:** n | xₙ | f(xₙ) | f'(xₙ) | xₙ₊₁ | Error

**Newton con derivada constante:** n | xₙ | f(xₙ) | d = f'(x₀) (mismo valor en todas las filas) | xₙ₊₁ | Error

**Interpolación de Newton:** tabla de datos originales (i, xᵢ, f(xᵢ)) + tabla de diferencias divididas completa + resultado P(x) y P(x evaluado)

**Lagrange:** i | xᵢ | yᵢ | Lᵢ(x) | yᵢ·Lᵢ(x), y el resultado P(x). Ofrecer vista simplificada y vista detallada si hay muchos puntos.

## 9. Gráficas por método

- **Newton-Raphson:** f(x), raíz, puntos de cada iteración sobre la curva, trayectoria de convergencia, opcionalmente las tangentes
- **Newton con derivada constante:** f(x), trayectoria del método, raíz, comparación opcional con Newton clásico
- **Interpolación (Newton y Lagrange):** puntos originales, curva/polinomio interpolante, punto solicitado y su valor interpolado

## 10. Validaciones y manejo de errores

- Newton clásico: si `f'(xₙ) = 0`, no dividir, mostrar "No se puede continuar: f'(xₙ) = 0"
- Newton constante: si `f'(x₀) = 0`, no ejecutar, mostrar "No se puede ejecutar el método: f'(x₀) = 0"
- Interpolación: rechazar xᵢ duplicados, datos incompletos o valores no numéricos
- Expresión matemática que MathLive/Math.js no pueda interpretar: mostrar "Expresión matemática no válida" y no ejecutar el algoritmo hasta corregirla

## 11. Precisión de presentación

Cálculo interno con la mayor precisión disponible; el redondeo es solo para mostrar en pantalla. Default: 10 cifras decimales, configurable por el usuario.

## 12. Identidad visual

Concepto: "Scientific IDE / Numerical Laboratory", no dashboard administrativo. Nombre sugerido: "Numeria" (no obligatorio, sirve como referencia visual).

Priorizar: expresiones matemáticas grandes, tablas densas pero legibles, gráficos como elemento principal, navegación lateral, estados de cálculo visibles.

Evitar: tarjetas muy redondeadas, KPIs decorativos, iconos sin función, gradientes innecesarios, apariencia de página administrativa, formularios convencionales para introducir fórmulas (para eso está MathLive, no un `<input type="text">`).

## 13. Pantallas

### 13.1 Pantalla inicial
Barra lateral con los métodos agrupados:
```
MÉTODOS
▸ Raíces
    Newton-Raphson
    Newton-Raphson constante
▸ Interpolación
    Newton
    Lagrange
▸ Análisis
    Comparar métodos
```

### 13.2 Pantalla de método
Campo `f(x)` con MathLive, parámetros del método (x₀, tolerancia, iteraciones, o los puntos si es interpolación), botón Ejecutar. Después de ejecutar: gráfica, resumen del resultado (valor, estado, iteraciones, error), tabla de iteraciones, y un toggle para pasar a modo Procedimiento.

### 13.3 Modo Procedimiento
Alternativa al modo Resultado: muestra la fórmula general y luego la sustitución numérica de cada iteración paso a paso (ej. `x₁ = x₀ - f(x₀)/f'(x₀)` con los valores ya sustituidos). Convierte la app en herramienta educativa además de calculadora.

## 14. Modo comparación

Ejecutar Newton clásico y Newton con derivada constante con los mismos `f(x)`, `x₀`, tolerancia y máximo de iteraciones. Mostrar tabla comparativa:

| Característica | Newton clásico | Newton constante |
|---|---:|---:|
| Iteraciones | ... | ... |
| Error final | ... | ... |
| Evaluaciones de derivada | ... | 1 |
| Estado | ... | ... |

Más una gráfica con ambas trayectorias superpuestas. Esta funcionalidad demuestra experimentalmente la diferencia entre los dos métodos, no es solo mostrar dos resultados por separado.

## 15. Exportación

- CSV para las tablas de iteraciones
- PDF con informe del cálculo: método, función, parámetros, resultado, tabla, gráfica, estado
- Guardar sesión (recuperar un cálculo después): funcionalidad futura, no entra en la v1

## 16. Referencias de código abierto consultadas

Ninguna cubre exactamente esta combinación de métodos; usarlas solo como referencia de estructura y lógica, revisando la licencia antes de reutilizar cualquier código, y documentando la procedencia si se reutiliza algo:

- `jerson/MetodosNumericosParaIng` (Java): referencia de lógica para Newton-Raphson, Newton y Lagrange
- `Evelyin405/numerical-methods-calc` (HTML/CSS/JS): referencia del flujo entrada → seleccionar método → calcular → tabla → gráfico
- `Estebangmz666/numerical-methods` (MATLAB/Octave): referencia de separación métodos/resultados/tablas/figuras
- `paramphy/C_codes_for_Numerical_analysis` (C, licencia GPL-3.0): referencia de estructura Interpolation/Root_finding
- `BahyMedhat/Numerical-Methods` (MATLAB GUI): junta Newton-Raphson + interpolación de Newton y Lagrange en una interfaz, buena referencia funcional aunque en otro lenguaje

## 17. Qué NO hacer

- No copiar un proyecto completo cambiando solo colores
- No mezclar código de varios repositorios sin revisar sus licencias
- No acoplar los cálculos numéricos directamente a los componentes de UI
- No hacer un único archivo gigante
- No implementar gráficos antes de validar que los resultados matemáticos son correctos
- No confundir Newton-Raphson clásico con la variante de derivada constante en ningún punto del código o la interfaz
- Sin comentarios en el código
- No agregar librerías, capas o funcionalidades que no estén en este documento

## 18. Plan de construcción por fases

1. UI: MathLive + React + diseño Scientific IDE (sin lógica matemática todavía)
2. Motor matemático: Newton-Raphson clásico
3. Motor matemático: Newton-Raphson con derivada constante
4. Motor matemático: Interpolación de Newton
5. Motor matemático: Interpolación de Lagrange
6. ECharts: visualización de convergencia para cada método
7. Modo comparación (Newton clásico vs constante)
8. Tests y validación matemática de los 4 métodos contra casos conocidos
9. Empaquetado con Tauri como aplicación de escritorio

## 19. Instrucción final

Con esta especificación completa, construye Numeria fase por fase en el orden de la sección 18, respetando la arquitectura de la sección 5, la estructura de carpetas de la sección 6 y las definiciones matemáticas exactas de la sección 3. Antes de avanzar de fase, valida que el motor matemático de esa fase produzca resultados correctos verificados a mano. No agregues librerías, capas o funcionalidades que no estén especificadas aquí.
