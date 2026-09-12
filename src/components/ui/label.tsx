import { forwardRef } from 'react'
import type { LabelHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(function Label(
  { className, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn('text-xs font-medium uppercase tracking-wide text-text-muted', className)}
      {...props}
    />
  )
})

export { Label }
