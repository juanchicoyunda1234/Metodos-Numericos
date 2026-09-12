import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ColorScheme } from '@/lib/theme'

function ThemeToggle({ theme, onToggle }: { theme: ColorScheme; onToggle: () => void }) {
  const next = theme === 'dark' ? 'claro' : 'oscuro'
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 w-8 px-0"
      onClick={onToggle}
      aria-label={`Cambiar a tema ${next}`}
      title={`Tema ${next}`}
    >
      {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </Button>
  )
}

export { ThemeToggle }
