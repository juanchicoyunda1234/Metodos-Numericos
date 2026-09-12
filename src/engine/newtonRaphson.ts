import { divergenceMessage, isDiverging, nextGrowthStreak, safeResidual } from '@/engine/divergence'
import { parseExpression } from '@/engine/parser'
import type { Iteration, NumericalResult } from '@/engine/types'

export interface NewtonRaphsonParams {
  expression: string
  x0: number
  tolerance: number
  maxIterations: number
}

export function newtonRaphson(params: NewtonRaphsonParams): NumericalResult {
  const { expression, x0, tolerance, maxIterations } = params
  const startTime = performance.now()
  const { evaluate, evaluateDerivative } = parseExpression(expression)

  const iterationData: Iteration[] = []
  let x = x0
  let growthStreak = 0

  for (let n = 0; n < maxIterations; n++) {
    const fx = evaluate(x)
    const fpx = evaluateDerivative(x)

    if (fpx === 0) {
      return {
        status: 'ERROR_NUMERICO',
        finalValue: x,
        iterations: n,
        tolerance,
        error: null,
        residual: Math.abs(fx),
        executionTime: performance.now() - startTime,
        iterationData,
        equation: expression,
        message: `No se puede continuar: f'(x${subscript(n)}) = 0`,
      }
    }

    const xNext = x - fx / fpx
    const error = Math.abs(xNext - x)
    iterationData.push({ n, x, fx, derivative: fpx, xNext, error })

    if (error < tolerance) {
      return {
        status: 'CONVERGIO',
        finalValue: xNext,
        iterations: n + 1,
        tolerance,
        error,
        residual: Math.abs(evaluate(xNext)),
        executionTime: performance.now() - startTime,
        iterationData,
        equation: expression,
      }
    }

    growthStreak = nextGrowthStreak(x, xNext, growthStreak)
    if (isDiverging(xNext, growthStreak)) {
      return {
        status: 'DIVERGIO',
        finalValue: Number.isFinite(xNext) ? xNext : x,
        iterations: n + 1,
        tolerance,
        error: Number.isFinite(error) ? error : null,
        residual: safeResidual(evaluate, xNext),
        executionTime: performance.now() - startTime,
        iterationData,
        equation: expression,
        message: divergenceMessage(growthStreak),
      }
    }

    x = xNext
  }

  return {
    status: 'NO_CONVERGIO',
    finalValue: x,
    iterations: maxIterations,
    tolerance,
    error: iterationData.at(-1)?.error ?? null,
    residual: Math.abs(evaluate(x)),
    executionTime: performance.now() - startTime,
    iterationData,
    equation: expression,
  }
}

function subscript(n: number) {
  const digits = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']
  return String(n)
    .split('')
    .map((d) => digits[Number(d)])
    .join('')
}
