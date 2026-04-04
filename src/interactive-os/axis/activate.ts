import type { PatternContext } from './types'
import { key } from './types'
import type { Command } from '../engine/types'
import { defineCommands } from '../engine/defineCommand'

export const activateCommands = defineCommands({
  activate: {
    type: 'core:activate' as const,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store) => store,
  },
})

// ② 2026-03-28-axis-handlers-export-prd.md
export const activateHandler = key(['core:activate'], (ctx: PatternContext): Command => ctx.activate())
