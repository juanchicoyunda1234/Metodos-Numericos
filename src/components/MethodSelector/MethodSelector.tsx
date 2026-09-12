import type { MethodId } from '@/engine/types'
import { cn } from '@/lib/utils'

interface MethodGroup {
  label: string
  methods: { id: MethodId; label: string }[]
}

const METHOD_GROUPS: MethodGroup[] = [
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
    <nav aria-label="Métodos" className="flex h-full flex-col overflow-y-auto py-5">
      <div className="flex flex-col gap-6">
        {METHOD_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-4 pb-2 text-xs font-medium text-text-dim">{group.label}</div>
            <ul className="flex flex-col gap-0.5 px-2">
              {group.methods.map((method) => {
                const active = method.id === selected
                return (
                  <li key={method.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(method.id)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex w-full items-center rounded-box px-3 py-2 text-left text-sm transition-colors duration-150',
                        'hover:bg-panel-alt hover:text-text',
                        active
                          ? 'bg-accent-dim font-medium text-text'
                          : 'text-text-muted',
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

export { MethodSelector, METHOD_GROUPS }
