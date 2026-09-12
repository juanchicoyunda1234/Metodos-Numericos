import type { Iteration, MethodId } from '@/engine/types'

const GENERAL_FORMULA: Record<MethodId, string> = {
  'newton-raphson': "x_{n+1} = x_n - \\dfrac{f(x_n)}{f'(x_n)}",
  'newton-raphson-constante': "x_{n+1} = x_n - \\dfrac{f(x_n)}{d}, \\quad d = f'(x_0)",
  'newton-interpolacion': 'P(x) = f[x_0] + f[x_0,x_1](x-x_0) + \\dots + f[x_0,\\dots,x_n]\\prod_{i=0}^{n-1}(x-x_i)',
  lagrange: 'P(x) = \\sum_{i=0}^{n} y_i \\, L_i(x)',
  comparacion: '',
}

interface ProcedureViewProps {
  method: MethodId
  iterations: Iteration[]
  precision: number
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

function ProcedureView({ method, iterations, precision }: ProcedureViewProps) {
  const derivativeSymbol = method === 'newton-raphson-constante' ? "d = f'(x₀)" : "f'(xₙ)"
  const isRootFinding = method === 'newton-raphson' || method === 'newton-raphson-constante'

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-border-strong bg-panel-alt px-4 py-3">
        <div className="mb-1.5 text-[11px] uppercase tracking-wide text-text-dim">Fórmula general</div>
        <math-field key={GENERAL_FORMULA[method]} read-only className="block">
          {GENERAL_FORMULA[method]}
        </math-field>
      </div>

      {isRootFinding && (
        <div className="flex flex-col gap-2">
          {iterations.length === 0 ? (
            <div className="flex h-24 items-center justify-center border border-dashed border-border text-sm text-text-dim">
              Ejecuta el método para ver el procedimiento paso a paso
            </div>
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
    </div>
  )
}

export { ProcedureView }
