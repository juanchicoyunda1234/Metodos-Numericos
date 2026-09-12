import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

function EmptyState({
  title,
  hint,
  className,
}: {
  title: string
  hint?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-start justify-center gap-1 rounded-box border border-dashed border-border px-4 py-6',
        className,
      )}
    >
      <p className="text-sm text-text text-pretty">{title}</p>
      {hint ? (
        <p className="max-w-[65ch] text-sm leading-relaxed text-text-muted text-pretty">{hint}</p>
      ) : null}
    </div>
  )
}

export { EmptyState }
