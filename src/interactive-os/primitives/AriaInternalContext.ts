import { createContext } from 'react'
import type { UseAriaReturn } from './useAria'
import type { AriaPattern } from '../pattern/types'

export interface AriaInternalContextValue extends UseAriaReturn {
  pattern?: AriaPattern
  /** True when <Aria.Panel> is rendered as a child — enables aria-controls on items */
  hasPanels?: boolean
}

export const AriaInternalContext = createContext<AriaInternalContextValue | null>(null)
