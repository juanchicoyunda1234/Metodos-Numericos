import { describe, expect, it } from 'vitest'

import { newtonInterpolation } from '@/engine/newtonInterpolation'
import { monomialLatex, snapCoefficient } from '@/engine/polynomial'

describe('Interpolación de Newton', () => {
  it('construye P(x) = −x² − x + 4 con los puntos (1,2), (0,4), (−3,−2)', () => {
    const result = newtonInterpolation({
      points: [
        { x: 1, y: 2 },
        { x: 0, y: 4 },
        { x: -3, y: -2 },
      ],
    })

    expect(result.status).toBe('CONVERGIO')
    expect(result.finalValue).toBeNull()
    const coeffs = result.monomialCoefficients ?? []
    expect(snapCoefficient(coeffs[0], 10)).toBe(4)
    expect(snapCoefficient(coeffs[1], 10)).toBe(-1)
    expect(snapCoefficient(coeffs[2], 10)).toBe(-1)
    expect(monomialLatex(coeffs, 10)).toBe('P(x) = -x^{2} - x + 4')
  })

  it('evalúa x² en 1.5 y arma la tabla de diferencias divididas', () => {
    const result = newtonInterpolation({
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 4 },
      ],
      xTarget: 1.5,
    })

    expect(result.finalValue).toBeCloseTo(2.25, 12)
    expect(result.dividedDifferences).toEqual([[0, 1, 1], [1, 3], [4]])
    expect(monomialLatex(result.monomialCoefficients ?? [], 10)).toBe('P(x) = x^{2}')
  })

  it('pasa por los nodos', () => {
    const points = [
      { x: 1, y: 1 },
      { x: 2, y: 8 },
      { x: 3, y: 27 },
    ]

    expect(newtonInterpolation({ points, xTarget: 2.5 }).finalValue).toBeCloseTo(16, 12)

    for (const node of points) {
      const atNode = newtonInterpolation({ points, xTarget: node.x })
      expect(atNode.finalValue).toBeCloseTo(node.y, 12)
    }
  })

  it('rechaza xᵢ duplicados y menos de 2 puntos', () => {
    expect(
      newtonInterpolation({
        points: [
          { x: 1, y: 1 },
          { x: 1, y: 2 },
        ],
        xTarget: 0,
      }).message,
    ).toBe('Hay valores xᵢ duplicados')

    expect(
      newtonInterpolation({
        points: [{ x: 1, y: 2 }],
        xTarget: 0,
      }).message,
    ).toBe('Se necesitan al menos 2 puntos')
  })

  it('rechaza valores no numéricos', () => {
    const result = newtonInterpolation({
      points: [
        { x: Number.NaN, y: 1 },
        { x: 2, y: 3 },
      ],
    })
    expect(result.status).toBe('ERROR_NUMERICO')
    expect(result.message).toBe('Los datos contienen valores no numéricos')
  })
})
