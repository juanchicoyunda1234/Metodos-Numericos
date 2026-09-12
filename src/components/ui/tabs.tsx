import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('inline-flex items-center gap-1 border-b border-border', className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'border-b-2 border-transparent px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text',
        'data-[state=active]:border-accent data-[state=active]:text-accent-strong',
        'focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('focus-visible:outline-none', className)} {...props} />
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
