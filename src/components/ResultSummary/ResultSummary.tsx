import type { NumericalResult } from '@/engine/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'

interface ResultSummaryProps {
  result: NumericalResult | null
  precision: number
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

function ResultSummary({ result, precision }: ResultSummaryProps) {
  if (!result) {
    return (
      <div className="flex h-32 items-center justify-center border border-dashed border-border text-sm text-text-dim">
        Ejecuta el método para ver el resultado
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <StatusBadge status={result.status} />
        <span className="font-mono-nums text-xs text-text-dim">{result.executionTime.toFixed(2)} ms</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Valor final" value={formatNumber(result.finalValue, precision)} className="text-accent-strong" />
        <Metric label="Iteraciones" value={String(result.iterations)} />
        <Metric label="Error" value={formatNumber(result.error, precision)} />
        <Metric label="Residuo |f(xₙ)|" value={formatNumber(result.residual, precision)} />
      </div>
      {result.message && (
        <p className="border border-border-strong bg-panel-alt px-3 py-2 text-sm text-text-muted">
          {result.message}
        </p>
      )}
    </div>
  )
}

export { ResultSummary }
