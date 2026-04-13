import { createDomainContext } from '@os/layout'
import type { NormalizedData } from '@os/store/types'
import type { Plugin } from '@os/engine/types'
import type { KeyHandler } from '@os/axis/types'

export interface I18nContextValue {
  data: NormalizedData
  plugins: Plugin[]
  keyMap: Record<string, KeyHandler>
  onChange: (next: NormalizedData) => void
  missingOnly: boolean
  setMissingOnly: (fn: (v: boolean) => boolean) => void
  stats: { perLocale: Array<{ total: number; filled: number }>; total: number; filled: number }
}

export const [I18nProvider, useI18n] = createDomainContext<I18nContextValue>('I18n')
