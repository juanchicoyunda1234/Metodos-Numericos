import { EmptyState } from '@/components/ui/empty-state'
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
    <div className="border-b border-border px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="text-[13px] text-text-muted">{label}</div>
      <div className={cn('mt-1 font-mono-nums text-lg leading-tight text-text', className)}>{value}</div>
    </div>
  )
}

function ResultingPolynomial({ latex }: { latex: string }) {
  return (
    <div className="rounded-box border border-border bg-panel px-4 py-4">
      <h3 className="mb-2 text-sm font-medium text-text">Polinomio resultante</h3>
      <math-field key={latex} read-only className="resulting-polynomial block">
        {latex}
      </math-field>
    </div>
  )
}

function ResultSummary({ result, precision, method }: ResultSummaryProps) {
  if (!result) {
    return (
      <EmptyState
        title="Todavía no hay un resultado"
        hint="Completa los datos de la izquierda y pulsa Ejecutar. Ctrl+Enter también lanza el método actual."
      />
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
              'grid overflow-hidden rounded-box border border-border bg-panel',
              result.xTarget !== undefined ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2',
            )}
          >
            {result.xTarget !== undefined && (
              <>
                <Metric label="x interpolado" value={formatNumber(result.xTarget, precision)} />
                <Metric
                  label="P(x) evaluado"
                  value={formatNumber(result.finalValue, precision)}
                  className="text-accent-strong"
                />
              </>
            )}
            <Metric
              label="Puntos"
              value={result.interpolationPoints ? String(result.interpolationPoints.length) : '—'}
            />
            <Metric label="Grado" value={degree === null ? '—' : String(degree)} />
          </div>
        </>
      ) : (
        <div
          className={cn(
            'grid overflow-hidden rounded-box border border-border bg-panel',
            result.constantDerivative !== undefined
              ? 'grid-cols-2 sm:grid-cols-5'
              : 'grid-cols-2 sm:grid-cols-4',
          )}
        >
          {result.constantDerivative !== undefined && (
            <Metric label="d = f'(x₀)" value={formatNumber(result.constantDerivative, precision)} />
          )}
          <Metric
            label="Valor final"
            value={formatNumber(result.finalValue, precision)}
            className="text-accent-strong"
          />
          <Metric label="Iteraciones" value={String(result.iterations)} />
          <Metric label="Error" value={formatNumber(result.error, precision)} />
          <Metric label="Residuo |f(xₙ)|" value={formatNumber(result.residual, precision)} />
        </div>
      )}
    </div>
  )
}

export { ResultSummary, ResultingPolynomial }
