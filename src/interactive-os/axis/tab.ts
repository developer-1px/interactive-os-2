import type { PatternContext } from './types'
import type { Command } from '../engine/types'

// ② 2026-03-28-axis-handlers-export-prd.md
export const focusNextWrap = (ctx: PatternContext): Command => ctx.focusNext({ wrap: true })
export const focusPrevWrap = (ctx: PatternContext): Command => ctx.focusPrev({ wrap: true })

