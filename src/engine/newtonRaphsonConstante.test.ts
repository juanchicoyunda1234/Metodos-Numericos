import { describe, expect, it } from 'vitest'

import { newtonRaphson } from '@/engine/newtonRaphson'
import { newtonRaphsonConstante } from '@/engine/newtonRaphsonConstante'

describe('Newton-Raphson con derivada constante', () => {
  it('usa d = f′(x₀) = 2 y no la cambia', () => {
    const result = newtonRaphsonConstante({
      expression: 'x^2-2',
      x0: 1,
      tolerance: 1e-4,
      maxIterations: 20,
    })

    expect(result.constantDerivative).toBe(2)
    expect(result.iterationData[0]).toMatchObject({
      n: 0,
      x: 1,
      fx: -1,
      derivative: 2,
      xNext: 1.5,
      error: 0.5,
    })
    expect(result.iterationData[1]).toMatchObject({
      n: 1,
      x: 1.5,
      fx: 0.25,
      derivative: 2,
      xNext: 1.375,
      error: 0.125,
    })
    expect(result.iterationData[2].x).toBe(1.375)
    expect(result.iterationData[2].fx).toBeCloseTo(-0.109375, 12)
    expect(result.iterationData[2].xNext).toBeCloseTo(1.4296875, 12)
    expect(result.iterationData[2].error).toBeCloseTo(0.0546875, 12)
    expect(result.iterationData.every((row) => row.derivative === 2)).toBe(true)
  })

  it('converge a √2 más lento que el clásico', () => {
    const params = {
      expression: 'x^2-2',
      x0: 1,
      tolerance: 1e-10,
      maxIterations: 40,
    }
    const classic = newtonRaphson(params)
    const constant = newtonRaphsonConstante(params)

    expect(constant.status).toBe('CONVERGIO')
    expect(constant.finalValue).toBeCloseTo(Math.sqrt(2), 9)
    expect(classic.iterations).toBeLessThan(constant.iterations)
  })

  it('no ejecuta si f′(x₀) = 0', () => {
    const result = newtonRaphsonConstante({
      expression: 'x^2',
      x0: 0,
      tolerance: 1e-6,
      maxIterations: 10,
    })

    expect(result.status).toBe('ERROR_NUMERICO')
    expect(result.constantDerivative).toBe(0)
    expect(result.iterationData).toHaveLength(0)
    expect(result.message).toBe("No se puede ejecutar el método: f'(x₀) = 0")
  })

  it('oscila 1 → 2 → 0 en x³ − x − 2 con x₀ = 1', () => {
    const result = newtonRaphsonConstante({
      expression: 'x^3-x-2',
      x0: 1,
      tolerance: 1e-8,
      maxIterations: 6,
    })

    expect(result.constantDerivative).toBe(2)
    expect(result.iterationData.map((row) => row.x)).toEqual([1, 2, 0, 1, 2, 0])
    expect(result.status).toBe('NO_CONVERGIO')
  })
})
