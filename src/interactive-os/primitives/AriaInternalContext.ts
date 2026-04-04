import { createContext } from 'react'
import type { UseAriaReturn } from './useAria'
import type { AriaPattern } from '../pattern/types'

// ② 2026-04-04-inspector-zone-keymap-prd.md
export interface AriaInternalContextValue extends UseAriaReturn {
  pattern?: AriaPattern
  /** Registry key for this Aria instance — used by Zone to register with parentId */
  registryKey?: string
}

export const AriaInternalContext = createContext<AriaInternalContextValue | null>(null)
