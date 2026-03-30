import { createContext } from 'react'
import type { UseAriaReturn } from './useAria'
import type { AriaPattern } from '../pattern/types'

export interface AriaInternalContextValue extends UseAriaReturn {
  pattern?: AriaPattern
}

export const AriaInternalContext = createContext<AriaInternalContextValue | null>(null)
