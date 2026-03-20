import type { BehaviorContext } from '../behaviors/types'
import type { AxisConfig, KeyMap } from './composePattern'

export interface NavigateOptions {
  orientation?: 'vertical' | 'horizontal' | 'both'
  wrap?: boolean
  grid?: { columns: number }
}

export function navigate(options?: NavigateOptions): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const wrap = options?.wrap
  const wrapOpts = wrap ? { wrap: true as const } : undefined

  // Grid mode overrides orientation to 'both'
  if (options?.grid) {
    const columns = options.grid.columns
    const keyMap: KeyMap = {
      ArrowDown: (ctx: BehaviorContext) => ctx.focusNext(wrapOpts),
      ArrowUp: (ctx: BehaviorContext) => ctx.focusPrev(wrapOpts),
      ArrowRight: (ctx: BehaviorContext) => ctx.grid?.focusNextCol() ?? ctx.focusNext(wrapOpts),
      ArrowLeft: (ctx: BehaviorContext) => ctx.grid?.focusPrevCol() ?? ctx.focusPrev(wrapOpts),
      Home: (ctx: BehaviorContext) => ctx.grid?.focusFirstCol() ?? ctx.focusFirst(),
      End: (ctx: BehaviorContext) => ctx.grid?.focusLastCol() ?? ctx.focusLast(),
      'Mod+Home': (ctx: BehaviorContext) => ctx.focusFirst(),
      'Mod+End': (ctx: BehaviorContext) => ctx.focusLast(),
    }
    return {
      keyMap,
      config: {
        focusStrategy: { type: 'roving-tabindex', orientation: 'both' },
        colCount: columns,
      },
    }
  }

  const orientation = options?.orientation ?? 'vertical'

  const keyMap: KeyMap = {}

  if (orientation === 'vertical') {
    keyMap['ArrowDown'] = (ctx: BehaviorContext) => ctx.focusNext(wrapOpts)
    keyMap['ArrowUp'] = (ctx: BehaviorContext) => ctx.focusPrev(wrapOpts)
    keyMap['Home'] = (ctx: BehaviorContext) => ctx.focusFirst()
    keyMap['End'] = (ctx: BehaviorContext) => ctx.focusLast()
  } else if (orientation === 'horizontal') {
    keyMap['ArrowRight'] = (ctx: BehaviorContext) => ctx.focusNext(wrapOpts)
    keyMap['ArrowLeft'] = (ctx: BehaviorContext) => ctx.focusPrev(wrapOpts)
    keyMap['Home'] = (ctx: BehaviorContext) => ctx.focusFirst()
    keyMap['End'] = (ctx: BehaviorContext) => ctx.focusLast()
  } else {
    // 'both' — all 4 arrows, no Home/End (matches navVhUniform v1)
    keyMap['ArrowDown'] = (ctx: BehaviorContext) => ctx.focusNext(wrapOpts)
    keyMap['ArrowUp'] = (ctx: BehaviorContext) => ctx.focusPrev(wrapOpts)
    keyMap['ArrowRight'] = (ctx: BehaviorContext) => ctx.focusNext(wrapOpts)
    keyMap['ArrowLeft'] = (ctx: BehaviorContext) => ctx.focusPrev(wrapOpts)
  }

  return {
    keyMap,
    config: {
      focusStrategy: { type: 'roving-tabindex', orientation },
    },
  }
}
