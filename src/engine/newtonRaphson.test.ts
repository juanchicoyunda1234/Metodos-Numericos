import { describe, expect, it } from 'vitest'

import { newtonRaphson } from '@/engine/newtonRaphson'
import { InvalidExpressionError } from '@/engine/parser'

describe('Newton-Raphson clásico', () => {
  it('reproduce los primeros pasos de x² − 2 con x₀ = 1', () => {
    const result = newtonRaphson({
      expression: 'x^2-2',
      x0: 1,
      tolerance: 1e-12,
      maxIterations: 20,
    })

    expect(result.iterationData[0]).toMatchObject({
      n: 0,
      x: 1,
      fx: -1,
      derivative: 2,
      xNext: 1.5,
      error: 0.5,
    })

    expect(result.iterationData[1].x).toBe(1.5)
    expect(result.iterationData[1].fx).toBe(0.25)
    expect(result.iterationData[1].derivative).toBe(3)
    expect(result.iterationData[1].xNext).toBeCloseTo(1.5 - 0.25 / 3, 12)
    expect(result.iterationData[1].error).toBeCloseTo(0.25 / 3, 12)
  })

  it('converge a √2', () => {
    const result = newtonRaphson({
      expression: 'x^2-2',
      x0: 1,
      tolerance: 1e-10,
      maxIterations: 20,
    })

    expect(result.status).toBe('CONVERGIO')
    expect(result.finalValue).toBeCloseTo(Math.sqrt(2), 10)
    expect(result.error).not.toBeNull()
    expect(result.error as number).toBeLessThan(1e-10)
    expect(result.residual).toBeLessThan(1e-9)
    expect(result.iterationData.at(-1)?.error as number).toBeLessThan(1e-10)
  })

  it('recalcula la derivada en cada iteración', () => {
    const result = newtonRaphson({
      expression: 'x^2-2',
      x0: 1,
      tolerance: 1e-8,
      maxIterations: 20,
    })

    const derivatives = result.iterationData.map((row) => row.derivative)
    expect(new Set(derivatives).size).toBeGreaterThan(1)
  })

  it('cumple el criterio |xₙ₊₁ − xₙ| < ε', () => {
    const tolerance = 1e-6
    const result = newtonRaphson({
      expression: 'x^3-x-2',
      x0: 1.5,
      tolerance,
      maxIterations: 50,
    })

    expect(result.status).toBe('CONVERGIO')
    expect(result.iterationData[0].x).toBe(1.5)
    expect(result.iterationData[0].fx).toBeCloseTo(-0.125, 12)
    expect(result.iterationData[0].derivative).toBeCloseTo(5.75, 12)
    expect(result.iterationData[0].xNext).toBeCloseTo(1.5217391304347827, 12)

    const last = result.iterationData.at(-1)
    expect(last?.error as number).toBeLessThan(tolerance)
    if (result.iterationData.length > 1) {
      expect(result.iterationData.at(-2)?.error as number).toBeGreaterThanOrEqual(tolerance)
    }
    expect(result.finalValue).toBeCloseTo(1.5213797068045676, 8)
  })

  it('no divide si f′(xₙ) = 0', () => {
    const result = newtonRaphson({
      expression: 'x^2',
      x0: 0,
      tolerance: 1e-6,
      maxIterations: 10,
    })

    expect(result.status).toBe('ERROR_NUMERICO')
    expect(result.iterationData).toHaveLength(0)
    expect(result.message).toBe("No se puede continuar: f'(x₀) = 0")
  })

  it('marca NO_CONVERGIO al agotar iteraciones', () => {
    const result = newtonRaphson({
      expression: 'x^2-2',
      x0: 1,
      tolerance: 1e-12,
      maxIterations: 2,
    })

    expect(result.status).toBe('NO_CONVERGIO')
    expect(result.iterations).toBe(2)
    expect(result.iterationData).toHaveLength(2)
    expect(result.error as number).toBeGreaterThanOrEqual(1e-12)
  })

  it('rechaza una expresión inválida', () => {
    expect(() =>
      newtonRaphson({
        expression: '',
        x0: 1,
        tolerance: 1e-6,
        maxIterations: 10,
      }),
    ).toThrow(InvalidExpressionError)
  })
})
