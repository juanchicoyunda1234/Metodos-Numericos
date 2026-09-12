import { convertLatexToAsciiMath } from 'mathlive'
import { derivative, parse } from 'mathjs'

export class InvalidExpressionError extends Error {
  constructor() {
    super('Expresión matemática no válida')
    this.name = 'InvalidExpressionError'
  }
}

export interface ParsedExpression {
  evaluate: (x: number) => number
  evaluateDerivative: (x: number) => number
}

function toFiniteNumber(value: unknown): number {
  if (typeof value !== 'number') throw new InvalidExpressionError()
  return value
}

export function parseExpression(latex: string): ParsedExpression {
  if (!latex.trim()) throw new InvalidExpressionError()

  let node
  let derivativeNode
  try {
    const ascii = convertLatexToAsciiMath(latex)
    node = parse(ascii)
    derivativeNode = derivative(node, 'x')
  } catch {
    throw new InvalidExpressionError()
  }

  const compiled = node.compile()
  const derivativeCompiled = derivativeNode.compile()

  const evaluate = (x: number) => {
    try {
      return toFiniteNumber(compiled.evaluate({ x }))
    } catch {
      throw new InvalidExpressionError()
    }
  }

  const evaluateDerivative = (x: number) => {
    try {
      return toFiniteNumber(derivativeCompiled.evaluate({ x }))
    } catch {
      throw new InvalidExpressionError()
    }
  }

  return { evaluate, evaluateDerivative }
}

export function sampleExpression(
  expression: string,
  xMin: number,
  xMax: number,
  steps = 240,
  maxAbs?: number,
): [number, number][] {
  const { evaluate } = parseExpression(expression)
  if (xMin === xMax) {
    xMin -= 1
    xMax += 1
  }

  const dx = (xMax - xMin) / steps
  const points: [number, number][] = []

  for (let i = 0; i <= steps; i++) {
    const x = xMin + dx * i
    try {
      const y = evaluate(x)
      if (!Number.isFinite(y)) continue
      if (maxAbs !== undefined && Math.abs(y) > maxAbs) continue
      points.push([x, y])
    } catch {
      continue
    }
  }

  return points
}
