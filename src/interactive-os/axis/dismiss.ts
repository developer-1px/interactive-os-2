import type { PatternContext } from './types'
import type { Command } from '../engine/types'

// ② 2026-03-28-axis-handlers-export-prd.md
export const dismissHandler = (ctx: PatternContext): Command => ctx.collapse()

