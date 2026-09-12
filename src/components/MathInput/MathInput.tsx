import 'mathlive'

import type { MathfieldElement } from 'mathlive'
import { useEffect, useRef } from 'react'

interface MathInputProps {
  value: string
  onChange: (latex: string) => void
  placeholder?: string
}

function MathInput({ value, onChange, placeholder }: MathInputProps) {
  const ref = useRef<MathfieldElement>(null)

  useEffect(() => {
    const mathField = ref.current
    if (!mathField) return

    mathField.smartFence = true
    mathField.smartSuperscript = true
    mathField.mathVirtualKeyboardPolicy = 'manual'

    const handleInput = () => onChange(mathField.getValue('latex'))
    mathField.addEventListener('input', handleInput)
    return () => mathField.removeEventListener('input', handleInput)
  }, [onChange])

  useEffect(() => {
    const mathField = ref.current
    if (mathField && mathField.getValue('latex') !== value) {
      mathField.setValue(value)
    }
  }, [value])

  return <math-field ref={ref} placeholder={placeholder} />
}

export { MathInput }
