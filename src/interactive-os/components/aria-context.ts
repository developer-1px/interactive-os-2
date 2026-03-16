import { createContext } from 'react'
import type { UseAriaReturn } from '../hooks/use-aria'

export const AriaInternalContext = createContext<UseAriaReturn | null>(null)
