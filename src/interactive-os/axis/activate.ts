import type { PatternContext } from './types'
import { key } from './types'
import type { Command } from '../engine/types'
import { activateCommands } from '../core'

// Re-export for backwards compatibility during migration
export { activateCommands }

// ② 2026-03-28-axis-handlers-export-prd.md
export const activateHandler = key(['core:activate'], (ctx: PatternContext): Command => ctx.activate())
