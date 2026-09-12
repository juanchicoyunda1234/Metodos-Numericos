export function polyAdd(a: number[], b: number[]): number[] {
  const n = Math.max(a.length, b.length)
  const out = Array.from({ length: n }, (_, i) => (a[i] ?? 0) + (b[i] ?? 0))
  return trimPoly(out)
}

export function polyScale(a: number[], scalar: number): number[] {
  if (scalar === 0) return [0]
  return trimPoly(a.map((c) => c * scalar))
}

export function polyMul(a: number[], b: number[]): number[] {
  if (a.length === 0 || b.length === 0) return [0]
  const out = Array.from({ length: a.length + b.length - 1 }, () => 0)
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      out[i + j] += a[i] * b[j]
    }
  }
  return trimPoly(out)
}

function trimPoly(p: number[]): number[] {
  let end = p.length - 1
  while (end > 0 && p[end] === 0) end -= 1
  return p.slice(0, end + 1)
}

export function factorXMinus(root: number): number[] {
  return [-root, 1]
}

export function newtonToMonomial(xs: number[], coefficients: number[]): number[] {
  if (coefficients.length === 0) return [0]
  let poly = [coefficients[coefficients.length - 1]]
  for (let k = coefficients.length - 2; k >= 0; k--) {
    poly = polyAdd([coefficients[k]], polyMul(factorXMinus(xs[k]), poly))
  }
  return poly
}

export function lagrangeToMonomial(xs: number[], ys: number[]): number[] {
  let sum = [0]
  for (let i = 0; i < xs.length; i++) {
    let num = [1]
    let den = 1
    for (let j = 0; j < xs.length; j++) {
      if (j === i) continue
      num = polyMul(num, factorXMinus(xs[j]))
      den *= xs[i] - xs[j]
    }
    sum = polyAdd(sum, polyScale(num, ys[i] / den))
  }
  return sum
}

export function snapCoefficient(value: number, precision: number): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** precision
  const rounded = Math.round(value * factor) / factor
  return Object.is(rounded, -0) ? 0 : rounded
}

function formatAbs(value: number, precision: number): string {
  const abs = Math.abs(snapCoefficient(value, precision))
  if (Number.isInteger(abs)) return String(abs)
  return abs.toFixed(precision).replace(/\.?0+$/, '')
}

export function evaluateMonomial(coefficients: number[], x: number): number {
  let y = 0
  for (let i = coefficients.length - 1; i >= 0; i--) {
    y = y * x + coefficients[i]
  }
  return y
}

export function sampleMonomial(
  coefficients: number[],
  xMin: number,
  xMax: number,
  steps = 240,
  maxAbs?: number,
): [number, number][] {
  if (xMin === xMax) {
    xMin -= 1
    xMax += 1
  }

  const dx = (xMax - xMin) / steps
  const points: [number, number][] = []

  for (let i = 0; i <= steps; i++) {
    const x = xMin + dx * i
    const y = evaluateMonomial(coefficients, x)
    if (!Number.isFinite(y)) continue
    if (maxAbs !== undefined && Math.abs(y) > maxAbs) continue
    points.push([x, y])
  }

  return points
}

export function monomialLatex(coefficients: number[], precision: number): string {
  const snapped = coefficients.map((c) => snapCoefficient(c, precision))
  while (snapped.length > 1 && snapped[snapped.length - 1] === 0) snapped.pop()

  const parts: string[] = []
  for (let k = snapped.length - 1; k >= 0; k--) {
    const c = snapped[k]
    if (c === 0) continue

    const abs = Math.abs(c)
    let body: string
    if (k === 0) {
      body = formatAbs(c, precision)
    } else if (k === 1) {
      body = abs === 1 ? 'x' : `${formatAbs(c, precision)}x`
    } else {
      body = abs === 1 ? `x^{${k}}` : `${formatAbs(c, precision)}x^{${k}}`
    }

    if (parts.length === 0) {
      parts.push(c < 0 ? `-${body}` : body)
    } else {
      parts.push(`${c < 0 ? '-' : '+'} ${body}`)
    }
  }

  if (parts.length === 0) return 'P(x) = 0'
  return `P(x) = ${parts.join(' ')}`
}
