import type { AxisConfig, KeyMap } from './types'
import { createBatchCommand } from '../engine/types'

interface ExpandOptions {
  mode?: 'arrow' | 'enter-esc'
}

export function expand(options?: ExpandOptions): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const mode = options?.mode ?? 'arrow'

  if (mode === 'enter-esc') {
    const keyMap: KeyMap = {
      Enter: (ctx) => {
        const children = ctx.getChildren(ctx.focused)
        if (children.length > 0) {
          return createBatchCommand([
            ctx.enterChild(ctx.focused),
            ctx.focusChild(),
          ])
        }
        return ctx.startRename(ctx.focused)
      },
      Escape: (ctx) => {
        return ctx.exitToParent()
      },
    }
    return { keyMap, config: {} }
  }

  // mode === 'arrow' (default)
  const keyMap: KeyMap = {
    ArrowRight: (ctx) => (ctx.isExpanded ? ctx.focusChild() : ctx.expand()),
    ArrowLeft: (ctx) => (ctx.isExpanded ? ctx.collapse() : ctx.focusParent()),
  }
  return { keyMap, config: {} }
}
