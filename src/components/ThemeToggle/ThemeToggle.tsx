import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ColorScheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

function ThemeToggle({ theme, onToggle }: { theme: ColorScheme; onToggle: () => void }) {
  const next = theme === 'dark' ? 'claro' : 'oscuro'
  const isDark = theme === 'dark'
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className="relative h-11 w-11 sm:h-8 sm:w-8"
      onClick={onToggle}
      aria-label={`Cambiar a tema ${next}`}
      title={`Tema ${next}`}
    >
      <span className="relative block size-4">
        <Sun
          aria-hidden="true"
          className={cn(
            'absolute inset-0 size-4 transition-[opacity,filter,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
            isDark ? 'scale-100 opacity-100 blur-0' : 'scale-[0.25] opacity-0 blur-[4px]',
          )}
        />
        <Moon
          aria-hidden="true"
          className={cn(
            'absolute inset-0 size-4 transition-[opacity,filter,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
            isDark ? 'scale-[0.25] opacity-0 blur-[4px]' : 'scale-100 opacity-100 blur-0',
          )}
        />
      </span>
    </Button>
  )
}

export { ThemeToggle }
