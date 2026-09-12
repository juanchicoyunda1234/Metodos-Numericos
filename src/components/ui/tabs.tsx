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
        'min-h-11 cursor-pointer border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-text-muted transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] [@media(hover:hover)]:hover:text-text sm:min-h-0 sm:py-2',
        'data-[state=active]:border-accent data-[state=active]:text-text',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
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
