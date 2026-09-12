import { ResultingPolynomial } from '@/components/ResultSummary/ResultSummary'
import {
  lagrangeBasisAtLatex,
  lagrangeBasisLatex,
  lagrangeEvaluationLatex,
  lagrangePolynomialLatex,
} from '@/engine/lagrangeInterpolation'
import { newtonEvaluationLatex, newtonPolynomialLatex } from '@/engine/newtonInterpolation'
import { monomialLatex } from '@/engine/polynomial'
import type { Iteration, LagrangeTerm, MethodId, NumericalResult, Point } from '@/engine/types'

const GENERAL_FORMULA: Record<MethodId, string> = {
  'newton-raphson': "x_{n+1} = x_n - \\dfrac{f(x_n)}{f'(x_n)}",
  'newton-raphson-constante': "x_{n+1} = x_n - \\dfrac{f(x_n)}{d}, \\quad d = f'(x_0)",
  'newton-interpolacion':
    'P(x) = f[x_0] + f[x_0,x_1](x-x_0) + \\cdots + f[x_0,\\ldots,x_n]\\prod_{i=0}^{n-1}(x-x_i)',
  lagrange: 'P(x) = \\sum_{i=0}^{n} y_i \\, L_i(x)',
  comparacion: '',
}

interface ProcedureViewProps {
  method: MethodId
  precision: number
  result: NumericalResult | null
}

function formatValue(value: number | undefined, precision: number) {
  if (value === undefined || Number.isNaN(value)) return '—'
  return value.toFixed(precision)
}

function ProcedureStep({ iteration, precision, derivativeSymbol }: {
  iteration: Iteration
  precision: number
  derivativeSymbol: string
}) {
  return (
    <div className="border border-border px-4 py-3">
      <div className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">Iteración {iteration.n + 1}</div>
      {(() => {
        const latex = `x_{${iteration.n + 1}} = ${formatValue(iteration.x, precision)} - \\dfrac{${formatValue(
          iteration.fx,
          precision,
        )}}{${formatValue(iteration.derivative, precision)}} = ${formatValue(iteration.xNext, precision)}`
        return (
          <math-field key={latex} read-only className="block">
            {latex}
          </math-field>
        )
      })()}
      <div className="mt-1 text-xs text-text-muted">
        {derivativeSymbol} = {formatValue(iteration.derivative, precision)} · Error = {formatValue(iteration.error, precision)}
      </div>
    </div>
  )
}

function differenceStepLatex(
  i: number,
  order: number,
  points: Point[],
  table: number[][],
  precision: number,
) {
  const left =
    order === 1 ? `f[x_{${i}},x_{${i + 1}}]` : `f[x_{${i}},\\ldots,x_{${i + order}}]`
  const rightNum =
    order === 1
      ? `f[x_{${i + 1}}]-f[x_{${i}}]`
      : `f[x_{${i + 1}},\\ldots,x_{${i + order}}]-f[x_{${i}},\\ldots,x_{${i + order - 1}}]`
  const numericNum = `${formatValue(table[i + 1][order - 1], precision)}-${formatValue(table[i][order - 1], precision)}`
  const numericDen = `${formatValue(points[i + order].x, precision)}-${formatValue(points[i].x, precision)}`
  return `${left} = \\dfrac{${rightNum}}{x_{${i + order}}-x_{${i}}} = \\dfrac{${numericNum}}{${numericDen}} = ${formatValue(table[i][order], precision)}`
}

