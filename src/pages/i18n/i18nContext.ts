import { createContext, useContext } from 'react'
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

const I18nContext = createContext<I18nContextValue | null>(null)

export const I18nProvider = I18nContext.Provider

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
