import { parseExpression } from '@/engine/parser'
import type { Iteration, NumericalResult } from '@/engine/types'

export interface NewtonRaphsonConstanteParams {
  expression: string
  x0: number
  tolerance: number
  maxIterations: number
}

export function newtonRaphsonConstante(params: NewtonRaphsonConstanteParams): NumericalResult {
  const { expression, x0, tolerance, maxIterations } = params
  const startTime = performance.now()
  const { evaluate, evaluateDerivative } = parseExpression(expression)

  const d = evaluateDerivative(x0)

  if (d === 0) {
    return {
      status: 'ERROR_NUMERICO',
      finalValue: x0,
      iterations: 0,
      tolerance,
      error: null,
      residual: Math.abs(evaluate(x0)),
      executionTime: performance.now() - startTime,
      iterationData: [],
      equation: expression,
      constantDerivative: d,
      message: "No se puede ejecutar el método: f'(x₀) = 0",
    }
  }

  const iterationData: Iteration[] = []
  let x = x0

  for (let n = 0; n < maxIterations; n++) {
    const fx = evaluate(x)
    const xNext = x - fx / d
    const error = Math.abs(xNext - x)
    iterationData.push({ n, x, fx, derivative: d, xNext, error })

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
        constantDerivative: d,
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
    constantDerivative: d,
  }
}
