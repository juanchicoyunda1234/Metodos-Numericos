export type ResultStatus = 'CONVERGIO' | 'NO_CONVERGIO' | 'ERROR_NUMERICO' | 'DIVERGIO'

export interface Iteration {
  n: number
  x: number
  fx: number
  derivative?: number
  xNext: number
  error: number
}

export interface NumericalResult {
  status: ResultStatus
  finalValue: number | null
  iterations: number
  tolerance: number
  error: number | null
  residual: number | null
  executionTime: number
  iterationData: Iteration[]
  equation?: string
  polynomial?: string
  message?: string
  constantDerivative?: number
  interpolationPoints?: Point[]
  dividedDifferences?: number[][]
  lagrangeTerms?: LagrangeTerm[]
  xTarget?: number
  monomialCoefficients?: number[]
}

export type MethodId =
  | 'newton-raphson'
  | 'newton-raphson-constante'
  | 'newton-interpolacion'
  | 'lagrange'
  | 'comparacion'

export interface Point {
  x: number
  y: number
}

export interface LagrangeTerm {
  i: number
  x: number
  y: number
  basis?: number
  term?: number
}
