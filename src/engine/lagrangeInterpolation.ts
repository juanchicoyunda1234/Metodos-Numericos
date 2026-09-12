import { lagrangeToMonomial, monomialLatex } from '@/engine/polynomial'
import type { LagrangeTerm, NumericalResult, Point } from '@/engine/types'

export interface LagrangeInterpolationParams {
  points: Point[]
  xTarget?: number
}

function errorResult(startTime: number, message: string): NumericalResult {
  return {
    status: 'ERROR_NUMERICO',
    finalValue: null,
    iterations: 0,
    tolerance: 0,
    error: null,
    residual: null,
    executionTime: performance.now() - startTime,
    iterationData: [],
    message,
  }
}

function lagrangeBasis(i: number, x: number, xs: number[]) {
  let value = 1
  const xi = xs[i]
  for (let j = 0; j < xs.length; j++) {
    if (j === i) continue
    const denom = xi - xs[j]
    if (denom === 0) return null
    value *= (x - xs[j]) / denom
  }
  return value
}

export function lagrangeInterpolation(params: LagrangeInterpolationParams): NumericalResult {
  const startTime = performance.now()
  const { points, xTarget } = params

  if (points.length < 2) {
    return errorResult(startTime, 'Se necesitan al menos 2 puntos')
  }

  if (points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))) {
    return errorResult(startTime, 'Los datos contienen valores no numéricos')
  }

  if (xTarget !== undefined && !Number.isFinite(xTarget)) {
    return errorResult(startTime, 'Los datos contienen valores no numéricos')
  }

  const xs = points.map((p) => p.x)
  if (new Set(xs).size !== xs.length) {
    return errorResult(startTime, 'Hay valores xᵢ duplicados')
  }

  const lagrangeTerms: LagrangeTerm[] = []
  let value: number | null = null

  if (xTarget === undefined) {
    for (let i = 0; i < points.length; i++) {
      lagrangeTerms.push({ i, x: points[i].x, y: points[i].y })
    }
  } else {
    value = 0
    for (let i = 0; i < points.length; i++) {
      const basis = lagrangeBasis(i, xTarget, xs)
      if (basis === null) {
        return errorResult(startTime, 'Hay valores xᵢ duplicados')
      }
      const term = points[i].y * basis
      lagrangeTerms.push({ i, x: points[i].x, y: points[i].y, basis, term })
      value += term
    }
  }

  const interpolationPoints = points.map((p) => ({ x: p.x, y: p.y }))
  const monomialCoefficients = lagrangeToMonomial(
    interpolationPoints.map((p) => p.x),
    interpolationPoints.map((p) => p.y),
  )

  return {
    status: 'CONVERGIO',
    finalValue: value,
    iterations: 0,
    tolerance: 0,
    error: null,
    residual: null,
    executionTime: performance.now() - startTime,
    iterationData: [],
    polynomial: monomialLatex(monomialCoefficients, 16),
    interpolationPoints,
    lagrangeTerms,
    xTarget,
    monomialCoefficients,
  }
}

function formatLatexNumber(value: number, precision: number) {
  return value.toFixed(precision)
}

export function lagrangeBasisLatex(i: number, points: Point[], precision: number) {
  const others = points.filter((_, j) => j !== i)
  const num = others.map((p) => `(x-${formatLatexNumber(p.x, precision)})`).join('')
  const den = others
    .map((p) => `(${formatLatexNumber(points[i].x, precision)}-${formatLatexNumber(p.x, precision)})`)
    .join('')
  return `L_{${i}}(x) = \\dfrac{${num}}{${den}}`
}

export function lagrangeBasisAtLatex(i: number, points: Point[], xTarget: number, basis: number, precision: number) {
  const x = formatLatexNumber(xTarget, precision)
  const others = points.filter((_, j) => j !== i)
  const num = others.map((p) => `(${x}-${formatLatexNumber(p.x, precision)})`).join('')
  const den = others
    .map((p) => `(${formatLatexNumber(points[i].x, precision)}-${formatLatexNumber(p.x, precision)})`)
    .join('')
  return `L_{${i}}(${x}) = \\dfrac{${num}}{${den}} = ${formatLatexNumber(basis, precision)}`
}

export function lagrangePolynomialLatex(points: Point[], precision: number, mode: 'compact' | 'expanded') {
  if (points.length === 0) return 'P(x) = 0'

  const terms = points.map((point, i) => {
    const y = formatLatexNumber(point.y, precision)
    if (mode === 'compact') return `${y} L_{${i}}(x)`
    const basis = lagrangeBasisLatex(i, points, precision).replace(`L_{${i}}(x) = `, '')
    return `${y}\\,${basis}`
  })

  return `P(x) = ${terms.join(' + ')}`.replaceAll('+ -', '- ')
}

export function lagrangeEvaluationLatex(
  terms: LagrangeTerm[],
  xTarget: number,
  value: number,
  precision: number,
) {
  const x = formatLatexNumber(xTarget, precision)
  const products = terms
    .map((term) => {
      const basis = term.basis
      if (basis === undefined) return `${formatLatexNumber(term.y, precision)} L_{${term.i}}(${x})`
      return `${formatLatexNumber(term.y, precision)}\\cdot ${formatLatexNumber(basis, precision)}`
    })
    .join(' + ')
  const sum = terms
    .map((term) => (term.term === undefined ? `y_{${term.i}} L_{${term.i}}(${x})` : formatLatexNumber(term.term, precision)))
    .join(' + ')
  return `P(${x}) = ${products} = ${sum} = ${formatLatexNumber(value, precision)}`.replaceAll('+ -', '- ')
}
