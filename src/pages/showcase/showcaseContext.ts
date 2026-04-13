import { createContext, useContext } from 'react'
import type { NormalizedData } from '@os/store/types'

export interface ShowcaseContextValue {
  sidebarData: NormalizedData
  activeSlug: string
  handleActivate: (slug: string) => void
  mdFile: string | undefined
}

const ShowcaseContext = createContext<ShowcaseContextValue | null>(null)

export const ShowcaseProvider = ShowcaseContext.Provider

export function useShowcase(): ShowcaseContextValue {
  const ctx = useContext(ShowcaseContext)
  if (!ctx) throw new Error('useShowcase must be used inside ShowcaseProvider')
  return ctx
}
