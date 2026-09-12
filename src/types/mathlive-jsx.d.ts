import type { MathfieldElement } from 'mathlive'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type MathFieldAttributes = HTMLAttributes<MathfieldElement> & {
  'read-only'?: boolean
  placeholder?: string
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': DetailedHTMLProps<MathFieldAttributes, MathfieldElement>
    }
  }
}
