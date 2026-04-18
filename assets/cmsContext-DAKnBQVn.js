var e=`import { createDomainContext } from '@os/layout'
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

export const [CmsProvider, useCms] = createDomainContext<CmsContextValue>('Cms')
`;export{e as default};