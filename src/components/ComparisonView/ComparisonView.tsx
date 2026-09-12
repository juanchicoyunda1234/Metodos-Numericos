import { useMemo } from 'react'

import { ConvergenceChart } from '@/components/ConvergenceChart/ConvergenceChart'
import { buildComparisonOption, buildErrorChartOption } from '@/components/ConvergenceChart/chartOptions'
import { StatusBadge } from '@/components/ui/status-badge'
import type { NumericalResult } from '@/engine/types'
import type { ColorScheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

interface ComparisonViewProps {
  classic: NumericalResult | null
  constant: NumericalResult | null
  precision: number
  colorScheme: ColorScheme
}

function formatNumber(value: number | null, precision: number) {
  if (value === null || Number.isNaN(value)) return '—'
  return value.toFixed(precision)
}

function derivativeEvaluations(result: NumericalResult, kind: 'classic' | 'constant') {
  if (kind === 'constant') return 1
  if (result.status === 'ERROR_NUMERICO') return result.iterationData.length + 1
  return result.iterationData.length
}

function derivativeLabel(count: number) {
  if (count === 1) return '1 sola evaluación'
  return `${count} evaluaciones`
}

function describeMethod(name: string, result: NumericalResult, derivs: number): string {
  if (result.status === 'CONVERGIO') {
    return `${name} alcanzó la tolerancia en ${result.iterations} iteraciones con ${derivativeLabel(derivs)} de derivada`
  }
  if (result.status === 'DIVERGIO') {
    return `${name} divergió a los ${result.iterations} pasos`
  }
  if (result.status === 'ERROR_NUMERICO') {
    return `${name} se detuvo por error numérico`
  }
  return `${name} no alcanzó la tolerancia en ${result.iterations} iteraciones`
}

function comparisonConclusion(classic: NumericalResult, constant: NumericalResult): string {
  const d1 = derivativeEvaluations(classic, 'classic')
  const d2 = derivativeEvaluations(constant, 'constant')
  if (classic.status === 'CONVERGIO' && constant.status === 'CONVERGIO') {
    return `Newton clásico alcanzó la tolerancia en ${classic.iterations} iteraciones con ${d1} evaluaciones de derivada; Newton constante tardó ${constant.iterations} iteraciones con ${derivativeLabel(d2)}.`
  }
  return `${describeMethod('Newton clásico', classic, d1)}; ${describeMethod('Newton constante', constant, d2)}.`
}

function Metric({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wide text-text-dim">{label}</span>
      <span className={cn('font-mono-nums text-base text-text', emphasize && 'text-accent-strong')}>{value}</span>
    </div>
  )
}

function MethodCard({
  title,
  result,
  precision,
  kind,
}: {
  title: string
  result: NumericalResult | null
  precision: number
  kind: 'classic' | 'constant'
}) {
  return (
    <article className="flex flex-col gap-4 rounded-box border border-border bg-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        {result ? <StatusBadge status={result.status} /> : <span className="text-xs text-text-dim">Sin ejecutar</span>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Metric label="Valor final" value={formatNumber(result?.finalValue ?? null, precision)} emphasize />
        <Metric label="Iteraciones" value={result ? String(result.iterations) : '—'} />
        <Metric
          label="Evaluaciones de derivada"
          value={result ? String(derivativeEvaluations(result, kind)) : '—'}
        />
      </div>
    </article>
  )
}

function ComparisonView({ classic, constant, precision, colorScheme }: ComparisonViewProps) {
  const hasResults = Boolean(classic && constant)
  const overlayOption = useMemo(
    () => buildComparisonOption(classic, constant, precision, colorScheme),
    [classic, constant, precision, colorScheme],
  )
  const errorOption = useMemo(
    () => buildErrorChartOption(classic, constant, precision, colorScheme),
    [classic, constant, precision, colorScheme],
  )

  return (
    <div className="flex flex-col gap-5">
      {!hasResults && (
        <div className="flex h-24 items-center justify-center rounded-box border border-dashed border-border text-sm text-text-dim">
          Ejecuta ambos métodos con los mismos parámetros para comparar
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MethodCard title="Newton clásico" result={classic} precision={precision} kind="classic" />
        <MethodCard title="Newton constante" result={constant} precision={precision} kind="constant" />
      </div>

      {classic && constant && (
        <p className="rounded-box border border-border bg-panel-alt px-4 py-3 text-sm text-text">{comparisonConclusion(classic, constant)}</p>
      )}

      <div className="flex flex-col gap-2">
        <div className="text-[11px] uppercase tracking-wide text-text-dim">Error vs iteración</div>
        <ConvergenceChart option={errorOption} height={280} colorScheme={colorScheme} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-[11px] uppercase tracking-wide text-text-dim">Trayectorias superpuestas</div>
        <ConvergenceChart option={overlayOption} height={440} colorScheme={colorScheme} />
      </div>
    </div>
  )
}

export { ComparisonView }
