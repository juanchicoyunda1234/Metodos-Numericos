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
