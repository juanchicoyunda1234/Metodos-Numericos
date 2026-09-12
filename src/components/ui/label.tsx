import type { LabelHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-xs font-medium uppercase tracking-wide text-text-muted', className)}
      {...props}
    />
  )
}

export { Label }
