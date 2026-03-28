import { useCallback } from 'react'
import { findMatchingKey } from '../interactive-os/primitives/useKeyboard'

export interface LayoutKeyHandlers {
  /** ⌘D — horizontal split (duplicate current pane) */
  splitH?: () => void
  /** ⌘⇧D — vertical split (duplicate current pane) */
  splitV?: () => void
  /** ⌘W — close current tab or pane */
  close?: () => void
  /** ⌘⇧[ — switch to previous tab */
  prevTab?: () => void
  /** ⌘⇧] — switch to next tab */
  nextTab?: () => void
}

const KEY_MAP: Record<string, keyof LayoutKeyHandlers> = {
  'Meta+d': 'splitH',
  'Meta+Shift+d': 'splitV',
  'Meta+w': 'close',
  'Meta+Shift+[': 'prevTab',
  'Meta+Shift+]': 'nextTab',
}

export function useLayoutKeys(handlers: LayoutKeyHandlers) {
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const matched = findMatchingKey(e.nativeEvent, KEY_MAP)
    if (!matched) return
    const handler = handlers[KEY_MAP[matched]]
    if (handler) {
      e.preventDefault()
      handler()
    }
  }, [handlers])

  return { onKeyDown }
}
