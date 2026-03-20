import { createContext } from 'react'
import type { UseAriaReturn } from '../hooks/useAria'
import type { AriaBehavior } from '../behaviors/types'

export interface AriaInternalContextValue extends UseAriaReturn {
  behavior: AriaBehavior
}

export const AriaInternalContext = createContext<AriaInternalContextValue | null>(null)
