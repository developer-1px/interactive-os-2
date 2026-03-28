// ② 2026-03-24-isomorphic-layer-tree-prd.md
import type { NormalizedData } from '../store/types'

export interface Command {
  type: string
  payload?: unknown
  execute(store: NormalizedData): NormalizedData
}

export interface BatchCommand extends Command {
  type: 'batch'
  commands: Command[]
}

export function createBatchCommand(cmds: Command[]): BatchCommand {
  return {
    type: 'batch',
    commands: cmds,
    execute: (store: NormalizedData): NormalizedData =>
      cmds.reduce((s, c) => c.execute(s), store),
  }
}

export type Middleware = (
  next: (command: Command) => void
) => (command: Command) => void
