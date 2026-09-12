import { useMemo } from 'react'

import { ConvergenceChart } from '@/components/ConvergenceChart/ConvergenceChart'
import { buildComparisonOption } from '@/components/ConvergenceChart/chartOptions'
import { StatusBadge } from '@/components/ui/status-badge'
import type { NumericalResult } from '@/engine/types'

interface ComparisonViewProps {
  classic: NumericalResult | null
  constant: NumericalResult | null
  precision: number
}

interface Row {
  label: string
  classic: string
  constant: string
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

function ComparisonView({ classic, constant, precision }: ComparisonViewProps) {
  const hasResults = Boolean(classic && constant)
  const option = useMemo(
    () => buildComparisonOption(classic, constant, precision),
    [classic, constant, precision],
  )

  const rows: Row[] = [
    {
      label: 'Valor final',
      classic: formatNumber(classic?.finalValue ?? null, precision),
      constant: formatNumber(constant?.finalValue ?? null, precision),
    },
    {
      label: 'Iteraciones',
      classic: classic ? String(classic.iterations) : '—',
      constant: constant ? String(constant.iterations) : '—',
    },
    {
      label: 'Error final',
      classic: formatNumber(classic?.error ?? null, precision),
      constant: formatNumber(constant?.error ?? null, precision),
    },
    {
      label: 'Evaluaciones de derivada',
      classic: classic ? String(derivativeEvaluations(classic, 'classic')) : '—',
      constant: constant ? String(derivativeEvaluations(constant, 'constant')) : '—',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {!hasResults && (
        <div className="flex h-24 items-center justify-center border border-dashed border-border text-sm text-text-dim">
          Ejecuta ambos métodos con los mismos parámetros para comparar
        </div>
      )}

      <div className="overflow-x-auto border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border-strong bg-panel-alt">
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Característica
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Newton clásico
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Newton constante
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border">
                <td className="px-3 py-1.5 text-text-muted">{row.label}</td>
                <td className="px-3 py-1.5 text-right font-mono-nums text-text">{row.classic}</td>
                <td className="px-3 py-1.5 text-right font-mono-nums text-text">{row.constant}</td>
              </tr>
            ))}
            <tr>
              <td className="px-3 py-1.5 text-text-muted">Estado</td>
              <td className="px-3 py-1.5 text-right">
                {classic ? <StatusBadge status={classic.status} /> : '—'}
              </td>
              <td className="px-3 py-1.5 text-right">
                {constant ? <StatusBadge status={constant.status} /> : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {(classic?.message || constant?.message) && (
        <div className="flex flex-col gap-1">
          {classic?.message && (
            <p className="border border-border-strong bg-panel-alt px-3 py-2 text-sm text-text-muted">
              Clásico: {classic.message}
            </p>
          )}
          {constant?.message && (
            <p className="border border-border-strong bg-panel-alt px-3 py-2 text-sm text-text-muted">
              Constante: {constant.message}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="text-[11px] uppercase tracking-wide text-text-dim">Trayectorias superpuestas</div>
        <ConvergenceChart option={option} height={440} />
      </div>
    </div>
  )
}

export { ComparisonView }
