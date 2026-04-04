import { useCallback } from 'react'
import { findMatchingKey } from './useKeyboard'

/**
 * 레이아웃 레벨 키맵 — pattern keyMap과 달리 React onKeyDown 버블링으로 동작.
 * Aria zone 밖에서도 키 캡처가 필요한 컨테이너(Workspace 등)에서 사용.
 */

export interface LayoutKeyHandlers {
  /** ⌘D — horizontal split */
  splitH?: () => void
  /** ⌘⇧D — vertical split */
  splitV?: () => void
  /** ⌘W — close current tab or pane */
  close?: () => void
  /** ⌘⇧[ — switch to previous tab */
  prevTab?: () => void
  /** ⌘⇧] — switch to next tab */
  nextTab?: () => void
}

const LAYOUT_KEY_MAP: Record<string, keyof LayoutKeyHandlers> = {
  'Meta+d': 'splitH',
  'Meta+Shift+d': 'splitV',
  'Meta+w': 'close',
  'Meta+Shift+[': 'prevTab',
  'Meta+Shift+]': 'nextTab',
}

export function useKeyMap(handlers: LayoutKeyHandlers) {
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const matched = findMatchingKey(e.nativeEvent, LAYOUT_KEY_MAP)
    if (!matched) return
    const handler = handlers[LAYOUT_KEY_MAP[matched]]
    if (handler) {
      e.preventDefault()
      handler()
    }
  }, [handlers])

  return { onKeyDown }
}
