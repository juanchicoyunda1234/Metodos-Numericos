import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-9 w-full rounded-box border border-border bg-panel-alt px-3 text-sm text-text placeholder:text-text-dim',
        'font-mono-nums transition-colors duration-150 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
        'aria-invalid:border-danger aria-invalid:ring-1 aria-invalid:ring-danger/30',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
