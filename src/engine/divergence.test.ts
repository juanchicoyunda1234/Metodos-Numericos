import { describe, expect, it } from 'vitest'

import {
  DIVERGENCE_MAGNITUDE,
  DIVERGENCE_STREAK,
  divergenceMessage,
  isDiverging,
  nextGrowthStreak,
} from '@/engine/divergence'

describe('detección de divergencia', () => {
  it('acumula racha solo mientras |x| crece', () => {
    expect(nextGrowthStreak(1, 2, 0)).toBe(1)
    expect(nextGrowthStreak(2, 5, 1)).toBe(2)
    expect(nextGrowthStreak(5, 4, 2)).toBe(0)
  })

  it('no dispara en rachas cortas o magnitudes pequeñas', () => {
    expect(isDiverging(1e5, DIVERGENCE_STREAK - 1)).toBe(false)
    expect(isDiverging(10, DIVERGENCE_STREAK)).toBe(false)
  })

  it('dispara con racha y magnitud suficientes', () => {
    expect(isDiverging(DIVERGENCE_MAGNITUDE, DIVERGENCE_STREAK)).toBe(true)
    expect(isDiverging(Number.POSITIVE_INFINITY, 1)).toBe(true)
  })

  it('explica la racha real', () => {
    expect(divergenceMessage(4)).toBe(
      'El método está divergiendo: |x| creció sostenidamente durante 4 iteraciones.',
    )
  })
})
