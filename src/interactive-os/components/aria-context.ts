import { createContext } from 'react'
import type { UseAriaReturn } from '../hooks/use-aria'
import type { AriaBehavior } from '../behaviors/types'

export interface AriaInternalContextValue extends UseAriaReturn {
  behavior: AriaBehavior
}

export const AriaInternalContext = createContext<AriaInternalContextValue | null>(null)
