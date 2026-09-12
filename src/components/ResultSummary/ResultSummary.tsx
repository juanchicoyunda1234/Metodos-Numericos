import { monomialLatex } from '@/engine/polynomial'
import type { MethodId, NumericalResult } from '@/engine/types'
import { cn } from '@/lib/utils'

interface ResultSummaryProps {
  result: NumericalResult | null
  precision: number
  method: MethodId
}

function formatNumber(value: number | null, precision: number) {
  if (value === null || Number.isNaN(value)) return '—'
  return value.toFixed(precision)
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex flex-col gap-1 border border-border bg-panel-alt px-4 py-3">
      <span className="text-[11px] uppercase tracking-wide text-text-dim">{label}</span>
      <span className={cn('font-mono-nums text-lg text-text', className)}>{value}</span>
    </div>
  )
}

function ResultingPolynomial({ latex }: { latex: string }) {
  return (
    <div className="border border-border-strong bg-panel-alt px-4 py-4">
      <div className="mb-2 text-[11px] uppercase tracking-wide text-text-dim">Polinomio resultante</div>
      <math-field key={latex} read-only className="resulting-polynomial block">
        {latex}
      </math-field>
    </div>
  )
}

function ResultSummary({ result, precision, method }: ResultSummaryProps) {
  if (!result) {
    return (
      <div className="flex h-32 items-center justify-center border border-dashed border-border text-sm text-text-dim">
        Ejecuta el método para ver el resultado
      </div>
    )
  }

  const isInterpolation = method === 'newton-interpolacion' || method === 'lagrange'
  const polynomialLatex = result.monomialCoefficients
    ? monomialLatex(result.monomialCoefficients, precision)
    : result.polynomial
  const degree =
    result.monomialCoefficients && result.monomialCoefficients.length > 0
      ? result.monomialCoefficients.length - 1
      : result.interpolationPoints
        ? result.interpolationPoints.length - 1
        : null

  return (
    <div className="flex flex-col gap-3">
      {isInterpolation ? (
        <>
          {polynomialLatex && <ResultingPolynomial latex={polynomialLatex} />}
          <div
            className={cn(
              'grid grid-cols-2 gap-3',
              result.xTarget !== undefined ? 'sm:grid-cols-4' : 'sm:grid-cols-2',
            )}
          >
            {result.xTarget !== undefined && (
              <>
                <Metric label="x interpolado" value={formatNumber(result.xTarget, precision)} />
                <Metric label="P(x) evaluado" value={formatNumber(result.finalValue, precision)} className="text-accent-strong" />
              </>
            )}
            <Metric label="Puntos" value={result.interpolationPoints ? String(result.interpolationPoints.length) : '—'} />
            <Metric label="Grado" value={degree === null ? '—' : String(degree)} />
          </div>
        </>
      ) : (
        <div
          className={cn(
            'grid grid-cols-2 gap-3',
            result.constantDerivative !== undefined ? 'sm:grid-cols-5' : 'sm:grid-cols-4',
          )}
        >
          {result.constantDerivative !== undefined && (
            <Metric label="d = f'(x₀)" value={formatNumber(result.constantDerivative, precision)} />
          )}
          <Metric label="Valor final" value={formatNumber(result.finalValue, precision)} className="text-accent-strong" />
          <Metric label="Iteraciones" value={String(result.iterations)} />
          <Metric label="Error" value={formatNumber(result.error, precision)} />
          <Metric label="Residuo |f(xₙ)|" value={formatNumber(result.residual, precision)} />
        </div>
      )}
    </div>
  )
}

export { ResultSummary, ResultingPolynomial }
