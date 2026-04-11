import { createContext, useContext } from 'react'
import type { CommandEngine } from '@os/engine/createCommandEngine'
import type { NormalizedData } from '@os/store/types'
import type { Plugin } from '@os/plugins/types'
import type { Locale } from './cmsTypes'
import type { ViewportSize } from './CmsViewportWrapper'

export interface CmsContextValue {
  engine: CommandEngine
  store: NormalizedData
  plugins: Plugin[]
  locale: Locale
  setLocale: (locale: Locale) => void
  viewport: ViewportSize
  setViewport: (v: ViewportSize) => void
  presenting: boolean
  setPresenting: (v: boolean | ((prev: boolean) => boolean)) => void
  i18nSheetOpen: boolean
  setI18nSheetOpen: (v: boolean | ((prev: boolean) => boolean)) => void
  canvasFocusedId: string
  setCanvasFocusedId: (id: string) => void
  activeTabMap: Map<string, string>
  onActivateTabItem: (tabItemId: string) => void
  detailZoneActive: boolean
  onSlotDrillDown: (nodeId: string) => void
  onDetailEscape: () => void
}

const CmsContext = createContext<CmsContextValue | null>(null)

export const CmsProvider = CmsContext.Provider

export function useCms(): CmsContextValue {
  const ctx = useContext(CmsContext)
  if (!ctx) throw new Error('useCms must be used within CmsProvider')
  return ctx
}
