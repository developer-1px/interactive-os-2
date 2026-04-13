import type { RefObject } from 'react'
import { createDomainContext } from '@os/layout'
import type { NormalizedData } from '@os/schema'
import type { Plugin, KeyHandler } from '@os/advanced'

export interface I18nContextValue {
  data: NormalizedData
  plugins: Plugin[]
  keyMap: Record<string, KeyHandler>
  onChange: (next: NormalizedData) => void
  missingOnly: boolean
  setMissingOnly: (fn: (v: boolean) => boolean) => void
  stats: { perLocale: Array<{ total: number; filled: number }>; total: number; filled: number }
  searchPortalRef: RefObject<HTMLDivElement | null>
}

export const [I18nProvider, useI18n] = createDomainContext<I18nContextValue>('I18n')
