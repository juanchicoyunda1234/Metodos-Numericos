# Numeria — design system

Fuente de verdad visual. El generador de UI UX Pro Max sugirió naranja/neumorfismo; **no se aplica**. Esta marca ya está cerrada.

## Producto

Laboratorio de métodos numéricos (herramienta densa, no landing). Audiencia: estudiantes e ingenieros. Stack: React + Tailwind v4 + shadcn/Radix + ECharts.

## Diales

- Variance: 4
- Motion: 3
- Density: 8

## Color (bloqueado)

- Accent: `#45b8e0` (oscuro) / `#157ea3` (claro)
- Background: `#0a0d12` / `#eef1f6`
- Panel: `#0f131a` / `#f7f9fc`
- Text: `#e3e9f1` / `#1b2430`
- Success / warning / danger: tokens `--n-success`, `--n-warning`, `--n-danger`

No sustituir el azul. No añadir un segundo acento de marca.

## Tipografía (bloqueada)

- UI: IBM Plex Sans
- Datos: IBM Plex Mono, tabular nums
- Radio: 5px

## UX obligatorio

- Contraste AA, anillos de foco visibles, `prefers-reduced-motion`
- Objetivos táctiles ~44px en móvil
- `cursor-pointer` en controles
- Errores con `role="alert"`, foco al fallar Ejecutar, `aria-describedby` en el campo
- Iconos Lucide: `aria-hidden` si hay texto; `aria-label` si el control es solo icono
- Gráficas: leyenda + forma, no solo color
