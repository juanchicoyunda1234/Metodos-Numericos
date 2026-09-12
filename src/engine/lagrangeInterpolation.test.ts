import { describe, expect, it } from 'vitest'

import { lagrangeInterpolation } from '@/engine/lagrangeInterpolation'
import { newtonInterpolation } from '@/engine/newtonInterpolation'
import { monomialLatex, snapCoefficient } from '@/engine/polynomial'

describe('Interpolación de Lagrange', () => {
  it('reproduce Lᵢ(1.5) y P(1.5) = 2.25 para x²', () => {
    const result = lagrangeInterpolation({
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 4 },
      ],
      xTarget: 1.5,
    })

    expect(result.status).toBe('CONVERGIO')
    expect(result.lagrangeTerms?.[0].basis).toBeCloseTo(-0.125, 12)
    expect(result.lagrangeTerms?.[1].basis).toBeCloseTo(0.75, 12)
    expect(result.lagrangeTerms?.[2].basis).toBeCloseTo(0.375, 12)
    expect(result.lagrangeTerms?.[0].term).toBeCloseTo(0, 12)
    expect(result.lagrangeTerms?.[1].term).toBeCloseTo(0.75, 12)
    expect(result.lagrangeTerms?.[2].term).toBeCloseTo(1.5, 12)
    expect(result.finalValue).toBeCloseTo(2.25, 12)
    expect(result.lagrangeTerms?.reduce((sum, term) => sum + (term.basis ?? 0), 0)).toBeCloseTo(1, 12)
  })

  it('coincide con Newton en el polinomio y en el valor interpolado', () => {
    const points = [
      { x: 1, y: 2 },
      { x: 0, y: 4 },
      { x: -3, y: -2 },
    ]
    const lagrange = lagrangeInterpolation({ points, xTarget: 0.5 })
    const newton = newtonInterpolation({ points, xTarget: 0.5 })

    expect(lagrange.finalValue).toBeCloseTo(newton.finalValue as number, 10)
    expect(monomialLatex(lagrange.monomialCoefficients ?? [], 10)).toBe('P(x) = -x^{2} - x + 4')
    expect(monomialLatex(newton.monomialCoefficients ?? [], 10)).toBe('P(x) = -x^{2} - x + 4')

    const lc = lagrange.monomialCoefficients ?? []
    const nc = newton.monomialCoefficients ?? []
    expect(lc.length).toBe(nc.length)
    for (let i = 0; i < lc.length; i++) {
      expect(snapCoefficient(lc[i], 8)).toBe(snapCoefficient(nc[i], 8))
    }
  })

  it('Lᵢ(xₖ) = δᵢₖ y P(xᵢ) = yᵢ', () => {
    const points = [
      { x: 1, y: 1 },
      { x: 2, y: 8 },
      { x: 3, y: 27 },
    ]

    for (const node of points) {
      const result = lagrangeInterpolation({ points, xTarget: node.x })
      expect(result.finalValue).toBeCloseTo(node.y, 12)
      for (const term of result.lagrangeTerms ?? []) {
        expect(term.basis).toBeCloseTo(term.x === node.x ? 1 : 0, 12)
      }
    }
  })

  it('rechaza xᵢ duplicados', () => {
    const result = lagrangeInterpolation({
      points: [
        { x: 1, y: 1 },
        { x: 1, y: 4 },
      ],
      xTarget: 0,
    })
    expect(result.status).toBe('ERROR_NUMERICO')
    expect(result.message).toBe('Hay valores xᵢ duplicados')
  })
})
