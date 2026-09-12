import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const Select = SelectPrimitive.Root
const SelectValue = SelectPrimitive.Value

function SelectTrigger({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        'flex h-11 cursor-pointer items-center justify-between gap-2 rounded-box border border-border bg-panel-alt px-2.5 text-sm text-text sm:h-8',
        'transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus:border-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent data-[placeholder]:text-text-dim',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          'z-50 rounded-box border border-border-strong bg-panel shadow-[var(--shadow-float)] origin-[var(--radix-select-content-transform-origin)]',
          className,
        )}
        position="popper"
        sideOffset={4}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex min-h-11 cursor-pointer select-none items-center py-1.5 pl-7 pr-3 text-sm text-text outline-none sm:min-h-0',
        'data-[highlighted]:bg-accent-dim data-[highlighted]:text-text',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemIndicator className="absolute left-2 flex items-center">
        <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
