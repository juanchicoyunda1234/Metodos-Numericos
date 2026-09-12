import type { MethodId } from '@/engine/types'
import { cn } from '@/lib/utils'

interface MethodGroup {
  label: string
  methods: { id: MethodId; label: string }[]
}

const GROUPS: MethodGroup[] = [
  {
    label: 'Raíces',
    methods: [
      { id: 'newton-raphson', label: 'Newton-Raphson' },
      { id: 'newton-raphson-constante', label: 'Newton-Raphson constante' },
    ],
  },
  {
    label: 'Interpolación',
    methods: [
      { id: 'newton-interpolacion', label: 'Newton' },
      { id: 'lagrange', label: 'Lagrange' },
    ],
  },
  {
    label: 'Análisis',
    methods: [{ id: 'comparacion', label: 'Comparar métodos' }],
  },
]

interface MethodSelectorProps {
  selected: MethodId
  onSelect: (id: MethodId) => void
}

function MethodSelector({ selected, onSelect }: MethodSelectorProps) {
  return (
    <nav className="flex h-full flex-col overflow-y-auto py-4">
      <div className="px-4 pb-3 text-xs font-semibold uppercase tracking-widest text-text-dim">
        Métodos
      </div>
      <div className="flex flex-col gap-4">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-4 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
              ▸ {group.label}
            </div>
            <ul>
              {group.methods.map((method) => {
                const active = method.id === selected
                return (
                  <li key={method.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(method.id)}
                      aria-current={active}
                      className={cn(
                        'flex w-full items-center border-l-2 border-transparent px-4 py-1.5 text-left text-sm text-text-muted transition-colors',
                        'hover:bg-panel-alt hover:text-text',
                        active && 'border-accent bg-panel-alt text-accent-strong',
                      )}
                    >
                      {method.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}

export { MethodSelector }
