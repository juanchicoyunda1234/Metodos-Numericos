import { monomialLatex, newtonToMonomial } from '@/engine/polynomial'
import type { NumericalResult, Point } from '@/engine/types'

export interface NewtonInterpolationParams {
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

export function newtonInterpolation(params: NewtonInterpolationParams): NumericalResult {
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

  const n = points.length
  const table: number[][] = points.map((p) => [p.y])

  for (let j = 1; j < n; j++) {
    for (let i = 0; i < n - j; i++) {
      const denom = points[i + j].x - points[i].x
      if (denom === 0) {
        return errorResult(startTime, 'Hay valores xᵢ duplicados')
      }
      table[i].push((table[i + 1][j - 1] - table[i][j - 1]) / denom)
    }
  }

  const coefficients = table[0]
  let value: number | null = null
  if (xTarget !== undefined) {
    value = coefficients[n - 1]
    for (let k = n - 2; k >= 0; k--) {
      value = coefficients[k] + (xTarget - points[k].x) * value
    }
  }

  const interpolationPoints = points.map((p) => ({ x: p.x, y: p.y }))
  const monomialCoefficients = newtonToMonomial(
    interpolationPoints.map((p) => p.x),
    coefficients,
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
    dividedDifferences: table,
    xTarget,
    monomialCoefficients,
  }
}

function formatLatexNumber(value: number, precision: number) {
  return value.toFixed(precision)
}

function factorLatex(xi: number, precision: number) {
  return `(x-${formatLatexNumber(xi, precision)})`
}

export function newtonPolynomialLatex(points: Point[], coefficients: number[], precision: number) {
  if (coefficients.length === 0) return 'P(x) = 0'

  const terms: string[] = []
  for (let k = 0; k < coefficients.length; k++) {
    const c = formatLatexNumber(coefficients[k], precision)
    if (k === 0) {
      terms.push(c)
      continue
    }
    const product = points
      .slice(0, k)
      .map((p) => factorLatex(p.x, precision))
      .join('')
    terms.push(`${c}${product}`)
  }

  return `P(x) = ${terms.join(' + ')}`.replaceAll('+ -', '- ')
}

export function newtonEvaluationLatex(
  points: Point[],
  coefficients: number[],
  xTarget: number,
  value: number,
  precision: number,
) {
  const x = formatLatexNumber(xTarget, precision)
  const terms: string[] = []

  for (let k = 0; k < coefficients.length; k++) {
    const c = formatLatexNumber(coefficients[k], precision)
    if (k === 0) {
      terms.push(c)
      continue
    }
    const product = points
      .slice(0, k)
      .map((p) => `(${x}-${formatLatexNumber(p.x, precision)})`)
      .join('')
    terms.push(`${c}${product}`)
  }

  return `P(${x}) = ${terms.join(' + ')} = ${formatLatexNumber(value, precision)}`.replaceAll('+ -', '- ')
}
