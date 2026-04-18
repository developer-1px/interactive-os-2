// ② flat-layout-engine-prd.md
// ② cmux-layout-prd.md
import { useContext, createContext } from 'react'
import type { NormalizedData } from '@os/store/types'
import type { Command } from '@os/engine/types'

export interface FlatLayoutContextValue {
  store: NormalizedData
  dispatch: (command: Command) => void
  /** DOM lookup for layout nodes — needed by spatial focus (focusDir) + flashPane effects. */
  getNodeElement: (nodeId: string) => HTMLElement | null
}

export const FlatLayoutContext = createContext<FlatLayoutContextValue | null>(null)

export function useFlatLayout(): FlatLayoutContextValue {
  const ctx = useContext(FlatLayoutContext)
  if (!ctx) throw new Error('useFlatLayout must be used inside FlatLayout')
  return ctx
}
