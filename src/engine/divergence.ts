export const DIVERGENCE_STREAK = 3
export const DIVERGENCE_MAGNITUDE = 1e4

export function nextGrowthStreak(x: number, xNext: number, current: number): number {
  if (!Number.isFinite(xNext)) return current + 1
  if (Math.abs(xNext) > Math.abs(x)) return current + 1
  return 0
}

export function isDiverging(xNext: number, streak: number): boolean {
  if (!Number.isFinite(xNext)) return true
  if (streak >= 2 && Math.abs(xNext) >= 1e12) return true
  return streak >= DIVERGENCE_STREAK && Math.abs(xNext) >= DIVERGENCE_MAGNITUDE
}

export function divergenceMessage(streak: number): string {
  return `El método está divergiendo: |x| creció sostenidamente durante ${streak} iteraciones.`
}

export function safeResidual(evaluate: (x: number) => number, x: number): number | null {
  if (!Number.isFinite(x)) return null
  try {
    const value = Math.abs(evaluate(x))
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}