function NewtonInterpolationProcedure({
  points,
  table,
  xTarget,
  value,
  precision,
  monomialCoefficients,
}: {
  points: Point[]
  table: number[][]
  xTarget?: number
  value: number | null
  precision: number
  monomialCoefficients?: number[]
}) {
  const coefficients = table[0]
  const polynomial = newtonPolynomialLatex(points, coefficients, precision)
  const evaluation =
    xTarget !== undefined && value !== null
      ? newtonEvaluationLatex(points, coefficients, xTarget, value, precision)
      : null
  const steps: string[] = []

  for (let i = 0; i < points.length; i++) {
    steps.push(`f[x_{${i}}] = ${formatValue(points[i].y, precision)}`)
  }
  for (let order = 1; order < table[0].length; order++) {
    for (let i = 0; i < points.length - order; i++) {
      steps.push(differenceStepLatex(i, order, points, table, precision))
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {steps.map((latex) => (
        <div key={latex} className="border border-border px-4 py-3">
          <math-field key={latex} read-only className="block">
            {latex}
          </math-field>
        </div>
      ))}
      <div className="border border-border px-4 py-3">
        <div className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">Polinomio de Newton</div>
        <math-field key={polynomial} read-only className="block">
          {polynomial}
        </math-field>
      </div>
      {evaluation && (
        <div className="border border-border px-4 py-3">
          <div className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">Evaluación</div>
          <math-field key={evaluation} read-only className="block">
            {evaluation}
          </math-field>
        </div>
      )}
      {monomialCoefficients && (
        <ResultingPolynomial latex={monomialLatex(monomialCoefficients, precision)} />
      )}
    </div>
  )
}

function LagrangeInterpolationProcedure({
  points,
  terms,
  xTarget,
  value,
  precision,
  monomialCoefficients,
}: {
  points: Point[]
  terms: LagrangeTerm[]
  xTarget?: number
  value: number | null
  precision: number
  monomialCoefficients?: number[]
}) {
  const polynomial = lagrangePolynomialLatex(points, precision, 'expanded')
  const evaluation =
    xTarget !== undefined && value !== null
      ? lagrangeEvaluationLatex(terms, xTarget, value, precision)
      : null

  return (
    <div className="flex flex-col gap-2">
      {terms.map((term) => {
        const basis = lagrangeBasisLatex(term.i, points, precision)
        const at =
          xTarget !== undefined && term.basis !== undefined
            ? lagrangeBasisAtLatex(term.i, points, xTarget, term.basis, precision)
            : null
        const product =
          term.basis !== undefined && term.term !== undefined
            ? `y_{${term.i}} L_{${term.i}}(x) = ${formatValue(term.y, precision)} \\cdot ${formatValue(term.basis, precision)} = ${formatValue(term.term, precision)}`
            : null
        return (
          <div key={term.i} className="flex flex-col gap-2 border border-border px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-text-dim">i = {term.i}</div>
            <math-field key={basis} read-only className="block">
              {basis}
            </math-field>
            {at && (
              <math-field key={at} read-only className="block">
                {at}
              </math-field>
            )}
            {product && (
              <math-field key={product} read-only className="block">
                {product}
              </math-field>
            )}
          </div>
        )
      })}
      <div className="border border-border px-4 py-3">
        <div className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">Polinomio de Lagrange</div>
        <math-field key={polynomial} read-only className="block">
          {polynomial}
        </math-field>
      </div>
      {evaluation && (
        <div className="border border-border px-4 py-3">
          <div className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">Evaluación</div>
          <math-field key={evaluation} read-only className="block">
            {evaluation}
          </math-field>
        </div>
      )}
      {monomialCoefficients && (
        <ResultingPolynomial latex={monomialLatex(monomialCoefficients, precision)} />
      )}
    </div>
  )
}

function ProcedureView({ method, precision, result }: ProcedureViewProps) {
  const iterations = result?.iterationData ?? []
  const constantDerivative = result?.constantDerivative
  const derivativeSymbol = method === 'newton-raphson-constante' ? "d = f'(x₀)" : "f'(xₙ)"
  const isRootFinding = method === 'newton-raphson' || method === 'newton-raphson-constante'
  const isNewtonInterpolation = method === 'newton-interpolacion'
  const isLagrange = method === 'lagrange'
  const dLatex =
    constantDerivative !== undefined
      ? `d = f'(x_0) = ${formatValue(constantDerivative, precision)}`
      : null

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-border-strong bg-panel-alt px-4 py-3">
        <div className="mb-1.5 text-[11px] uppercase tracking-wide text-text-dim">Fórmula general</div>
        <math-field key={GENERAL_FORMULA[method]} read-only className="block">
          {GENERAL_FORMULA[method]}
        </math-field>
      </div>

      {dLatex && (
        <div className="border border-border px-4 py-3">
          <div className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">Derivada constante</div>
          <math-field key={dLatex} read-only className="block">
            {dLatex}
          </math-field>
          <div className="mt-1 text-xs text-text-muted">Se calcula una sola vez y se reutiliza en todas las iteraciones</div>
        </div>
      )}

      {isRootFinding && (
        <div className="flex flex-col gap-2">
          {iterations.length === 0 ? (
            constantDerivative === undefined ? (
              <div className="flex h-24 items-center justify-center border border-dashed border-border text-sm text-text-dim">
                Ejecuta el método para ver el procedimiento paso a paso
              </div>
            ) : null
          ) : (
            iterations.map((iteration) => (
              <ProcedureStep
                key={iteration.n}
                iteration={iteration}
                precision={precision}
                derivativeSymbol={derivativeSymbol}
              />
            ))
          )}
        </div>
      )}

      {isNewtonInterpolation &&
        (result?.interpolationPoints && result.dividedDifferences ? (
          <NewtonInterpolationProcedure
            points={result.interpolationPoints}
            table={result.dividedDifferences}
            xTarget={result.xTarget}
            value={result.finalValue}
            precision={precision}
            monomialCoefficients={result.monomialCoefficients}
          />
        ) : result ? null : (
          <div className="flex h-24 items-center justify-center border border-dashed border-border text-sm text-text-dim">
            Ejecuta el método para ver el procedimiento paso a paso
          </div>
        ))}

      {isLagrange &&
        (result?.lagrangeTerms && result.interpolationPoints ? (
          <LagrangeInterpolationProcedure
            points={result.interpolationPoints}
            terms={result.lagrangeTerms}
            xTarget={result.xTarget}
            value={result.finalValue}
            precision={precision}
            monomialCoefficients={result.monomialCoefficients}
          />
        ) : result ? null : (
          <div className="flex h-24 items-center justify-center border border-dashed border-border text-sm text-text-dim">
            Ejecuta el método para ver el procedimiento paso a paso
          </div>
        ))}
    </div>
  )
}

export { ProcedureView }
