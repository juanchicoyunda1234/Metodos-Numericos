import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ColorScheme } from '@/lib/theme'

function ThemeToggle({ theme, onToggle }: { theme: ColorScheme; onToggle: () => void }) {
  const next = theme === 'dark' ? 'claro' : 'oscuro'
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={onToggle}
      aria-label={`Cambiar a tema ${next}`}
      title={`Tema ${next}`}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  )
}

export { ThemeToggle }
