// ② 2026-03-28-overlay-core-layer-prd.md
import type { AxisConfig, KeyMap } from './types'

export type TriggerMode = 'click' | 'hover' | 'focus' | 'manual'

export interface TriggerPopupOptions {
  openOn?: TriggerMode // default 'click'
  popupRole?: PopupRole // maps to aria-haspopup
}

export type PopupRole = 'menu' | 'listbox' | 'dialog' | 'tree' | 'grid'

export interface TriggerPopupConfig {
  openOn: TriggerMode
  popupRole: PopupRole
}

export function triggerPopup(options?: TriggerPopupOptions): {
  keyMap: KeyMap
  config: Partial<AxisConfig>
  triggerConfig: TriggerPopupConfig
} {
  const openOn = options?.openOn ?? 'click'
  const popupRole = options?.popupRole ?? 'menu'

  const keyMap: KeyMap = {}

  if (openOn === 'click' || openOn === 'manual') {
    // Enter/Space toggle the popup — activate is reused
    keyMap.Enter = (ctx) => ctx.activate()
    keyMap.Space = (ctx) => ctx.activate()
    // ArrowDown opens and moves to first item
    keyMap.ArrowDown = (ctx) => ctx.expand()
    // ArrowUp opens and moves to last item
    keyMap.ArrowUp = (ctx) => {
      ctx.expand()
      return ctx.focusLast()
    }
  }

  return {
    keyMap,
    config: {},
    triggerConfig: { openOn, popupRole },
  }
}
