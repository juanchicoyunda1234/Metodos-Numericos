import 'mathlive'

import type { MathfieldElement } from 'mathlive'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { parseExpression } from '@/engine/parser'
import { cn } from '@/lib/utils'

const INSERTS = [
  { label: 'x', latex: 'x' },
  { label: 'x²', latex: 'x^{2}' },
  { label: '√', latex: '\\sqrt{#0}' },
  { label: 'π', latex: '\\pi' },
  { label: 'sin', latex: '\\sin(#0)' },
  { label: 'cos', latex: '\\cos(#0)' },
  { label: 'ln', latex: '\\ln(#0)' },
] as const

interface MathInputProps {
  value: string
  onChange: (latex: string) => void
  placeholder?: string
  onSubmit?: () => void
}

function MathInput({ value, onChange, placeholder, onSubmit }: MathInputProps) {
  const ref = useRef<MathfieldElement>(null)
  const onSubmitRef = useRef(onSubmit)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    onSubmitRef.current = onSubmit
  }, [onSubmit])

  useEffect(() => {
    const mathField = ref.current
    if (!mathField) return

    mathField.smartFence = true
    mathField.smartSuperscript = true
    mathField.mathVirtualKeyboardPolicy = 'manual'

    const handleInput = () => onChange(mathField.getValue('latex'))
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault()
        event.stopPropagation()
        onSubmitRef.current?.()
      }
    }

    mathField.addEventListener('input', handleInput)
    mathField.addEventListener('keydown', handleKeyDown)
    return () => {
      mathField.removeEventListener('input', handleInput)
      mathField.removeEventListener('keydown', handleKeyDown)
    }
  }, [onChange])

  useEffect(() => {
    const mathField = ref.current
    if (mathField && mathField.getValue('latex') !== value) {
      mathField.setValue(value)
    }
  }, [value])

  useEffect(() => {
    if (!value.trim()) return
    const timer = window.setTimeout(() => {
      try {
        parseExpression(value)
        setInvalid(false)
      } catch {
        setInvalid(true)
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [value])

  const insert = (latex: string) => {
    const mathField = ref.current
    if (!mathField) return
    mathField.insert(latex, { focus: true, insertionMode: 'replaceSelection' })
    onChange(mathField.getValue('latex'))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {INSERTS.map((item) => (
          <Button
            key={item.label}
            type="button"
            variant="outline"
            size="sm"
            className="h-11 min-w-11 px-2 font-mono-nums sm:h-7 sm:min-w-8"
            aria-label={`Insertar ${item.label}`}
            onClick={() => insert(item.latex)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div className={cn('math-well', invalid && 'border-danger')}>
        <math-field
          ref={ref}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid && value.trim() !== '' ? 'math-error' : undefined}
          className={cn(invalid && 'text-danger')}
        />
      </div>
      {invalid && value.trim() !== '' && (
        <p id="math-error" role="alert" className="text-sm text-danger">
          Expresión matemática no válida. Revisa paréntesis y operadores.
        </p>
      )}
    </div>
  )
}

export { MathInput }
