import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'h-9 w-full border border-border bg-panel-alt px-3 text-sm text-text placeholder:text-text-dim',
        'font-mono-nums focus-visible:border-accent focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
