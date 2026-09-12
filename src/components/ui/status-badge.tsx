import type { ResultStatus } from '@/engine/types'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<ResultStatus, string> = {
  CONVERGIO: 'Convergió',
  NO_CONVERGIO: 'No convergió',
  ERROR_NUMERICO: 'Error numérico',
  DIVERGIO: 'Divergió',
}

const STATUS_STYLE: Record<ResultStatus, string> = {
  CONVERGIO: 'bg-success-dim text-success border-success/40',
  NO_CONVERGIO: 'bg-warning-dim text-warning border-warning/40',
  ERROR_NUMERICO: 'bg-danger-dim text-danger border-danger/40',
  DIVERGIO: 'bg-danger-dim text-danger border-danger/40',
}

interface StatusBadgeProps {
  status: ResultStatus
  className?: string
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-box border px-2.5 py-1 text-xs font-medium uppercase tracking-wide',
        STATUS_STYLE[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  )
}

export { StatusBadge }
