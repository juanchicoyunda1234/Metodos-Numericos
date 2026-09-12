import { AlertTriangle, CheckCircle2, TrendingUp, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { MethodId, NumericalResult, ResultStatus } from '@/engine/types'
import { cn } from '@/lib/utils'

interface StatusBannerProps {
  result: NumericalResult
  method: MethodId
  precision: number
}

const STATUS_CONFIG: Record<ResultStatus, { label: string; icon: LucideIcon; className: string }> = {
  CONVERGIO: {
    label: 'Convergió',
    icon: CheckCircle2,
    className: 'border-success/35 bg-success-dim text-success',
  },
  NO_CONVERGIO: {
    label: 'No convergió',
    icon: AlertTriangle,
    className: 'border-warning/35 bg-warning-dim text-warning',
  },
  ERROR_NUMERICO: {
    label: 'Error numérico',
    icon: XCircle,
    className: 'border-danger/35 bg-danger-dim text-danger',
  },
  DIVERGIO: {
    label: 'Divergió',
    icon: TrendingUp,
    className: 'border-danger/35 bg-danger-dim text-danger',
  },
}

function formatNumber(value: number, precision: number) {
  return value.toFixed(precision)
}

function buildMessage(result: NumericalResult, method: MethodId, precision: number): string {
  const isRootFinding = method === 'newton-raphson' || method === 'newton-raphson-constante'

  if (result.status === 'ERROR_NUMERICO' || result.status === 'DIVERGIO') {
    return result.message ?? 'No se pudo completar el cálculo.'
  }

  if (isRootFinding) {
    if (result.status === 'CONVERGIO') {
      return `La tolerancia ε = ${formatNumber(result.tolerance, precision)} fue alcanzada en ${result.iterations} iteraciones.`
    }
    return `Se alcanzó el máximo de ${result.iterations} iteraciones sin cumplir la tolerancia.`
  }

  const count = result.interpolationPoints?.length ?? 0
  if (result.xTarget !== undefined && result.finalValue !== null) {
    return `Polinomio interpolante construido con ${count} puntos. P(${formatNumber(result.xTarget, precision)}) = ${formatNumber(result.finalValue, precision)}.`
  }
  return `Polinomio interpolante construido con ${count} puntos.`
}

function StatusBanner({ result, method, precision }: StatusBannerProps) {
  const config = STATUS_CONFIG[result.status]
  const Icon = config.icon
  const message = buildMessage(result, method, precision)

  return (
    <div className={cn('flex items-start gap-3 rounded-box border px-4 py-3', config.className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold">{config.label}</span>
        <span className="text-sm opacity-90">{message}</span>
      </div>
      <span className="ml-auto shrink-0 font-mono-nums text-xs opacity-80">
        {result.executionTime.toFixed(2)} ms
      </span>
    </div>
  )
}

export { StatusBanner }
