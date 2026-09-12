import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={250} skipDelayDuration={150}>
      {children}
    </TooltipPrimitive.Provider>
  )
}

function Tooltip({
  content,
  children,
  className,
}: {
  content: string
  children: ReactNode
  className?: string
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={6}
          className={cn(
            'z-50 max-w-xs rounded-box border border-border bg-panel px-2.5 py-1.5 text-xs leading-relaxed text-text shadow-[var(--shadow-float)]',
            className,
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export { Tooltip, TooltipProvider }
